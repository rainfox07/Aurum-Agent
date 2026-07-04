import { NextResponse } from "next/server";
import { z } from "zod";
import { generateGroundedAnswer } from "@/lib/answers/generate-answer";
import { buildEvidence, getPendingQuestion } from "@/lib/mock-data";

const answerSchema = z.object({
  pendingQuestionId: z.string().min(1),
  selectedBookSourceIds: z.array(z.string().min(1)).min(1),
  llmConfig: z
    .object({
      baseUrl: z.string().trim().min(1),
      model: z.string().trim().min(1),
      apiKey: z.string().min(1)
    })
    .optional()
});

export async function POST(request: Request) {
  const parsed = answerSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Select at least one book source." }, { status: 400 });
  }

  const pendingQuestion = getPendingQuestion(parsed.data.pendingQuestionId);
  const question = pendingQuestion?.question ?? "What should I know from these sources?";
  const evidence = buildEvidence(parsed.data.selectedBookSourceIds);
  const answer = await generateGroundedAnswer({ question, evidence, llmConfig: parsed.data.llmConfig });

  return NextResponse.json({
    messageId: `asst-${Date.now()}`,
    markdown: answer.markdown,
    citations: answer.citations,
    aiMode: answer.aiMode,
    model: answer.model,
    warning: answer.warning,
    question
  });
}
