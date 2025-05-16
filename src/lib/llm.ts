// src/lib/llm.ts
import { SYSTEM_PROMPT } from '@/lib/prompts';

interface LLMOptions {
  maxTokens?: number;
  temperature?: number;
  onStreamToken?: (token: string) => void; // New callback for streaming
}

/**
 * Extracts the primary insured entity name from document text
 */
export async function extractInsuredName(documentText: string, options: LLMOptions = {}): Promise<string> {
  // First try direct regex extraction 
  const extractedWithRegex = extractEntityWithRegex(documentText);
  if (extractedWithRegex !== "UNKNOWN") {
    console.log(`Extracted entity with regex: "${extractedWithRegex}"`);
    
    // Simulate streaming for regex results if streaming is enabled
    if (options.onStreamToken) {
      const words = extractedWithRegex.split(/\s+/);
      for (const word of words) {
        await new Promise(resolve => setTimeout(resolve, 100));
        options.onStreamToken(word + ' ');
      }
    }
    
    return extractedWithRegex;
  }

  try {
    console.log("Regex extraction failed, falling back to local server");
    
    // Use streaming API if a streaming callback is provided
    if (options.onStreamToken) {
      const response = await fetch('/api/llm-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: documentText,
          max_length: options.maxTokens || 200,
          temperature: options.temperature || 0.7
        }),
      });

      if (!response.ok) {
        throw new Error(`Streaming request failed: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let result = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        result += chunk;
        
        // Call the callback with each chunk
        options.onStreamToken(chunk);
      }

      console.log(`Streamed entity: "${result}"`);
      return result.trim();
    } else {
      // Use regular API for non-streaming requests
      const response = await fetch('/api/llm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: documentText,
          max_length: options.maxTokens || 200,
          temperature: options.temperature || 0.7
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to extract insured name');
      }

      const data = await response.json();
      console.log(`Extracted entity with server: "${data.response}"`);
      return data.response.trim();
    }
  } catch (error) {
    console.error('LLM extraction error:', error);
    
    // If server fails, still return the regex result
    return extractedWithRegex;
  }
}

// Improved regex patterns with special handling for your sample cases
function extractEntityWithRegex(text: string): string {
  
  // General patterns
  const patterns = [
    // Primary entity pattern
    /(\w+(?:\s+\w+)*)\s*$$primary entity$$/i,
    
    // Insured party patterns
    /insured(?:\s+party)?[:\s]+([^.\n]+)/i,
    /named\s+insured[:\s]+([^.\n]+)/i,
    /policy\s+holder[:\s]+([^.\n]+)/i,
    /certificate\s+holder[:\s]+([^.\n]+)/i,
    
    // Primary account holder
    /refer\s+to\s+(\w+(?:\s+\w+)*)\s+as the primary account/i,
    /issued\s+to[:\s]+([^.\n]+)/i,
    
    // Company name patterns
    /([A-Z][A-Za-z0-9\s\.,&'-]+\s+(?:Ltd\.?|LLC|Inc\.?|Corporation|Corp\.?|Co\.?|Group|Partners|Farms|RE|HealthCare))\b/i,
    
    // Advanced pattern for company names with business keywords
    /([A-Z][A-Za-z0-9\s\.,&'-]*\s+(?:Healthcare|Medical|Financial|Insurance|Construction|Manufacturing|Software|Services|Solutions)(?:\s+[A-Za-z0-9\s\.,&'-]*))\b/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return "UNKNOWN";
}