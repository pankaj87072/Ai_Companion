from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


# ---- Companions ----


class Companion(BaseModel):
    id: str
    name: str
    species: str
    traits: list[str]
    quote: str
    accent: str  # css gradient key used by frontend


# ---- Users ----


class GuestCreateRequest(BaseModel):
    companion_id: str
    companion_name: str = Field(min_length=1, max_length=40)


class UserOut(BaseModel):
    id: str
    companion_id: Optional[str]
    companion_name: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ---- Chat ----


class ChatRequest(BaseModel):
    user_id: str
    message: str = Field(min_length=1, max_length=4000)


class ChatResponse(BaseModel):
    reply: str
    memories_saved: list[str] = []


# ---- Conversation ----


class MessageOut(BaseModel):
    id: str
    role: Literal["user", "assistant"]
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


# ---- Memory ----


class MemoryOut(BaseModel):
    id: str
    content: str
    category: str
    importance: int
    created_at: datetime

    class Config:
        from_attributes = True


class ExtractedMemory(BaseModel):
    content: str
    category: Literal[
        "fact", "preference", "goal", "relationship", "life_event", "emotional_context"
    ]
    importance: int = Field(ge=1, le=10, default=5)


class ExtractedMemories(BaseModel):
    memories: list[ExtractedMemory] = []
