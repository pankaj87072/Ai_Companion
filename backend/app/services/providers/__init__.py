from app.config import settings
from app.services.ai_errors import AIUnavailableError
from app.services.providers.base import ChatProvider

SUPPORTED_PROVIDERS = {"openai", "anthropic", "google"}


def get_provider() -> ChatProvider:
    provider = settings.AI_PROVIDER

    if provider == "openai":
        from app.services.providers.openai_provider import OpenAIProvider

        return OpenAIProvider(settings.AI_API_KEY, settings.AI_MODEL, settings.AI_BASE_URL)

    if provider == "anthropic":
        from app.services.providers.anthropic_provider import AnthropicProvider

        return AnthropicProvider(settings.AI_API_KEY, settings.AI_MODEL)

    if provider == "google":
        from app.services.providers.google_provider import GoogleProvider

        return GoogleProvider(settings.AI_API_KEY, settings.AI_MODEL)

    raise AIUnavailableError(
        f"Unknown AI_PROVIDER '{provider}'. Use one of: {', '.join(sorted(SUPPORTED_PROVIDERS))}."
    )
