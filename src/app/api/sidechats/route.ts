import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();

  return NextResponse.json({
    id: `side-${Date.now()}`,
    conversationId: body.conversationId ?? "conv-1",
    anchorMessageId: body.anchorMessageId ?? "msg-2",
    title: body.title ?? "Follow-up"
  });
}

