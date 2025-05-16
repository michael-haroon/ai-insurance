# server.py - Advanced entity extraction
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import re
from typing import List, Tuple

app = FastAPI(title="Insurance Claim Parser - Advanced NLP")

class ChatRequest(BaseModel):
    prompt: str
    max_length: int = 200  # kept for API compatibility
    temperature: float = 0.7  # kept for API compatibility

class ChatResponse(BaseModel):
    response: str

# Define section markers that often precede insured entities
SECTION_MARKERS = [
    r"(?:named\s+)?insured(?:\s+party)?[:\s]+",
    r"policy\s+holder[:\s]+",
    r"certificate\s+holder[:\s]+",
    r"insurance\s+holder[:\s]+",
    r"(?:primary|insured)\s+(?:entity|company)[:\s]+",
    r"coverage\s+for[:\s]+",
    r"issued\s+to[:\s]+"
]

# Define company suffixes and words
COMPANY_SUFFIXES = [
    r"LLC", r"Inc\.?", r"Ltd\.?", r"Corporation", r"Corp\.?", 
    r"Company", r"Co\.?", r"Group", r"Partners", r"Farms", 
    r"Industries", r"Holdings", r"Associates", r"Services",
    r"Solutions", r"Systems", r"Technologies", r"Properties"
]

