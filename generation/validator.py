import json
import re

from core.types import Type
from core.stats import Stats, validate_stats
from core.moves import Move, validate_move
from core.creature import Creature


def _extract_json(text: str) -> dict:
    """Extract JSON from Claude's response, handling markdown code fences."""
    # Try direct parse first
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Strip markdown code fences
    match = re.search(r'```(?:json)?\s*\n?(.*?)\n?\s*```', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass

    # Try to find JSON object
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass

    raise ValueError("Could not parse creature JSON from response")


def _parse_type(type_str: str) -> Type:
    """Parse a type string to Type enum."""
    type_str = type_str.strip().upper()
    for t in Type:
        if t.name == type_str or t.value.upper() == type_str:
            return t
    # Fuzzy match
    for t in Type:
        if type_str in t.name or t.name in type_str:
            return t
    return Type.NORMAL  # fallback


def validate_creature(data: dict) -> Creature:
    """Validate and clamp a creature dict into a proper Creature object."""
    # Name
    name = str(data.get("name", "Unknown"))[:30]

    # Description
    description = str(data.get("description", "A mysterious creature."))[:200]

    # Types (1-2)
    raw_types = data.get("types", ["Normal"])
    if isinstance(raw_types, str):
        raw_types = [raw_types]
    types = [_parse_type(t) for t in raw_types[:2]]
    if not types:
        types = [Type.NORMAL]

    # Stats
    raw_stats = data.get("stats", {})
    stats = Stats(
        hp=int(raw_stats.get("hp", 50)),
        attack=int(raw_stats.get("attack", 50)),
        defense=int(raw_stats.get("defense", 50)),
        sp_attack=int(raw_stats.get("sp_attack", 50)),
        sp_defense=int(raw_stats.get("sp_defense", 50)),
        speed=int(raw_stats.get("speed", 50)),
    )
    stats = validate_stats(stats)

    # Moves (exactly 4)
    raw_moves = data.get("moves", [])
    moves = []
    for i, m in enumerate(raw_moves[:4]):
        move = Move(
            name=str(m.get("name", f"Move {i + 1}"))[:25],
            type=_parse_type(str(m.get("type", "Normal"))),
            category=str(m.get("category", "physical")) if m.get("category") in ("physical", "special", "status") else "physical",
            power=int(m.get("power", 60)),
            accuracy=int(m.get("accuracy", 85)),
            effect=m.get("effect") if m.get("effect") else None,
            effect_chance=int(m.get("effect_chance", 0)),
        )
        moves.append(validate_move(move))

    # Fill in if less than 4 moves
    while len(moves) < 4:
        default_type = types[0]
        moves.append(validate_move(Move(
            name=f"Tackle {len(moves) + 1}",
            type=default_type,
            category="physical",
            power=50,
            accuracy=95,
        )))

    return Creature(
        name=name,
        description=description,
        types=types,
        base_stats=stats,
        moves=moves,
    )


def parse_and_validate(response_text: str) -> Creature:
    """Parse Claude's response and return a validated Creature."""
    data = _extract_json(response_text)
    return validate_creature(data)
