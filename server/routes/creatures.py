import asyncio

from fastapi import APIRouter, HTTPException

from core.stats import Stats
from generation.generator import CreatureGenerator
from server.database import save_creature
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

        # Build stat dict for sprite prompt
        sprite_stats = (
            stat_prefs.as_dict()
            if stat_prefs
            else {"hp": 100, "attack": 100, "defense": 100,
                  "sp_attack": 100, "sp_defense": 100, "speed": 100}
        )

        # Run creature data (Sonnet, fast) + sprite (Opus, detailed) in PARALLEL
        creature_task = asyncio.to_thread(
            generator.generate, description_with_types, stat_prefs
        )
        sprite_task = asyncio.to_thread(
            generator.generate_sprite,
            request.description,
            request.types,
            sprite_stats,
        )

        # Wait for both concurrently
        creature, sprite_svg = await asyncio.gather(
            creature_task,
            sprite_task,
            return_exceptions=True,
        )

        # Handle creature generation failure
        if isinstance(creature, Exception):
            raise creature

        schema = creature_to_schema(creature)

        # Attach sprite if it succeeded
        if isinstance(sprite_svg, Exception):
            schema.sprite_svg = None
        else:
            schema.sprite_svg = sprite_svg

        # Auto-save to pokedex
        try:
            pokedex_id = save_creature(schema)
            schema.pokedex_id = pokedex_id
        except Exception:
            pass  # Don't fail generation if save fails

        return schema

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")
