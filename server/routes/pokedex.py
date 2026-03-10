from fastapi import APIRouter, HTTPException

from server.database import save_creature, list_creatures, get_creature, delete_creature
from server.models import CreatureSchema, PokedexEntry

router = APIRouter()


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
