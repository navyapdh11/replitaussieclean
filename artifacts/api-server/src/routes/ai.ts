import { Router, type IRouter } from "express";
import { db, serviceAreasTable, priceRulesTable } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";
import { eq } from "drizzle-orm";
import { chatLimiter } from "../lib/ratelimit";
import { logger } from "../lib/logger";
const router: IRouter = Router();

const ALLOWED_ROLES = new Set(["user", "assistant", "system"]);
const MAX_CONTENT_LENGTH = 2000;
const MAX_MESSAGES = 20;

/** Simple in-module cache so DB isn't queried on every chat turn */
interface PromptCache { areaList: string; priceList: string; expiresAt: number }
let promptCache: PromptCache | null = null;
const PROMPT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function getCachedPromptData(): Promise<{ areaList: string; priceList: string }> {
  const now = Date.now();
  if (promptCache && now < promptCache.expiresAt) {
    return { areaList: promptCache.areaList, priceList: promptCache.priceList };
  }
  const [serviceAreas, priceRules] = await Promise.all([
    db.select().from(serviceAreasTable).where(eq(serviceAreasTable.active, true)),
    db.select().from(priceRulesTable).where(eq(priceRulesTable.active, true)),
  ]);
  const areaList = serviceAreas.map((a) => `${a.suburb}, ${a.state}`).join(" • ");
  const priceList = priceRules
    .map((r) => `${r.serviceType.replace(/_/g, " ")} (${r.propertyType}): from $${r.basePriceCents / 100}`)
    .join("\n");
  promptCache = { areaList, priceList, expiresAt: now + PROMPT_CACHE_TTL_MS };
  return { areaList, priceList };
}

router.post("/ai/chat", chatLimiter, async (req, res): Promise<void> => {
  const { messages } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "messages array is required" });
    return;
  }

  if (messages.length > MAX_MESSAGES) {
    res.status(400).json({ error: "Too many messages in conversation" });
    return;
  }

  for (const m of messages) {
    if (!ALLOWED_ROLES.has(m?.role)) {
      res.status(400).json({ error: "Invalid message role" });
      return;
    }
    if (typeof m.content !== "string" || m.content.length > MAX_CONTENT_LENGTH) {
      res.status(400).json({ error: "Message content too long or invalid" });
      return;
    }
  }

  try {
    const { areaList, priceList } = await getCachedPromptData();

    const systemPrompt = `You are AussieClean's friendly AI booking assistant. Help customers choose the right cleaning service and guide them through booking.

Key info:
- Service areas covered: ${areaList}
- GST (10%) is included in all quoted prices
- Instant online booking — takes under 2 minutes
- All cleaners are police-checked, fully insured, and vetted
- 100% satisfaction guarantee — free re-clean if you're not happy
- Call 1300 CLEAN AU (1300 253 262) for urgent or complex enquiries

Complete service catalogue (18 categories — Australia's most comprehensive):

RESIDENTIAL:
• Standard Home Clean — regular weekly/fortnightly upkeep from $149 (WHS Act 2011)
• Deep / Spring Clean — thorough top-to-bottom cleaning from $249
• End-of-Lease / Bond Clean — bond-back guaranteed from $349 (Australian Consumer Law)
• Carpet & Upholstery Clean — steam or dry cleaning from $189/room
• Window Cleaning — internal & external from $149
• Eco-Friendly / Green Clean — non-toxic, sustainable products from $169

COMMERCIAL:
• Office / Commercial Clean — daily, weekly or one-off from $399 (WHS compliant)
• Strata / Body Corporate Clean — common areas & lobbies from $499/week
• Retail / Shop Clean — after-hours or early-morning from $349
• Hospitality / Hotel Clean — room turnover & common areas from $599

MEDICAL & AGED CARE:
• Medical / Healthcare Facility Clean — hospital-grade, AS/NZS 4187 + NHMRC guidelines from $899
• Aged Care & NDIS Clean — gentle, empathetic care-environment cleaning from $649

INSTITUTIONAL:
• School / Childcare / Educational Clean — police-checked staff, child-safe products from $549

INDUSTRIAL:
• Industrial / Warehouse Clean — heavy-duty, WHS + POEO Act compliant from $1,299
• Post-Construction / Builders Clean — dust removal, fit-out cleaning from $899

SPECIALIZED:
• Pressure Wash & Exterior Clean — driveways, decks, facades from $349
• Biohazard / Crime Scene / Sanitisation Clean — specialist PPE, safe disposal from $1,500
• Solar Panel / Duct / Air-Con Clean — roof-access certified team from $449

Current pricing from admin:
${priceList}

Be warm, helpful, and conversational. Use plain Australian English. Keep responses concise (under 120 words unless asked for detail). Always guide users toward clicking "Book Now" or "Get an Instant Quote". If a customer mentions compliance requirements (healthcare, aged care, school), proactively confirm we meet them.`;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const chatMessages = (messages as Array<{ role: "user" | "assistant" | "system"; content: string }>).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 512,
      messages: [{ role: "system", content: systemPrompt }, ...chatMessages],
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    logger.error({ err }, "AI chat error");
    if (!res.headersSent) {
      res.status(500).json({ error: "AI chat failed" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Chat failed" })}\n\n`);
      res.end();
    }
  }
});

export default router;
