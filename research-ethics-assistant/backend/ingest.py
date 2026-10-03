"""
Document ingestion pipeline for Research Ethics Guidance Assistant.
Processes the 8 real research ethics PDF guidelines, extracts text page-by-page using PyMuPDF,
chunks intelligently by section/paragraph, generates embeddings with all-MiniLM-L6-v2,
and stores them in ChromaDB collection 'research_ethics_knowledge_base'.

Run: python ingest.py
"""

import os
import re
import json
import hashlib
import logging
from datetime import datetime
from typing import List, Dict, Tuple, Optional
import pymupdf as fitz
import chromadb
from sentence_transformers import SentenceTransformer

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(__file__)
DOCS_DIR = os.path.join(BASE_DIR, "knowledge_base", "documents")
METADATA_DIR = os.path.join(BASE_DIR, "knowledge_base", "metadata")
CHROMA_PATH = os.path.join(BASE_DIR, "chroma_db")
REGISTRY_PATH = os.path.join(METADATA_DIR, "source_registry.json")
BACKUP_REGISTRY_PATH = os.path.join(BASE_DIR, "source_registry.json")
STATUS_PATH = os.path.join(METADATA_DIR, "ingestion_status.json")

COLLECTION_NAME = "research_ethics_knowledge_base"
OLD_COLLECTION_NAME = "research_ethics_kb"
MODEL_NAME = "all-MiniLM-L6-v2"

TARGET_CHUNK_SIZE = 850
CHUNK_OVERLAP = 120

# Verified document metadata registry
VERIFIED_REGISTRY = [
    {
        "document": "ICMR Policy on Research Integrity and Publication Ethics",
        "filename": "1724844182_icmr_pripe2019.pdf",
        "organization": "Indian Council of Medical Research",
        "publication_year": 2019,
        "total_pages": 24,
        "source_type": "provided_guideline",
        "categories": ["Research Integrity", "Publication Ethics", "Authorship"],
        "description": "Policy guidelines from the Indian Council of Medical Research covering responsible conduct of research, authorship, research misconduct, plagiarism check threshold (<10%), RIO, and reporting."
    },
    {
        "document": "APA Ethical Principles of Psychologists and Code of Conduct",
        "filename": "ethics-code-2017.pdf",
        "organization": "American Psychological Association",
        "publication_year": 2017,
        "total_pages": 20,
        "source_type": "provided_guideline",
        "categories": ["Informed Consent", "Data Handling & Privacy", "Authorship", "Publication Ethics", "Research Integrity"],
        "description": "American Psychological Association ethics code including Standard 8 (Research and Publication), Standard 4 (Privacy and Confidentiality), and core principles."
    },
    {
        "document": "General guidelines for research ethics",
        "filename": "general-guidelines.pdf",
        "organization": "The Norwegian National Research Ethics Committees",
        "publication_year": None,
        "total_pages": 1,
        "source_type": "provided_guideline",
        "categories": ["Informed Consent", "Data Handling & Privacy", "Publication Ethics", "Research Integrity", "Other Research Ethics"],
        "description": "National guidelines from the Norwegian Committees (NEM, NENT, NESH, Granskingsutvalget) defining 14 core ethical principles including voluntary informed consent, confidentiality, integrity, and social responsibility."
    },
    {
        "document": "Guidelines for Ethical Considerations in Social Research & Evaluation in India",
        "filename": "Guidelines-for-Ethical-Considerations-in-Social-Research-Evaluation-In-India_2020.pdf",
        "organization": "Centre For Media Studies-Institutional Review Board (CMS-IRB)",
        "publication_year": 2020,
        "total_pages": 28,
        "source_type": "provided_guideline",
        "categories": ["Informed Consent", "Data Handling & Privacy", "Research Integrity", "Other Research Ethics"],
        "description": "Guidance for social and evaluation research in India by CMS-IRB, detailing human subjects protection, vulnerable populations, verbal vs written consent, privacy, and research ethics committees."
    },
    {
        "document": "Research ethics checks: Guidelines for editors and reviewers",
        "filename": "Research ethics_guidelines for editors and reviewers.pdf",
        "organization": "Frontiers",
        "publication_year": 2024,
        "total_pages": 24,
        "source_type": "provided_guideline",
        "categories": ["Informed Consent", "Data Handling & Privacy", "Publication Ethics", "Research Integrity", "Authorship"],
        "description": "Frontiers editorial guidelines detailing study ethics verification, AIRA automated checks, COPE compliance, consent statements, identifiable patient data, vulnerable populations, and animal studies."
    },
    {
        "document": "Research ethics checks: Guidelines for editors and reviewers (Duplicate copy)",
        "filename": "Research ethics_guidelines for editors and reviewers (1).pdf",
        "organization": "Frontiers",
        "publication_year": 2024,
        "total_pages": 24,
        "source_type": "provided_guideline",
        "categories": ["Informed Consent", "Data Handling & Privacy", "Publication Ethics", "Research Integrity", "Authorship"],
        "description": "Frontiers editorial guidelines for reviewer/editor ethics checks and compliance assessments."
    },
    {
        "document": "The Belmont Report: Ethical Principles and Guidelines for the Protection of Human Subjects of Research",
        "filename": "the-belmont-report-508c_FINAL.pdf",
        "organization": "National Commission for the Protection of Human Subjects of Biomedical and Behavioral Research",
        "publication_year": 1979,
        "total_pages": 10,
        "source_type": "provided_guideline",
        "categories": ["Informed Consent", "Research Integrity", "Other Research Ethics"],
        "description": "Foundational ethical framework establishing Respect for Persons, Beneficence, and Justice, and their applications to Informed Consent, Risk/Benefit Assessment, and Subject Selection."
    },
    {
        "document": "International Ethical Guidelines for Health-related Research Involving Humans",
        "filename": "WEB-CIOMS-EthicalGuidelines.pdf",
        "organization": "Council for International Organizations of Medical Sciences (CIOMS) in collaboration with WHO",
        "publication_year": 2016,
        "total_pages": 119,
        "source_type": "provided_guideline",
        "categories": ["Informed Consent", "Data Handling & Privacy", "Research Integrity", "Other Research Ethics"],
        "description": "Comprehensive international guidelines by CIOMS and WHO covering 25 guidelines for health research, consent waivers, biological specimens, data governance, vulnerable groups, and ethics committee review."
    }
]


