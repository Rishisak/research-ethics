from pydantic import BaseModel
from typing import Optional, List


class AskRequest(BaseModel):
    question: str
    category: Optional[str] = None


class SourceCitation(BaseModel):
    document: str
    page: int
    section: str
    excerpt: str
    category: str
    organization: str


class AskResponse(BaseModel):
    answer: str
    category: Optional[str]
    confidence: str  # "High", "Medium", "Insufficient"
    escalation_required: bool
    escalation_reason: Optional[str]
    question_type: str  # "SUPPORTED", "ESCALATION", "UNKNOWN"
    sources: List[SourceCitation]


class HealthResponse(BaseModel):
    status: str
    rag_ready: bool
    knowledge_base_docs: int
    version: str


class CategoryInfo(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    color: str


class FeedbackRequest(BaseModel):
    message_id: Optional[str] = None
    question: Optional[str] = None
    rating: str  # "helpful" or "unhelpful"
    comment: Optional[str] = None


# ── Paper Analysis Models ─────────────────────────────────────────────────────

class PaperGuidelineSource(BaseModel):
    """One guideline chunk used as evidence for a paper concern."""
    document: str
    page: int
    section: str
    excerpt: str
    organization: str


class PaperIssue(BaseModel):
    """One potential research-ethics concern identified in the paper."""
    category: str
    severity: str          # LOW | MEDIUM | HIGH
    confidence: str        # LOW | MEDIUM | HIGH
    paper_page: int
    paper_section: str
    paper_excerpt: str
    concern: str           # Plain-language description — always hedged
    guideline_sources: List[PaperGuidelineSource]
    recommendation: str


class PaperAnalysisResponse(BaseModel):
    """Top-level response for POST /analyze-paper."""
    document: str
    page_count: int
    analysis_status: str   # POTENTIAL_ISSUES_DETECTED | NO_POTENTIAL_ISSUES_IDENTIFIED |
                           # INSUFFICIENT_EVIDENCE | INSUFFICIENT_TEXT | ANALYSIS_ERROR
    summary: str
    issues: List[PaperIssue]
    human_review_required: bool
