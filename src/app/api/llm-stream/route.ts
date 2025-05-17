// src/app/api/llm-stream/route.ts - Streaming endpoint
import { extractEntity } from '@/lib/extraction-service';
import { simulateStreamingResponse } from '@/lib/prompt-helpers';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const body = await request.json();
        
        // Extract the entity
        const entity = await extractEntity(body.prompt, {
          maxTokens: body.max_length,
          temperature: body.temperature
        });
        
        // Stream the response back
        await simulateStreamingResponse(
          entity,
          (chunk) => controller.enqueue(new TextEncoder().encode(chunk)),
          120 // slightly longer delay for a more natural typing effect
        );
        
        controller.close();
      } catch (error) {
        console.error('Streaming error:', error);
        controller.error(error);
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache'
    }
  });
}