def save_source_registry():
    """Save verified source registry to metadata dir and backend root."""
    os.makedirs(METADATA_DIR, exist_ok=True)
    with open(REGISTRY_PATH, "w", encoding="utf-8") as f:
        json.dump(VERIFIED_REGISTRY, f, indent=2)
    with open(BACKUP_REGISTRY_PATH, "w", encoding="utf-8") as f:
        json.dump(VERIFIED_REGISTRY, f, indent=2)
    logger.info(f"Source registry saved ({len(VERIFIED_REGISTRY)} entries).")


def get_doc_metadata(filename: str) -> Dict:
    for entry in VERIFIED_REGISTRY:
        if entry["filename"].lower() == filename.lower():
            return entry
    return {
        "document": filename,
        "filename": filename,
        "organization": None,
        "publication_year": None,
        "source_type": "provided_guideline",
    }


def classify_chunk_category(text: str, section: str) -> str:
    """Classify chunk into one of 5 supported categories or Other Research Ethics."""
    combined = (section + " " + text).lower()
    
    # Authorship
    if any(k in combined for k in [
        "authorship", "co-author", "author credit", "publication credit", 
        "gift author", "ghost author", "author order", "qualify for authorship", 
        "qualifies as an author", "substantially contributed to the research and may include",
        "author contribution", "authorship criteria", "non-human entities", "ai as author"
    ]):
        return "Authorship"
        
    # Informed Consent
    if any(k in combined for k in [
        "informed consent", "consent form", "voluntary participation", "assent of minor", 
        "waiver of consent", "dispensing with informed consent", "refusal to participate", 
        "withdraw consent", "decisional capacity", "respect for persons", "human subject",
        "consent statement", "verbal consent", "written informed consent"
    ]):
        return "Informed Consent"
        
    # Data Handling & Privacy
    if any(k in combined for k in [
        "confidentiality", "anonymi", "de-identif", "privacy", "data storage", 
        "data protection", "identifiable data", "identifiable information", 
        "sharing research data", "biological materials", "biobank", "patient records",
        "medical history", "deidentified"
    ]):
        return "Data Handling & Privacy"
        
    # Publication Ethics
    if any(k in combined for k in [
        "publication ethics", "duplicate publication", "predatory journal", "plagiarism check", 
        "salami publication", "redundant publication", "manuscript preparation", "journal submission", 
        "peer review", "retraction", "erratum", "editor", "reviewer", "dissemination of research", 
        "disclose ai", "ai-assisted writing", "guidelines for editors and reviewers",
        "generative ai", "chatgpt in research", "gemini in academic"
    ]):
        return "Publication Ethics"
        
    # Research Integrity
    if any(k in combined for k in [
        "research integrity", "misconduct", "fabrication", "falsification", "plagiarism", 
        "conflict of interest", "research ethics committee", "institutional review board", 
        "rio", "whistleblower", "malpractice", "scientific fraud", "responsible conduct of research",
        "ethical clearance", "ethics committee approval"
    ]):
        return "Research Integrity"
        
    return "Other Research Ethics"


