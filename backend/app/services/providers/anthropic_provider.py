from anthropic import Anthropic, APIError, APIConnectionError

from app.services.ai_errors import AIUnavailableError
from app.services.providers.base import ChatProvider


class AnthropicProvider(ChatProvider):
    """Uses an Anthropic API key directly against the Claude Messages API."""

    def __init__(self, api_key: str, model: str):
        if not api_key:
            raise AIUnavailableError("Missing AI_API_KEY for the anthropic provider")
        self.client = Anthropic(api_key=api_key)
        self.model = model

    def chat(
        self,
        system_prompt: str,
        messages: list[dict[str, str]],
        temperature: float = 0.8,
        max_tokens: int = 400,
    ) -> str:
        # Anthropic requires alternating user/assistant turns starting with "user".
        cleaned: list[dict[str, str]] = []
        for m in messages:
            role = "assistant" if m["role"] == "assistant" else "user"
            if cleaned and cleaned[-1]["role"] == role:
                cleaned[-1]["content"] += f"\n{m['content']}"
            else:
                cleaned.append({"role": role, "content": m["content"]})
        if not cleaned or cleaned[0]["role"] != "user":
            cleaned.insert(0, {"role": "user", "content": "(continuing our conversation)"})

        try:
            response = self.client.messages.create(
                model=self.model,
                system=system_prompt,
                messages=cleaned,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            parts = [
                block.text
                for block in response.content
                if getattr(block, "type", "") == "text"
            ]
            return "".join(parts).strip()
        except (APIError, APIConnectionError) as exc:
            raise AIUnavailableError(str(exc)) from exc
