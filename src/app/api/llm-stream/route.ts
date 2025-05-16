// src/app/api/llm-stream/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  // Create a streaming response
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const body = await request.json();
        const text = body.prompt;
        
        // Call your Python service (which isn't actually streaming)
        // but we'll simulate streaming on our end
        const response = await fetch('http://localhost:8000/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || `Server error: ${response.status}`);
        }

        const result = await response.json();
        const entityName = result.response.trim();
        
        // Simulate streaming by sending word by word
        const words = entityName.split(/\s+/);
        for (const word of words) {
          // Encode the text chunk and send it
          controller.enqueue(new TextEncoder().encode(word + ' '));
          // Add a small delay to simulate typing
          await new Promise(resolve => setTimeout(resolve, 120));
        }
        
        controller.close();
      } catch (error) {
        console.error('Streaming error:', error);
        controller.error(error);
      }
    }
  });

  // Return the stream with the appropriate headers
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache'
    }
  });
}