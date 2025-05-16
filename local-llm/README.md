# Local LLM Server for AI Insurance

This project provides a local LLM server that can be used by the insurance application without any API restrictions.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the server:
```bash
python server.py
```

The server will run on http://localhost:8000

## Usage

The server provides a `/chat` endpoint that accepts POST requests with the following JSON body:
```json
{
    "prompt": "Your prompt here",
    "max_length": 200,  // Optional, default: 200
    "temperature": 0.7   // Optional, default: 0.7
}
```

Example curl request:
```bash
curl -X POST http://localhost:8000/chat \
-H "Content-Type: application/json" \
-d '{"prompt": "Explain insurance policies in simple terms."}'
```

## Features
- Local deployment without API restrictions
- Mixtral model for high-quality responses
- FastAPI backend for efficient serving
- Configurable parameters (max_length, temperature)
