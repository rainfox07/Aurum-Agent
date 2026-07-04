import type { EvidenceItem } from "@/lib/types";

export class CitationValidationError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export function extractCitationIds(markdown: string): string[] {
  return Array.from(markdown.matchAll(/\[\^([a-z]+_\d+)\]/g), (match) => match[1]);
}

export function validateCitedAnswer(markdown: string, evidence: EvidenceItem[]): string[] {
  const evidenceIds = new Set(evidence.map((item) => item.evidenceId));
  const citationIds = extractCitationIds(markdown);

  for (const citationId of citationIds) {
    if (!evidenceIds.has(citationId)) {
      throw new CitationValidationError(`Unknown citation marker: ${citationId}`);
    }
  }

  const paragraphs = markdown
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  for (const paragraph of paragraphs) {
    if (!/\[\^[a-z]+_\d+\]/.test(paragraph)) {
      throw new CitationValidationError("Every answer paragraph must include a citation");
    }
  }

  return citationIds;
}
