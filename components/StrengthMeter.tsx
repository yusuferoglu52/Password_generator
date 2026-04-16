import type { PasswordStrengthLabel } from "@/types/password";

type StrengthMeterProps = {
  score: 0 | 1 | 2 | 3 | 4;
  label: PasswordStrengthLabel;
};

const LABEL_COLORS: Record<StrengthMeterProps["label"], string> = {
  "very weak": "bg-red-500 shadow-sm shadow-red-500/30",
  weak: "bg-orange-500 shadow-sm shadow-orange-500/25",
  fair: "bg-amber-500 shadow-sm shadow-amber-500/25",
  strong: "bg-sky-500 shadow-sm shadow-sky-500/25",
  "very strong": "bg-emerald-500 shadow-sm shadow-emerald-500/30",
};

export function StrengthMeter({ score, label }: StrengthMeterProps) {
  const filledSteps = score + 1;

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
        <span className="font-medium text-slate-600">Strength</span>
        <span className="capitalize text-slate-700">{label}</span>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div
            key={idx}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              idx < filledSteps ? LABEL_COLORS[label] : "bg-slate-200/90"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
