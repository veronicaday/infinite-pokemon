from enum import Enum
import random


class StatusEffect(Enum):
    BURN = "burn"
    FREEZE = "freeze"
    PARALYZE = "paralyze"
    POISON = "poison"
    SLEEP = "sleep"
    CONFUSE = "confuse"
    SCARED = "scared"


def can_move(status: StatusEffect | None, turns_asleep: int = 0) -> tuple[bool, str]:
    """Check if a creature can move this turn. Returns (can_move, message)."""
    if status is None:
        return True, ""

    if status == StatusEffect.FREEZE:
        if random.random() < 0.2:
            return True, "thawed out! ❄️✨"
        return False, "is frozen solid! 🧊"

    if status == StatusEffect.PARALYZE:
        if random.random() < 0.25:
            return False, "is paralyzed! It can't move! ⚡"
        return True, ""

    if status == StatusEffect.SLEEP:
        if turns_asleep >= 3 or random.random() < 0.33:
            return True, "woke up! 💤✨"
        return False, "is fast asleep. 💤"

    if status == StatusEffect.CONFUSE:
        if random.random() < 0.5:
            return False, "hurt itself in confusion! 💫"
        return True, ""

    if status == StatusEffect.SCARED:
        if random.random() < 0.3:
            return False, "is too scared to move! 👻"
        return True, "shook off its fear! 👻✨"

    return True, ""


def end_of_turn_damage(status: StatusEffect | None, max_hp: int) -> tuple[int, str]:
    """Calculate end-of-turn damage from status effects. Returns (damage, message)."""
    if status is None:
        return 0, ""

    if status == StatusEffect.BURN:
        damage = max(1, max_hp // 16)
        return damage, "is hurt by its burn! 🔥"

    if status == StatusEffect.POISON:
        damage = max(1, max_hp // 8)
        return damage, "is hurt by poison! 🤢"

    return 0, ""
