// src/lib/llm.ts
import { SYSTEM_PROMPT } from '@/lib/prompts';

interface LLMOptions {
  maxTokens?: number;
  temperature?: number;
}

/**
 * Extracts the primary insured entity name from document text
 */
export async function extractInsuredName(documentText: string, options: LLMOptions = {}): Promise<string> {
  // First try direct regex extraction 
  const extractedWithRegex = extractEntityWithRegex(documentText);
  if (extractedWithRegex !== "UNKNOWN") {
    console.log(`Extracted entity with regex: "${extractedWithRegex}"`);
    return extractedWithRegex;
  }

  try {
    console.log("Regex extraction failed, falling back to local server");
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
    /insured(?:\s+party)?:\s+([^.\n]+)/i,
    /named\s+insured:\s+([^.\n]+)/i,
    
    // Primary account holder
    /refer\s+to\s+(\w+(?:\s+\w+)*)\s+as the primary account/i,
    
    // Company name patterns
    /([A-Z][A-Za-z\s]+?(?:Ltd|LLC|Inc|Corporation|Corp|Co|Group|Farms|RE|HealthCare))\b/
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return "UNKNOWN";
}