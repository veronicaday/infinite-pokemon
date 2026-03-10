import re

import anthropic

from config import ANTHROPIC_API_KEY
from core.stats import Stats
from core.creature import Creature
from generation.prompts import SYSTEM_PROMPT, build_user_prompt
from generation.validator import parse_and_validate
from generation.sprite_prompt import SPRITE_SYSTEM_PROMPT, build_sprite_prompt


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

    def generate_sprite(
        self,
        name: str,
        description: str,
        types: list[str],
        stats: dict[str, int],
    ) -> str:
        """Generate an SVG sprite for a creature using Claude."""
        user_prompt = build_sprite_prompt(name, description, types, stats)

        message = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=8192,
            system=SPRITE_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_prompt}],
        )

        svg_text = message.content[0].text.strip()
        return _sanitize_svg(svg_text)


def _sanitize_svg(svg: str) -> str:
    """Extract and sanitize SVG markup."""
    # Strip markdown code fences if present
    match = re.search(r'```(?:svg|xml)?\s*\n?(.*?)\n?\s*```', svg, re.DOTALL)
    if match:
        svg = match.group(1).strip()

    # Extract just the <svg>...</svg> element
    match = re.search(r'(<svg[\s\S]*?</svg>)', svg, re.IGNORECASE)
    if match:
        svg = match.group(1)
    else:
        raise ValueError("No valid SVG element found in response")

    # Remove any script tags for safety
    svg = re.sub(r'<script[\s\S]*?</script>', '', svg, flags=re.IGNORECASE)
    svg = re.sub(r'\bon\w+\s*=\s*["\'][^"\']*["\']', '', svg)

    return svg
