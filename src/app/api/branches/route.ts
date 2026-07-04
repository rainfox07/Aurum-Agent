import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const forkedFromMessageId = body.forkedFromMessageId ?? "msg-2";

  return NextResponse.json({
    id: `branch-${Date.now()}`,
    conversationId: body.conversationId ?? "conv-1",
    parentBranchId: body.parentBranchId ?? "branch-main",
    forkedFromMessageId,
    title: body.title ?? `Branch from ${String(forkedFromMessageId).slice(0, 8)}`
  });
}

