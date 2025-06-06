// src/lib/parser.ts

import { extractInsuredName } from '@/lib/llm';

// Create a singleton processing queue with proper isolation
class PdfProcessingQueue {
  private queue: Array<{
    task: () => Promise<any>,
    resolve: (value: any) => void,
    reject: (error: Error) => void
  }> = [];
  private isProcessing = false;

  // Add task to queue and return a promise
  enqueue<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        task,
        resolve,
        reject
      });
      
      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  // Process queue sequentially
  private async processQueue() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }
    
    this.isProcessing = true;
    const { task, resolve, reject } = this.queue.shift()!;
    
    try {
      // Process one task at a time
      const result = await task();
      resolve(result);
    } catch (error) {
      reject(error instanceof Error ? error : new Error(String(error)));
    } finally {
      // Ensure we continue processing the queue
      setTimeout(() => this.processQueue(), 50);
    }
  }
}

// Create a singleton instance
const pdfQueue = new PdfProcessingQueue();

export interface ParsedDocument {
  text: string;
  insuredName: string;
}

export async function parseFile(
  file: File, 
  onExtractProgress?: (partialName: string) => void
): Promise<ParsedDocument> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  let text: string;
  switch (ext) {
    case 'pdf':
      // Use the queue for PDF processing
      text = await pdfQueue.enqueue(() => processPdf(file));
      break;
    case 'docx':
      text = await parseViaApi('/parse-docx', file);
      break;
    case 'txt':
      text = await file.text();
      break;
    default:
      throw new Error(`Unsupported file type: ${ext}`);
  }

  // Track the current partial name for streaming updates
  let currentPartial = '';
  
  const onToken = onExtractProgress 
    ? (token: string) => {
        currentPartial += token;
        onExtractProgress(currentPartial);
      }
    : undefined;

  // Extract the insured name with streaming support
  const insuredName = await extractInsuredName(text, {
    onStreamToken: onToken
  });

  return { text, insuredName };
}

// PDF-specific processing function with retries
async function processPdf(file: File): Promise<string> {
  // Add exponential backoff retry logic
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    try {
      const text = await parseViaApi('/parse-pdf', file);
      return text;
    } catch (error) {
      attempts++;
      console.log(`PDF parse attempt ${attempts} failed, ${maxAttempts - attempts} retries left`);
      
      if (attempts >= maxAttempts) {
        throw error;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, attempts)));
    }
  }
  
  throw new Error("Maximum retry attempts exceeded");
}

async function parseViaApi(endpoint: string, file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);

  // Implement a timeout to prevent hanging requests
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // Increased to 60 second timeout
  
  try {
    const res = await fetch(`/api${endpoint}`, { 
      method: 'POST', 
      body: fd,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `${endpoint} failed: ${res.status}`);
    }
    
    const { text } = await res.json();
    
    // Validate the response with less strict criteria
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid response format');
    }
    
    // Log the first 100 characters for debugging
    console.log(`Parsed text sample (${text.length} chars):`, text.substring(0, 100));
    
    // Only check for obviously invalid content
    if (text.includes('WebKitFormBoundary')) {
      throw new Error('Form boundary detected in response');
    }
    
    return text;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`Parse API error for ${file.name}:`, error);
    throw error;
  }
}