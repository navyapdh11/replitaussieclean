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
    const [serviceAreas, priceRules] = await Promise.all([
      db.select().from(serviceAreasTable).where(eq(serviceAreasTable.active, true)),
      db.select().from(priceRulesTable).where(eq(priceRulesTable.active, true)),
    ]);

    const areaList = serviceAreas.map((a) => `${a.suburb}, ${a.state}`).join(" • ");
    const priceList = priceRules
      .map(
        (r) =>
          `${r.serviceType.replace(/_/g, " ")} (${r.propertyType}): from $${r.basePriceCents / 100}`
      )
      .join("\n");

    const systemPrompt = `You are AussieClean's friendly AI booking assistant. Help customers choose the right cleaning service and guide them through booking.

Key info:
- Service areas: ${areaList}
- Services: Standard Home Clean, Deep/Spring Clean, End-of-Lease (bond-back guarantee), Office Clean, NDIS Support Cleaning
- Pricing:
${priceList}
- GST (10%) is included in all quotes
- Instant online booking — takes under 2 minutes
- All cleaners are police-checked, fully insured, and vetted
- 100% satisfaction guarantee — we'll re-clean for free if you're not happy
- Call 1300 CLEAN AU (1300 253 262) for urgent bookings

Be warm, helpful, and conversational. Use plain Australian English. Keep responses concise (under 100 words unless asked for detail). Always guide users toward clicking "Book Now" or "Get an Instant Quote".`;

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
