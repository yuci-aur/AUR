"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Bot, Send, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useSidebar } from "./navigation/SidebarContext";

// ─── Types ────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FloatingChatAssistant() {
  const {activeView } = useSidebar();
  const [isChatOpen, setIsChatOpen] = useState(false);


  const [isIdle, setIsIdle] = useState(true);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const handleScroll = () => {
      setIsIdle(false);
      clearTimeout(timeout);
      timeout = setTimeout(() => setIsIdle(true), 1500);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timeout);
    };
  }, []);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      role: "assistant",
      content:
        "Hi — ask me about rankings, programs, tuition, or how to compare universities.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ─── Side Effects ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (isChatOpen) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      setTimeout(() => inputRef.current?.focus(), 140);
    }
  }, [isChatOpen, messages]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleClose = () => {
    setIsChatOpen(false);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isThinking) return;
    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: text.trim() };
    const query = userMsg.content;
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsThinking(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query }),
      });
      const data = await res.json().catch(() => ({}));
      setIsThinking(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: res.ok
            ? data.reply
            : data.detail || "Sorry, the chat service is unavailable right now.",
        },
      ]);
    } catch (err) {
      setIsThinking(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: "Sorry, I couldn't reach the server. Please try again.",
        },
      ]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  // ─── Theme Tokens (brand navy + amber) ────────────────────────────────────

  const panelBg  = "bg-white";
  const border   = "border-slate-200";
  const inputBg  = "bg-slate-50";
  const aiBubble = "bg-slate-100 border border-slate-200 text-slate-700";
  const muted    = "text-slate-500";

  const dragGlow = "shadow-[0_16px_48px_rgba(26,54,93,0.28)] border-slate-200";

  const SUGGESTIONS = [
    "Top universities in Singapore",
    "Medical programs in Central Asia",
    "How are the scores calculated?",
  ];

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Physics Chat Panel ──────────────────────────────────────────── */}
      <>
        {isChatOpen && (
          <motion.div
            key="chat-panel"
            drag
            dragMomentum={false}
            role="dialog"
            aria-label="AUR Helping Hand chat assistant"
            className={[
              "fixed bottom-20 md:bottom-24 right-3 sm:right-6 z-50",
              "max-w-[calc(100vw-1.5rem)] w-80 sm:w-[360px]",
              "flex flex-col rounded-xl overflow-hidden",
              "border",
              border,
              panelBg,
              dragGlow,
              "cursor-grab select-none",
              "will-change-transform",
            ].join(" ")}
          >

            {/* ── Header ─────────────────────────────────────── */}
            <div className="flex items-center justify-between px-4 py-3 bg-aur-primary shrink-0">
              {/* Branding */}
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400">
                  <Bot className="h-4 w-4 text-aur-primary" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-white">
                    AUR Assistant
                  </p>
                  <p className="text-[9px] text-slate-300">
                    {isThinking ? "Thinking…" : "Answers from the rankings dataset"}
                  </p>
                </div>
              </div>

              {/* Close button — stops propagation so it doesn't initiate drag */}
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={handleClose}
                className="p-1.5 rounded-full transition-colors text-slate-300 hover:text-white hover:bg-white/15 dark:hover:bg-white/15"
                title="Close"
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* ── Messages ───────────────────────────────────── */}
            {/* stopPropagation prevents drag from accidentally starting on message text */}
            <div
              className="flex-1 overflow-y-auto px-4 py-4 space-y-3 cursor-default"
              style={{ maxHeight: 340 }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full mr-2 mt-0.5 bg-aur-primary/10 border border-aur-primary/15">
                      <Bot className="h-3 w-3 text-aur-primary" />
                    </div>
                  )}
                  <div
                    className={[
                      "max-w-[78%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed",
                      msg.role === "user"
                        ? "bg-aur-primary text-white font-semibold"
                        : aiBubble,
                    ].join(" ")}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {/* Quick-start suggestions — only before the first question */}
              {messages.length === 1 && !isThinking && (
                <div className="flex flex-wrap gap-1.5 pl-8">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => sendMessage(s)}
                      className="rounded-full border border-aur-primary/25 bg-white px-3 py-1.5 text-[11px] font-semibold text-aur-primary transition-colors hover:bg-aur-primary hover:text-white"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Thinking indicator */}
              {isThinking && (
                <div className="flex justify-start">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full mr-2 mt-0.5 bg-aur-primary/10 border border-aur-primary/15">
                    <Bot className="h-3 w-3 text-aur-primary" />
                  </div>
                  <div className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs ${aiBubble}`}>
                    <Loader2 className="h-3 w-3 text-aur-primary animate-spin" />
                    <span className={muted}>Thinking…</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* ── Input ──────────────────────────────────────── */}
            <form
              onSubmit={handleSubmit}
              onPointerDown={(e) => e.stopPropagation()}
              className={[
                "shrink-0 p-3 border-t",
                border,
                "bg-white",
                "flex items-center gap-2",
              ].join(" ")}
            >
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                aria-label="Ask the assistant about universities"
                placeholder="Ask about universities…"
                disabled={isThinking}
                className={[
                  "h-auto flex-1 rounded-lg px-3 py-2 text-xs md:text-xs border cursor-text",
                  inputBg,
                  "dark:bg-slate-50",
                  border,
                  "text-slate-800 placeholder-slate-400 placeholder:text-slate-400",
                  "focus:border-aur-primary focus-visible:border-aur-primary focus-visible:ring-0",
                  "focus:outline-none transition-colors disabled:opacity-50",
                  "disabled:bg-slate-50 dark:disabled:bg-slate-50",
                ].join(" ")}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isThinking}
                aria-label="Send message"
                className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-aur-primary hover:bg-aur-primary/90 dark:bg-aur-primary dark:hover:bg-aur-primary/90 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>
          </motion.div>
        )}
      </>

      {/* ── Floating Trigger Button ─────────────────────────────────────── */}
      <>
        {!isChatOpen && (
          <motion.div
            drag
            dragMomentum={false}
            className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 flex flex-col items-end gap-2 cursor-grab active:cursor-grabbing"
            style={{
              opacity: isIdle ? 1 : 0,
              pointerEvents: isIdle ? "auto" : "none",
            }}
          >
            {/* Invitation label — only on homepage */}
            {activeView === "home" && (
              <div
                className={[
                  "relative px-3.5 py-2.5 rounded-2xl text-[11px] font-bold pointer-events-none mr-2",
                  "bg-white border border-slate-200 text-aur-primary shadow-[0_8px_24px_rgba(26,54,93,0.16)]",
                ].join(" ")}
              >
                Ask about any university
                <div
                  className={[
                    "absolute right-4 -bottom-1.5 w-3.5 h-3.5 rotate-45 border-r border-b",
                    "bg-white border-slate-200",
                  ].join(" ")}
                />
              </div>
            )}

            {/* FAB — always visible on all pages */}
            <Button
              key="chat-trigger"
              type="button"
              size="icon"
              onClick={() => setIsChatOpen(true)}
              aria-label="Open the AUR assistant"
              className="shrink-0 h-14 w-14 rounded-full bg-amber-400 hover:bg-amber-300 dark:bg-amber-400 dark:hover:bg-amber-300 text-aur-primary border-2 border-white/80 shadow-[0_10px_30px_rgba(7,26,47,0.4)] hover:shadow-[0_14px_40px_rgba(7,26,47,0.5)] flex items-center justify-center relative hover:scale-105 transition-all"
              title="Ask about any university"
            >
              <Bot className="h-6 w-6 pointer-events-none" />
              {/* Pulsing ring only on home */}
              {activeView === "home" && (
                <span className="absolute inset-0 rounded-full motion-safe:animate-ping bg-amber-400/40 pointer-events-none" />
              )}
            </Button>
          </motion.div>
        )}
      </>
    </>
  );
}


