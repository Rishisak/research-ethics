"""
FastAPI main application for Research Ethics Guidance Assistant.
"""

import os
import re
import logging
import json
from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from models import AskRequest, AskResponse, HealthResponse, CategoryInfo, SourceCitation, FeedbackRequest
from classifier import classify_question
from escalation import build_escalation_response, get_escalation_reason
from rag import retrieve_relevant_chunks, is_rag_ready, get_collection_count
from llm import generate_answer, assess_confidence

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

CATEGORIES = [
    CategoryInfo(
        id="informed_consent",
        name="Informed Consent",
        description="Participant rights, consent processes, and documentation requirements",
        icon="FileCheck",
        color="cyan",
    ),
    CategoryInfo(
        id="data_handling",
        name="Data Handling & Privacy",
        description="Research data protection, anonymization, and storage standards",
        icon="Shield",
        color="blue",
    ),
    CategoryInfo(
        id="authorship",
        name="Authorship",
        description="Authorship criteria, contribution standards, and attribution practices",
        icon="Users",
        color="violet",
    ),
    CategoryInfo(
        id="publication_ethics",
        name="Publication Ethics",
        description="Publication standards, duplicate publication, and peer review conduct",
        icon="BookOpen",
        color="indigo",
    ),
    CategoryInfo(
        id="research_integrity",
        name="Research Integrity",
        description="Responsible conduct, misconduct definitions, and reporting",
        icon="Award",
        color="purple",
    ),
]

UNKNOWN_RESPONSE = """That question is outside the scope of this Research Ethics Guidance Assistant.

I can help with research ethics topics including:
• **Informed Consent** — participant rights and consent processes
• **Data Handling & Privacy** — research data protection and privacy
• **Authorship** — authorship criteria and contribution standards
• **Publication Ethics** — publication standards and peer review
• **Research Integrity** — responsible conduct and misconduct

Please ask a question related to one of these topics."""


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Research Ethics Guidance Assistant starting up...")
    rag_status = is_rag_ready()
    if rag_status:
        logger.info(f"✓ RAG system ready. {get_collection_count()} chunks in knowledge base.")
    else:
        logger.warning("⚠ RAG system not ready. Run: python ingest.py")
    yield
    logger.info("Shutting down...")


app = FastAPI(
    title="Research Ethics Guidance Assistant",
    description="Citation-first, evidence-grounded research ethics guidance with human-in-the-loop escalation.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "service": "Research Ethics Guidance Assistant",
        "version": "1.0.0",
        "status": "online",
        "docs": "/docs",
    }


@app.get("/health", response_model=HealthResponse)
def health_check():
    rag_ready = is_rag_ready()
    doc_count = get_collection_count() if rag_ready else 0
    return HealthResponse(
        status="online",
        rag_ready=rag_ready,
        knowledge_base_docs=doc_count,
        version="1.0.0",
    )


@app.get("/categories")
def get_categories():
    return {"categories": [cat.model_dump() for cat in CATEGORIES]}


