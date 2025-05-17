// src/app/api/llm/route.ts - Standard endpoint
import { NextResponse } from 'next/server';
import { extractEntity } from '@/lib/extraction-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await extractEntity(body.prompt, {
      maxTokens: body.max_length,
      temperature: body.temperature
    });
    
    return NextResponse.json({ response: result });
  } catch (error: unknown) {
    console.error('Extraction error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: `Failed to extract entity: ${errorMessage}` },
      { status: 500 }
    );
  }
}