# Research Ethics Guidance Assistant

> Citation-first, evidence-grounded research ethics guidance with human-in-the-loop escalation.

## ⚠️ DEMO KNOWLEDGE BASE
This application uses **demo documents** for demonstration purposes only.
Replace all files in `backend/knowledge_base/` with institution-approved sources before any production use.

---

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- A valid `GEMINI_API_KEY`

### 1. Environment Setup

```bash
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

### 2. Backend Setup

```bash
cd backend
pip install -r requirements.txt
python ingest.py           # Index the knowledge base (run once)
uvicorn main:app --reload  # Start the API server
```

Backend runs at: http://localhost:8000
API docs at: http://localhost:8000/docs

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: http://localhost:5173

---

## Architecture

```
APPROVED SOURCES (PDFs/TXT)
         ↓
   PDF Extraction (PyMuPDF)
         ↓
   Text Chunking
         ↓
   Embeddings (all-MiniLM-L6-v2)
         ↓
   ChromaDB Vector Store
         ↓
   Similarity Retrieval
         ↓
   Question Classifier
   (SUPPORTED / ESCALATION / UNKNOWN)
         ↓
   Gemini LLM (evidence-grounded)
         ↓
   Citation-aware Answer + Sources
         ↓
   Case-specific? → Human Review
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Service info |
| GET | `/health` | System health + RAG status |
| GET | `/categories` | Available categories |
| POST | `/ask` | Ask a question |

### POST /ask

Request:
```json
{
  "question": "What is informed consent?",
  "category": "Informed Consent"
}
```

Response:
```json
{
  "answer": "...",
  "category": "Informed Consent",
  "confidence": "High",
  "escalation_required": false,
  "escalation_reason": null,
  "question_type": "SUPPORTED",
  "sources": [
    {
      "document": "Demo Informed Consent Policy",
      "page": 2,
      "section": "2.1",
      "excerpt": "...",
      "category": "Informed Consent",
      "organization": "Demo Research Institution"
    }
  ]
}
```

## Question Classification

| Type | Example | Behavior |
|------|---------|----------|
| SUPPORTED | "What is informed consent?" | RAG answer with citations |
| ESCALATION | "Can our study proceed?" | General guidance + human review required |
| UNKNOWN | "Write a Python game" | Out of scope message |

## Knowledge Base Structure

```
backend/knowledge_base/
├── consent/            → Informed Consent documents
├── data_handling/      → Data & Privacy documents  
├── authorship/         → Authorship policy documents
├── publication/        → Publication ethics documents
└── research_integrity/ → Research integrity framework
```

Add PDFs or TXT files to any folder, then re-run `python ingest.py`.

## Team

- **Member 1** — AI/RAG (ingest.py, rag.py, llm.py, classifier.py, escalation.py)
- **Member 2** — UI/UX (React, Tailwind, glassmorphism design)
- **Member 3** — Backend/Integration (FastAPI, testing, deployment)

## Key Differentiators

1. **Citation-first** — Every answer shows exact document, section, and page
2. **Evidence-grounded** — LLM can only use retrieved evidence, never invents
3. **Human-in-the-loop** — Case-specific decisions always escalate to human review
4. **Transparent** — Source modal shows exact excerpts used
5. **Non-hallucinating** — Insufficient evidence is explicitly flagged

## License

MIT — For demonstration purposes only. Not a substitute for professional ethics review.
