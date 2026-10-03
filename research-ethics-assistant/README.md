# Research Ethics Guidance Assistant

> Citation-first, evidence-grounded research ethics guidance with human-in-the-loop escalation.

An enterprise-grade, citation-grounded conversational system that guides researchers, principal investigators, and students through research ethics policies, informed consent procedures, data privacy, authorship guidelines, and publication standards.

Built with **FastAPI**, **ChromaDB**, **Sentence-Transformers**, **Groq / Google Gemini**, and **React + Tailwind CSS**.

---

## 🌟 Key Features

- **Authoritative Knowledge Base**: Grounded in **8 verified national and international ethics guidelines** (~250 indexed pages) from ICMR, APA, CIOMS/WHO, CMS-IRB, Frontiers, and the Belmont Report.
- **Two-Stage Semantic Question Classifier**:
  - **Stage 1 (Scope Detection)**: Distinguishes genuine ethics questions from out-of-scope queries (weather, cooking, code generation, etc.) with structured refusal responses.
  - **Stage 2 (Category Mapping)**: Maps questions to 5 core domains (*Informed Consent*, *Data Handling & Privacy*, *Authorship*, *Publication Ethics*, *Research Integrity*).
- **Category-Aware Hybrid Retrieval**:
  - Global dense semantic search using `all-MiniLM-L6-v2` embeddings in ChromaDB.
  - Targeted category filtering with relevance bonuses (+0.04 primary / +0.02 secondary) and cosine thresholding (`min_score_threshold = 0.25`).
- **Strict Evidence Grounding & Refusal Guardrails**:
  - LLM answers strictly using retrieved chunks; prevents hallucinated policies, citations, or rules.
  - Graceful refusal (`INSUFFICIENT_EVIDENCE`) when knowledge base lacks adequate sources.
- **Safe Human-in-the-Loop Escalation**:
  - Detects case-specific compliance and study approval requests (e.g., *"Can my study proceed without consent?"*).
  - Explicitly refuses automated study approvals and provides general guidance paired with formal recommendations to consult the institutional Ethics Committee (REC / IRB / IEC).
- **Dual LLM Provider Architecture**:
  - Primary: Ultra-fast **Groq** inference (`openai/gpt-oss-120b`, `qwen/qwen3.8-27b`).
  - Secondary / Fallback: **Google Gemini** (`gemini-1.5-flash`, `gemini-pro`).
- **Interactive Web Interface**:
  - Modern dark-mode glassmorphism design with responsive drawer and animations.
  - **Source Cards with Accordion Excerpts**: Inspect section, page, institution, and verbatim text.
  - **Source Modal Deep-Dive**: Full citation metadata and verified excerpt viewer.
  - **Knowledge Base Explorer**: Search, filter, and review indexed guidelines and version history.
  - **REC/IRB Consultation Letter Generator**: Generates formatted formal submission letters.
  - **Ethics Checklist**: Interactive pre-submission review across all 5 ethics categories.
  - **Report Export**: Download one-click formal Markdown ethics reports with full citations.

---

## 🏛️ Curated Knowledge Base

The system indexes 8 real-world regulatory and professional guidelines:

| Document | Issuing Organization | Year | Pages | Key Focus Areas |
|----------|----------------------|------|-------|-----------------|
| **ICMR Policy on Research Integrity & Publication Ethics** | Indian Council of Medical Research | 2019 | 24 | Research misconduct, plagiarism threshold (<10%), RIO role, authorship |
| **APA Ethical Principles of Psychologists & Code of Conduct** | American Psychological Association | 2017 | 20 | Standard 8 (Research & Publication), Standard 4 (Privacy & Confidentiality) |
| **International Ethical Guidelines for Health-related Research** | CIOMS in collaboration with WHO | 2016 | 119 | 25 Health research guidelines, consent waivers, biobanks, vulnerable populations |
| **Guidelines for Ethical Considerations in Social Research** | CMS-IRB | 2020 | 28 | Social research, verbal vs. written consent, community-based studies |
| **Research Ethics Checks: Guidelines for Editors & Reviewers** | Frontiers | 2024 | 24 | Automated AIRA checks, COPE compliance, consent statements, identifiable data |
| **The Belmont Report** | National Commission for Human Subjects Protection | 1979 | 10 | Respect for Persons, Beneficence, Justice; consent and risk-benefit evaluation |
| **General Guidelines for Research Ethics** | Norwegian National Research Ethics Committees | — | 1 | 14 National research ethics principles and social responsibility |

---

## 🏗️ System Architecture

