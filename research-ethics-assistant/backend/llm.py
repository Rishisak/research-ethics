"""
LLM integration supporting both Groq (Llama 3.3 / Llama 3.1) and Google Gemini.
Defaults to Groq if GROQ_API_KEY is set in environment, with automatic fallback.
"""

import os
import logging
from typing import List, Dict

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a Research Ethics Guidance Assistant.

Your role is to provide general research ethics guidance using ONLY the retrieved evidence supplied to you.

STRICT OPERATIONAL PRINCIPLES:
1. Ground every claim directly in the retrieved evidence chunks. Avoid any unsupported claims.
2. NEVER invent policies, guidelines, regulations, journal rules, citations, or organizations.
3. If the retrieved evidence is insufficient or does not explicitly address the question, explicitly state that the available knowledge base does not contain enough evidence to provide a reliable answer.
4. Clearly distinguish general policy principles from case-specific ethical decisions.
5. NEVER approve or reject a research study, protocol, or waiver request.
6. NEVER determine that a specific consent process, form, or participant recruitment method is legally or ethically sufficient.
7. NEVER provide a definitive case-specific ethics or legal determination.
8. For questions regarding Artificial Intelligence (AI) in research or writing:
   - Formulate the answer ONLY from what is supported by the retrieved policies (e.g., regarding author accountability, mandatory disclosure, transparency, and prohibition of AI as an author).
   - Do NOT invent blanket allowances or bans not documented in the evidence.

RESPONSE STYLE:
- Clear, objective, professional, and directly grounded in the provided sources.
- Cite the relevant document, section, and institution for key points.
- If evidence is absent or incomplete, clearly communicate the limitation without guessing.
"""


def build_evidence_context(chunks: List[Dict]) -> str:
    """Build the evidence context string from retrieved chunks."""
    if not chunks:
        return "No relevant evidence found in the knowledge base."

    context_parts = []
    for i, chunk in enumerate(chunks, 1):
        doc = chunk.get("document", "Unknown Document")
        page = chunk.get("page", "N/A")
        section = chunk.get("section", "N/A")
        text = chunk.get("text", "")
        context_parts.append(
            f"[EVIDENCE {i}]\n"
            f"Document: {doc}\n"
            f"Section: {section} | Page: {page}\n"
            f"Content:\n{text}\n"
        )
    return "\n---\n".join(context_parts)


import time

def _generate_with_groq(prompt: str) -> str:
    """Generate answer using Groq API."""
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        raise ValueError("GROQ_API_KEY is not set.")

    from groq import Groq
    client = Groq(api_key=groq_api_key.strip(), max_retries=1)

    groq_models = [
        "openai/gpt-oss-120b",
        "qwen/qwen3.8-27b",
        "openai/gpt-oss-20b",
    ]

    last_err = None
    for model in groq_models:
        for attempt in range(2):
            try:
                logger.info(f"Calling Groq model: {model} (attempt {attempt + 1})")
                completion = client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": prompt},
                    ],
                    temperature=0.2,
                    max_tokens=1500,
                )
                if completion.choices and completion.choices[0].message.content:
                    return completion.choices[0].message.content.strip()
            except Exception as e:
                err_str = str(e).lower()
                logger.warning(f"Groq model {model} attempt {attempt + 1} failed: {e}")
                last_err = e
                if "429" in err_str or "rate" in err_str or "quota" in err_str:
                    time.sleep(2.5)
                else:
                    break

    raise last_err or RuntimeError("All Groq models failed")


def _generate_with_gemini(prompt: str) -> str:
    """Generate answer using Google Gemini API."""
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    if not gemini_api_key:
        raise ValueError("GEMINI_API_KEY is not set.")

    from google import genai
    client = genai.Client(api_key=gemini_api_key.strip())

    gemini_models = [
        "gemini-flash-latest",
        "gemini-3.8-flash",
        "gemini-2.5-flash-lite",
        "gemini-pro-latest",
    ]

    full_prompt = f"{SYSTEM_PROMPT}\n\n{prompt}"
    last_err = None
    for model_name in gemini_models:
        try:
            logger.info(f"Calling Gemini model: {model_name}")
            response = client.models.generate_content(
                model=model_name,
                contents=full_prompt,
            )
            if response and response.text:
                return response.text.strip()
        except Exception as e:
            logger.warning(f"Gemini model {model_name} failed: {e}")
            last_err = e
            continue

    raise last_err or RuntimeError("All Gemini models failed")


def generate_answer(question: str, chunks: List[Dict], is_escalation: bool = False) -> str:
    """Generate an answer using Groq (if configured) or Gemini, with graceful fallback."""
    try:
        evidence = build_evidence_context(chunks)

        if is_escalation:
            task_instruction = (
                "The user is asking a case-specific ethics question. "
                "Using the evidence below, explain the relevant general principles only. "
                "Make clear that you cannot make a specific determination for their case. "
                "Recommend consultation with the appropriate ethics authority."
            )
        else:
            task_instruction = (
                "Using ONLY the evidence below, provide a clear and accurate answer to the question. "
                "Cite which evidence supports each point."
            )

        prompt = f"""TASK: {task_instruction}

QUESTION: {question}

RETRIEVED EVIDENCE:
{evidence}

ANSWER (based strictly on the evidence above):"""

        groq_api_key = os.getenv("GROQ_API_KEY")
        gemini_api_key = os.getenv("GEMINI_API_KEY")

        # 1. Try Groq if GROQ_API_KEY is provided
        if groq_api_key and groq_api_key.strip() and not groq_api_key.strip().startswith("your_"):
            try:
                return _generate_with_groq(prompt)
            except Exception as groq_err:
                logger.error(f"Groq generation failed, attempting Gemini fallback: {groq_err}")

        # 2. Fallback to Gemini if GEMINI_API_KEY is provided
        if gemini_api_key and gemini_api_key.strip() and not gemini_api_key.strip().startswith("your_"):
            try:
                return _generate_with_gemini(prompt)
            except Exception as gemini_err:
                logger.error(f"Gemini generation failed: {gemini_err}")

        # If neither worked
        if not groq_api_key and not gemini_api_key:
            return "No LLM API key configured. Please add GROQ_API_KEY to your backend/.env file."

        return "Unable to generate response from configured LLM providers. Please check your API keys in backend/.env."

    except Exception as e:
        logger.error(f"Error in generate_answer: {e}")
        return f"Unable to generate response: {str(e)}"


def assess_confidence(chunks: List[Dict], question: str) -> str:
    """Assess confidence based on retrieval quality."""
    if not chunks:
        return "Insufficient"

    scores = [chunk.get("score", 0.0) for chunk in chunks]
    if scores:
        top_score = max(scores)
        avg_score = sum(scores) / len(scores)
        if top_score < 0.30 or avg_score < 0.28:
            return "Insufficient"
        elif avg_score >= 0.55 or top_score >= 0.65:
            return "High"
        else:
            return "Medium"

    if len(chunks) >= 3:
        return "High"
    elif len(chunks) >= 1:
        return "Medium"
    else:
        return "Insufficient"
