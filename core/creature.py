from dataclasses import dataclass, field

from core.types import Type
from core.stats import Stats
from core.moves import Move
from core.status_effects import StatusEffect


@dataclass
class Creature:
    name: str
    description: str
    types: list[Type]
    base_stats: Stats
    moves: list[Move]
    current_hp: int = 0
    status: StatusEffect | None = None
    turns_asleep: int = 0
    stat_modifiers: dict[str, int] = field(default_factory=lambda: {
        "attack": 0, "defense": 0, "sp_attack": 0, "sp_defense": 0, "speed": 0,
    })

    def __post_init__(self):
        if self.current_hp == 0:
            self.current_hp = self.max_hp

    @property
    def max_hp(self) -> int:
        # HP formula: base_hp * 2 + 110 (simplified from Pokemon formula at level 50)
        return self.base_stats.hp * 2 + 110

    def get_effective_stat(self, stat_name: str) -> int:
        """Get stat value with modifiers applied."""
        base = getattr(self.base_stats, stat_name)
        if stat_name == "hp":
            return self.max_hp

        # Stat stage multipliers: -6 to +6
        stage = self.stat_modifiers.get(stat_name, 0)
        if stage >= 0:
            multiplier = (2 + stage) / 2
        else:
            multiplier = 2 / (2 - stage)

        # Burn halves physical attack
        value = int(base * multiplier)
        if stat_name == "attack" and self.status == StatusEffect.BURN:
            value //= 2

        # Paralysis halves speed
        if stat_name == "speed" and self.status == StatusEffect.PARALYZE:
            value //= 2

        return max(1, value)

    @property
    def is_fainted(self) -> bool:
        return self.current_hp <= 0

    def take_damage(self, amount: int) -> int:
        """Apply damage and return actual damage dealt."""
        actual = min(amount, self.current_hp)
        self.current_hp = max(0, self.current_hp - amount)
        return actual

    def reset_for_battle(self):
        """Reset battle state."""
        self.current_hp = self.max_hp
        self.status = None
        self.turns_asleep = 0
        self.stat_modifiers = {
            "attack": 0, "defense": 0, "sp_attack": 0, "sp_defense": 0, "speed": 0,
        }
