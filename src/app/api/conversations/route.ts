import { NextResponse } from "next/server";
import { conversations } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json(
    conversations.map((conversation) => ({
      id: conversation.id,
      title: conversation.title,
      updatedAt: conversation.updatedAt,
      branchCount: conversation.branches.length,
      sidechatCount: conversation.sidechats.length
    }))
  );
}

export async function POST() {
  return NextResponse.json({
    conversationId: "conv-1",
    branchId: "branch-main",
    title: "New Aurum Inquiry"
  });
}

