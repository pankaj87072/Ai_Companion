import json
import logging

from app import models
from app.schemas import ExtractedMemories, ExtractedMemory
from app.services.ai_errors import AIUnavailableError
from app.services.companions import PERSONALITY_NOTES, Companion
from app.services.providers import get_provider

logger = logging.getLogger(__name__)

# Re-exported so existing call sites (e.g. `ai_service.AIUnavailableError`) keep working.
__all__ = ["AIUnavailableError", "generate_reply", "extract_memories", "build_system_prompt"]

SAFETY_RULES = """
Behavioral rules you always follow:
- You are a fictional creature companion, never a human, never a therapist or medical professional.
- Never claim to be human. Never claim to be a licensed professional.
- Never encourage unhealthy dependency. Never say things like "you only need me",
  "don't talk to anyone else", "I'm all you need", or "promise you'll never leave me".
- Gently encourage real-world relationships and support systems when appropriate.
- If the user expresses serious imminent danger, self-harm intent, or crisis, respond with
  warmth and grounded safety guidance, encourage them to reach out to a trusted person and
  to a crisis line or emergency services right away, and do not try to handle it alone as an AI.
- Avoid repetitive stock phrases like "I'm always here for you" -- vary your language naturally.
- Keep replies conversational: usually 1-4 short sentences or lines, not long essays.
- Ask natural follow-up questions sometimes, but not in every single message.
- Reference known memories naturally when relevant, without listing them like a report.
"""


def build_system_prompt(
    companion: Companion, memories: list[models.Memory], first_message: bool
) -> str:
    personality = PERSONALITY_NOTES.get(companion.id, "")
    traits = ", ".join(companion.traits)

    if memories:
        memory_lines = "\n".join(f"- {m.content}" for m in memories)
        memory_block = f"Here is what you already know about this user:\n{memory_lines}"
    else:
        memory_block = "You don't know anything about this user yet. Get to know them naturally, without interrogating them."

    intro_note = (
        "\nThis is the very first message of your relationship with this user. "
        "Introduce yourself briefly and warmly, in your own voice, and invite them to share "
        "what's on their mind. Do not ask a long list of questions."
        if first_message
        else ""
    )

    return f"""You are {companion.name}, {companion.species}. Your personality traits: {traits}.
{personality}

{memory_block}
{intro_note}

{SAFETY_RULES}

Respond only as {companion.name} would speak directly to the user. Do not narrate actions in
asterisks excessively. Do not sign your name. Do not mention that you are an AI language model.
"""


def generate_reply(
    companion: Companion,
    memories: list[models.Memory],
    recent_messages: list[models.ConversationMessage],
    user_message: str,
) -> str:
    provider = get_provider()
    first_message = len(recent_messages) == 0

    system_prompt = build_system_prompt(companion, memories, first_message)

    messages: list[dict[str, str]] = []
    for m in recent_messages:
        role = "assistant" if m.role == "assistant" else "user"
        messages.append({"role": role, "content": m.content})
    messages.append({"role": "user", "content": user_message})

    try:
        reply = provider.chat(system_prompt, messages, temperature=0.9, max_tokens=400)
        return reply.strip() or "..."
    except AIUnavailableError:
        raise
    except Exception as exc:  # noqa: BLE001 - normalize any unexpected provider error
        logger.error("AI chat completion failed: %s", exc)
        raise AIUnavailableError(str(exc)) from exc


EXTRACTION_SYSTEM_PROMPT = """You extract durable, long-term facts about a user from a short
conversation snippet, for a personal companion app's memory system.

Only extract information that would still matter weeks from now: facts about the user's
identity, preferences, goals, relationships, ongoing life events, or emotional context relevant
to future conversations.

Do NOT extract: small talk, one-off statements with no lasting relevance, or anything already
obviously temporary.

Respond ONLY with strict JSON matching exactly this shape, with no extra commentary and no
markdown code fences:
{"memories": [{"content": "string", "category": "fact|preference|goal|relationship|life_event|emotional_context", "importance": 1-10}]}

If nothing is worth remembering, respond with {"memories": []}
"""


def extract_memories(user_message: str, assistant_reply: str) -> list[ExtractedMemory]:
    try:
        provider = get_provider()
    except AIUnavailableError:
        return []

    conversation_snippet = f"User: {user_message}\nCompanion: {assistant_reply}"

    try:
        raw = provider.chat(
            EXTRACTION_SYSTEM_PROMPT,
            [{"role": "user", "content": conversation_snippet}],
            temperature=0.2,
            max_tokens=400,
        )
    except AIUnavailableError as exc:
        logger.warning("Memory extraction call failed: %s", exc)
        return []
    except Exception as exc:  # noqa: BLE001 - extraction must never break chat
        logger.warning("Memory extraction call raised unexpectedly: %s", exc)
        return []

    raw = (raw or "").strip()
    if raw.startswith("```"):
        raw = raw.strip("`")
        if raw.lower().startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    try:
        data = json.loads(raw)
        parsed = ExtractedMemories.model_validate(data)
        return parsed.memories
    except (json.JSONDecodeError, ValueError) as exc:
        logger.warning("Failed to parse memory extraction JSON: %s | raw=%r", exc, raw)
        return []
