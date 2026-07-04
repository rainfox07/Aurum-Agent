import { describe, expect, it } from "vitest";
import { selectTopPresetBooks } from "@/lib/books/book-selector";

describe("selectTopPresetBooks", () => {
  it("selects startup or product books for startup/product questions", () => {
    const selection = selectTopPresetBooks("How should a startup test an MVP and improve product strategy?");
    const selectedIds = selection.selectedBooks.map((book) => book.id);

    expect(selectedIds).toHaveLength(3);
    expect(selectedIds.some((id) => id === "zero-to-one" || id === "the-lean-startup")).toBe(true);
  });

  it("selects Thinking, Fast and Slow for bias and decision questions", () => {
    const selection = selectTopPresetBooks("How do cognitive bias and overconfidence affect important decisions?");
    const selectedIds = selection.selectedBooks.map((book) => book.id);

    expect(selectedIds).toHaveLength(3);
    expect(selectedIds).toContain("thinking-fast-and-slow");
  });

  it("always returns three books", () => {
    expect(selectTopPresetBooks("天气怎么样？").selectedBooks).toHaveLength(3);
  });
});
