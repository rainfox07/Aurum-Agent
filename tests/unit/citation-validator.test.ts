import { describe, expect, it } from "vitest";
import { validateCitedAnswer } from "@/lib/citation-validator";

const evidence = [
  {
    evidenceId: "ev_1",
    sourceId: "principles",
    title: "Principles",
    authorOrDomain: "Ray Dalio",
    sourceRef: "Part II",
    quotedText: "Principles make decision rules explicit."
  }
];

describe("validateCitedAnswer", () => {
  it("accepts cited paragraphs", () => {
    expect(validateCitedAnswer("Use explicit principles. [^ev_1]", evidence)).toEqual(["ev_1"]);
  });

  it("rejects uncited paragraphs", () => {
    expect(() => validateCitedAnswer("Use explicit principles.", evidence)).toThrow(
      "Every answer paragraph must include a citation"
    );
  });

  it("rejects unknown evidence markers", () => {
    expect(() => validateCitedAnswer("Use explicit principles. [^ev_9]", evidence)).toThrow(
      "Unknown citation marker: ev_9"
    );
  });

  it("accepts preset book citation markers", () => {
    expect(
      validateCitedAnswer("Use the selected book evidence. [^book_1]", [
        {
          ...evidence[0],
          evidenceId: "book_1"
        }
      ])
    ).toEqual(["book_1"]);
  });
});