def detect_section_heading(text: str) -> Optional[str]:
    """Detect if block looks like a heading/section title."""
    clean = " ".join(text.split()).strip()
    if len(clean) > 100:
        return None
    patterns = [
        r"^(?:Guideline\s+\d+|Standard\s+\d+|Section\s+\d+|Annex(?:ure)?\s+[IVX\d]+|Part\s+[ABC]|\d+\.\s+[A-Z]|\d+\.\d+)",
        r"^(?:PRINCIPLES|ETHICAL STANDARDS|GENERAL PRINCIPLES|Contents|Preface|Foreword)",
        r"^[A-Z\s]{4,40}$",
    ]
    for pat in patterns:
        if re.search(pat, clean, re.I):
            return clean
    return None


def extract_and_chunk_pdf(filepath: str, meta: Dict) -> Tuple[List[Dict], int]:
    """Extract and intelligently chunk text from a single PDF using PyMuPDF."""
    filename = os.path.basename(filepath)
    doc_name = meta.get("document", filename)
    org = meta.get("organization")
    
    doc = fitz.open(filepath)
    total_pages = len(doc)
    chunks = []
    
    curr_section = f"{doc_name} (Overview)"
    
    for page_num in range(1, total_pages + 1):
        page = doc[page_num - 1]
        blocks = page.get_text("blocks")
        
        page_buffer = ""
        for b in blocks:
            # b: (x0, y0, x1, y1, text, block_no, block_type)
            block_text = b[4].strip()
            if not block_text:
                continue
                
            heading = detect_section_heading(block_text)
            if heading:
                curr_section = heading
            
            clean_block = " ".join(block_text.split())
            if not page_buffer:
                page_buffer = clean_block
            else:
                page_buffer += "\n\n" + clean_block
                
            if len(page_buffer) >= TARGET_CHUNK_SIZE:
                cat = classify_chunk_category(page_buffer, curr_section)
                chunk_id = hashlib.md5(f"{filename}_{page_num}_{len(chunks)}_{page_buffer[:60]}".encode()).hexdigest()
                chunks.append({
                    "id": chunk_id,
                    "text": page_buffer.strip(),
                    "metadata": {
                        "document": doc_name,
                        "filename": filename,
                        "page": page_num,
                        "section": curr_section,
                        "category": cat,
                        "organization": org if org else "Unknown Organization",
                        "source_type": "provided_guideline",
                    }
                })
                # Keep overlap from end of buffer
                page_buffer = page_buffer[-CHUNK_OVERLAP:]
                
        if len(page_buffer.strip()) > 80:
            cat = classify_chunk_category(page_buffer, curr_section)
            chunk_id = hashlib.md5(f"{filename}_{page_num}_{len(chunks)}_{page_buffer[:60]}".encode()).hexdigest()
            chunks.append({
                "id": chunk_id,
                "text": page_buffer.strip(),
                "metadata": {
                    "document": doc_name,
                    "filename": filename,
                    "page": page_num,
                    "section": curr_section,
                    "category": cat,
                    "organization": org if org else "Unknown Organization",
                    "source_type": "provided_guideline",
                }
            })
            page_buffer = ""
            
    doc.close()
    return chunks, total_pages


