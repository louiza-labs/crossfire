"use client";

import { useState, useEffect } from "react";

interface TypingTextProps {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
  cursor?: boolean;
  onComplete?: () => void;
}

export function TypingText({
  text,
  speed = 50,
  delay = 0,
  className = "",
  cursor = true,
  onComplete,
}: TypingTextProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const startTimeout = setTimeout(() => {
      setStarted(true);
    }, delay);

    return () => clearTimeout(startTimeout);
  }, [delay]);

  useEffect(() => {
    if (!started) return;

    if (displayedText.length < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(text.slice(0, displayedText.length + 1));
      }, speed);

      return () => clearTimeout(timeout);
    } else {
      setIsComplete(true);
      onComplete?.();
    }
  }, [displayedText, text, speed, started, onComplete]);

  return (
    <span className={className}>
      {displayedText}
      {cursor && !isComplete && (
        <span className="animate-pulse text-emerald-400">_</span>
      )}
      {cursor && isComplete && (
        <span className="animate-pulse text-emerald-400 opacity-50">_</span>
      )}
    </span>
  );
}

interface TerminalLineProps {
  prefix?: string;
  text: string;
  delay?: number;
  speed?: number;
  className?: string;
  onComplete?: () => void;
}

export function TerminalLine({
  prefix = "$",
  text,
  delay = 0,
  speed = 30,
  className = "",
  onComplete,
}: TerminalLineProps) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowContent(true);
    }, delay);
    return () => clearTimeout(timeout);
  }, [delay]);

  if (!showContent) return null;

  return (
    <div className={`font-mono ${className}`}>
      <span className="text-zinc-500 mr-2">{prefix}</span>
      <TypingText text={text} speed={speed} onComplete={onComplete} />
    </div>
  );
}

interface CommandOptionProps {
  command: string;
  description: string;
  href: string;
  delay?: number;
  index?: number;
}

export function CommandOption({
  command,
  description,
  href,
  delay = 0,
  index = 0,
}: CommandOptionProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setVisible(true);
    }, delay + index * 100);
    return () => clearTimeout(timeout);
  }, [delay, index]);

  if (!visible) return null;

  return (
    <a
      href={href}
      className="group flex items-center gap-4 py-2 px-3 -mx-3 rounded-lg hover:bg-zinc-900 transition-all duration-200"
    >
      <span className="font-mono text-emerald-400 group-hover:text-emerald-300 transition-colors">
        {command}
      </span>
      <span className="text-zinc-500 group-hover:text-zinc-300 transition-colors">
        {description}
      </span>
      <span className="ml-auto text-zinc-700 group-hover:text-emerald-400 transition-colors opacity-0 group-hover:opacity-100">
        →
      </span>
    </a>
  );
}