```
[ Research Ethics PDF Guidelines (8 Documents, 250 Pages) ]
                           │
                           ▼
[ Ingestion Pipeline: PyMuPDF + Section Detection + Topic/Org Chunking ]
                           │
                           ▼
       [ Vector Embeddings: all-MiniLM-L6-v2 (ChromaDB) ]
                           │
─────────────── User Query Submitted to /ask ───────────────
                           │
                           ▼
          [ Stage 1 & 2 Question Classifier ]
         ├─ Scope: IN_SCOPE / OUT_OF_SCOPE / UNCERTAIN
         ├─ Category: Primary & Secondary Domain
         └─ Escalation Detection: Case-Specific Study Approval?
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
   [ OUT_OF_SCOPE ]                     [ IN_SCOPE ]
        │                                     │
Structured Refusal                            ▼
                            [ Category-Aware Hybrid Retrieval ]
                            ├─ Global Dense Similarity Search
                            ├─ Category Filtered Retrieval (+Bonuses)
                            └─ Similarity Score Threshold (>= 0.25)
                                              │
                                              ▼
                                 [ Evidence Context Assembly ]
                                              │
                                              ▼
                             [ Dual LLM Engine: Groq / Gemini ]
                             Strict Grounding + Refusal Guardrails
                                              │
                    ┌─────────────────────────┴─────────────────────────┐
                    │                                                   │
          [ Escalation Triggered ]                            [ Standard Supported ]
                    │                                                   │
       General Principles Only +                          Cited Guidance + Exact Sources
       REC / IRB Consultation Mandate                     (Document, Section, Page, Excerpt)
```

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.10+**
- **Node.js 18+**
- An API key for **Groq** (`GROQ_API_KEY`) and/or **Google Gemini** (`GEMINI_API_KEY`)

### 1. Environment Setup

Copy `.env.example` in the `backend/` folder to `.env` and insert your API keys:

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```ini
GROQ_API_KEY=gsk_your_groq_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Ingest the Knowledge Base

Extract, chunk, embed, and index the 8 ethics guidelines into ChromaDB:

```bash
cd backend
pip install -r requirements.txt
python ingest.py
```

*Note: Ingestion processes all PDFs, extracts sections, assigns metadata (document, organization, page, category), and populates `backend/chroma_db/`.*

### 3. Run the Backend API

```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```

- API Server: `http://localhost:8000`
- Interactive OpenAPI Docs: `http://localhost:8000/docs`

### 4. Run the Frontend Dev Server

```bash
cd frontend
npm install
npm run dev
```

- Web Interface: `http://localhost:5173`

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Service information, version, and status |
| `GET` | `/health` | Health status, RAG readiness, and indexed chunk count |
| `GET` | `/categories` | List of 5 supported ethics categories and metadata |
| `GET` | `/sources` | Full registry of 8 curated documents, authors, and page counts |
| `GET` | `/knowledge-base/status` | Detailed ingestion status, model name, and timestamps |
| `POST` | `/ask` | Submit question for classification, retrieval, and cited guidance |
| `POST` | `/feedback` | Submit user feedback (helpful/unhelpful) for audit logging |

### `POST /ask` Example

**Request:**
```json
{
  "question": "Can AI tools like ChatGPT be listed as a co-author on a research paper?",
  "category": "Authorship"
}
```

**Response:**
```json
{
  "answer": "Based on the provided research ethics policies, non-human entities and AI tools like ChatGPT cannot be listed as authors on research papers. Authorship requires accountability for the research, substantial intellectual contribution, and the capacity to approve the final manuscript—responsibilities that AI cannot fulfill. However, any use of AI tools in manuscript preparation or data analysis must be transparently disclosed...",
  "category": "Authorship",
  "confidence": "High",
  "escalation_required": false,
  "escalation_reason": null,
  "question_type": "SUPPORTED",
  "sources": [
    {
      "document": "ICMR Policy on Research Integrity and Publication Ethics",
      "page": 7,
      "section": "Authorship Criteria",
      "excerpt": "Authorship confers credit and implies responsibility. Only individuals who have made substantial intellectual contributions...",
      "category": "Authorship",
      "organization": "Indian Council of Medical Research"
    },
    {
      "document": "Research ethics checks: Guidelines for editors and reviewers",
      "page": 12,
      "section": "Authorship and Generative AI",
      "excerpt": "Artificial Intelligence tools (such as LLMs) do not meet the criteria for authorship as they cannot take responsibility for submitted work...",
      "category": "Authorship",
      "organization": "Frontiers"
    }
  ]
}
```

---

## 🧪 Evaluation Suite

The backend includes comprehensive automated evaluation scripts testing **Relevance**, **Faithfulness**, and **Safe Escalation**:

```bash
cd backend
python test_pipeline.py
```

### What It Tests:
- **Test Suite (28 queries)**:
  - **Category Accuracy**: Tests queries across Informed Consent, Data Handling, Authorship, Publication Ethics, and Research Integrity without keyword hints.
  - **Safe Escalation**: Verifies questions requesting study approval trigger `escalation_required == True` and explicitly confirms no automated approval decisions are output.
  - **Insufficient Evidence**: Queries outside the indexed knowledge base trigger `INSUFFICIENT_EVIDENCE` without hallucinated answers.
  - **Out-of-Scope Detection**: Non-ethics queries (recipes, sports, code) cleanly refuse with `UNKNOWN`.

---

## 🛡️ Responsible AI & Ethical Guardrails

1. **Citation-First Evidence Grounding**: Every substantive assertion is mapped directly to indexed guideline excerpts.
2. **Refusal of Compliance Determinations**: The system will never determine whether a specific study protocol is legally or ethically compliant.
3. **Mandatory Human Review**: Case-specific questions trigger automatic escalation flags pointing researchers to their REC / IRB / IEC.
4. **Verifiable Sources**: Users can view the exact excerpt, page, section, and publisher for full auditability.
5. **No AI Authorship Guarantee**: Explicitly upholds ICMJE and COPE guidelines regarding AI non-authorship and transparent disclosure.

---

## 📄 License

MIT License — Intended for educational, screening, and guidance assistance. Not a substitute for formal review and approval by an accredited Institutional Review Board (IRB) or Research Ethics Committee (REC).
