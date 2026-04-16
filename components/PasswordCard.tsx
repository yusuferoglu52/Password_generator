"use client";

import { useState } from "react";
import type { PasswordSuggestion } from "@/types/password";
import { StrengthMeter } from "@/components/StrengthMeter";
import { ZxcvbnStatsPanel } from "@/components/ZxcvbnStatsPanel";

type PasswordCardProps = {
  suggestion: PasswordSuggestion;
};

const labelBadgeClass: Record<string, string> = {
  "very weak": "bg-red-100 text-red-800 ring-red-200/60",
  weak: "bg-orange-100 text-orange-900 ring-orange-200/60",
  fair: "bg-amber-100 text-amber-900 ring-amber-200/60",
  strong: "bg-sky-100 text-sky-900 ring-sky-200/60",
  "very strong": "bg-emerald-100 text-emerald-900 ring-emerald-200/60",
};

export function PasswordCard({ suggestion }: PasswordCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(suggestion.value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  const badge = labelBadgeClass[suggestion.label] ?? "bg-slate-100 text-slate-800 ring-slate-200/60";

  return (
    <article className="group flex flex-col rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-[0_12px_40px_-20px_rgba(15,23,42,0.2)] ring-1 ring-white/80 transition hover:border-teal-500/25 hover:shadow-[0_16px_48px_-20px_rgba(15,23,42,0.28)]">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
          <code className="block break-all font-mono text-sm font-semibold tracking-wide text-slate-800">
            {suggestion.value}
          </code>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-teal-500/40 hover:bg-teal-50/80 hover:text-teal-900 active:scale-[0.98]"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${badge}`}
        >
          {suggestion.label}
        </span>
        <span className="text-right text-[11px] leading-snug text-slate-500 sm:max-w-[55%]">
          <span className="font-medium text-slate-600">Score {suggestion.score + 1}/5</span>
          <span className="mx-1 text-slate-300">·</span>
          <span className="text-slate-500">{suggestion.crackTime}</span>
        </span>
      </div>
      <StrengthMeter score={suggestion.score} label={suggestion.label} />
      {suggestion.feedback[0] ? (
        <p className="mt-3 rounded-lg border border-amber-100/80 bg-amber-50/50 px-3 py-2 text-xs leading-relaxed text-amber-950/80">
          {suggestion.feedback[0]}
        </p>
      ) : null}
      <ZxcvbnStatsPanel
        guesses={suggestion.guesses}
        guessesLog10={suggestion.guessesLog10}
        crackTimesDisplay={suggestion.crackTimesDisplay}
        crackTimesSeconds={suggestion.crackTimesSeconds}
        calcTimeMs={suggestion.calcTimeMs}
        matchCount={suggestion.matchCount}
      />
    </article>
  );
}
