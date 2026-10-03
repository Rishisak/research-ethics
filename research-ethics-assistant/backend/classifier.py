"""
Semantic Question Classifier for Research Ethics Guidance Assistant.

Two-Stage Classification Architecture:
Stage 1: Scope Detection (IN_SCOPE, OUT_OF_SCOPE, UNCERTAIN)
Stage 2: Category Classification (Primary Category, Secondary Category)
Orthogonal: Escalation Detection (Independent flag for case-specific human review)
"""

import re
import logging
from typing import Dict, Any, Optional, Tuple, List
import numpy as np

logger = logging.getLogger(__name__)

# Category definitions and semantic prototypes
CATEGORY_PROTOTYPES = {
    "Informed Consent": (
        "Informed consent process, participant rights and autonomy, voluntary participation, "
        "consent forms, consent documentation, consent waivers, vulnerable populations, capacity to consent, withdrawal from study."
    ),
    "Data Handling & Privacy": (
        "Research data protection, participant privacy, confidentiality, anonymization, de-identification, "
        "data storage security, data sharing, GDPR compliance, sensitive personal data, identifiable information."
    ),
    "Authorship": (
        "Authorship criteria, author qualification, ICMJE guidelines, co-authors, author order, "
        "ghost authorship, gift or honorary authorship, contribution attribution, AI as an author, contributor acknowledgments."
    ),
    "Publication Ethics": (
        "Publication standards, manuscript submission, journal peer review, duplicate or redundant publication, "
        "salami slicing, plagiarism, self-plagiarism, citations, disclosures, AI-assisted writing, generative AI in academic papers, "
        "ChatGPT in manuscripts, image manipulation, retractions and corrections."
    ),
    "Research Integrity": (
        "Responsible conduct of research, scientific misconduct, data fabrication, falsification of results, "
        "plagiarism, questionable research practices, conflicts of interest, whistleblowing, reporting misconduct, research fraud, responsible AI in research."
    ),
}

# General Domain Prototype representing the entire research ethics universe
RESEARCH_ETHICS_DOMAIN_PROTOTYPE = (
    "Academic research ethics, research methodology, study protocols, human subjects review, "
    "informed consent of participants, research data privacy, confidentiality and anonymization, "
    "authorship criteria and author contributions, journal publishing standards, duplicate publication, "
    "plagiarism, generative AI in academic writing and manuscript preparation, and scientific research integrity."
)

# Unambiguous out-of-scope conceptual topics (only trigger if NO academic/research/ethics cues)
OUT_OF_SCOPE_REGEX = [
    r"\b(weather|forecast|temperature|rain|snow|humidity)\b",
    r"\b(recipe|cook|baking|bake|cake|pizza|chocolate|soup|dish|pasta|ingredient|cocktail|dinner)\b",
    r"\b(football|soccer|basketball|cricket|nba|super bowl|tennis|match score|fifa|olympics)\b",
    r"\b(movie|cinema|actor|actress|hollywood|bollywood|song|lyrics|singer|pop music|joke|poem)\b",
    r"\b(travel|flight|hotel booking|vacation|tourist|airline ticket)\b",
    r"\b(stock price|bitcoin|cryptocurrency|crypto market|forex|wall street)\b",
    r"\b(write|create|build|make|code|program)\b.*(game|app|website|html|css|script|calculator|python code)",
    r"\b(tell me a joke|tell me a story|who are you|how is your day)\b",
]

# Explicit Academic, Research, AI, or Ethics domain cues
DOMAIN_CUES_REGEX = r"\b(research|study|protocol|trial|experiment|paper|manuscript|journal|publish|publication|" \
                    r"peer review|author|co-author|first author|authorship|contributor|credit|byline|" \
                    r"consent|assent|participant|human subjects|patient|confidential|privacy|anonymiz|de-identif|" \
                    r"data protection|gdpr|data sharing|data storage|vulnerable|children|minors|guardian|" \
                    r"irb|iec|rec|ethics committee|ethics board|institutional review|" \
                    r"integrity|misconduct|fabricat|falsif|plagiarism|retract|duplicate publication|" \
                    r"whistleblow|conflict of interest|harking|" \
                    r"ai|artificial intelligence|generative ai|llm|chatgpt|gemini|claude|copilot|automated writing)\b"

