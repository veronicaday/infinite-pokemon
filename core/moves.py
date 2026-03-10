from dataclasses import dataclass

from core.types import Type
from config import MOVE_POWER_BUDGET, MAX_POWER, MIN_ACCURACY, MAX_ACCURACY, EFFECT_BUDGET_VALUES


@dataclass
class Move:
    name: str
    type: Type
    category: str  # "physical", "special", "status"
    power: int  # 0 for status moves
    accuracy: int  # 50-100
    effect: str | None = None  # e.g., "burn", "paralyze"
    effect_chance: int = 0  # 0-100

    def budget_cost(self) -> int:
        """Calculate how much of the power budget this move uses."""
        cost = self.power + self.accuracy
        if self.effect and self.effect in EFFECT_BUDGET_VALUES:
            cost += int(EFFECT_BUDGET_VALUES[self.effect] * (self.effect_chance / 100))
        return cost


def validate_move(move: Move) -> Move:
    """Clamp move values to respect the power budget."""
    power = max(0, min(MAX_POWER, move.power))
    accuracy = max(MIN_ACCURACY, min(MAX_ACCURACY, move.accuracy))
    effect_chance = max(0, min(100, move.effect_chance))

    # If status move, power must be 0
    if move.category == "status":
        power = 0

    # Calculate budget and reduce if over
    effect_cost = 0
    if move.effect and move.effect in EFFECT_BUDGET_VALUES:
        effect_cost = int(EFFECT_BUDGET_VALUES[move.effect] * (effect_chance / 100))

    total = power + accuracy + effect_cost
    if total > MOVE_POWER_BUDGET:
        # Reduce power first, then accuracy
        excess = total - MOVE_POWER_BUDGET
        power_reduction = min(excess, power)
        power -= power_reduction
        excess -= power_reduction
        if excess > 0:
            accuracy = max(MIN_ACCURACY, accuracy - excess)

    return Move(
        name=move.name,
        type=move.type,
        category=move.category,
        power=power,
        accuracy=accuracy,
        effect=move.effect,
        effect_chance=effect_chance,
    )
