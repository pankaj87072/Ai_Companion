from datetime import datetime
from difflib import SequenceMatcher

from sqlalchemy.orm import Session

from app import models
from app.schemas import ExtractedMemory

MAX_RETRIEVED_MEMORIES = 18
SIMILARITY_THRESHOLD = 0.82


def _similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, a.lower().strip(), b.lower().strip()).ratio()


def get_relevant_memories(
    db: Session, user_id: str, companion_id: str, limit: int = MAX_RETRIEVED_MEMORIES
) -> list[models.Memory]:
    """Rank memories by a blend of importance and recency."""
    memories = (
        db.query(models.Memory)
        .filter(
            models.Memory.user_id == user_id,
            models.Memory.companion_id == companion_id,
        )
        .all()
    )
    if not memories:
        return []

    now = datetime.utcnow()

    def score(m: models.Memory) -> float:
        days_since_use = max((now - (m.last_used_at or m.created_at)).days, 0)
        recency_score = 1.0 / (1.0 + days_since_use)
        return m.importance * 1.0 + recency_score * 3.0

    ranked = sorted(memories, key=score, reverse=True)
    top = ranked[:limit]

    # touch last_used_at for retrieved memories
    for m in top:
        m.last_used_at = now
    db.commit()

    return top


def save_extracted_memories(
    db: Session,
    user_id: str,
    companion_id: str,
    extracted: list[ExtractedMemory],
) -> list[str]:
    if not extracted:
        return []

    existing = (
        db.query(models.Memory)
        .filter(
            models.Memory.user_id == user_id,
            models.Memory.companion_id == companion_id,
        )
        .all()
    )

    saved_contents: list[str] = []

    for item in extracted:
        content = item.content.strip()
        if not content:
            continue

        is_duplicate = any(
            _similarity(content, e.content) >= SIMILARITY_THRESHOLD for e in existing
        )
        if is_duplicate:
            continue

        memory = models.Memory(
            user_id=user_id,
            companion_id=companion_id,
            content=content,
            category=item.category,
            importance=max(1, min(10, item.importance)),
        )
        db.add(memory)
        existing.append(memory)
        saved_contents.append(content)

    if saved_contents:
        db.commit()

    return saved_contents
