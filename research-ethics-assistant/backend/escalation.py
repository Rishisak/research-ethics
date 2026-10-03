"""
Escalation logic for Research Ethics Guidance Assistant.
Determines when a question requires human ethics committee review.
"""

from typing import Tuple


ESCALATION_RESPONSE_TEMPLATE = """I can provide general guidance based on approved sources, but this question involves a case-specific ethics decision that cannot be determined by an automated system.

The assistant is designed to explain general principles and policies — it cannot determine whether your specific study should be approved, whether you may proceed, or whether your practices are legally or ethically sufficient for your particular context.

**What I can share from the knowledge base:**

{general_guidance}

---

**Recommended Action:**

Please consult your institutional Research Ethics Committee (REC), Institutional Review Board (IRB), or Independent Ethics Committee (IEC) for a formal review of your specific situation.

This recommendation is not a judgment of your research — it reflects the appropriate human oversight process that protects both researchers and participants."""


def build_escalation_response(general_guidance: str) -> str:
    """Build the escalation response with whatever general guidance was found."""
    return ESCALATION_RESPONSE_TEMPLATE.format(general_guidance=general_guidance)


def get_escalation_reason() -> str:
    return (
        "This question involves a case-specific research ethics decision. "
        "The assistant provides general guidance only and cannot determine "
        "whether your specific study, protocol, or situation meets ethical "
        "requirements. Please consult your Ethics Committee / IRB / IEC."
    )
