import { Router, type IRouter } from "express";
import { db, serviceAreasTable, priceRulesTable } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";
import { eq } from "drizzle-orm";
import { chatLimiter } from "../lib/ratelimit";
import { logger } from "../lib/logger";
import knowledgeBase from "../lib/knowledge-base.json" with { type: "json" };

const router: IRouter = Router();

const ALLOWED_ROLES = new Set(["user", "assistant", "system"]);
const MAX_CONTENT_LENGTH = 2000;
const MAX_MESSAGES = 20;

interface PromptCache { areaList: string; priceList: string; expiresAt: number }
let promptCache: PromptCache | null = null;
const PROMPT_CACHE_TTL_MS = 5 * 60 * 1000;

interface KnowledgeItem {
  id?: string;
  name?: string;
  title?: string;
  description?: string;
  content?: string;
  answer?: string;
  price_from?: number;
  duration?: string;
  includes?: string[];
  keywords?: string[];
  question?: string;
  triggers?: string[];
}

interface RagResult {
  type: "service" | "faq" | "policy" | "intent";
  content: string;
  confidence: number;
  metadata?: Record<string, unknown>;
}

function calculateKeywordScore(query: string, item: KnowledgeItem): number {
  const queryLower = query.toLowerCase();
  const keywords = item.keywords || [];
  
  let score = 0;
  for (const keyword of keywords) {
    if (queryLower.includes(keyword.toLowerCase())) {
      score += 1;
    }
    for (const word of queryLower.split(/\s+/)) {
      if (keyword.toLowerCase().includes(word)) {
        score += 0.5;
      }
    }
  }
  return score;
}

function extractUserIntent(userMessage: string): string | null {
  const message = userMessage.toLowerCase();
  
  const intentMap = knowledgeBase.knowledge_base.common_queries;
  
  for (const [intent, config] of Object.entries(intentMap)) {
    const triggers = (config as { triggers?: string[] }).triggers || [];
    for (const trigger of triggers) {
      if (message.includes(trigger)) {
        return intent;
      }
    }
  }
  return null;
}

function semanticSearch(query: string): RagResult[] {
  const results: RagResult[] = [];
  const queryLower = query.toLowerCase();
  
  const services = knowledgeBase.knowledge_base.services as KnowledgeItem[];
  for (const service of services) {
    const keywordScore = calculateKeywordScore(query, service);
    const hasKeywordMatch = keywordScore > 0;
    
    const textToSearch = `${service.name} ${service.description} ${service.includes?.join(" ")}`.toLowerCase();
    const hasDirectMatch = textToSearch.includes(queryLower) || queryLower.split(/\s+/).some(w => w.length > 3 && textToSearch.includes(w));
    
    if (hasKeywordMatch || hasDirectMatch) {
      const confidence = Math.min(1, (keywordScore * 0.3) + (hasDirectMatch ? 0.5 : 0));
      results.push({
        type: "service",
        content: `${service.name}: ${service.description}. From $${service.price_from}. Includes: ${service.includes?.slice(0, 5).join(", ")}`,
        confidence,
        metadata: { serviceId: service.id, priceFrom: service.price_from }
      });
    }
  }
  
  const faqs = knowledgeBase.knowledge_base.faq as KnowledgeItem[];
  for (const faq of faqs) {
    const keywordScore = calculateKeywordScore(query, faq);
    const questionMatch = faq.question?.toLowerCase().includes(queryLower) || queryLower.split(/\s+/).some(w => w.length > 3 && faq.question?.toLowerCase().includes(w));
    
    if (keywordScore > 0 || questionMatch) {
      results.push({
        type: "faq",
        content: `Q: ${faq.question}\nA: ${faq.answer}`,
        confidence: Math.min(1, (keywordScore * 0.3) + (questionMatch ? 0.6 : 0)),
        metadata: {}
      });
    }
  }
  
  const policies = knowledgeBase.knowledge_base.policies as KnowledgeItem[];
  for (const policy of policies) {
    const keywordScore = calculateKeywordScore(query, policy);
    if (keywordScore > 0.5) {
      results.push({
        type: "policy",
        content: `${policy.title}: ${policy.content}`,
        confidence: Math.min(1, keywordScore * 0.2),
        metadata: { policyId: policy.id }
      });
    }
  }
  
  const intent = extractUserIntent(query);
  if (intent) {
    const intentConfig = knowledgeBase.knowledge_base.common_queries[intent as keyof typeof knowledgeBase.knowledge_base.common_queries] as { response: string; triggers?: string[] };
    results.push({
      type: "intent",
      content: intentConfig.response,
      confidence: 0.8,
      metadata: { intent }
    });
  }
  
  results.sort((a, b) => b.confidence - a.confidence);
  return results.slice(0, 4);
}

