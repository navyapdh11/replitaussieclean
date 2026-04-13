import { OpenAI } from "openai";
// @ts-expect-error JSON import — Vercel Edge Runtime handles this natively
import knowledgeBase from "../../artifacts/api-server/src/lib/knowledge-base.json";

export const runtime = "edge";
export const maxDuration = 30;

// ─── Types ───────────────────────────────────────────────────────────────────

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
}

// ─── RAG helpers (mirrors api-server/src/routes/ai.ts) ───────────────────────

function calculateKeywordScore(query: string, item: KnowledgeItem): number {
  const queryLower = query.toLowerCase();
  const keywords = item.keywords || [];
  let score = 0;
  for (const keyword of keywords) {
    if (queryLower.includes(keyword.toLowerCase())) score += 1;
    for (const word of queryLower.split(/\s+/)) {
      if (keyword.toLowerCase().includes(word)) score += 0.5;
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
      if (message.includes(trigger)) return intent;
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
    const textToSearch = `${service.name ?? ""} ${service.description ?? ""} ${(service.includes ?? []).join(" ")}`.toLowerCase();
    const hasDirectMatch = textToSearch.includes(queryLower) ||
      queryLower.split(/\s+/).some((w) => w.length > 3 && textToSearch.includes(w));

    if (keywordScore > 0 || hasDirectMatch) {
      results.push({
        type: "service",
        content: `${service.name ?? "Service"}: ${service.description ?? ""}. From $${service.price_from ?? 0}. Includes: ${(service.includes ?? []).slice(0, 5).join(", ")}`,
        confidence: Math.min(1, (keywordScore * 0.3) + (hasDirectMatch ? 0.5 : 0)),
      });
    }
  }

  const faqs = knowledgeBase.knowledge_base.faq as KnowledgeItem[];
  for (const faq of faqs) {
    const keywordScore = calculateKeywordScore(query, faq);
    const questionMatch = (faq.question ?? "").toLowerCase().includes(queryLower) ||
      queryLower.split(/\s+/).some((w) => w.length > 3 && (faq.question ?? "").toLowerCase().includes(w));

    if (keywordScore > 0 || questionMatch) {
      results.push({
        type: "faq",
        content: `Q: ${faq.question ?? ""}\nA: ${faq.answer ?? ""}`,
        confidence: Math.min(1, (keywordScore * 0.3) + (questionMatch ? 0.6 : 0)),
      });
    }
  }

  const intent = extractUserIntent(query);
  if (intent) {
    const intentConfig = knowledgeBase.knowledge_base.common_queries[
      intent as keyof typeof knowledgeBase.knowledge_base.common_queries
    ] as { response: string };
    results.push({
      type: "intent",
      content: intentConfig?.response ?? "",
      confidence: 0.8,
    });
  }

  results.sort((a, b) => b.confidence - a.confidence);
  return results.slice(0, 4);
}

function buildContextFromRag(userMessage: string): string {
  const ragResults = semanticSearch(userMessage);
  if (ragResults.length === 0) return "";

  const parts = ["RELEVANT CONTEXT FROM KNOWLEDGE BASE:"];

  const services = ragResults.filter((r) => r.type === "service").slice(0, 2);
  if (services.length > 0) {
    parts.push("\n--- MATCHING SERVICES ---");
    services.forEach((s) => parts.push(s.content));
  }

  const faqs = ragResults.filter((r) => r.type === "faq").slice(0, 2);
  if (faqs.length > 0) {
    parts.push("\n--- RELEVANT FAQS ---");
    faqs.forEach((f) => parts.push(f.content));
  }

  return parts.join("\n");
}

// ─── Vercel Edge Function ────────────────────────────────────────────────────

export async function POST(req: Request): Promise<Response> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "OpenAI API key not configured" },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = body as { messages?: unknown };

  if (!Array.isArray(parsed.messages) || parsed.messages.length === 0) {
    return Response.json({ error: "messages array is required" }, { status: 400 });
  }

  if (parsed.messages.length > 20) {
    return Response.json({ error: "Too many messages" }, { status: 400 });
  }

  const ALLOWED_ROLES = new Set(["user", "assistant", "system"]);
  for (const m of parsed.messages as Array<unknown>) {
    const msg = m as Record<string, unknown>;
    if (!ALLOWED_ROLES.has(msg?.role as string)) {
      return Response.json({ error: "Invalid message role" }, { status: 400 });
    }
    if (typeof msg.content !== "string" || msg.content.length > 2000) {
      return Response.json({ error: "Message content too long or invalid" }, { status: 400 });
    }
  }

  const typedMessages = parsed.messages as Array<{ role: string; content: string }>;
  const lastUserMessage = typedMessages.filter((m) => m.role === "user").pop()?.content ?? "";
  const ragContext = buildContextFromRag(lastUserMessage);

  const SERVICE_AREAS =
    "Sydney, Melbourne, Brisbane, Perth, Adelaide, Gold Coast, Newcastle";
  const PRICE_LIST =
    "Standard Clean: from $149\nDeep Clean: from $249\nEnd of Lease: from $349\nCarpet Clean: from $189/room\nWindow Clean: from $149\nEco Clean: from $169\nOffice Clean: from $399\nMedical Clean: from $899";

  let systemPrompt = `You are AussieClean's friendly AI booking assistant. Help customers choose the right cleaning service and guide them through booking.

Key info:
- Service areas: ${SERVICE_AREAS}
- GST (10%) included in all prices
- Instant online booking — under 2 minutes
- All cleaners are police-checked, insured, vetted
- 100% satisfaction guarantee — free re-clean
- Call 1300 253 262 for urgent enquiries

Complete service catalogue:
RESIDENTIAL: Standard ($149), Deep ($249), End-of-Lease ($349), Carpet ($189/room), Window ($149), Eco ($169)
COMMERCIAL: Office ($399), Strata ($499/wk), Retail ($349), Hospitality ($599)
MEDICAL: Healthcare ($899), Aged Care ($649)
INDUSTRIAL: Warehouse ($1,299), Post-Construction ($899), Biohazard ($1,500)

Price List:
${PRICE_LIST}`;

  if (ragContext) {
    systemPrompt += `\n\n${ragContext}\n\nIMPORTANT: Use the context above to provide accurate, specific answers.`;
  }

  systemPrompt += `\n\nBe warm, helpful, and conversational. Use plain Australian English. Keep responses concise (under 120 words). Always guide users toward clicking "Book Now" or "Get an Instant Quote".`;

  const openai = new OpenAI({ apiKey });

  const chatMessages = typedMessages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 512,
      messages: [{ role: "system", content: systemPrompt }, ...chatMessages],
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content })}\n\n`),
            );
          }
        }
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`),
        );
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("AI chat error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "AI chat failed" },
      { status: 500 },
    );
  }
}
