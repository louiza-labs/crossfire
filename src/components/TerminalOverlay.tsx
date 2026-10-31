"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

interface TerminalOverlayProps {
  onSearch?: (query: string) => void;
  onCommand?: (command: string) => void;
}

export function TerminalOverlay({ onSearch, onCommand }: TerminalOverlayProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [typingPrompt, setTypingPrompt] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const prompts = [
    "search flexera...",
    "fund ARCC",
    "show shared positions",
    "focus insurance",
  ];

  // Typing animation for prompt
  useEffect(() => {
    if (isOpen) return;

    let promptIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let timeout: NodeJS.Timeout;

    const animate = () => {
      const currentPrompt = prompts[promptIndex];

      if (!isDeleting) {
        setTypingPrompt(currentPrompt.slice(0, charIndex + 1));
        charIndex++;

        if (charIndex === currentPrompt.length) {
          isDeleting = true;
          timeout = setTimeout(animate, 2000);
          return;
        }
      } else {
        setTypingPrompt(currentPrompt.slice(0, charIndex - 1));
        charIndex--;

        if (charIndex === 0) {
          isDeleting = false;
          promptIndex = (promptIndex + 1) % prompts.length;
        }
      }

      timeout = setTimeout(animate, isDeleting ? 30 : 80);
    };

    timeout = setTimeout(animate, 1000);
    return () => clearTimeout(timeout);
  }, [isOpen]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim().toLowerCase();

    if (trimmed.startsWith("search ") || trimmed.startsWith("find ")) {
      const query = trimmed.replace(/^(search|find)\s+/, "");
      onSearch?.(query);
    } else if (trimmed.startsWith("focus ")) {
      const target = trimmed.replace(/^focus\s+/, "");
      onCommand?.(`focus:${target}`);
    } else if (trimmed === "funds" || trimmed === "f") {
      router.push("/funds");
    } else if (trimmed === "borrowers" || trimmed === "b") {
      router.push("/borrowers");
    } else if (trimmed === "explorer" || trimmed === "e") {
      router.push("/explorer");
    } else if (trimmed === "shared" || trimmed === "overlaps") {
      onCommand?.("overlaps");
    } else if (trimmed === "concentrated" || trimmed === "top") {
      onCommand?.("concentrated");
    } else if (trimmed === "reset" || trimmed === "clear") {
      onCommand?.("reset");
    } else if (trimmed) {
      onSearch?.(trimmed);
    }

    setInput("");
    setIsOpen(false);
  }, [input, onSearch, onCommand, router]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === "Escape") {
          setIsOpen(false);
          (e.target as HTMLElement).blur();
        }
        return;
      }

      if (e.key === "/" || (e.key === "k" && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      } else if (e.key === "Escape") {
        setIsOpen(false);
        onCommand?.("reset");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCommand]);

  return (
    <>
      {/* Minimal command trigger */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <button
          onClick={() => {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-black/80 backdrop-blur-xl border border-zinc-800/50 rounded-full text-sm hover:border-zinc-700 transition-all group"
        >
          <span className="text-emerald-500 font-mono">$</span>
          <span className="text-zinc-600 font-mono text-xs">
            {typingPrompt}
            <span className="inline-block w-[2px] h-3 bg-emerald-500 ml-0.5 animate-pulse" />
          </span>
          <kbd className="ml-2 px-1.5 py-0.5 text-[9px] bg-zinc-900 rounded text-zinc-600 font-mono">⌘K</kbd>
        </button>
      </div>

      {/* Command palette */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
          <div
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative w-full max-w-lg mx-4">
            <form onSubmit={handleSubmit}>
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-4 border-b border-zinc-800/50">
                  <span className="text-emerald-500 font-mono">$</span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="type command..."
                    className="flex-1 bg-transparent text-white placeholder-zinc-700 focus:outline-none font-mono text-sm"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <kbd className="px-1.5 py-0.5 text-[9px] bg-zinc-900 rounded text-zinc-600 font-mono">ESC</kbd>
                </div>

                <div className="p-3 space-y-0.5 text-xs font-mono">
                  <CommandRow cmd="search" arg="<name>" desc="find borrower" onClick={() => { setInput("search "); inputRef.current?.focus(); }} />
                  <CommandRow cmd="fund" arg="<ticker>" desc="filter to fund" onClick={() => { setInput("fund "); inputRef.current?.focus(); }} />
                  <CommandRow cmd="shared" desc="overlapping positions" onClick={() => { setInput("shared"); handleSubmit({ preventDefault: () => {} } as React.FormEvent); }} />
                  <CommandRow cmd="concentrated" desc="top multi-fund borrowers" onClick={() => { onCommand?.("concentrated"); setIsOpen(false); }} />
                  <CommandRow cmd="explorer" desc="full explorer view" onClick={() => router.push("/explorer")} />
                  <CommandRow cmd="reset" desc="clear filters" onClick={() => { onCommand?.("reset"); setIsOpen(false); }} />
                  <div className="h-px bg-zinc-800/50 my-2" />
                  <CommandRow cmd="funds" shortcut="F" desc="browse funds" onClick={() => router.push("/funds")} />
                  <CommandRow cmd="borrowers" shortcut="B" desc="search companies" onClick={() => router.push("/borrowers")} />
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function CommandRow({
  cmd,
  arg,
  desc,
  shortcut,
  onClick
}: {
  cmd: string;
  arg?: string;
  desc: string;
  shortcut?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-zinc-900 text-left transition-colors group"
    >
      <span className="text-zinc-500 w-16">{cmd}</span>
      {arg && <span className="text-zinc-700">{arg}</span>}
      <span className="text-zinc-600 ml-auto">{desc}</span>
      {shortcut && (
        <kbd className="px-1.5 py-0.5 text-[9px] bg-zinc-900 rounded text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity">
          {shortcut}
        </kbd>
      )}
    </button>
  );
}