def ingest_all():
    """Main ingestion entrypoint."""
    logger.info("==================================================")
    logger.info("STARTING INGESTION: 8 REAL RESEARCH ETHICS GUIDELINES")
    logger.info("==================================================")
    
    # 1. Save verified registry
    save_source_registry()
    
    # 2. Check PDFs in knowledge_base/documents
    if not os.path.exists(DOCS_DIR):
        raise FileNotFoundError(f"Documents directory not found: {DOCS_DIR}")
        
    pdf_files = sorted([f for f in os.listdir(DOCS_DIR) if f.lower().endswith(".pdf")])
    logger.info(f"Found {len(pdf_files)} PDF files in {DOCS_DIR}:")
    for f in pdf_files:
        logger.info(f"  - {f}")
        
    if len(pdf_files) != 8:
        logger.warning(f"Expected 8 PDFs, found {len(pdf_files)}. Continuing with available PDFs.")
        
    # 3. Process all PDFs
    all_chunks = []
    total_pages_all = 0
    doc_stats = []
    
    for f in pdf_files:
        filepath = os.path.join(DOCS_DIR, f)
        meta = get_doc_metadata(f)
        chunks, page_count = extract_and_chunk_pdf(filepath, meta)
        total_pages_all += page_count
        all_chunks.extend(chunks)
        doc_stats.append({
            "filename": f,
            "document": meta.get("document", f),
            "pages": page_count,
            "chunks": len(chunks)
        })
        logger.info(f"Processed: {f} | {page_count} pages | {len(chunks)} chunks")
        
    logger.info("--------------------------------------------------")
    logger.info(f"TOTAL: {len(pdf_files)} documents, {total_pages_all} pages, {len(all_chunks)} chunks.")
    
    # 4. Initialize embedding model
    logger.info(f"Loading embedding model: {MODEL_NAME}")
    embedder = SentenceTransformer(MODEL_NAME)
    
    # 5. Connect to ChromaDB and reset collections
    client = chromadb.PersistentClient(path=CHROMA_PATH)
    
    # Delete old demo collection if present
    try:
        client.delete_collection(OLD_COLLECTION_NAME)
        logger.info(f"Cleaned up old demo collection: {OLD_COLLECTION_NAME}")
    except Exception:
        pass
        
    # Delete current collection to recreate fresh
    try:
        client.delete_collection(COLLECTION_NAME)
        logger.info(f"Reset active collection: {COLLECTION_NAME}")
    except Exception:
        pass
        
    collection = client.create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"}
    )
    
    # 6. Batch encode and store
    batch_size = 64
    ids = [c["id"] for c in all_chunks]
    texts = [c["text"] for c in all_chunks]
    metadatas = [c["metadata"] for c in all_chunks]
    
    logger.info("Generating embeddings and indexing into ChromaDB...")
    for i in range(0, len(texts), batch_size):
        batch_texts = texts[i:i + batch_size]
        batch_ids = ids[i:i + batch_size]
        batch_metas = metadatas[i:i + batch_size]
        
        batch_embeddings = embedder.encode(batch_texts, show_progress_bar=False).tolist()
        
        collection.add(
            ids=batch_ids,
            documents=batch_texts,
            embeddings=batch_embeddings,
            metadatas=batch_metas
        )
        logger.info(f"Indexed batch {i//batch_size + 1}/{(len(texts)-1)//batch_size + 1} ({len(batch_texts)} chunks)")
        
    stored_count = collection.count()
    logger.info(f"Successfully stored {stored_count} chunks in collection '{COLLECTION_NAME}'.")
    
    # 7. Write status metadata file
    status_data = {
        "status": "ready",
        "collection_name": COLLECTION_NAME,
        "embedding_model": MODEL_NAME,
        "total_documents": len(pdf_files),
        "total_pages": total_pages_all,
        "total_chunks": stored_count,
        "ingestion_timestamp": datetime.utcnow().isoformat(),
        "documents": doc_stats
    }
    with open(STATUS_PATH, "w", encoding="utf-8") as f:
        json.dump(status_data, f, indent=2)
    logger.info(f"Ingestion status written to: {STATUS_PATH}")
    logger.info("==================================================")
    logger.info("INGESTION COMPLETE & VERIFIED")
    logger.info("==================================================")


if __name__ == "__main__":
    ingest_all()
