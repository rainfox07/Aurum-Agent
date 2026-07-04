import { describe, expect, it } from "vitest";
import { listBookCandidates, normalizeDomain } from "@/lib/mock-data";

describe("source selection", () => {
  it("returns book candidates only", () => {
    const candidates = listBookCandidates("How should I make better decisions?");
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates.every((candidate) => candidate.type === "book")).toBe(true);
  });
});

describe("normalizeDomain", () => {
  it("normalizes full URLs", () => {
    expect(normalizeDomain("https://www.ft.com/world")).toBe("ft.com");
  });

  it("rejects localhost", () => {
    expect(() => normalizeDomain("localhost:3000")).toThrow("Invalid media domain");
  });
});

