import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2, Bot } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  id: string;
}

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

const STARTERS = [
  "How much does end-of-lease cleaning cost?",
  "Do you service my suburb?",
  "What's included in a standard clean?",
];

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "G'day! 👋 I'm AussieClean's virtual assistant. Ask me anything about our services, pricing, or availability!",
      id: "welcome",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const msgCountRef = useRef(0);
  const nextId = useCallback(() => String(++msgCountRef.current), []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: text.trim(),
      id: nextId(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const assistantId = nextId();
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "", id: assistantId },
    ]);

    try {
      const response = await fetch(`${BASE_URL}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage]
            .filter((m) => m.id !== "welcome")
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.content) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: m.content + data.content }
                    : m
                )
              );
            }
          } catch {}
        }
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: "Sorry, something went wrong. Please try again!" }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full shadow-2xl shadow-cyan-500/30 flex items-center justify-center hover:scale-110 transition-transform"
        aria-label={isOpen ? "Close chat" : "Open chat with AussieClean assistant"}
        aria-expanded={isOpen}
        aria-controls="ai-chat-panel"
      >
        {isOpen ? <X className="w-6 h-6 text-white" /> : <MessageCircle className="w-6 h-6 text-white" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="ai-chat-panel"
            role="dialog"
            aria-label="AussieClean chat assistant"
            aria-modal="false"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-[360px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{ maxHeight: "520px" }}
          >
            <div className="p-4 border-b border-slate-700 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">AussieClean Assistant</p>
                <p className="text-xs text-muted-foreground">Ask about pricing or services</p>
              </div>
            </div>

            <div
              aria-live="polite"
              aria-label="Chat messages"
              className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0"
            >
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-cyan-500 text-slate-950 font-medium"
                        : "bg-slate-800 text-slate-100"
                    }`}
                  >
                    {m.content || (
                      <span className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {messages.length <= 1 && (
              <div className="px-4 pb-2 flex flex-col gap-1.5">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="text-left text-xs px-3 py-2 rounded-lg border border-slate-700 text-muted-foreground hover:border-cyan-500/50 hover:text-foreground transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
              className="p-3 border-t border-slate-700 flex gap-2"
            >
              <input
                type="text"
                aria-label="Ask AussieClean assistant"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                disabled={isLoading}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="w-9 h-9 flex-shrink-0 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 rounded-xl flex items-center justify-center transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 text-slate-950 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 text-slate-950" />
                )}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
