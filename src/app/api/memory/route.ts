import { NextResponse } from "next/server";
import { activeMemories, suggestedMemories } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json({
    suggested: suggestedMemories,
    active: activeMemories
  });
}