# Case-specific escalation patterns (requesting automated approval / compliance ruling)
ESCALATION_REGEX = [
    r"\bcan (?:my|our|this) (?:study|research|project|protocol|trial|experiment)\b",
    r"\bshould (?:my|our|this) (?:study|research|project|protocol|trial|experiment)\b",
    r"\bwill (?:my|our|this) (?:study|research|project|protocol|trial) (?:be|get) approved\b",
    r"\bshould (?:the|our|my)(?:\s+\w+)?\s+(?:committee|irb|iec|rec|board)\s+approve\b",
    r"\bshould (?:the\s+)?(?:irb|iec|rec|ethics committee)\s+approve\b",
    r"\bapprove (?:my|our|this)\b",
    r"\bcan (?:i|we) proceed\b",
    r"\bmay (?:i|we) proceed\b",
    r"\bis (?:my|our|this) (?:consent(?:\s+form)?|study|research|protocol|form) (?:sufficient|valid|adequate|compliant|legally sufficient)\b",
    r"\bcan (?:i|we) (?:skip|waive|omit|bypass) (?:consent|ethics review|irb|approval)\b",
    r"\bdo (?:i|we) need (?:irb|iec|rec|ethics committee) approval for this (?:specific|particular)\b",
    r"\bdoes (?:my|our|this) study (?:violate|breach)\b",
    r"\bis this specific study ethically acceptable\b",
    r"\bcan (?:our|my|this) study proceed if\b",
]

# Lazy-loaded embedding cache
_embedding_model = None
_proto_embeddings: Dict[str, np.ndarray] = {}
_domain_embedding: Optional[np.ndarray] = None


def _get_model():
    global _embedding_model
    if _embedding_model is None:
        from rag import get_embedding_model
        _embedding_model = get_embedding_model()
    return _embedding_model


def _ensure_prototype_embeddings():
    global _proto_embeddings, _domain_embedding
    if not _proto_embeddings:
        model = _get_model()
        _domain_embedding = model.encode([RESEARCH_ETHICS_DOMAIN_PROTOTYPE])[0]
        for cat_name, proto_text in CATEGORY_PROTOTYPES.items():
            _proto_embeddings[cat_name] = model.encode([proto_text])[0]


def cosine_similarity(v1: np.ndarray, v2: np.ndarray) -> float:
    norm1 = np.linalg.norm(v1)
    norm2 = np.linalg.norm(v2)
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return float(np.dot(v1, v2) / (norm1 * norm2))


