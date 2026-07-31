import json
import math
import re
from typing import List, Dict, Any

def text_to_embedding(text: str, dim: int = 128) -> List[float]:
    """
    Generates a deterministic 128-dimensional embedding vector for text.
    Handles semantic word-hashing & term-frequency representation.
    """
    words = re.findall(r'\w+', text.lower())
    vec = [0.0] * dim
    if not words:
        return vec
    
    for word in words:
        # Simple hash trick to map words to dimension indices
        h = sum(ord(c) * (i + 1) for i, c in enumerate(word))
        idx1 = h % dim
        idx2 = (h * 31) % dim
        vec[idx1] += 1.0
        vec[idx2] += 0.5
        
    # Normalize vector to unit length
    magnitude = math.sqrt(sum(x * x for x in vec))
    if magnitude > 0:
        vec = [x / magnitude for x in vec]
    return vec

def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """Calculates cosine similarity between two float vectors."""
    if not vec1 or not vec2 or len(vec1) != len(vec2):
        return 0.0
    dot_product = sum(a * b for a, b in zip(vec1, vec2))
    mag1 = math.sqrt(sum(a * a for a in vec1))
    mag2 = math.sqrt(sum(b * b for b in vec2))
    if mag1 == 0 or mag2 == 0:
        return 0.0
    return dot_product / (mag1 * mag2)

def rank_vector_matches(query_text: str, chunk_records: List[Dict[str, Any]], top_k: int = 5) -> List[Dict[str, Any]]:
    """
    Ranks news vector chunks against a user query using cosine similarity.
    """
    query_vec = text_to_embedding(query_text)
    scored_items = []
    
    for record in chunk_records:
        vector_data = json.loads(record["vector_json"]) if isinstance(record["vector_json"], str) else record["vector_json"]
        sim = cosine_similarity(query_vec, vector_data)
        
        # Keyword bonus boost for exact match stock symbols or high impact events
        query_words = set(query_text.lower().split())
        chunk_words = set(record["chunk_text"].lower().split())
        overlap = len(query_words.intersection(chunk_words))
        score = sim + (overlap * 0.05)
        
        scored_items.append((score, record))
        
    scored_items.sort(key=lambda x: x[0], reverse=True)
    return [item[1] for item in scored_items[:top_k]]
