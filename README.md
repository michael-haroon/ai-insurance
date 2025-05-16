# Insurance Claim Parser

A Next.js application that processes insurance claim documents to identify and match insured entities.

## Features

- Drag-and-drop file upload for PDF, DOCX, and TXT files
- Automatic extraction of insured entity names using Google's Gemini
- Fuzzy matching against a predefined list of insured entities
- Real-time processing status updates
- Confidence scoring for matches
- Error handling and graceful failure recovery

## Tech Stack

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Google Gemini Pro
- PDF.js for PDF parsing
- Mammoth.js for DOCX parsing
- String Similarity for fuzzy matching

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file in the root directory with your Google API key:
   ```
   GOOGLE_API_KEY=your_api_key_here
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Architecture

The application follows a modular architecture with clear separation of concerns:

- `components/`: React components for the UI
- `lib/`: Core business logic and utilities
  - `parser.ts`: Document parsing utilities
  - `llm.ts`: Google Gemini integration for entity extraction
  - `match.ts`: String matching and normalization logic
- `app/`: Next.js app router pages and layouts

## Trade-offs and Assumptions

1. **File Processing**: Files are processed sequentially to avoid overwhelming the LLM API. In a production environment, we might want to implement parallel processing with rate limiting.

2. **Error Handling**: The application handles errors gracefully but doesn't persist error states across page refreshes. In a production environment, we might want to implement error logging and recovery mechanisms.

3. **Matching Algorithm**: The current implementation uses a simple string similarity algorithm. For production use, we might want to implement more sophisticated matching algorithms or integrate with a dedicated entity matching service.

4. **Security**: The application assumes that uploaded files are safe to process. In a production environment, we would need to implement file validation, sanitization, and virus scanning.

## Testing

Run the test suite:

```bash
npm test
```

The test suite includes unit tests for the string matching utilities and integration tests for the document parsing functionality.