# Business keywords that often appear in company names
BUSINESS_INDICATORS = [
    r"Healthcare", r"Medical", r"Financial", r"Insurance", r"Bank",
    r"Construction", r"Manufacturing", r"Retail", r"Software", 
    r"Consulting", r"Development", r"Resources", r"Energy", r"Foods",
    r"Products", r"Enterprises", r"Global", r"International", r"National"
]

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest):
    try:
        # Prepare text and normalize whitespace
        doc_text = re.sub(r'\s+', ' ', req.prompt).strip()
        print(f"Processing document of length {len(doc_text)} chars")
        
        # Handle common PDF parsing issues
        if "FitH null" in doc_text and len(doc_text) < 50:
            print("Found PDF metadata instead of content")
            return ChatResponse(response="UNKNOWN (PDF parsing error)")
        
        # Check for specific patterns in descending order of confidence
        
        # 1. HIGHEST PRIORITY: Explicit "primary entity" markers
        primary_entity_patterns = [
            r"(\w+(?:\s+\w+)+)\s*$$(?:primary|main)\s+entity$$",
            r"primary\s+insured\s*[:\-]\s*(\w+(?:\s+\w+)+)",
            r"primary\s+insured\s+(?:is|being)\s+(\w+(?:\s+\w+)+)",
            r"refer\s+to\s+(\w+(?:\s+\w+)+)\s+as\s+(?:the\s+)?primary",
            r"principal\s+insured\s*[:\-]\s*(\w+(?:\s+\w+)+)"
        ]
        
        for pattern in primary_entity_patterns:
            matches = re.finditer(pattern, doc_text, re.IGNORECASE)
            for match in matches:
                entity = match.group(1).strip()
                print(f"Found primary entity indicator: '{entity}'")
                # Try to extend the entity name if it's truncated
                extended_entity = extend_entity_name(doc_text, entity)
                return ChatResponse(response=extended_entity)
        
        # 2. MEDIUM PRIORITY: Look for entities near insured/policy sections
        for marker in SECTION_MARKERS:
            pattern = f"{marker}([A-Z][A-Za-z0-9\s\.,&'-]+)(?:\.|\\n|\\r|$)"
            matches = re.finditer(pattern, doc_text, re.IGNORECASE)
            for match in matches:
                # Extract up to the next boundary (period, newline, or 50 chars)
                entity_text = match.group(1).strip()
                if len(entity_text) > 5:  # Avoid very short matches
                    # Clean up and normalize the entity
                    entity = clean_entity_name(entity_text)
                    print(f"Found entity near section marker: '{entity}'")
                    return ChatResponse(response=entity)
        
        # 3. LOWER PRIORITY: Look for company names with business suffixes
        company_patterns = []
        
        # Create patterns for various company name formats
        for suffix in COMPANY_SUFFIXES:
            company_patterns.append(
                rf"([A-Z][A-Za-z0-9\s\.,&'-]+\s+{suffix})(?:\.|\\n|\\r|$)"
            )
        
        # Add patterns for company names with business indicators
        for indicator in BUSINESS_INDICATORS:
            company_patterns.append(
                rf"([A-Z][A-Za-z0-9\s\.,&'-]*\s+{indicator}\s+[A-Za-z0-9\s\.,&'-]*)(?:\.|\\n|\\r|$)"
            )
        
        # Try to match company patterns
        for pattern in company_patterns:
            matches = re.finditer(pattern, doc_text, re.IGNORECASE)
            for match in matches:
                entity = clean_entity_name(match.group(1))
                print(f"Found company name with business suffix: '{entity}'")
                return ChatResponse(response=entity)
        
        # 4. LOWEST PRIORITY: Look for capitalized multi-word phrases
        cap_word_pattern = r"([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,5})(?:\.|\\n|\\r|$)"
        matches = re.finditer(cap_word_pattern, doc_text)
        for match in matches:
            entity = clean_entity_name(match.group(1))
            # Avoid extracting common header phrases
            if not any(header in entity.lower() for header in ["report", "certificate", "policy", "document", "claim", "loss"]):
                print(f"Found capitalized phrase: '{entity}'")
                return ChatResponse(response=entity)
        
        # If we still haven't found anything, try extracting the most likely candidate
        potential_entities = extract_potential_entities(doc_text)
        if potential_entities:
            best_entity = potential_entities[0]
            print(f"No clear entity found, using best candidate: '{best_entity}'")
            return ChatResponse(response=best_entity)
        
        print("No entity found in text")
        return ChatResponse(response="UNKNOWN")

    except Exception as e:
        print(f"Error processing request: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

def clean_entity_name(name: str) -> str:
    """Clean and normalize an entity name."""
    # Remove trailing punctuation and extra spaces
    cleaned = re.sub(r'[,.:;]$', '', name)
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    
    # If the name appears to be cut off (ends with a single word), try to find a boundary
    words = cleaned.split()
    if len(words) > 2 and len(words[-1]) <= 3 and words[-1].lower() not in ["inc", "llc", "ltd", "co"]:
        cleaned = " ".join(words[:-1])
    
    return cleaned

def extend_entity_name(text: str, partial_name: str) -> str:
    """Try to extend a partial entity name by looking for common business suffixes."""
    # Find the position of the partial name in the text
    pos = text.find(partial_name)
    if pos == -1:
        return partial_name
    
    # Look ahead for common business suffixes within a reasonable distance
    look_ahead = text[pos + len(partial_name):pos + len(partial_name) + 30]
    
    # Check if there's a business suffix nearby
    for suffix in ["LLC", "Inc", "Ltd", "Corporation", "Corp", "Co", "Group"]:
        suffix_match = re.search(rf'\s+{suffix}\.?\b', look_ahead, re.IGNORECASE)
        if suffix_match:
            return f"{partial_name} {suffix_match.group(0).strip()}"
    
    return partial_name

def extract_potential_entities(text: str) -> List[str]:
    """Extract a list of potential entity names ranked by likelihood."""
    candidates = []
    
    # Look for capitalized phrases that might be company names
    cap_phrases = re.finditer(r'([A-Z][A-Za-z0-9\s\.,&\'-]{5,50})(?:\.|\\n|\\r|$)', text)
    for match in cap_phrases:
        phrase = clean_entity_name(match.group(1))
        if len(phrase.split()) >= 2:  # At least two words
            # Score the phrase based on likelihood of being a company name
            score = score_entity_candidate(phrase)
            candidates.append((phrase, score))
    
    # Sort by score in descending order
    candidates.sort(key=lambda x: x[1], reverse=True)
    
    # Return just the names, in order of likelihood
    return [name for name, score in candidates]

def score_entity_candidate(phrase: str) -> float:
    """Score a phrase based on how likely it is to be a company name."""
    score = 0.0
    lower_phrase = phrase.lower()
    
    # Bonus for length (but not too long)
    words = phrase.split()
    if 2 <= len(words) <= 5:
        score += 0.3
    
    # Bonus for business suffixes
    if any(suffix.lower() in lower_phrase for suffix in ["llc", "inc", "ltd", "corporation", "corp", "co", "group"]):
        score += 0.4
    
    # Bonus for business indicators
    business_words = ["healthcare", "medical", "financial", "insurance", "construction", "manufacturing", 
                       "retail", "software", "consulting", "solutions", "services", "systems", "technologies"]
    if any(word in lower_phrase for word in business_words):
        score += 0.3
    
    # Penalty for common non-entity phrases
    common_phrases = ["report of", "certificate of", "policy number", "claim form", "page", "date", "time"]
    if any(phrase in lower_phrase for phrase in common_phrases):
        score -= 0.5
    
    return score

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)