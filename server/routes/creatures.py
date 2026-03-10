import asyncio

from fastapi import APIRouter, HTTPException

from core.stats import Stats
from generation.generator import CreatureGenerator
from server.models import CreatureCreateRequest, CreatureSchema, creature_to_schema

router = APIRouter()

_generator: CreatureGenerator | None = None


def _get_generator() -> CreatureGenerator:
    global _generator
    if _generator is None:
        _generator = CreatureGenerator()
    return _generator


@router.post("/generate", response_model=CreatureSchema)
async def generate_creature(request: CreatureCreateRequest):
    """Generate a new creature from a description and selected types."""
    try:
        generator = _get_generator()

        stat_prefs = None
        if request.stat_preferences:
            stat_prefs = Stats(
                hp=request.stat_preferences.hp,
                attack=request.stat_preferences.attack,
                defense=request.stat_preferences.defense,
                sp_attack=request.stat_preferences.sp_attack,
                sp_defense=request.stat_preferences.sp_defense,
                speed=request.stat_preferences.speed,
            )

        # Include selected types in the description for the prompt
        type_str = "/".join(request.types)
        description_with_types = (
            f"{request.description}\n\n"
            f"IMPORTANT: This creature MUST be {type_str} type. "
            f"Set \"types\" to {request.types} in your response."
        )

        # Run creature data + sprite generation in parallel
        creature_task = asyncio.to_thread(
            generator.generate, description_with_types, stat_prefs
        )

        # We need creature data first for the sprite prompt, but we can
        # start with user-provided info for the sprite call
        creature = await creature_task

        # Now generate sprite with the actual creature data
        schema = creature_to_schema(creature)
        try:
            sprite_svg = await asyncio.to_thread(
                generator.generate_sprite,
                creature.name,
                creature.description,
                [t.value for t in creature.types],
                schema.base_stats.model_dump(),
            )
            schema.sprite_svg = sprite_svg
        except Exception:
            # Sprite generation failed — frontend will fall back to procedural
            schema.sprite_svg = None

        return schema

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")
