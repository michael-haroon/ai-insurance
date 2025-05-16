// app/api/llm/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const response = await fetch('http://localhost:8000/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.detail || 'LLM processing failed' },
        { status: response.status }
      );
    }

    return NextResponse.json(await response.json());
  } catch (error: unknown) {
    console.error('LLM proxy error:', error);
    
    // Type-safe error handling
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred';
      
    return NextResponse.json(
      { error: `Failed to process LLM request: ${errorMessage}` },
      { status: 500 }
    );
  }
}