@app.get("/knowledge-base/status")
def get_knowledge_base_status():
    """Return status, document counts, chunk counts, model, and timestamp for knowledge base."""
    status_file = os.path.join(os.path.dirname(__file__), "knowledge_base", "metadata", "ingestion_status.json")
    if os.path.exists(status_file):
        try:
            with open(status_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error reading ingestion status: {e}")
            
    return {
        "status": "ready" if is_rag_ready() else "not_ready",
        "collection_name": "research_ethics_knowledge_base",
        "embedding_model": "all-MiniLM-L6-v2",
        "total_documents": 8,
        "total_pages": 250,
        "total_chunks": get_collection_count() if is_rag_ready() else 0,
        "ingestion_timestamp": None,
    }


@app.get("/sources")
def get_sources():
    """Return all registered knowledge base sources with metadata and readiness status."""
    meta_path = os.path.join(os.path.dirname(__file__), "knowledge_base", "metadata", "source_registry.json")
    fallback_path = os.path.join(os.path.dirname(__file__), "source_registry.json")
    registry_path = meta_path if os.path.exists(meta_path) else fallback_path
    
    sources = []
    if os.path.exists(registry_path):
        try:
            with open(registry_path, "r", encoding="utf-8") as f:
                sources = json.load(f)
        except Exception as e:
            logger.error(f"Error loading source registry: {e}")

    status_file = os.path.join(os.path.dirname(__file__), "knowledge_base", "metadata", "ingestion_status.json")
    status_meta = {}
    if os.path.exists(status_file):
        try:
            with open(status_file, "r", encoding="utf-8") as f:
                status_meta = json.load(f)
        except Exception:
            pass

    return {
        "sources": sources,
        "total_sources": len(sources),
        "total_chunks": get_collection_count() if is_rag_ready() else 0,
        "total_pages": status_meta.get("total_pages", 250),
        "collection_name": status_meta.get("collection_name", "research_ethics_knowledge_base"),
        "embedding_model": status_meta.get("embedding_model", "all-MiniLM-L6-v2"),
        "ingestion_timestamp": status_meta.get("ingestion_timestamp"),
        "rag_ready": is_rag_ready(),
    }


@app.post("/feedback")
def submit_feedback(feedback: FeedbackRequest):
    """Log user feedback for continuous improvement and compliance auditing."""
    log_file = os.path.join(os.path.dirname(__file__), "feedback_log.json")
    entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "message_id": feedback.message_id,
        "question": feedback.question,
        "rating": feedback.rating,
        "comment": feedback.comment,
    }
    entries = []
    if os.path.exists(log_file):
        try:
            with open(log_file, "r", encoding="utf-8") as f:
                entries = json.load(f)
        except Exception:
            entries = []
    entries.append(entry)
    try:
        with open(log_file, "w", encoding="utf-8") as f:
            json.dump(entries, f, indent=2)
    except Exception as e:
        logger.error(f"Failed to save feedback: {e}")
        raise HTTPException(status_code=500, detail="Could not store feedback")

    return {"status": "ok", "message": "Feedback recorded successfully"}



