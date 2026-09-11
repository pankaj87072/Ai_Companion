import google.generativeai as genai

from app.services.ai_errors import AIUnavailableError
from app.services.providers.base import ChatProvider


class GoogleProvider(ChatProvider):
    """Uses a Google AI Studio API key against the Gemini API."""

    def __init__(self, api_key: str, model: str):
        if not api_key:
            raise AIUnavailableError("Missing AI_API_KEY for the google provider")
        # Use the REST transport instead of the default gRPC transport: gRPC retries
        # connection failures indefinitely with no overall timeout, which can hang a
        # request forever. REST fails fast and predictably, like the other providers.
        genai.configure(api_key=api_key, transport="rest")
        self.model_name = model

    def chat(
        self,
        system_prompt: str,
        messages: list[dict[str, str]],
        temperature: float = 0.8,
        max_tokens: int = 400,
    ) -> str:
        try:
            model = genai.GenerativeModel(
                self.model_name, system_instruction=system_prompt
            )
            history = [
                {
                    "role": "model" if m["role"] == "assistant" else "user",
                    "parts": [m["content"]],
                }
                for m in messages[:-1]
            ]
            last_message = messages[-1]["content"] if messages else ""

            chat = model.start_chat(history=history)
            response = chat.send_message(
                last_message,
                generation_config=genai.types.GenerationConfig(
                    temperature=temperature, max_output_tokens=max_tokens
                ),
                request_options={"timeout": 20},
            )
            return (response.text or "").strip()
        except Exception as exc:  # noqa: BLE001 - normalize any provider SDK error
            raise AIUnavailableError(str(exc)) from exc
