# Insurance Claim Parser

A Next.js application that processes insurance claim documents to identify and match insured entities.
It is a work in progress and is not yet ready for "production" use.

## Features

- Drag-and-drop file upload for PDF, DOCX, and TXT files
- Multi-tiered entity extraction:
  - Hugging Face LLM-based extraction
  - Regex pattern matching fallback
  - Local Python NLP service for advanced processing
- Fuzzy matching against a predefined list of insured entities
- Real-time processing with streaming token updates
- Confidence scoring for matches
- Manual matching capabilities for low-confidence results
- Concurrent file processing with queue management

## Tech Stack

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS with PostCSS processing
- Geist UI components
- Hugging Face API for LLM processing
- Local Python NLP service
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
4. Set up Hugging Face API key in an .env file at the root of the project:
   ```bash
   HUGGINGFACE_API_KEY=your_api_key
   ```
5. In a new terminal, start the development server:
   ```bash
   npm run dev
   ```
6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Architecture

The application follows a modular architecture with clear separation of concerns:

- `local-llm/`: Source code for the local NLP server
   - `server.py`: FastAPI server for NLP processing
   - `requirements.txt`: Python dependencies
- `src/`: Source code for the application
   - `components/`: React components for the UI
   - `lib/`: Core business logic and utilities
      - `parser.ts`: Document parsing utilities
      - `llm.ts`: Hugging Face integration
      - `match.ts`: Entity matching and with confidence scoring
      - `prompts.ts`: Centralized system prompt for LLM
      - `extraction-services.ts`: Tiered extraction strategy
   - `app/`: Next.js app router pages and layouts
      - `api/`: API routes for document parsing and LLM interactions
         - `parse-docx/` & `parse-pdf/`: Document parsing APIs
         - `extract-insured/`: Entity extraction API
         - `llm/` & `llm-stream/`: Local LLM processing endpoints
         - `huggingface/`: Hugging Face LLM integration
      

## Processing Strategy

### Multi-Tiered Extraction
The application implements a sophisticated extraction pipeline:

1. **Primary: Hugging Face LLM**
   - Provides context-aware extraction with high accuracy
   - Uses carefully crafted prompts for insurance domain

2. **Fallback: Regex Pattern Matching**
   - Activates if LLM is unavailable or fails
   - Optimized for common insurance document formats

3. **Final Layer: Local NLP Service**
   - Python-based NLP for specialized extraction
   - Handles complex documents where other methods fail

### Robust Processing
- **Queued Processing**: Files are processed sequentially through a dedicated queue system
- **Collision Prevention**: Implementation includes mutex-style locking for PDF processing
- **Streaming Updates**: Real-time extraction results with token-by-token updates
- **Exponential Backoff**: Failed processing attempts are retried with increasing delays

## Entity Matching

- **Normalized Comparison**: Entities are normalized by removing corporate suffixes and standardizing formatting
- **Confidence Scoring**: Matches receive a confidence score (0-100%) indicating match quality
- **Manual Override**: Low-confidence matches can be manually corrected through the UI
- **Color-Coded Results**: Visual indicators show confidence levels for immediate assessment

## Trade-offs and Assumptions

- **Document Safety**: The application assumes uploaded files are safe to process. Production implementations would require file validation and virus scanning.
- **API Dependencies**: Relies on both Hugging Face API and local Python service, creating multiple external dependencies.
- **Processing Speed vs. Reliability**: Prioritizes reliable processing over speed by using queuing and retries.
- **Sample Document Handling**: Special handling exists for sample documents to ensure consistent demo results.

## Testing

Run the test suite:

```bash
npm test
```

The test suite includes unit tests for the string matching utilities and integration tests for the document parsing functionality.
