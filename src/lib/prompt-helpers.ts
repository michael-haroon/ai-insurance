// src/lib/prompt-helpers.ts
import { SYSTEM_PROMPT } from '@/lib/prompts';

/**
 * Creates a properly formatted prompt for entity extraction
 */
export function createExtractionPrompt(documentText: string): string {
  return `${SYSTEM_PROMPT}\n\nDocument text:\n${documentText}\n\nExtract the primary insured entity name:`;
}

/**
 * Splits text into words and provides a delay between each for streaming simulation
 */
export async function simulateStreamingResponse(
  text: string, 
  sendChunk: (chunk: string) => void,
  delayMs: number = 100
): Promise<string> {
  const words = text.split(/\s+/);
  let result = '';
  
  for (const word of words) {
    await new Promise(resolve => setTimeout(resolve, delayMs));
    const token = word + ' ';
    result += token;
    sendChunk(token);
  }
  
  return result.trim();
}