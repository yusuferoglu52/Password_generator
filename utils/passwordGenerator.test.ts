import { describe, expect, it } from "vitest";
import { generatePasswords } from "@/utils/passwordGenerator";
import type { PasswordGeneratorOptions } from "@/types/password";

const SYMBOL_RE = /[!@#$%&*_\-+=?]/;
const DIGIT_RE = /\d/;

function createOptions(overrides: Partial<PasswordGeneratorOptions> = {}): PasswordGeneratorOptions {
  return {
    keywordsInput: "hiking,jazz,coffee,space",
    length: 14,
    style: "balanced",
    includeNumbers: true,
    includeSymbols: true,
    ...overrides,
  };
}

describe("generatePasswords", () => {
  it("returns requested count and unique passwords", async () => {
    const results = await generatePasswords(createOptions(), 8);

    expect(results).toHaveLength(8);
    expect(new Set(results.map((item) => item.value)).size).toBe(results.length);
  });

  it("clamps generated length to minimum and maximum bounds", async () => {
    const minResults = await generatePasswords(createOptions({ length: 3 }), 6);
    const maxResults = await generatePasswords(createOptions({ length: 99 }), 6);

    minResults.forEach((item) => expect(item.value).toHaveLength(10));
    maxResults.forEach((item) => expect(item.value).toHaveLength(32));
  });

  it("injects numbers and symbols when related options are enabled", async () => {
    const results = await generatePasswords(
      createOptions({
        style: "strongest",
        length: 20,
        includeNumbers: true,
        includeSymbols: true,
      }),
      8
    );

    results.forEach((item) => {
      expect(item.value).toMatch(DIGIT_RE);
      expect(item.value).toMatch(SYMBOL_RE);
    });
  });

  it("keeps memorable style readable with separator-based phrase structure", async () => {
    const results = await generatePasswords(
      createOptions({
        style: "memorable",
        length: 18,
        includeNumbers: false,
        includeSymbols: false,
      }),
      8
    );

    results.forEach((item) => {
      expect(item.value).toMatch(/^[A-Z]/);
      expect(item.value).toMatch(/[-.]/);
    });
  });
});
