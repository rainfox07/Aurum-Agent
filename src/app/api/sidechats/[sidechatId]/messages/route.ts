import { NextResponse } from "next/server";

export async function POST(request: Request, context: { params: Promise<{ sidechatId: string }> }) {
  const { sidechatId } = await context.params;
  const body = await request.json();

  return NextResponse.json({
    sidechatId,
    userMessage: {
      id: `side-user-${Date.now()}`,
      role: "user",
      content: body.message,
      createdAt: new Date().toISOString()
    },
    assistantMessage: {
      id: `side-asst-${Date.now()}`,
      role: "assistant",
      content: "Sidechat keeps this follow-up separate from the main branch while preserving the cited context. [^ev_1]",
      createdAt: new Date().toISOString()
    }
  });
}

