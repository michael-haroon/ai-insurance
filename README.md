# Insurance Claim Parser

A Next.js application that processes insurance claim documents to identify and match insured entities.
It is a work in progress and is not yet ready for "production" use.


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

The application employs a multi-tiered extraction strategy with three levels: Hugging Face LLM (primary), regex pattern matching (secondary), and a Python NLP service (fallback). Document processing follows a queue-based approach with mutex locking to prevent collisions during concurrent uploads. The React frontend provides real-time feedback through streaming updates during extraction, while the backend API routes handle document parsing and entity extraction.

Core modules include: parser.ts (document handling), extraction-service.ts (tiered extraction), llm.ts (AI integration), and match.ts (entity matching with confidence scoring). The system uses a dedicated Python service (local-llm/) for advanced NLP capabilities when other methods fail.

## Trade-offs and Assumptions

- **Document Safety**: The application assumes uploaded files are safe to process. Production implementations would require file validation and virus scanning.
- **API Dependencies**: Relies on both Hugging Face API and local Python service, creating multiple external dependencies.
- **Processing Speed vs. Reliability**: Prioritizes reliable processing over speed by using queuing and retries.
- **Sample Document Handling**: Special handling exists for sample documents to ensure consistent demo results.

