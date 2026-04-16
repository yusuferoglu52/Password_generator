import type { CrackTimesDisplay, CrackTimesSeconds } from "@zxcvbn-ts/core";

export type PasswordStrengthLabel =
  | "very weak"
  | "weak"
  | "fair"
  | "strong"
  | "very strong";

export type PasswordStrengthAnalysis = {
  score: 0 | 1 | 2 | 3 | 4;
  label: PasswordStrengthLabel;
  feedback: string[];
  /** Primary hint: offline attack vs slow hash (same as zxcvbn display). */
  crackTime: string;
  guesses: number;
  guessesLog10: number;
  crackTimesDisplay: CrackTimesDisplay;
  crackTimesSeconds: CrackTimesSeconds;
  calcTimeMs: number;
  matchCount: number;
};

export type PasswordStyle = "memorable" | "balanced" | "strongest";

export type PasswordGeneratorOptions = {
  keywordsInput: string;
  length: number;
  style: PasswordStyle;
  includeNumbers: boolean;
  includeSymbols: boolean;
};

export type PasswordSuggestion = { id: string; value: string } & PasswordStrengthAnalysis;