def classify_question(
    question: str,
    user_category: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Perform Two-Stage Semantic Classification:
    Stage 1: Scope Detection (IN_SCOPE, OUT_OF_SCOPE, UNCERTAIN)
    Stage 2: Category Classification (Primary Category, Secondary Category)
    Orthogonal: Escalation Detection (Independent flag for case-specific human review)
    """
    q_clean = question.strip()
    q_lower = q_clean.lower()

    if not q_clean:
        return {
            "scope": "OUT_OF_SCOPE",
            "primary_category": "General",
            "secondary_category": None,
            "escalation_required": False,
            "escalation_reason": None,
            "domain_similarity": 0.0,
            "category_scores": {},
        }

    # --- Orthogonal Check: Escalation Detection ---
    escalation_required = False
    escalation_reason = None
    for pattern in ESCALATION_REGEX:
        if re.search(pattern, q_lower):
            escalation_required = True
            escalation_reason = (
                "This question involves a case-specific research ethics decision. "
                "The assistant provides general guidance only and cannot determine "
                "whether your specific study, protocol, or situation meets ethical requirements. "
                "Please consult your Ethics Committee / IRB / IEC."
            )
            break

    # --- Stage 1: Scope Detection ---
    is_clearly_out = any(re.search(pat, q_lower) for pat in OUT_OF_SCOPE_REGEX)
    has_domain_cues = bool(re.search(DOMAIN_CUES_REGEX, q_lower))

    # Compute semantic domain embedding similarity
    _ensure_prototype_embeddings()
    model = _get_model()
    q_embedding = model.encode([q_clean])[0]
    domain_sim = cosine_similarity(q_embedding, _domain_embedding)

    if is_clearly_out and not has_domain_cues:
        scope = "OUT_OF_SCOPE"
    elif has_domain_cues or domain_sim >= 0.16:
        scope = "IN_SCOPE"
    elif domain_sim < 0.04:
        scope = "OUT_OF_SCOPE"
    else:
        # Borderline questions: Do NOT reject immediately, let Stage 2 & RAG evaluate
        scope = "UNCERTAIN"

    # --- Stage 2: Category Classification ---
    cat_scores = {}
    for cat_name, proto_emb in _proto_embeddings.items():
        cat_scores[cat_name] = cosine_similarity(q_embedding, proto_emb)

    # Contextual boosts for nuanced multi-domain intents:
    # 1. AI as Author -> Authorship primary, Publication Ethics secondary
    if re.search(r"\b(ai (?:as|listed as|be|co-)?author|author.*(?:ai|chatgpt)|(?:ai|chatgpt).*author)\b", q_lower):
        cat_scores["Authorship"] += 0.28
        cat_scores["Publication Ethics"] += 0.16

    # 2. Text recycling / self-plagiarism / redundant publication -> Publication Ethics primary
    elif re.search(r"\b(reuse.*(?:paragraph|text|content|paper)|text recycling|self-plagiaris|duplicate publication|salami|without citing|prior publication|submit.*two.*journals)\b", q_lower):
        cat_scores["Publication Ethics"] += 0.30
        cat_scores["Research Integrity"] += 0.18

    # 3. Authorship qualification & attribution cues
    elif re.search(r"\b(author(?:ship)? (?:criteria|credit|order)|qualif.*author|who qualifies|co-author|first author|byline|on the paper|named on|entitle.*(?:paper|author)|credit for paper|order of (?:authors|contributors)|honorary credit|ghost author)\b", q_lower):
        cat_scores["Authorship"] += 0.28

    # 4. AI in writing / manuscript / paper -> Publication Ethics primary, Research Integrity secondary
    elif re.search(r"\b(write.*paper.*ai|ai.*write.*paper|chatgpt.*paper|chatgpt.*write|disclose.*ai|ai.*manuscript|generative ai.*writing|ai in academic writing)\b", q_lower):
        cat_scores["Publication Ethics"] += 0.28
        cat_scores["Research Integrity"] += 0.18

    # 5. Consent / vulnerable populations / permission cues
    elif re.search(r"\b(consent|permission|assent|children|minor|vulnerable|sign.*form|withdraw|voluntary agreement)\b", q_lower):
        cat_scores["Informed Consent"] += 0.22

    # 5. Plagiarism with AI / fabrication -> Research Integrity primary, Publication Ethics secondary
    elif re.search(r"\b(ai.*plagiarism|plagiarism.*ai|ai.*fabricat|fake citation.*ai)\b", q_lower):
        cat_scores["Research Integrity"] += 0.28
        cat_scores["Publication Ethics"] += 0.18

    # 4. User-selected category preference from UI (if valid and strong)
    if user_category and user_category in cat_scores:
        cat_scores[user_category] += 0.08

    # Rank categories
    sorted_cats = sorted(cat_scores.items(), key=lambda x: x[1], reverse=True)
    primary_category = sorted_cats[0][0]
    secondary_category = sorted_cats[1][0] if sorted_cats[1][1] >= 0.22 else None

    logger.debug(
        f"Classification: Q='{q_clean}' | Scope={scope} | Primary={primary_category} | "
        f"Secondary={secondary_category} | Escalation={escalation_required} | DomainSim={domain_sim:.3f}"
    )

    return {
        "scope": scope,
        "primary_category": primary_category,
        "secondary_category": secondary_category,
        "escalation_required": escalation_required,
        "escalation_reason": escalation_reason,
        "domain_similarity": round(domain_sim, 4),
        "category_scores": {k: round(v, 4) for k, v in sorted_cats},
    }