function buildContextFromRag(userMessage: string): string {
  const ragResults = semanticSearch(userMessage);
  
  if (ragResults.length === 0) {
    return "";
  }
  
  const contextParts = ["RELEVANT CONTEXT FROM KNOWLEDGE BASE:"];
  
  const serviceContext = ragResults.filter(r => r.type === "service").slice(0, 2);
  if (serviceContext.length > 0) {
    contextParts.push("\n--- MATCHING SERVICES ---");
    for (const s of serviceContext) {
      contextParts.push(s.content);
    }
  }
  
  const faqContext = ragResults.filter(r => r.type === "faq").slice(0, 2);
  if (faqContext.length > 0) {
    contextParts.push("\n--- RELEVANT FAQS ---");
    for (const f of faqContext) {
      contextParts.push(f.content);
    }
  }
  
  return contextParts.join("\n");
}

async function getCachedPromptData(): Promise<{ areaList: string; priceList: string }> {
  const now = Date.now();
  if (promptCache && now < promptCache.expiresAt) {
    return { areaList: promptCache.areaList, priceList: promptCache.priceList };
  }
  
  try {
    const [serviceAreas, priceRules] = await Promise.all([
      db.select().from(serviceAreasTable).where(eq(serviceAreasTable.active, true)).limit(100),
      db.select().from(priceRulesTable).where(eq(priceRulesTable.active, true)).limit(50),
    ]);
    
    const areaList = serviceAreas.length > 0 
      ? serviceAreas.map((a) => `${a.suburb}, ${a.state}`).join(" • ")
      : "Sydney, Melbourne, Brisbane, Perth, Adelaide, Gold Coast, Newcastle";
    
    const priceList = priceRules.length > 0
      ? priceRules.map((r) => `${r.serviceType.replace(/_/g, " ")} (${r.propertyType}): from $${(r.basePriceCents || 0) / 100}`)
        .join("\n")
      : "Standard Clean: from $149\nDeep Clean: from $249\nEnd of Lease: from $349";
    
    promptCache = { areaList, priceList, expiresAt: now + PROMPT_CACHE_TTL_MS };
    return { areaList, priceList };
  } catch (err) {
    logger.warn({ err }, "Failed to fetch DB data, using fallback");
    return {
      areaList: "Sydney, Melbourne, Brisbane, Perth, Adelaide, Gold Coast",
      priceList: "Standard Clean: from $149\nDeep Clean: from $249"
    };
  }
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

  const lastUserMessage = messages.filter(m => m.role === "user").pop()?.content || "";
  const ragContext = buildContextFromRag(lastUserMessage);

  try {
    const { areaList, priceList } = await getCachedPromptData();

    let systemPrompt = `You are AussieClean's friendly AI booking assistant. Help customers choose the right cleaning service and guide them through booking.

Key info:
- Service areas covered: ${areaList}
- GST (10%) is included in all quoted prices
- Instant online booking — takes under 2 minutes
- All cleaners are police-checked, fully insured, and vetted
- 100% satisfaction guarantee — free re-clean if you're not happy
- Call 1300 CLEAN AU (1300 253 262) for urgent or complex enquiries

Complete service catalogue:
RESIDENTIAL:
• Standard Home Clean — regular weekly/fortnightly upkeep from $149
• Deep / Spring Clean — thorough top-to-bottom cleaning from $249
• End-of-Lease / Bond Clean — bond-back guaranteed from $349
• Carpet & Upholstery Clean — steam or dry cleaning from $189/room
• Window Cleaning — internal & external from $149
• Eco-Friendly / Green Clean — non-toxic, sustainable products from $169

COMMERCIAL:
• Office / Commercial Clean — daily, weekly or one-off from $399
• Strata / Body Corporate Clean — common areas & lobbies from $499/week

MEDICAL & AGED CARE:
• Medical / Healthcare Facility Clean — hospital-grade from $899
• Aged Care & NDIS Clean — gentle, empathetic care cleaning from $649

Price List:
${priceList}`;

    if (ragContext) {
      systemPrompt += `\n\n${ragContext}\n\nIMPORTANT: Use the context above to provide accurate, specific answers. If context is relevant, reference it directly.`;
    }

    systemPrompt += `\n\nBe warm, helpful, and conversational. Use plain Australian English. Keep responses concise (under 120 words unless asked for detail). Always guide users toward clicking "Book Now" or "Get an Instant Quote".`;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const chatMessages = (messages as Array<{ role: "user" | "assistant" | "system"; content: string }>)
      .filter(m => m.role !== "system")
      .map((m) => ({ role: m.role, content: m.content }));

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