import random
from dataclasses import dataclass

from core.creature import Creature
from core.moves import Move
from core.types import Type, get_effectiveness
from core.status_effects import StatusEffect, can_move, end_of_turn_damage
from config import STAB_MULTIPLIER


@dataclass
class BattleEvent:
    """Describes something that happened in battle, for the UI to display."""
    event_type: str  # "move", "damage", "miss", "status", "faint", "heal", "stat_change", "message"
    actor: int  # 1 or 2 (which player's creature)
    message: str
    damage: int = 0
    effectiveness: float = 1.0
    move_type: str | None = None  # type of the move used (for animations)


class BattleEngine:
    def __init__(self, creature1: Creature, creature2: Creature):
        self.creatures = {1: creature1, 2: creature2}
        creature1.reset_for_battle()
        creature2.reset_for_battle()
        self.winner: int | None = None
        self.turn_number = 0

    def execute_turn(self, move1: Move, move2: Move) -> list[BattleEvent]:
        """Execute a full turn. Returns list of events for UI."""
        self.turn_number += 1
        events: list[BattleEvent] = []

        # Determine turn order by speed (ties broken randomly)
        speed1 = self.creatures[1].get_effective_stat("speed")
        speed2 = self.creatures[2].get_effective_stat("speed")

        if speed1 > speed2 or (speed1 == speed2 and random.random() < 0.5):
            order = [(1, 2, move1), (2, 1, move2)]
        else:
            order = [(2, 1, move2), (1, 2, move1)]

        for attacker_id, defender_id, move in order:
            attacker = self.creatures[attacker_id]
            defender = self.creatures[defender_id]

            if attacker.is_fainted:
                continue

            # Check if attacker can move (status effects)
            able, status_msg = can_move(attacker.status, attacker.turns_asleep)
            if attacker.status == StatusEffect.SLEEP:
                if able:
                    attacker.status = None
                    attacker.turns_asleep = 0
                else:
                    attacker.turns_asleep += 1

            if not able:
                events.append(BattleEvent("status", attacker_id, f"{attacker.name} {status_msg}"))
                # Confusion self-damage
                if attacker.status == StatusEffect.CONFUSE:
                    self_damage = max(1, attacker.max_hp // 8)
                    attacker.take_damage(self_damage)
                    events.append(BattleEvent("damage", attacker_id, f"{attacker.name} dealt {self_damage} to itself!", damage=self_damage))
                if attacker.is_fainted:
                    events.append(BattleEvent("faint", attacker_id, f"{attacker.name} fainted!"))
                    self.winner = defender_id
                continue

            # Thaw/wake messages
            if status_msg:
                events.append(BattleEvent("status", attacker_id, f"{attacker.name} {status_msg}"))

            # Use the move
            move_type_str = move.type.value if hasattr(move.type, 'value') else str(move.type)
            events.append(BattleEvent("move", attacker_id, f"{attacker.name} used {move.name}!", move_type=move_type_str))

            # Accuracy check
            if random.randint(1, 100) > move.accuracy:
                events.append(BattleEvent("miss", attacker_id, f"{attacker.name}'s attack missed!"))
                continue

            if move.category == "status":
                # Status moves apply effects
                status_events = self._apply_move_effect(attacker_id, defender_id, move)
                events.extend(status_events)
            else:
                # Calculate and apply damage
                damage, effectiveness = self._calculate_damage(attacker, defender, move)
                defender.take_damage(damage)

                eff_msg = ""
                if effectiveness > 1.0:
                    eff_msg = " It's super effective!"
                elif effectiveness < 1.0 and effectiveness > 0:
                    eff_msg = " It's not very effective..."
                elif effectiveness == 0:
                    eff_msg = " It had no effect..."
                    damage = 0

                events.append(BattleEvent(
                    "damage", attacker_id,
                    f"{defender.name} took {damage} damage!{eff_msg}",
                    damage=damage, effectiveness=effectiveness,
                    move_type=move_type_str,
                ))

                # Apply secondary effect
                if move.effect and damage > 0 and random.randint(1, 100) <= move.effect_chance:
                    effect_events = self._apply_move_effect(attacker_id, defender_id, move)
                    events.extend(effect_events)

            # Check for faint
            if defender.is_fainted:
                events.append(BattleEvent("faint", defender_id, f"{defender.name} fainted!"))
                self.winner = attacker_id
                break

        # End-of-turn status damage
        if self.winner is None:
            for pid in [1, 2]:
                creature = self.creatures[pid]
                if creature.is_fainted:
                    continue
                damage, msg = end_of_turn_damage(creature.status, creature.max_hp)
                if damage > 0:
                    creature.take_damage(damage)
                    events.append(BattleEvent("damage", pid, f"{creature.name} {msg}", damage=damage))
                    if creature.is_fainted:
                        other = 2 if pid == 1 else 1
                        events.append(BattleEvent("faint", pid, f"{creature.name} fainted!"))
                        self.winner = other

        return events

    def _calculate_damage(self, attacker: Creature, defender: Creature, move: Move) -> tuple[int, float]:
        """Calculate damage. Returns (damage, effectiveness_multiplier)."""
        if move.power == 0:
            return 0, 1.0

        # Pick attack/defense stats based on move category
        if move.category == "physical":
            atk = attacker.get_effective_stat("attack")
            dfn = defender.get_effective_stat("defense")
        else:
            atk = attacker.get_effective_stat("sp_attack")
            dfn = defender.get_effective_stat("sp_defense")

        # Type effectiveness
        effectiveness = get_effectiveness(move.type, defender.types)
        if effectiveness == 0:
            return 0, 0.0

        # STAB (Same Type Attack Bonus)
        stab = STAB_MULTIPLIER if move.type in attacker.types else 1.0

        # Random factor
        rand_factor = random.uniform(0.85, 1.0)

        # Damage formula
        damage = ((22 * move.power * (atk / dfn)) / 50 + 2) * effectiveness * stab * rand_factor
        return max(1, int(damage)), effectiveness

    def _apply_move_effect(self, attacker_id: int, defender_id: int, move: Move) -> list[BattleEvent]:
        """Apply a move's effect (status or stat change)."""
        events = []
        defender = self.creatures[defender_id]
        effect = move.effect

        if not effect:
            return events

        # Status effects
        status_map = {
            "burn": StatusEffect.BURN,
            "freeze": StatusEffect.FREEZE,
            "paralyze": StatusEffect.PARALYZE,
            "poison": StatusEffect.POISON,
            "sleep": StatusEffect.SLEEP,
            "confuse": StatusEffect.CONFUSE,
        }

        if effect in status_map:
            if defender.status is None:
                defender.status = status_map[effect]
                events.append(BattleEvent("status", defender_id, f"{defender.name} was {effect}ed!"))
            else:
                events.append(BattleEvent("message", defender_id, f"It had no effect on {defender.name}..."))
            return events

        # Stat changes
        if effect.startswith("raise_"):
            stat = effect[6:]
            target = self.creatures[attacker_id]
            target.stat_modifiers[stat] = min(6, target.stat_modifiers.get(stat, 0) + 1)
            events.append(BattleEvent("stat_change", attacker_id, f"{target.name}'s {stat} rose!"))
        elif effect.startswith("lower_"):
            stat = effect[6:]
            defender.stat_modifiers[stat] = max(-6, defender.stat_modifiers.get(stat, 0) - 1)
            events.append(BattleEvent("stat_change", defender_id, f"{defender.name}'s {stat} fell!"))

        return events

    def check_winner(self) -> int | None:
        return self.winner
