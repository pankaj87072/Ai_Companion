from abc import ABC, abstractmethod


class ChatProvider(ABC):
    """A minimal common interface every AI provider adapter implements.

    `messages` is always a plain list of {"role": "user"|"assistant", "content": str}
    in chronological order, ending with the newest user turn. `system_prompt` is passed
    separately since every provider handles system instructions differently.
    """

    @abstractmethod
    def chat(
        self,
        system_prompt: str,
        messages: list[dict[str, str]],
        temperature: float = 0.8,
        max_tokens: int = 400,
    ) -> str:
        raise NotImplementedError
