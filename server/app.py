from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import STAT_BUDGET, MIN_STAT, MAX_STAT, STAT_NAMES
from core.types import Type, TYPE_COLORS, _EFFECTIVENESS
from server.routes import creatures, battle

app = FastAPI(title="Infinite Pokemon API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(creatures.router, prefix="/api/creatures", tags=["creatures"])
app.include_router(battle.router, prefix="/api/battle", tags=["battle"])


def _rgb_to_hex(rgb: tuple[int, int, int]) -> str:
    return "#{:02x}{:02x}{:02x}".format(*rgb)


@app.get("/api/config")
async def get_config():
    """Return game configuration for the frontend."""
    types_with_colors = {
        t.value: _rgb_to_hex(TYPE_COLORS[t])
        for t in Type
    }

    return {
        "stat_budget": STAT_BUDGET,
        "min_stat": MIN_STAT,
        "max_stat": MAX_STAT,
        "stat_names": STAT_NAMES,
        "types": types_with_colors,
    }


@app.get("/api/types/effectiveness")
async def get_type_effectiveness():
    """Return the full type effectiveness chart."""
    chart: dict[str, dict[str, float]] = {}

    for attack_type in Type:
        matchups: dict[str, float] = {}
        for defend_type in Type:
            multiplier = _EFFECTIVENESS.get((attack_type, defend_type), 1.0)
            if multiplier != 1.0:
                matchups[defend_type.value] = multiplier
        chart[attack_type.value] = matchups

    return chart
