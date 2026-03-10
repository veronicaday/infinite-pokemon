import anthropic

from config import ANTHROPIC_API_KEY
from core.stats import Stats
from core.creature import Creature
from generation.prompts import SYSTEM_PROMPT, build_user_prompt
from generation.validator import parse_and_validate


class CreatureGenerator:
    def __init__(self, api_key: str | None = None):
        key = api_key or ANTHROPIC_API_KEY
        if not key:
            raise ValueError(
                "No API key found. Set the ANTHROPIC_API_KEY environment variable.\n"
                "  export ANTHROPIC_API_KEY='your-key-here'"
            )
        self.client = anthropic.Anthropic(api_key=key)

    def generate(self, description: str, stat_preferences: Stats | None = None) -> Creature:
        """Generate a creature from a text description using Claude."""
        stat_dict = stat_preferences.as_dict() if stat_preferences else None
        user_prompt = build_user_prompt(description, stat_dict)

        message = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_prompt}],
        )

        response_text = message.content[0].text
        return parse_and_validate(response_text)
