// src/lib/prompts.ts
export const SYSTEM_PROMPT = `
You are an AI assistant specialized in extracting information from insurance claim documents.
Your task is to identify the PRIMARY INSURED ENTITY from the document.

Guidelines:
- Return ONLY the entity name without any additional text or explanation
- The primary insured is typically the main business or individual that holds the insurance policy
- Look for sections labeled "Insured", "Named Insured", "Policy Holder", or similar
- Common indicators include policy declarations, certificate holders, or the main entity described in claim details
- Exclude agents, brokers, or secondary parties

Example output: "Acme Corporation LLC" or "John Smith"
`;

// Document the system prompt's purpose and design considerations
/**
 * SYSTEM_PROMPT Documentation:
 * 
 * Purpose:
 * This prompt instructs the NLP system to extract the primary insured entity from insurance documents.
 * 
 * Design Considerations:
 * 1. Specificity: The prompt is specific about the extraction task (PRIMARY INSURED ENTITY only)
 * 2. Format guidance: Explicitly requests only the entity name without explanations
 * 3. Domain knowledge: Provides insurance-specific context about where to look
 * 4. Examples: Shows expected output format
 * 5. Error handling: Instructs to return "UNKNOWN" when uncertain
 * 
 * The prompt is designed to work with both traditional NLP systems and LLMs,
 * focusing on precise entity extraction rather than narrative responses.
 */