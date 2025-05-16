# Insurance Claim Parser

A Next.js application that processes insurance claim documents to identify and match insured entities.

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

- `components/`: React components for the UI
- `lib/`: Core business logic and utilities
  - `parser.ts`: Document parsing utilities
  - `llm.ts`: Local NLP integration for entity extraction
  - `match.ts`: String matching and normalization logic
- `app/`: Next.js app router pages and layouts

## Trade-offs and Assumptions

### Processing Flow
- **Tiered Extraction Strategy**: The application implements a multi-tiered approach, using regex extraction first and falling back to rule-based NLP processing only when needed, balancing performance and accuracy.
- **Sequential Processing**: Files are processed sequentially with intentional delays (`await new Promise(resolve => setTimeout(resolve, 100))`) to prevent parser collisions. In a production environment, implementing parallel processing would be more efficient.
- **Streaming Support**: The application simulates streaming responses for a better user experience but this comes with additional complexity in the API endpoints.

### Error Handling
- **Graceful Degradation**: Multiple fallback mechanisms exist (regex → FastAPI NLP service → sample fallbacks) to handle various failure scenarios.
- **Ephemeral Error States**: The application handles errors gracefully but doesn't persist error states across page refreshes. A production environment would benefit from error logging and recovery mechanisms.
- **PDF Processing Resilience**: The app attempts multiple PDF parsing methods if the primary method fails, showing good resilience for handling problematic documents.

### Entity Extraction & Matching
- **Rule-based NLP**: Instead of using an actual LLM, the system uses a sophisticated rule-based NLP approach with pattern matching and heuristic scoring to extract entity names.
- **Simple String Similarity**: For entity matching, the implementation uses a basic string similarity algorithm. A production system might implement more sophisticated matching algorithms or integrate with a dedicated entity matching service.
- **Confidence Threshold**: Matches below a 0.8 confidence score are rejected, which may be too strict or too lenient depending on your domain's requirements.

### Security & Infrastructure
- **Document Safety**: The application assumes uploaded files are safe to process. Production implementations would require file validation, sanitization, and virus scanning.
- **Local FastAPI Server**: The system relies on a local FastAPI server (on port 8000) for advanced NLP processing, which might create deployment complexity but eliminates the costs associated with cloud-based LLMs.
- **Sample Fallbacks**: Special handling exists for sample documents, which is useful for demos but would need to be removed in production.


## Testing

Run the test suite:

```bash
npm test
```

The test suite includes unit tests for the string matching utilities and integration tests for the document parsing functionality.
