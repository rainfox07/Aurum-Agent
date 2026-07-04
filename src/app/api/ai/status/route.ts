import { NextResponse } from "next/server";
import { getLlmConfig } from "@/lib/ai/chat-client";

export async function GET() {
  const config = getLlmConfig();

  return NextResponse.json({
    configured: config.configured,
    mode: config.configured ? "live" : "mock",
    baseUrl: config.baseUrl,
    model: config.model,
    hasKey: config.configured
  });
}

