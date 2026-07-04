import { NextResponse } from "next/server";
import { z } from "zod";
import { generateAuthorModeAnswer } from "@/lib/answers/generate-answer";
import type { EvidenceItem } from "@/lib/types";
import { bookSources, buildEvidence } from "@/lib/mock-data";

const sourceSchema = z.object({
  sourceId: z.string().min(1),
  title: z.string().min(1),
  author: z.string().min(1),
  sourceRef: z.string().optional(),
  quotedText: z.string().optional()
});

const schema = z.object({
  conversationId: z.string().min(1),
  branchId: z.string().min(1),
  sourceId: z.string().min(1),
  message: z.string().trim().min(1),
  source: sourceSchema.optional(),
  llmConfig: z
    .object({
      baseUrl: z.string().trim().min(1),
      model: z.string().trim().min(1),
      apiKey: z.string().optional()
    })
    .optional()
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Author mode message is required." }, { status: 400 });
  }

  const evidence = buildAuthorModeEvidence(parsed.data.source ?? null, parsed.data.sourceId);
  const source = parsed.data.source ?? bookSources.find((book) => book.id === parsed.data.sourceId);
  const answer = await generateAuthorModeAnswer({
    author: source?.author ?? "the selected author",
    title: source?.title ?? "the selected book",
    userMessage: parsed.data.message,
    evidence,
    llmConfig: parsed.data.llmConfig
  });

  return NextResponse.json({
    messageId: `author-msg-${Date.now()}`,
    markdown: answer.markdown,
    citations: answer.citations,
    aiMode: answer.aiMode,
    model: answer.model,
    warning: answer.warning
  });
}

function buildAuthorModeEvidence(
  source: z.infer<typeof sourceSchema> | null,
  sourceId: string
): EvidenceItem[] {
  if (source) {
    return [
      {
        evidenceId: "ev_1",
        sourceId: source.sourceId,
        title: source.title,
        authorOrDomain: source.author,
        sourceRef: source.sourceRef ?? "Selected book excerpt",
        quotedText: source.quotedText ?? `Selected excerpt from ${source.title}.`
      }
    ];
  }

  return buildEvidence([sourceId]);
}
