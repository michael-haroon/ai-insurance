// src/lib/llm.ts
import { SYSTEM_PROMPT } from './prompts';
import { parseViaApi } from './parser';

interface LLMOptions {
  maxTokens?: number;
  temperature?: number;
  onStreamToken?: (token: string) => void;
  file?: File;
}

/**
 * Extracts the primary insured entity name from document text
 * using a tiered approach: regex -> reparse PDF -> API endpoints
 */
export async function extractInsuredName(documentText: string, options: LLMOptions = {}): Promise<string> {
  // First try direct regex extraction (fast, local)
  const extractedWithRegex = extractEntityWithRegex(documentText);
  if (extractedWithRegex !== "UNKNOWN") {
    console.log(`Extracted entity with regex: "${extractedWithRegex}"`);
    
    // Simulate streaming for regex results if streaming is enabled
    if (options.onStreamToken) {
      // Split the text into characters and stream them with a small delay
      const tokens = extractedWithRegex.split('');
      for (let i = 0; i < tokens.length; i++) {
        // Use setTimeout to create a delay between tokens
        await new Promise(resolve => setTimeout(resolve, 20));
        options.onStreamToken(tokens[i]);
      }
    }
    
    return extractedWithRegex;
  }

  try {
    console.log("Regex extraction failed, attempting PDF reparse");
    
    // If the document text is from a PDF, try to reparse it
    if (options.file && options.file.name.toLowerCase().endsWith('.pdf')) {
      try {
        // Attempt to reparse the PDF
        const reparsedText = await parseViaApi('/parse-pdf', options.file);
        console.log("PDF reparse successful, attempting regex extraction again");
        
        // Try regex extraction again with the reparsed text
        const reparsedExtraction = extractEntityWithRegex(reparsedText);
        if (reparsedExtraction !== "UNKNOWN") {
          console.log(`Extracted entity after PDF reparse: "${reparsedExtraction}"`);
          
          // Simulate streaming for reparsed results
          if (options.onStreamToken) {
            const tokens = reparsedExtraction.split('');
            for (let i = 0; i < tokens.length; i++) {
              await new Promise(resolve => setTimeout(resolve, 20));
              options.onStreamToken(tokens[i]);
            }
          }
          
          return reparsedExtraction;
        }
      } catch (reparseError) {
        console.warn("PDF reparse failed:", reparseError);
      }
    }

    console.log("Regex extraction and PDF reparse failed, calling extraction API");
    
    const response = await fetch('/api/llm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        system_prompt: SYSTEM_PROMPT,
        prompt: documentText,
        max_length: options.maxTokens || 200,
        temperature: options.temperature || 0.3
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `API request failed with status ${response.status}`);
    }

    if (!response.body) {
      throw new Error('Response body is empty');
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
              if (options.onStreamToken) {
                options.onStreamToken(data.token);
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

    console.log(`Extracted entity with API: "${result}"`);
    return result.trim() || "UNKNOWN";
  } catch (error) {
    console.error('API extraction error:', error);
    return "UNKNOWN";
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