import { NextResponse } from "next/server";

export async function POST(request: Request, context: { params: Promise<{ memoryId: string }> }) {
  const { memoryId } = await context.params;
  const body = await request.json().catch(() => ({}));

  return NextResponse.json({
    id: memoryId,
    status: "active",
    category: body.category ?? "preference",
    content: body.content ?? "Approved memory",
    updatedAt: new Date().toISOString()
  });
}

export async function DELETE(_request: Request, context: { params: Promise<{ memoryId: string }> }) {
  const { memoryId } = await context.params;
  return NextResponse.json({ id: memoryId, status: "deleted" });
}

