from openai import OpenAI, APIError, APIConnectionError

from app.services.ai_errors import AIUnavailableError
from app.services.providers.base import ChatProvider


class OpenAIProvider(ChatProvider):
    """Works with OpenAI itself, and any OpenAI-compatible endpoint (Groq, OpenRouter,
    Together, local vLLM/Ollama servers, etc.) when AI_BASE_URL is set."""

    def __init__(self, api_key: str, model: str, base_url: str | None = None):
        if not api_key:
            raise AIUnavailableError("Missing AI_API_KEY for the openai provider")
        kwargs: dict = {"api_key": api_key}
        if base_url:
            kwargs["base_url"] = base_url
        self.client = OpenAI(**kwargs)
        self.model = model

    def chat(
        self,
        system_prompt: str,
        messages: list[dict[str, str]],
        temperature: float = 0.8,
        max_tokens: int = 400,
    ) -> str:
        full_messages = [{"role": "system", "content": system_prompt}, *messages]
        try:
            completion = self.client.chat.completions.create(
                model=self.model,
                messages=full_messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            return (completion.choices[0].message.content or "").strip()
        except (APIError, APIConnectionError) as exc:
            raise AIUnavailableError(str(exc)) from exc
