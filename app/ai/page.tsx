"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Send, Bot, User, Sparkles } from "lucide-react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const SLASH_COMMANDS = [
  {
    cmd: "/status",
    label: "Status",
    description: "Summarize current job hunt status",
    icon: "📊",
  },
  {
    cmd: "/prep-plan",
    label: "Prep Plan",
    description: "Personalized study plan",
    icon: "📚",
  },
  {
    cmd: "/draft-email",
    label: "Draft Email",
    description: "Follow-up email draft",
    icon: "✉️",
  },
  {
    cmd: "/interview-prep",
    label: "Interview Prep",
    description: "Likely interview questions",
    icon: "🎯",
  },
  {
    cmd: "/weekly-review",
    label: "Weekly Review",
    description: "Review progress & next actions",
    icon: "📅",
  },
  {
    cmd: "/todo-suggest",
    label: "Suggest Todos",
    description: "AI-suggested action items",
    icon: "✅",
  },
] as const;

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
      <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
      <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" />
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser
            ? "bg-violet-600"
            : "bg-slate-200 dark:bg-slate-700"
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-slate-600 dark:text-slate-300" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-violet-600 text-white rounded-tr-sm"
            : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-tl-sm"
        }`}
      >
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-headings:mb-1 prose-headings:mt-2 prose-code:text-violet-600 dark:prose-code:text-violet-400 prose-pre:bg-slate-100 dark:prose-pre:bg-slate-900 prose-strong:font-semibold">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {msg.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AIPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
      };

      const next = [...messages, userMsg];
      setMessages(next);
      setInput("");
      setIsStreaming(true);

      // Placeholder for streaming assistant reply
      const assistantId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "" },
      ]);

      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: next.map(({ role, content }) => ({ role, content })),
          }),
        });

        if (!res.ok || !res.body) {
          throw new Error(`API error ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: accumulated } : m
            )
          );
        }
        // flush any remaining bytes
        accumulated += decoder.decode();
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: accumulated } : m
          )
        );
      } catch (err) {
        console.error(err);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content:
                    "Sorry, something went wrong. Make sure `OPENROUTER_API_KEY` is set in `.env`.",
                }
              : m
          )
        );
      } finally {
        setIsStreaming(false);
      }
    },
    [messages, isStreaming]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="min-h-full flex flex-col">
      {/* Page title bar */}
      <div className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center gap-2 text-violet-600 dark:text-violet-400">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-semibold">AI Assistant</span>
        </div>
      </div>

      {/* Chat body */}
      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 md:px-6 pb-4">
        {/* Empty state / welcome */}
        {isEmpty && (
          <div className="flex-1 flex flex-col items-center justify-center py-16 text-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">
                Your AI Career Coach
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
                I have full context of your job search. Ask me anything or use a
                quick action below.
              </p>
            </div>

            {/* Quick actions grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full max-w-lg">
              {SLASH_COMMANDS.map(({ cmd, label, description, icon }) => (
                <button
                  key={cmd}
                  onClick={() => sendMessage(cmd)}
                  disabled={isStreaming}
                  className="flex flex-col items-start gap-1 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-violet-300 dark:hover:border-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all text-left group"
                >
                  <span className="text-lg">{icon}</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 group-hover:text-violet-700 dark:group-hover:text-violet-300">
                    {label}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 leading-snug">
                    {description}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {!isEmpty && (
          <div className="flex-1 space-y-5 py-6 overflow-y-auto">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
            {/* Thinking indicator: show when streaming and last msg is empty assistant */}
            {isStreaming &&
              messages[messages.length - 1]?.role === "assistant" &&
              messages[messages.length - 1]?.content === "" && (
                <div className="flex gap-3">
                  <div className="shrink-0 w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  </div>
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-sm">
                    <TypingIndicator />
                  </div>
                </div>
              )}
            <div ref={bottomRef} />
          </div>
        )}

        {/* Slash command bar — shown after first message */}
        {!isEmpty && (
          <div className="py-2 flex gap-1.5 flex-wrap">
            {SLASH_COMMANDS.map(({ cmd, label, icon }) => (
              <button
                key={cmd}
                onClick={() => sendMessage(cmd)}
                disabled={isStreaming}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-violet-400 dark:hover:border-violet-500 hover:text-violet-700 dark:hover:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>{icon}</span>
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Input area */}
        <div className="sticky bottom-0 pb-2 pt-1 bg-slate-50 dark:bg-slate-950">
          <div className="relative flex items-end gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2 shadow-sm focus-within:border-violet-400 dark:focus-within:border-violet-500 focus-within:ring-1 focus-within:ring-violet-400/30 transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your job search… or use /status"
              rows={1}
              className="flex-1 bg-transparent resize-none text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none py-1.5 max-h-40 leading-relaxed"
              disabled={isStreaming}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isStreaming}
              className="shrink-0 mb-0.5 w-8 h-8 flex items-center justify-center rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-center text-xs text-slate-400 dark:text-slate-600 mt-2">
            Shift+Enter for new line · Enter to send
          </p>
        </div>
      </main>
    </div>
  );
}
