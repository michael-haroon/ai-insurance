# Insurance Claim Parser

A Next.js application that processes insurance claim documents to identify and match insured entities.
It is a work in progress and is not yet ready for "production" use.

## Features

- Drag-and-drop file upload for PDF, DOCX, and TXT files
- Automatic extraction of insured entity names using local NLP
- Fuzzy matching against a predefined list of insured entities
- Real-time processing status updates
- Confidence scoring for matches
- Error handling and graceful failure recovery

## Tech Stack

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Local NLP
- PDF.js for PDF parsing
- Mammoth.js for DOCX parsing
- String Similarity for fuzzy matching

## Setup

1. Clone the repository
2. In the root directory, install dependencies:
   ```bash
   npm install
   ```
3. Set up the local NLP server:
   ```bash
   # Navigate to the local-llm directory
   cd local-llm

   # Create a Python virtual environment (optional but recommended)
   python -m venv venv

   # Activate the virtual environment
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate

   # Install Python dependencies
   pip install -r requirements.txt

   # Start the NLP server
   python server.py
   ```
4. In a new terminal, start the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Architecture

The application follows a modular architecture with clear separation of concerns:

- `local-llm/`: Source code for the local NLP server
   - `server.py`: FastAPI server for NLP processing
   - `requirements.txt`: Python dependencies
- `src/`: Source code for the application
   - `components/`: React components for the UI
   - `lib/`: Core business logic and utilities
      - `parser.ts`: Document parsing utilities
      - `llm.ts`: Local NLP integration for entity extraction
      - `match.ts`: String matching and normalization logic
      - `mockData.ts`: Mock data for testing
   - `app/`: Next.js app router pages and layouts
      - `page.tsx`: Main page component
      - `layout.tsx`: Layout component
      - `api/`: API routes
         - `parse-docx/`: Document parsing API
         - `extract-insured/`: Insured extraction API
         - `llm/`: Local NLP API
         - `llm-stream/`: Local NLP streaming API
   - `public/`: Static assets
      - `favicon.ico`: Favicon
      - `logo.png`: Logo
      - `mockData.ts`: Mock data for testing
      

## Trade-offs and Assumptions

### Processing Flow
- **Three-Tier Extraction Strategy**: The application implements a sophisticated multi-tiered approach:
  1. **LLM-Based Extraction**: First attempts to use Hugging Face's LLM capabilities for highest accuracy
  2. **Pattern Matching**: Falls back to regex pattern matching if the LLM is unavailable
  3. **Advanced NLP Service**: As a final fallback, uses a dedicated Python NLP service with specialized entity extraction algorithms
  
- **Sequential Processing**: Files are processed sequentially with intentional delays to prevent parser collisions and avoid overwhelming system resources. In a production environment, implementing parallel processing with rate limiting would be more efficient.
- **Streaming Support**: The application simulates streaming token responses from all extraction methods for a better user experience, providing real-time feedback during extraction operations.

### Error Handling
- **Graceful Degradation**: The three-tier fallback system (LLM → regex → Python NLP) ensures exceptional resilience, allowing the system to continue functioning even when multiple extraction methods fail.
- **Ephemeral Error States**: The application handles errors gracefully but doesn't persist error states across page refreshes. A production environment would benefit from error logging and recovery mechanisms.
- **PDF Processing Resilience**: The app attempts multiple PDF parsing methods if the primary method fails, showing good resilience for handling problematic documents.

### Entity Extraction & Matching
- **LLM Integration**: The system uses Hugging Face's API for primary extraction, with carefully tuned prompts to guide the model's focus on insurance entities.
- **Pattern-Based Fallback**: When LLM extraction isn't available, the system falls back to regex patterns optimized for insurance document formatting.
- **Advanced NLP Techniques**: The Python service provides sophisticated entity detection with contextual awareness and heuristic scoring that goes beyond simple pattern matching.
- **String Similarity Matching**: For entity matching, the implementation uses the string-similarity package to compute a confidence score between normalized entity names. The score ranges from 0 to 1, with 1 being an exact match.
- **Strict Confidence Threshold**: Matches below a 0.8 confidence score are rejected as "No match found". This 80% threshold balances precision and recall for the insurance domain.
- **Name Normalization**: The matching algorithm normalizes names by removing corporate suffixes, converting to lowercase, and standardizing spacing, which improves matching accuracy but might lose potentially distinguishing information.

### Security & Infrastructure
- **Document Safety**: The application assumes uploaded files are safe to process. Production implementations would require file validation, sanitization, and virus scanning.
- **API Key Security**: The Hugging Face API key is stored server-side with appropriate access controls, but a more robust secrets management system would be needed in production.
- **Sample Fallbacks**: Special handling exists for sample documents, which is useful for demos but would need to be removed in production.
- **Service Dependencies**: The application relies on both the Hugging Face API and a local Python service, creating multiple external dependencies that would need reliability monitoring in production.

### System Prompt Design
The system prompt is configured in a single location (`src/lib/prompts.ts`) for maintainability and consistency. The prompt was designed with these considerations:
- **Task specificity**: Clearly instructs the model to extract only the primary insured entity
- **Format guidance**: Emphasizes returning only the entity name without explanations
- **Domain context**: Provides insurance-specific terminology to help the model identify relevant entities
- **Error handling**: Instructs the model to return "UNKNOWN" when it can't confidently identify the entity

## Testing

Run the test suite:

```bash
npm test
```

The test suite includes unit tests for the string matching utilities and integration tests for the document parsing functionality.