@app.post("/ask", response_model=AskResponse)
def ask_question_endpoint(request: AskRequest):
    question = request.question.strip()
    user_category = request.category

    # Handle empty question
    if not question:
        return AskResponse(
            answer="Please enter a question.",
            category=user_category,
            confidence="Insufficient",
            escalation_required=False,
            escalation_reason=None,
            question_type="UNKNOWN",
            sources=[],
        )

    # Stage 1 & 2: Two-Stage Semantic Classification & Orthogonal Escalation Check
    classification = classify_question(question, user_category=user_category)
    scope = classification["scope"]  # "IN_SCOPE", "OUT_OF_SCOPE", "UNCERTAIN"
    primary_category = classification["primary_category"]
    secondary_category = classification["secondary_category"]
    escalation_required = classification["escalation_required"]
    escalation_reason = classification["escalation_reason"]

    # Handle genuine OUT_OF_SCOPE questions immediately
    if scope == "OUT_OF_SCOPE":
        logger.info(
            f"\n==================================================\n"
            f"DEBUG PIPELINE TRACE\n"
            f"==================================================\n"
            f"QUESTION:             {question}\n"
            f"SCOPE:                {scope} (domain_sim: {classification.get('domain_similarity', 0.0)})\n"
            f"PRIMARY CATEGORY:     {primary_category}\n"
            f"SECONDARY CATEGORY:   {secondary_category}\n"
            f"ESCALATION REQUIRED:  {escalation_required}\n"
            f"ESCALATION REASON:    {escalation_reason}\n"
            f"RETRIEVED CHUNKS:     0\n"
            f"RETRIEVAL SCORES:     []\n"
            f"SOURCES:              []\n"
            f"LLM CALLED:           NO (OUT_OF_SCOPE)\n"
            f"FINAL CONFIDENCE:     Insufficient\n"
            f"=================================================="
        )
        return AskResponse(
            answer=UNKNOWN_RESPONSE,
            category=None,
            confidence="Insufficient",
            escalation_required=False,
            escalation_reason=None,
            question_type="UNKNOWN",
            sources=[],
        )

    # For IN_SCOPE or UNCERTAIN questions: Category-aware hybrid retrieval from ChromaDB
    chunks = retrieve_relevant_chunks(
        question,
        primary_category=primary_category,
        secondary_category=secondary_category,
        top_k=5,
        min_score_threshold=0.25,
    )

    # Check if retrieval returned sufficient evidence
    if not chunks:
        logger.info(
            f"\n==================================================\n"
            f"DEBUG PIPELINE TRACE\n"
            f"==================================================\n"
            f"QUESTION:             {question}\n"
            f"SCOPE:                {scope} (domain_sim: {classification.get('domain_similarity', 0.0)})\n"
            f"PRIMARY CATEGORY:     {primary_category}\n"
            f"SECONDARY CATEGORY:   {secondary_category}\n"
            f"ESCALATION REQUIRED:  {escalation_required}\n"
            f"ESCALATION REASON:    {escalation_reason}\n"
            f"RETRIEVED CHUNKS:     0\n"
            f"RETRIEVAL SCORES:     []\n"
            f"SOURCES:              []\n"
            f"LLM CALLED:           NO (INSUFFICIENT_EVIDENCE)\n"
            f"FINAL CONFIDENCE:     Insufficient\n"
            f"=================================================="
        )
        insufficient_msg = (
            f"This question relates to research ethics ({primary_category}), but I couldn't find "
            f"sufficient evidence in the current knowledge base to provide a reliable answer.\n\n"
            f"Please consult the applicable journal or institutional policy, or check with your "
            f"institution's Ethics Committee / Institutional Review Board (IRB)."
        )
        return AskResponse(
            answer=insufficient_msg,
            category=primary_category,
            confidence="Insufficient",
            escalation_required=escalation_required,
            escalation_reason=escalation_reason,
            question_type="INSUFFICIENT_EVIDENCE",
            sources=[],
        )

    # Assess confidence based on retrieved chunk similarity
    confidence = assess_confidence(chunks, question)

    # Handle insufficient evidence if retrieval confidence is Insufficient and not escalation
    if confidence == "Insufficient" and not escalation_required:
        insufficient_msg = (
            f"This question relates to research ethics ({primary_category}), but I couldn't find "
            f"sufficient evidence in the current knowledge base to provide a reliable answer.\n\n"
            f"Please consult the applicable journal or institutional policy, or check with your "
            f"institution's Ethics Committee / Institutional Review Board (IRB)."
        )
        low_scores = [c.get("score") for c in chunks]
        low_sources = [f"{c.get('document', '')} § {c.get('section', '')}" for c in chunks]
        logger.info(
            f"\n==================================================\n"
            f"DEBUG PIPELINE TRACE\n"
            f"==================================================\n"
            f"QUESTION:             {question}\n"
            f"SCOPE:                {scope}\n"
            f"PRIMARY CATEGORY:     {primary_category}\n"
            f"SECONDARY CATEGORY:   {secondary_category}\n"
            f"ESCALATION REQUIRED:  False\n"
            f"ESCALATION REASON:    None\n"
            f"RETRIEVED CHUNKS:     {len(chunks)} (below confidence threshold)\n"
            f"RETRIEVAL SCORES:     {low_scores}\n"
            f"SOURCES:              {low_sources}\n"
            f"LLM CALLED:           NO (INSUFFICIENT_EVIDENCE)\n"
            f"FINAL CONFIDENCE:     Insufficient\n"
            f"=================================================="
        )
        return AskResponse(
            answer=insufficient_msg,
            category=primary_category,
            confidence="Insufficient",
            escalation_required=False,
            escalation_reason=None,
            question_type="INSUFFICIENT_EVIDENCE",
            sources=[],
        )

    # Handle ESCALATION questions (case-specific approval/waiver requests requiring human review)
    if escalation_required:
        general_guidance = generate_answer(question, chunks, is_escalation=True)
        answer = build_escalation_response(general_guidance)
        sources = _build_sources(chunks[:3])

        esc_scores = [c.get("score") for c in chunks]
        esc_sources = [f"{c.get('document', '')} § {c.get('section', '')}" for c in chunks]

        logger.info(
            f"\n==================================================\n"
            f"DEBUG PIPELINE TRACE\n"
            f"==================================================\n"
            f"QUESTION:             {question}\n"
            f"SCOPE:                {scope}\n"
            f"PRIMARY CATEGORY:     {primary_category}\n"
            f"SECONDARY CATEGORY:   {secondary_category}\n"
            f"ESCALATION REQUIRED:  {escalation_required}\n"
            f"ESCALATION REASON:    {escalation_reason}\n"
            f"RETRIEVED CHUNKS:     {len(chunks)}\n"
            f"RETRIEVAL SCORES:     {esc_scores}\n"
            f"SOURCES:              {esc_sources}\n"
            f"LLM CALLED:           YES (ESCALATION GUIDANCE)\n"
            f"FINAL CONFIDENCE:     {confidence}\n"
            f"=================================================="
        )
        return AskResponse(
            answer=answer,
            category=primary_category,
            confidence=confidence,
            escalation_required=True,
            escalation_reason=escalation_reason,
            question_type="ESCALATION",
            sources=sources,
        )

    # Normal In-Scope Grounded Generation via RAG
    answer = generate_answer(question, chunks, is_escalation=False)
    sources = _build_sources(chunks[:4])

    ans_lower = answer.lower()
    ans_start = ans_lower[:300]
    is_insufficient = (
        bool(
            re.search(
                r"\b(do(?:es)? not contain|insufficient evidence|no documented|cannot find|could not find|no guidance|no information|available knowledge base does not contain|none of the (?:retrieved|cited|provided)|no explicit (?:statement|guidance|policy))\b",
                ans_start,
            )
        )
        or "does not contain enough evidence" in ans_lower
        or "not contain enough evidence to provide a reliable answer" in ans_lower
        or "couldn't find sufficient evidence" in ans_lower
        or "could not find sufficient evidence" in ans_lower
    )
    if is_insufficient:
        confidence = "Insufficient"
        question_type = "INSUFFICIENT_EVIDENCE"
    else:
        question_type = "SUPPORTED"

    chunk_scores = [c.get("score") for c in chunks]
    chunk_sources = [f"{c.get('document', '')} § {c.get('section', '')}" for c in chunks]

    logger.info(
        f"\n==================================================\n"
        f"DEBUG PIPELINE TRACE\n"
        f"==================================================\n"
        f"QUESTION:             {question}\n"
        f"SCOPE:                {scope}\n"
        f"PRIMARY CATEGORY:     {primary_category}\n"
        f"SECONDARY CATEGORY:   {secondary_category}\n"
        f"ESCALATION REQUIRED:  {escalation_required}\n"
        f"ESCALATION REASON:    {escalation_reason}\n"
        f"RETRIEVED CHUNKS:     {len(chunks)}\n"
        f"RETRIEVAL SCORES:     {chunk_scores}\n"
        f"SOURCES:              {chunk_sources}\n"
        f"LLM CALLED:           YES (RAG GROUNDED)\n"
        f"FINAL CONFIDENCE:     {confidence}\n"
        f"=================================================="
    )

    return AskResponse(
        answer=answer,
        category=primary_category,
        confidence=confidence,
        escalation_required=False,
        escalation_reason=None,
        question_type=question_type,
        sources=sources,
    )


def _build_sources(chunks: list) -> list:
    """Build SourceCitation list from retrieved chunks."""
    sources = []
    seen = set()
    for chunk in chunks:
        key = f"{chunk['document']}_{chunk['page']}_{chunk['section']}"
        if key in seen:
            continue
        seen.add(key)
        sources.append(
            SourceCitation(
                document=chunk["document"],
                page=chunk["page"],
                section=chunk["section"],
                excerpt=chunk["text"][:400] + ("..." if len(chunk["text"]) > 400 else ""),
                category=chunk["category"],
                organization=chunk.get("organization") or "Verified Research Ethics Guideline",
            )
        )
    return sources


def _detect_category(chunks: list) -> str:
    """Detect the most common category from retrieved chunks."""
    if not chunks:
        return "General"
    from collections import Counter
    cats = [c.get("category", "General") for c in chunks]
    return Counter(cats).most_common(1)[0][0]
