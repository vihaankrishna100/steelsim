"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

// Drop this file in app/page.tsx (App Router) to make the chatbot fill the whole page.
// TailwindCSS required. Works in dark/light.

export default function FullPageChat() {
  const [messages, setMessages] = useState<Array<{ id: string; role: "user" | "assistant"; content: string }>>([
    { id: crypto.randomUUID(), role: "assistant", content: "Hey! I’m your steel production chatbot. Ask me about the simulation ✨" },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  // auto-scroll to latest message
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const canSend = useMemo(() => input.trim().length > 0 && !isSending, [input, isSending]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSend) return;

    const userMsg = { id: crypto.randomUUID(), role: "user" as const, content: input.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setIsSending(true);

    try {
      // Call Flask backend /get-advice
      const res = await fetch("http://127.0.0.1:6969/get-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          simulation_data: { workers: 10, hours: 5 }, // Replace with real simulation data from UI if needed
          question: userMsg.content,
        }),
      });

      const data = await res.json();
      let reply = data.advice || data.error || "No response from advisor.";
      const botMsg = { id: crypto.randomUUID(), role: "assistant" as const, content: reply };
      setMessages((m) => [...m, botMsg]);
    } catch (err: any) {
      const botMsg = { id: crypto.randomUUID(), role: "assistant" as const, content: `Error: ${err.message}` };
      setMessages((m) => [...m, botMsg]);
    } finally {
      setIsSending(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && canSend) {
      e.preventDefault();
      // form submit
      const form = (e.currentTarget.closest("form") as HTMLFormElement) || undefined;
      form?.requestSubmit();
    }
  }

  return (
    <div className="h-dvh w-screen bg-black from-slate-50 to-slate-100 text-slate-900 dark:from-slate-900 dark:to-slate-950 dark:text-slate-100">
      <div className="mx-auto flex h-full max-w-5xl flex-col gap-0 px-4">
        <header className="sticky top-0 z-10 -mx-4 mb-2 border-b border-slate-200/60 bg-white/70 px-4 py-3 backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/60">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold tracking-tight">Steel Production Chatbot</h1>
            <div className="text-xs opacity-70">Next.js + Tailwind + Flask</div>
          </div>
        </header>

        <div ref={listRef} className="flex-1 overflow-y-auto rounded-2xl border border-slate-200/70 bg-white/70 p-3 shadow-sm backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/50">
          <div className="mx-auto flex max-w-3xl flex-col gap-3">
            {messages.map((m) => (
              <Message key={m.id} role={m.role} content={m.content} />
            ))}
            {isSending && <Message role="assistant" content={<TypingDots />} />}
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-3">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-end gap-2 rounded-2xl border border-slate-200/70 bg-white p-2 shadow-sm dark:border-slate-800/60 dark:bg-slate-900">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={isSending ? "Getting advice…" : "Ask a question about the simulation"}
                className="min-h-[48px] max-h-[40dvh] flex-1 resize-none bg-transparent px-3 py-2 outline-none placeholder:text-slate-400"
                rows={1}
                aria-label="Message"
              />
              <button
                type="submit"
                disabled={!canSend}
                className="select-none rounded-xl px-4 py-2 text-sm font-medium shadow-sm transition active:scale-[.98] disabled:opacity-50 disabled:shadow-none dark:shadow-black/10 bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
              >
                Send
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Press Enter to send • Shift+Enter for newline</p>
          </div>
        </form>
      </div>
    </div>
  );
}

function Message({ role, content }: { role: "user" | "assistant"; content: React.ReactNode }) {
  const isUser = role === "user";
  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={
          "max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed shadow-sm " +
          (isUser
            ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
            : "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100")
        }
      >
        {content}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      <Dot />
      <Dot style={{ animationDelay: "120ms" }} />
      <Dot style={{ animationDelay: "240ms" }} />
    </span>
  );
}

function Dot(props: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      {...props}
      className={("h-2 w-2 animate-bounce rounded-full bg-current opacity-60 " + (props.className || "")) as string}
    />
  );
}