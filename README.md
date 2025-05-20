# Insurance Claim Parser

A Next.js application that processes insurance claim documents to identify and match insured entities.
It is a work in progress and is not yet ready for "production" use.


## Setup

1. Clone the repository
2. In the root directory, install dependencies:
   ```bash
   npm install
   ```
3. Set up Hugging Face API key in an .env file at the root of the project:
   ```bash
   HUGGINGFACE_API_KEY=your_api_key
   ```
4. In a new terminal, start the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Architecture

The application employs a multi-tiered extraction strategy with two levels: regex pattern matching (primary), and a Hugging Face LLM (secondary). Document processing follows a queue-based approach with mutex locking to prevent collisions during concurrent uploads. The React frontend provides real-time feedback through streaming updates during extraction, while the backend API routes handle document parsing and entity extraction.

Core modules include: parser.ts (document handling), extraction-service.ts (tiered extraction), llm.ts (AI integration), and match.ts (entity matching with confidence scoring). The system uses a lite regex pattern matching function at the first level to keep the program quick. LLM is the second level.

## Trade-offs and Assumptions

- **Document Safety**: The application assumes uploaded files are safe to process. Production implementations would require file validation and virus scanning.
- **API Dependencies**: Relies on Hugging Face API service, creating an external dependency that can lead to sudden privacy issues, price hikes, loss of service, or latency issues.
- **Processing Speed vs. Reliability**: Prioritizes speed over robustness by using lite regex first, then falls back to Hugging Face LLM if regex fails.
