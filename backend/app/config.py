import os
from dotenv import load_dotenv

load_dotenv()

DEFAULT_MODELS = {
    "openai": "gpt-4o-mini",
    "anthropic": "claude-3-5-sonnet-20241022",
    "google": "gemini-1.5-flash",
}


class Settings:
    # Which AI provider to use: "openai", "anthropic", or "google".
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "openai").strip().lower()

    # A single API key slot regardless of provider -- just paste the key that matches
    # whichever AI_PROVIDER you picked above.
    AI_API_KEY: str = os.getenv("AI_API_KEY", "").strip()

    # Falls back to a sensible default model per provider if left blank.
    AI_MODEL: str = os.getenv("AI_MODEL", "").strip() or DEFAULT_MODELS.get(
        AI_PROVIDER, "gpt-4o-mini"
    )

    # Only used by the "openai" provider. Point this at any OpenAI-compatible endpoint
    # (OpenRouter, Groq, Together, a local Ollama/vLLM server, etc.) to use that instead
    # of api.openai.com.
    AI_BASE_URL: str | None = os.getenv("AI_BASE_URL", "").strip() or None

    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./companion.db")
    CORS_ORIGINS: list[str] = [
        o.strip()
        for o in os.getenv(
            "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
        ).split(",")
        if o.strip()
    ]


settings = Settings()
