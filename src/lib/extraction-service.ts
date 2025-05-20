// src/lib/extraction-service.ts
import { createExtractionPrompt } from '@/lib/prompt-helpers';

interface ExtractionOptions {
  maxTokens?: number;
  temperature?: number;
}

/**
 * Attempts entity extraction using Hugging Face
 */
export async function extractEntity(text: string, options: ExtractionOptions = {}): Promise<string> {
  const prompt = createExtractionPrompt(text);
  
  try {
    // First try Hugging Face
    console.log("Attempting entity extraction with Hugging Face");
    const response = await fetch('/api/huggingface', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        maxTokens: options.maxTokens || 200,
        temperature: options.temperature || 0.3,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Hugging Face API failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data.result || data.response || "";
  } catch (error) {
    console.log("Hugging Face extraction failed! Check your API key or make sure the file is not corrupt.");
    return "UNKNOWN";
  }
}