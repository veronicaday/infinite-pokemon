from dataclasses import dataclass

from config import STAT_BUDGET, MIN_STAT, MAX_STAT, STAT_NAMES


@dataclass
class Stats:
    hp: int
    attack: int
    defense: int
    sp_attack: int
    sp_defense: int
    speed: int

    def total(self) -> int:
        return self.hp + self.attack + self.defense + self.sp_attack + self.sp_defense + self.speed

    def as_dict(self) -> dict[str, int]:
        return {
            "hp": self.hp,
            "attack": self.attack,
            "defense": self.defense,
            "sp_attack": self.sp_attack,
            "sp_defense": self.sp_defense,
            "speed": self.speed,
        }

    def as_list(self) -> list[int]:
        return [self.hp, self.attack, self.defense, self.sp_attack, self.sp_defense, self.speed]

    @classmethod
    def from_dict(cls, d: dict[str, int]) -> "Stats":
        return cls(
            hp=d.get("hp", MIN_STAT),
            attack=d.get("attack", MIN_STAT),
            defense=d.get("defense", MIN_STAT),
            sp_attack=d.get("sp_attack", MIN_STAT),
            sp_defense=d.get("sp_defense", MIN_STAT),
            speed=d.get("speed", MIN_STAT),
        )

    @classmethod
    def default(cls) -> "Stats":
        """Create balanced default stats that sum to STAT_BUDGET."""
        base = STAT_BUDGET // 6
        remainder = STAT_BUDGET % 6
        values = [base] * 6
        for i in range(remainder):
            values[i] += 1
        return cls(*values)


def validate_stats(stats: Stats) -> Stats:
    """Clamp stats to valid range and redistribute to meet budget."""
    values = stats.as_list()

    # Clamp each stat to [MIN_STAT, MAX_STAT]
    values = [max(MIN_STAT, min(MAX_STAT, v)) for v in values]

    # Redistribute to meet budget
    current_total = sum(values)
    if current_total != STAT_BUDGET:
        diff = STAT_BUDGET - current_total
        # Distribute difference proportionally
        if diff > 0:
            # Need to add points - add to stats with room to grow
            while diff > 0:
                for i in range(6):
                    if diff <= 0:
                        break
                    if values[i] < MAX_STAT:
                        add = min(diff, MAX_STAT - values[i], max(1, diff // 6))
                        values[i] += add
                        diff -= add
        else:
            # Need to remove points - take from highest stats
            while diff < 0:
                for i in sorted(range(6), key=lambda x: values[x], reverse=True):
                    if diff >= 0:
                        break
                    if values[i] > MIN_STAT:
                        remove = min(-diff, values[i] - MIN_STAT, max(1, -diff // 6))
                        values[i] -= remove
                        diff += remove

    return Stats(*values)
