import { NextResponse } from "next/server";
import { conversations } from "@/lib/mock-data";

export async function GET(_request: Request, context: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = await context.params;
  const conversation = conversations.find((item) => item.id === conversationId);

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  return NextResponse.json(conversation);
}

