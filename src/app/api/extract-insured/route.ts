// src/app/api/extract-insured/route.ts
import { NextResponse } from "next/server";
import { SYSTEM_PROMPT } from "@/lib/prompts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";


export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    
    // Call your local LLM instead of Google
    const response = await fetch("http://localhost:8000/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: `${SYSTEM_PROMPT}\n\nDocument text:\n${text}\n\nExtract the primary insured entity name:`,
        max_length: 200,
        temperature: 0.3 // Lower temperature for more deterministic results
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `LLM request failed: ${response.status}`);
    }

    const result = await response.json();
    const insuredName = result.response.trim();
    
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