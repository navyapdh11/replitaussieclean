import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2, Bot, AlertCircle, RotateCcw } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  id: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";
const BASE_PATH = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

const STARTERS = [
  "How much does end-of-lease cleaning cost?",
  "Do you service my suburb?",
  "What's included in a standard clean?",
  "How do I book a clean?",
  "Are your cleaners insured?",
];

const MAX_INPUT_CHARS = 1000;
const MAX_HISTORY_MESSAGES = 12;
const SSE_RECONNECT_DELAY_MS = 1000;

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "G'day! 👋 I'm AussieClean's virtual assistant. Ask me anything about our services, pricing, or availability!",
      id: "welcome",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const msgCountRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  // Ref to always access latest messages without stale closures
  const messagesRef = useRef<Message[]>(messages);
  messagesRef.current = messages;
  const nextId = useCallback(() => String(++msgCountRef.current), []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Cleanup abort on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim().slice(0, MAX_INPUT_CHARS);
    if (!trimmed || isLoading) return;

    // Cancel any in-flight request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setStreamError(null);
    setHasInteracted(true);

    const userMessage: Message = {
      role: "user",
      content: trimmed,
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
      // Use the messages ref for the latest conversation state
      const history = [...messagesRef.current, userMessage]
        .filter((m) => m.id !== "welcome")
        .slice(-MAX_HISTORY_MESSAGES)
        .map((m) => ({ role: m.role, content: m.content }));

      const apiUrl = API_BASE_URL
        ? `${API_BASE_URL}/api/ai/chat`
        : `${BASE_PATH}/api/ai/chat`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(
          `Server error ${response.status}: ${errorText || response.statusText}`,
        );
      }

      // Check that we actually got an SSE stream
      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("text/event-stream")) {
        // Server returned non-SSE (likely JSON error)
        try {
          const json = await response.json();
          throw new Error(json.error || "Unexpected response format");
        } catch {
          throw new Error("Server did not return a streaming response");
        }
      }

      if (!response.body) {
        throw new Error("No response body — server may be down");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let receivedContent = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || !trimmedLine.startsWith("data: ")) continue;

          try {
            const data = JSON.parse(trimmedLine.slice(6));
            if (data.content) {
              receivedContent = true;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: m.content + data.content }
                    : m,
                ),
              );
            } else if (data.error) {
              throw new Error(data.error);
            }
            // data.done — stream ended normally, nothing to do
          } catch (parseErr) {
            // Silently skip malformed SSE lines — not every line is valid JSON
            if (parseErr instanceof SyntaxError) continue;
            throw parseErr;
          }
        }
      }

      // If we received no content at all, show a helpful message
      if (!receivedContent) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: "I didn't receive a response. Please try again." }
              : m,
          ),
        );
      }
    } catch (err) {
      // Don't show error if the request was intentionally aborted
      if (err instanceof DOMException && err.name === "AbortError") return;

      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";

      setStreamError(message);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content:
                  "Sorry, I'm having trouble connecting. Please check your internet connection and try again, or call 1300 253 262 for help.",
              }
            : m,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    // Retry the last user message
    const lastUser = messagesRef.current.filter((m) => m.role === "user").pop();
    if (lastUser) {
      // Remove the error assistant message if present
      setMessages((prev) => {
        const filtered = prev.filter(
          (m, i) => !(m.id !== "welcome" && m.role === "assistant" && !m.content && i === prev.length - 1)
        );
        return filtered;
      });
      sendMessage(lastUser.content);
    }
  };

  const hasUserMessages = messagesRef.current.some(
    (m) => m.role === "user",
  );

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full shadow-2xl shadow-cyan-500/30 flex items-center justify-center hover:scale-110 transition-transform"
        aria-label={isOpen ? "Close chat" : "Open chat with AussieClean assistant"}
        aria-expanded={isOpen}
        aria-controls="ai-chat-panel"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
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
            className="fixed bottom-24 right-6 z-50 w-[min(360px,calc(100vw-2rem))] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{ maxHeight: "520px" }}
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-700 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground text-sm">
                  AussieClean Assistant
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {isLoading
                    ? "Thinking..."
                    : "Ask about pricing or services"}
                </p>
              </div>
              {streamError && (
                <button
                  onClick={handleRetry}
                  className="flex-shrink-0 p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
                  aria-label="Retry last message"
                  title="Retry"
                >
                  <RotateCcw className="w-4 h-4 text-cyan-400" />
                </button>
              )}
            </div>

            {/* Messages */}
            <div
              aria-live="polite"
              aria-label="Chat messages"
              className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0"
            >
              {messages.map((m) => {
                // Skip empty assistant messages that are still loading (show typing dots instead)
                if (m.role === "assistant" && !m.content && isLoading && m.id !== "welcome") {
                  return (
                    <div key={m.id} className="flex justify-start">
                      <div className="max-w-[85%] rounded-2xl px-3 py-2 bg-slate-800">
                        <span className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
                          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
                          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
                        </span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={m.id}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed break-words ${
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
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Starter prompts — show until user has sent at least one message */}
            {!hasUserMessages && (
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

            {/* Stream error banner */}
            {streamError && (
              <div className="px-4 pb-2">
                <div className="flex items-start gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span className="leading-snug">{streamError}</span>
                </div>
              </div>
            )}

            {/* Input form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="p-3 border-t border-slate-700 flex gap-2"
            >
              <input
                type="text"
                aria-label="Ask AussieClean assistant"
                value={input}
                onChange={(e) =>
                  setInput(e.target.value.slice(0, MAX_INPUT_CHARS))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                placeholder="Ask a question..."
                maxLength={MAX_INPUT_CHARS}
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
