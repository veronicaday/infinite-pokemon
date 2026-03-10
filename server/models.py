from pydantic import BaseModel, Field

from core.types import Type
from core.stats import Stats
from core.moves import Move
from core.creature import Creature
from core.battle import BattleEvent


class StatsSchema(BaseModel):
    hp: int
    attack: int
    defense: int
    sp_attack: int
    sp_defense: int
    speed: int


class MoveSchema(BaseModel):
    name: str
    type: str
    category: str
    power: int
    accuracy: int
    effect: str | None = None
    effect_chance: int = 0


class CreatureSchema(BaseModel):
    name: str
    description: str
    types: list[str]
    base_stats: StatsSchema
    moves: list[MoveSchema]
    current_hp: int
    max_hp: int
    status: str | None = None
    sprite_svg: str | None = None


class PokedexEntry(CreatureSchema):
    id: str
    created_at: str
    wins: int = 0
    evolution_threshold: int = 1
    evolved: bool = False
    losses: int = 0


class CreatureCreateRequest(BaseModel):
    description: str
    types: list[str] = Field(..., min_length=1, max_length=2)
    stat_preferences: StatsSchema | None = None


class BattleEventSchema(BaseModel):
    event_type: str
    actor: int | None = None
    message: str
    damage: int = 0
    effectiveness: float | None = None
    move_type: str | None = None


class TurnRequest(BaseModel):
    move1_index: int
    move2_index: int


class BattleCreateRequest(BaseModel):
    creature1: CreatureSchema
    creature2: CreatureSchema


# --- Conversion functions ---


def creature_to_schema(creature: Creature) -> CreatureSchema:
    return CreatureSchema(
        name=creature.name,
        description=creature.description,
        types=[t.value for t in creature.types],
        base_stats=StatsSchema(
            hp=creature.base_stats.hp,
            attack=creature.base_stats.attack,
            defense=creature.base_stats.defense,
            sp_attack=creature.base_stats.sp_attack,
            sp_defense=creature.base_stats.sp_defense,
            speed=creature.base_stats.speed,
        ),
        moves=[
            MoveSchema(
                name=m.name,
                type=m.type.value,
                category=m.category,
                power=m.power,
                accuracy=m.accuracy,
                effect=m.effect,
                effect_chance=m.effect_chance,
            )
            for m in creature.moves
        ],
        current_hp=creature.current_hp,
        max_hp=creature.max_hp,
        status=creature.status.value if creature.status else None,
    )


def schema_to_creature(schema: CreatureSchema) -> Creature:
    types = []
    for t_str in schema.types:
        for t in Type:
            if t.value == t_str:
                types.append(t)
                break

    moves = []
    for m in schema.moves:
        move_type = Type.NORMAL
        for t in Type:
            if t.value == m.type:
                move_type = t
                break
        moves.append(Move(
            name=m.name,
            type=move_type,
            category=m.category,
            power=m.power,
            accuracy=m.accuracy,
            effect=m.effect,
            effect_chance=m.effect_chance,
        ))

    creature = Creature(
        name=schema.name,
        description=schema.description,
        types=types,
        base_stats=Stats(
            hp=schema.base_stats.hp,
            attack=schema.base_stats.attack,
            defense=schema.base_stats.defense,
            sp_attack=schema.base_stats.sp_attack,
            sp_defense=schema.base_stats.sp_defense,
            speed=schema.base_stats.speed,
        ),
        moves=moves,
        current_hp=schema.current_hp,
    )
    return creature


def battle_event_to_schema(event: BattleEvent) -> BattleEventSchema:
    return BattleEventSchema(
        event_type=event.event_type,
        actor=event.actor,
        message=event.message,
        damage=event.damage,
        effectiveness=event.effectiveness,
        move_type=event.move_type,
    )
