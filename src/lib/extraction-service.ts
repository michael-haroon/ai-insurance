// src/lib/extraction-service.ts
import { createExtractionPrompt } from '@/lib/prompt-helpers';

interface ExtractionOptions {
  maxTokens?: number;
  temperature?: number;
  onToken?: (token: string) => void;
}

/**
 * Extracts entity from text using the LLM service
 */
export async function extractEntity(text: string, options: ExtractionOptions = {}): Promise<string> {
  const prompt = createExtractionPrompt(text);
  
  try {
    console.log("Attempting entity extraction with LLM service");
    const response = await fetch('/api/llm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        max_length: options.maxTokens || 200,
        temperature: options.temperature || 0.3,
      }),
    });
    
    if (!response.ok) {
      const error = await response.text().catch(() => 'Unknown error');
      throw new Error(`LLM service failed: ${response.status} - ${error}`);
    }
    
    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let result = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(line => line.trim() !== '');
      
      for (const line of lines) {
        if (line === 'data: [DONE]') {
          continue;
        }
        
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.token) {
              result += data.token;
              if (options.onToken) {
                options.onToken(data.token);
              }
            } else if (data.error) {
              throw new Error(data.error);
            }
          } catch (e) {
            console.error('Error parsing chunk:', e);
          }
        }
      }
    }
    
    return result || "UNKNOWN";
  } catch (error) {
    console.error("Entity extraction failed:", error);
    return "UNKNOWN";
  }
}