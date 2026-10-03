"""
RAG (Retrieval-Augmented Generation) engine for Research Ethics Guidance Assistant.
Uses ChromaDB for vector storage and sentence-transformers for embeddings.
"""

import os
import json
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

CHROMA_PATH = os.path.join(os.path.dirname(__file__), "chroma_db")
COLLECTION_NAME = "research_ethics_knowledge_base"
TOP_K = 5
MODEL_NAME = "all-MiniLM-L6-v2"

# Singleton instances
_chroma_client = None
_collection = None
_embedding_model = None


def get_embedding_model() -> SentenceTransformer:
    global _embedding_model
    if _embedding_model is None:
        logger.info(f"Loading embedding model: {MODEL_NAME}")
        _embedding_model = SentenceTransformer(MODEL_NAME)
    return _embedding_model


def get_chroma_collection():
    global _chroma_client, _collection
    if _collection is None:
        _chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
        _collection = _chroma_client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )
    return _collection


def get_collection_count() -> int:
    try:
        collection = get_chroma_collection()
        return collection.count()
    except Exception as e:
        logger.error(f"Error getting collection count: {e}")
        return 0


def retrieve_relevant_chunks(
    question: str,
    primary_category: Optional[str] = None,
    secondary_category: Optional[str] = None,
    category: Optional[str] = None,  # Backward compatibility
    top_k: int = TOP_K,
    min_score_threshold: float = 0.25,
) -> List[Dict]:
    """
    Retrieve top-k relevant chunks using Category-Aware Hybrid Retrieval:
    1. Query ChromaDB globally (pure semantic similarity).
    2. Query ChromaDB with category filters if categories are provided.
    3. Merge, deduplicate, and apply category relevance boosts.
    4. Filter by minimum similarity score threshold.
    """
    try:
        model = get_embedding_model()
        collection = get_chroma_collection()

        total_docs = collection.count()
        if total_docs == 0:
            logger.warning("ChromaDB collection is empty. Run ingest.py first.")
            return []

        # If legacy 'category' passed and no primary_category, use it
        p_cat = primary_category or category
        s_cat = secondary_category

        # Encode the query
        query_embedding = model.encode([question])[0].tolist()

        # Step 1: Global semantic retrieval
        fetch_limit = min(top_k * 2, total_docs)
        global_results = collection.query(
            query_embeddings=[query_embedding],
            n_results=fetch_limit,
            include=["documents", "metadatas", "distances"],
        )

        # Step 2: Targeted category retrievals (if specified)
        cat_results = []
        if p_cat:
            try:
                p_res = collection.query(
                    query_embeddings=[query_embedding],
                    n_results=min(top_k, total_docs),
                    where={"category": {"$eq": p_cat}},
                    include=["documents", "metadatas", "distances"],
                )
                if p_res and p_res.get("documents") and p_res["documents"][0]:
                    cat_results.append((p_res, 0.04))  # +0.04 primary category bonus
            except Exception as e:
                logger.debug(f"Primary category query failed or no matches: {e}")

        if s_cat and s_cat != p_cat:
            try:
                s_res = collection.query(
                    query_embeddings=[query_embedding],
                    n_results=min(top_k, total_docs),
                    where={"category": {"$eq": s_cat}},
                    include=["documents", "metadatas", "distances"],
                )
                if s_res and s_res.get("documents") and s_res["documents"][0]:
                    cat_results.append((s_res, 0.02))  # +0.02 secondary category bonus
            except Exception as e:
                logger.debug(f"Secondary category query failed or no matches: {e}")

        # Step 3: Merge and deduplicate chunks
        merged_chunks = {}

        def process_raw_results(results, bonus=0.0):
            if not results or not results.get("documents") or not results["documents"][0]:
                return
            for doc_text, metadata, distance in zip(
                results["documents"][0],
                results["metadatas"][0],
                results["distances"][0],
            ):
                # Cosine distance to similarity score
                raw_score = 1.0 - distance
                adjusted_score = raw_score + bonus
                # Unique key for chunk
                key = f"{metadata.get('document', '')}_{metadata.get('section', '')}_{doc_text[:80]}"
                
                if key not in merged_chunks or adjusted_score > merged_chunks[key]["score"]:
                    merged_chunks[key] = {
                        "text": doc_text,
                        "document": metadata.get("document", "Unknown Guideline"),
                        "filename": metadata.get("filename", ""),
                        "page": metadata.get("page", 1),
                        "section": metadata.get("section", "N/A"),
                        "category": metadata.get("category", "Other Research Ethics"),
                        "organization": metadata.get("organization") or "Verified Ethics Guideline",
                        "source_type": metadata.get("source_type", "provided_guideline"),
                        "raw_score": round(raw_score, 4),
                        "score": round(adjusted_score, 4),
                        "distance": round(distance, 4),
                    }

        # Process global results first (no bonus)
        process_raw_results(global_results, bonus=0.0)

        # Process targeted category results with bonuses
        for res, bonus in cat_results:
            process_raw_results(res, bonus=bonus)

        # Step 4: Filter by minimum score threshold
        filtered_chunks = [
            chunk for chunk in merged_chunks.values()
            if chunk["score"] >= min_score_threshold
        ]

        # Sort descending by adjusted score
        filtered_chunks.sort(key=lambda x: x["score"], reverse=True)
        top_chunks = filtered_chunks[:top_k]

        logger.debug(
            f"Retrieved {len(top_chunks)} chunks for '{question[:40]}...' "
            f"(PrimaryCat: {p_cat}, SecCat: {s_cat}, Scores: {[c['score'] for c in top_chunks]})"
        )
        return top_chunks

    except Exception as e:
        logger.error(f"Retrieval error: {e}")
        return []


def is_rag_ready() -> bool:
    """Check if the RAG system is ready (has indexed documents)."""
    try:
        return get_collection_count() > 0
    except Exception:
        return False
