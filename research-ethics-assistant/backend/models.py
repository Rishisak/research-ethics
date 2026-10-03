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

