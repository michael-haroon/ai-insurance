// src/app/api/extract-insured/route.ts - Simplified to use extraction service
import { NextResponse } from "next/server";
import { extractEntity } from '@/lib/extraction-service';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    
    const insuredName = await extractEntity(text, {
      maxTokens: 200,
      temperature: 0.3
    });
    
    return NextResponse.json({ insuredName });
  } catch (err: unknown) {
    console.error("extract-insured error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to extract insured", details: errorMessage },
      { status: 500 }
    );
  }
}