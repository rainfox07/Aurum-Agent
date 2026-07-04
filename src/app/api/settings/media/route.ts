import { NextResponse } from "next/server";
import { mediaDomains, normalizeDomain } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json({ domains: mediaDomains });
}

export async function POST(request: Request) {
  const body = await request.json();
  const lines = String(body.domains ?? "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const unique = Array.from(new Set(lines.map((line) => normalizeDomain(line))));

  return NextResponse.json({
    domains: unique.map((domain, index) => ({
      id: `domain-${index + 1}`,
      domain,
      label: domain
    }))
  });
}

