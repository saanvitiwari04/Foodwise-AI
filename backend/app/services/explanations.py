from __future__ import annotations


def grounded_explanation(title: str, facts: dict) -> str:
    """Template fallback for LLM explanations.

    A production wrapper can pass the same facts to Gemini/OpenAI. The important
    rule from the blueprint is preserved here: numbers come from backend facts,
    not from generated text.
    """

    fact_text = ", ".join(f"{key.replace('_', ' ')}: {value}" for key, value in facts.items())
    return f"{title}. This is based on verified backend data - {fact_text}."

