// src/app/api/llm/route.ts - LLM API endpoint with streaming support
import { NextResponse } from 'next/server';

// Default model to use if none is specified
const DEFAULT_MODEL = 'cutycat2000x/MeowGPT-3.5';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    
    if (!apiKey) {
      throw new Error('Hugging Face API key is not configured');
    }
    
    const model = body.model || DEFAULT_MODEL;
    const prompt = body.prompt || '';
    const maxTokens = body.max_length || 200;
    const temperature = body.temperature || 0.3;
    
    // Call the Hugging Face API
    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: maxTokens,
          temperature: temperature,
          return_full_text: false
        },
        options: {
          stream: true
        }
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `Hugging Face API error: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('Response body is empty');
    }

    // Create a TransformStream to process the streaming response
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();
    
    // Process the streaming response in the background
    (async () => {
      try {
        const reader = response.body!.getReader();
        let buffer = '';
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = new TextDecoder().decode(value, { stream: true });
          buffer += chunk;
          
          // Process complete lines
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6); // Remove 'data: ' prefix
            if (data === '[DONE]') break;
            
            try {
              const parsed = JSON.parse(data);
              const token = parsed.token?.text || '';
              if (token) {
                await writer.write(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`));
              }
            } catch (e) {
              console.error('Error parsing chunk:', e);
            }
          }
        }
        
        // Send completion event
        await writer.write(encoder.encode('data: [DONE]\n\n'));
        await writer.close();
      } catch (error) {
        console.error('Stream processing error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        await writer.write(encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`));
        await writer.close();
      }
    })();
    
    // Return the readable side of the stream as the response
    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: unknown) {
    console.error('Request error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: `Failed to process request: ${errorMessage}` },
      { status: 500 }
    );
  }
}