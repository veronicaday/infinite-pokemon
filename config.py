import os
from dotenv import load_dotenv

load_dotenv()

# Screen
SCREEN_WIDTH = 1024
SCREEN_HEIGHT = 768
FPS = 60
GAME_TITLE = "Infinite Pokemon"

# Stats
STAT_BUDGET = 600
MIN_STAT = 20
MAX_STAT = 200
STAT_NAMES = ["hp", "attack", "defense", "sp_attack", "sp_defense", "speed"]

# Moves
MOVE_POWER_BUDGET = 160
MAX_MOVES = 4
MIN_POWER = 0
MAX_POWER = 120
MIN_ACCURACY = 50
MAX_ACCURACY = 100

# Battle
STAB_MULTIPLIER = 1.5
LEVEL = 50  # Fixed level for simplicity

# Effect budget values (for move power budget calculation)
EFFECT_BUDGET_VALUES = {
    "burn": 30,
    "paralyze": 35,
    "freeze": 40,
    "poison": 20,
    "sleep": 35,
    "confuse": 25,
    "raise_attack": 15,
    "raise_defense": 15,
    "raise_sp_attack": 15,
    "raise_sp_defense": 15,
    "raise_speed": 15,
    "lower_attack": 15,
    "lower_defense": 15,
    "lower_sp_attack": 15,
    "lower_sp_defense": 15,
    "lower_speed": 15,
}

# API
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
