from fastapi import APIRouter, HTTPException

from core.battle import BattleEngine
from server.models import (
    BattleCreateRequest,
    BattleEventSchema,
    CreatureSchema,
    TurnRequest,
    battle_event_to_schema,
    creature_to_schema,
    schema_to_creature,
)
from server.state import create_session, get_session

router = APIRouter()


@router.post("/create")
async def create_battle(request: BattleCreateRequest):
    """Create a new battle session from two creatures."""
    creature1 = schema_to_creature(request.creature1)
    creature2 = schema_to_creature(request.creature2)

    engine = BattleEngine(creature1, creature2)
    session_id = create_session(engine)

    # Preserve sprite SVGs from the request
    session = get_session(session_id)
    if session:
        session.sprite_svgs = {
            1: request.creature1.sprite_svg,
            2: request.creature2.sprite_svg,
        }

    c1_schema = creature_to_schema(engine.creatures[1])
    c2_schema = creature_to_schema(engine.creatures[2])
    c1_schema.sprite_svg = request.creature1.sprite_svg
    c2_schema.sprite_svg = request.creature2.sprite_svg

    return {
        "session_id": session_id,
        "creature1": c1_schema,
        "creature2": c2_schema,
    }


@router.post("/{session_id}/turn")
async def execute_turn(session_id: str, request: TurnRequest):
    """Execute a turn in the battle."""
    session = get_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Battle session not found")

    engine = session.engine

    if engine.winner is not None:
        raise HTTPException(status_code=400, detail="Battle is already over")

    # Validate move indices
    c1_moves = engine.creatures[1].moves
    c2_moves = engine.creatures[2].moves

    if not (0 <= request.move1_index < len(c1_moves)):
        raise HTTPException(status_code=400, detail="Invalid move index for creature 1")
    if not (0 <= request.move2_index < len(c2_moves)):
        raise HTTPException(status_code=400, detail="Invalid move index for creature 2")

    move1 = c1_moves[request.move1_index]
    move2 = c2_moves[request.move2_index]

    events = engine.execute_turn(move1, move2)

    c1_schema = creature_to_schema(engine.creatures[1])
    c2_schema = creature_to_schema(engine.creatures[2])
    c1_schema.sprite_svg = session.sprite_svgs.get(1)
    c2_schema.sprite_svg = session.sprite_svgs.get(2)

    return {
        "events": [battle_event_to_schema(e) for e in events],
        "creature1": c1_schema,
        "creature2": c2_schema,
        "winner": engine.winner,
    }


@router.get("/{session_id}")
async def get_battle_state(session_id: str):
    """Get current battle state."""
    session = get_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Battle session not found")

    engine = session.engine

    c1_schema = creature_to_schema(engine.creatures[1])
    c2_schema = creature_to_schema(engine.creatures[2])
    c1_schema.sprite_svg = session.sprite_svgs.get(1)
    c2_schema.sprite_svg = session.sprite_svgs.get(2)

    return {
        "creature1": c1_schema,
        "creature2": c2_schema,
        "winner": engine.winner,
        "turn_number": engine.turn_number,
    }
