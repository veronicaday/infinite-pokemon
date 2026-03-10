import asyncio

from fastapi import APIRouter, HTTPException

from generation.generator import CreatureGenerator
from server.database import (
    save_creature,
    list_creatures,
    get_creature,
    delete_creature,
    increment_wins,
    increment_losses,
    update_creature,
    reset_wins,
)
from server.models import CreatureSchema, PokedexEntry, creature_to_schema

router = APIRouter()

_generator: CreatureGenerator | None = None


def _get_generator() -> CreatureGenerator:
    global _generator
    if _generator is None:
        _generator = CreatureGenerator()
    return _generator


@router.get("", response_model=list[PokedexEntry])
async def list_pokedex():
    """List all saved creatures, newest first."""
    return list_creatures()


@router.get("/{creature_id}", response_model=PokedexEntry)
async def get_pokedex_entry(creature_id: str):
    """Get a single creature by ID."""
    entry = get_creature(creature_id)
    if entry is None:
        raise HTTPException(status_code=404, detail="Creature not found")
    return entry


@router.post("", response_model=PokedexEntry)
async def save_to_pokedex(creature: CreatureSchema):
    """Save a creature to the pokedex."""
    creature_id = save_creature(creature)
    entry = get_creature(creature_id)
    return entry


@router.delete("/{creature_id}")
async def delete_from_pokedex(creature_id: str):
    """Delete a creature from the pokedex."""
    deleted = delete_creature(creature_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Creature not found")
    return {"ok": True}


@router.post("/{creature_id}/win")
async def record_win(creature_id: str):
    """Record a battle win for a creature, incrementing its win count."""
    result = increment_wins(creature_id)
    if not result:
        raise HTTPException(status_code=404, detail="Creature not found")
    return result


@router.post("/{creature_id}/loss")
async def record_loss(creature_id: str):
    """Record a battle loss for a creature."""
    result = increment_losses(creature_id)
    if not result:
        raise HTTPException(status_code=404, detail="Creature not found")
    return result


@router.post("/{creature_id}/evolve")
async def evolve_creature(creature_id: str):
    """Evolve a creature if it has enough wins."""
    creature = get_creature(creature_id)
    if not creature:
        raise HTTPException(status_code=404, detail="Creature not found")
    if creature.get("evolved"):
        raise HTTPException(
            status_code=400,
            detail="This creature has already evolved",
        )
    if creature["wins"] < creature["evolution_threshold"]:
        raise HTTPException(
            status_code=400,
            detail="Not enough wins to evolve",
        )

    generator = _get_generator()

    # Build evolution prompt
    evolution_description = (
        f"This is the evolution of {creature['name']}. {creature['description']}. "
        f"Design a more powerful, evolved form that keeps the same core theme but is "
        f"bigger, more impressive, and more powerful. It should clearly be an evolution "
        f"of the original."
    )

    types = creature["types"]  # Keep same types
    type_str = "/".join(types)
    description_with_types = (
        f"{evolution_description}\n\n"
        f"IMPORTANT: This creature MUST be {type_str} type. "
        f"Set \"types\" to {types} in your response."
    )

    # Run creature data + sprite generation in parallel via asyncio.to_thread
    creature_task = asyncio.to_thread(
        generator.generate, description_with_types
    )
    sprite_task = asyncio.to_thread(
        generator.generate_sprite,
        evolution_description,
        types,
        creature["base_stats"],
    )

    evolved_creature_obj, sprite_svg = await asyncio.gather(
        creature_task,
        sprite_task,
        return_exceptions=True,
    )

    # Handle creature generation failure
    if isinstance(evolved_creature_obj, Exception):
        raise HTTPException(
            status_code=500,
            detail=f"Evolution generation failed: {str(evolved_creature_obj)}",
        )

    evolved_schema = creature_to_schema(evolved_creature_obj)

    # Build the evolved creature data dict for database update
    evolved_data = {
        "name": evolved_schema.name,
        "description": evolved_schema.description,
        "types": evolved_schema.types,
        "base_stats": evolved_schema.base_stats.model_dump(),
        "moves": [m.model_dump() for m in evolved_schema.moves],
        "sprite_svg": sprite_svg if not isinstance(sprite_svg, Exception) else None,
        "current_hp": evolved_schema.current_hp,
        "max_hp": evolved_schema.max_hp,
        "status": evolved_schema.status,
    }

    # Update the existing creature in the database (replace it with evolution)
    update_creature(creature_id, evolved_data)
    reset_wins(creature_id)

    # Return the updated entry
    updated = get_creature(creature_id)
    return updated
