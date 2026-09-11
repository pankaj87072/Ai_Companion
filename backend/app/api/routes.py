import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.services import companions as companions_service
from app.services import memory as memory_service
from app.services import ai as ai_service

logger = logging.getLogger(__name__)
router = APIRouter()

FRIENDLY_AI_ERROR = "Your companion couldn't connect right now. Try again in a moment."
RECENT_MESSAGE_LIMIT = 12


@router.get("/health")
def health():
    return {"status": "ok"}


@router.get("/companions", response_model=list[schemas.Companion])
def get_companions():
    return companions_service.list_companions()


@router.post("/users/guest", response_model=schemas.UserOut)
def create_guest_user(payload: schemas.GuestCreateRequest, db: Session = Depends(get_db)):
    companion = companions_service.get_companion(payload.companion_id)
    if not companion:
        raise HTTPException(status_code=400, detail="Unknown companion")

    user = models.User(
        companion_id=payload.companion_id,
        companion_name=payload.companion_name.strip()[:40],
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/chat", response_model=schemas.ChatResponse)
def chat(payload: schemas.ChatRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.companion_id:
        raise HTTPException(status_code=400, detail="User has no companion selected")

    companion = companions_service.get_companion(user.companion_id)
    if not companion:
        raise HTTPException(status_code=400, detail="Unknown companion")

    display_companion = companion.model_copy(update={"name": user.companion_name or companion.name})

    recent_messages = (
        db.query(models.ConversationMessage)
        .filter(
            models.ConversationMessage.user_id == user.id,
            models.ConversationMessage.companion_id == user.companion_id,
        )
        .order_by(models.ConversationMessage.created_at.desc())
        .limit(RECENT_MESSAGE_LIMIT)
        .all()
    )
    recent_messages.reverse()

    memories = memory_service.get_relevant_memories(db, user.id, user.companion_id)

    try:
        reply = ai_service.generate_reply(
            companion=display_companion,
            memories=memories,
            recent_messages=recent_messages,
            user_message=payload.message,
        )
    except ai_service.AIUnavailableError as exc:
        logger.error("AI unavailable: %s", exc)
        raise HTTPException(status_code=503, detail=FRIENDLY_AI_ERROR) from exc
    except Exception as exc:  # noqa: BLE001 - never leak internals to the client
        logger.exception("Unexpected chat failure")
        raise HTTPException(status_code=500, detail=FRIENDLY_AI_ERROR) from exc

    user_msg = models.ConversationMessage(
        user_id=user.id,
        companion_id=user.companion_id,
        role="user",
        content=payload.message,
    )
    assistant_msg = models.ConversationMessage(
        user_id=user.id,
        companion_id=user.companion_id,
        role="assistant",
        content=reply,
    )
    db.add_all([user_msg, assistant_msg])
    db.commit()

    saved_memories: list[str] = []
    try:
        extracted = ai_service.extract_memories(payload.message, reply)
        saved_memories = memory_service.save_extracted_memories(
            db, user.id, user.companion_id, extracted
        )
    except Exception:  # noqa: BLE001 - extraction failure should never break chat
        logger.exception("Memory extraction failed; continuing without it")

    return schemas.ChatResponse(reply=reply, memories_saved=saved_memories)


@router.get("/conversations/{user_id}", response_model=list[schemas.MessageOut])
def get_conversations(user_id: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    messages = (
        db.query(models.ConversationMessage)
        .filter(models.ConversationMessage.user_id == user_id)
        .order_by(models.ConversationMessage.created_at.asc())
        .all()
    )
    return messages


@router.get("/memories/{user_id}", response_model=list[schemas.MemoryOut])
def get_memories(user_id: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    memories = (
        db.query(models.Memory)
        .filter(models.Memory.user_id == user_id)
        .order_by(models.Memory.importance.desc(), models.Memory.created_at.desc())
        .all()
    )
    return memories


@router.delete("/memories/user/{user_id}")
def forget_all_memories(user_id: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.query(models.Memory).filter(models.Memory.user_id == user_id).delete()
    db.commit()
    return {"status": "ok"}


@router.delete("/memories/{memory_id}")
def delete_memory(memory_id: str, db: Session = Depends(get_db)):
    memory = db.query(models.Memory).filter(models.Memory.id == memory_id).first()
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")

    db.delete(memory)
    db.commit()
    return {"status": "ok"}
