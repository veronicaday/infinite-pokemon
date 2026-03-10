from enum import Enum


class Type(Enum):
    NORMAL = "Normal"
    FIRE = "Fire"
    WATER = "Water"
    GRASS = "Grass"
    ELECTRIC = "Electric"
    ICE = "Ice"
    FIGHTING = "Fighting"
    POISON = "Poison"
    GROUND = "Ground"
    FLYING = "Flying"
    PSYCHIC = "Psychic"
    BUG = "Bug"
    ROCK = "Rock"
    GHOST = "Ghost"
    DRAGON = "Dragon"
    DARK = "Dark"
    STEEL = "Steel"
    FAIRY = "Fairy"
    # New types
    COSMIC = "Cosmic"
    SOUND = "Sound"
    DIGITAL = "Digital"


# Effectiveness chart: (attacking_type, defending_type) -> multiplier
# Only non-1.0 matchups are listed. Missing pairs default to 1.0.
_EFFECTIVENESS: dict[tuple[Type, Type], float] = {
    # Normal
    (Type.NORMAL, Type.ROCK): 0.5,
    (Type.NORMAL, Type.GHOST): 0.0,
    (Type.NORMAL, Type.STEEL): 0.5,
    # Fire
    (Type.FIRE, Type.FIRE): 0.5,
    (Type.FIRE, Type.WATER): 0.5,
    (Type.FIRE, Type.GRASS): 2.0,
    (Type.FIRE, Type.ICE): 2.0,
    (Type.FIRE, Type.BUG): 2.0,
    (Type.FIRE, Type.ROCK): 0.5,
    (Type.FIRE, Type.DRAGON): 0.5,
    (Type.FIRE, Type.STEEL): 2.0,
    # Water
    (Type.WATER, Type.FIRE): 2.0,
    (Type.WATER, Type.WATER): 0.5,
    (Type.WATER, Type.GRASS): 0.5,
    (Type.WATER, Type.GROUND): 2.0,
    (Type.WATER, Type.ROCK): 2.0,
    (Type.WATER, Type.DRAGON): 0.5,
    # Grass
    (Type.GRASS, Type.FIRE): 0.5,
    (Type.GRASS, Type.WATER): 2.0,
    (Type.GRASS, Type.GRASS): 0.5,
    (Type.GRASS, Type.POISON): 0.5,
    (Type.GRASS, Type.GROUND): 2.0,
    (Type.GRASS, Type.FLYING): 0.5,
    (Type.GRASS, Type.BUG): 0.5,
    (Type.GRASS, Type.ROCK): 2.0,
    (Type.GRASS, Type.DRAGON): 0.5,
    (Type.GRASS, Type.STEEL): 0.5,
    # Electric
    (Type.ELECTRIC, Type.WATER): 2.0,
    (Type.ELECTRIC, Type.ELECTRIC): 0.5,
    (Type.ELECTRIC, Type.GRASS): 0.5,
    (Type.ELECTRIC, Type.GROUND): 0.0,
    (Type.ELECTRIC, Type.FLYING): 2.0,
    (Type.ELECTRIC, Type.DRAGON): 0.5,
    # Ice
    (Type.ICE, Type.FIRE): 0.5,
    (Type.ICE, Type.WATER): 0.5,
    (Type.ICE, Type.GRASS): 2.0,
    (Type.ICE, Type.ICE): 0.5,
    (Type.ICE, Type.GROUND): 2.0,
    (Type.ICE, Type.FLYING): 2.0,
    (Type.ICE, Type.DRAGON): 2.0,
    (Type.ICE, Type.STEEL): 0.5,
    # Fighting
    (Type.FIGHTING, Type.NORMAL): 2.0,
    (Type.FIGHTING, Type.ICE): 2.0,
    (Type.FIGHTING, Type.POISON): 0.5,
    (Type.FIGHTING, Type.FLYING): 0.5,
    (Type.FIGHTING, Type.PSYCHIC): 0.5,
    (Type.FIGHTING, Type.BUG): 0.5,
    (Type.FIGHTING, Type.ROCK): 2.0,
    (Type.FIGHTING, Type.GHOST): 0.0,
    (Type.FIGHTING, Type.DARK): 2.0,
    (Type.FIGHTING, Type.STEEL): 2.0,
    (Type.FIGHTING, Type.FAIRY): 0.5,
    # Poison
    (Type.POISON, Type.GRASS): 2.0,
    (Type.POISON, Type.POISON): 0.5,
    (Type.POISON, Type.GROUND): 0.5,
    (Type.POISON, Type.ROCK): 0.5,
    (Type.POISON, Type.GHOST): 0.5,
    (Type.POISON, Type.STEEL): 0.0,
    (Type.POISON, Type.FAIRY): 2.0,
    # Ground
    (Type.GROUND, Type.FIRE): 2.0,
    (Type.GROUND, Type.ELECTRIC): 2.0,
    (Type.GROUND, Type.GRASS): 0.5,
    (Type.GROUND, Type.POISON): 2.0,
    (Type.GROUND, Type.FLYING): 0.0,
    (Type.GROUND, Type.BUG): 0.5,
    (Type.GROUND, Type.ROCK): 2.0,
    (Type.GROUND, Type.STEEL): 2.0,
    # Flying
    (Type.FLYING, Type.ELECTRIC): 0.5,
    (Type.FLYING, Type.GRASS): 2.0,
    (Type.FLYING, Type.FIGHTING): 2.0,
    (Type.FLYING, Type.BUG): 2.0,
    (Type.FLYING, Type.ROCK): 0.5,
    (Type.FLYING, Type.STEEL): 0.5,
    # Psychic
    (Type.PSYCHIC, Type.FIGHTING): 2.0,
    (Type.PSYCHIC, Type.POISON): 2.0,
    (Type.PSYCHIC, Type.PSYCHIC): 0.5,
    (Type.PSYCHIC, Type.DARK): 0.0,
    (Type.PSYCHIC, Type.STEEL): 0.5,
    # Bug
    (Type.BUG, Type.FIRE): 0.5,
    (Type.BUG, Type.GRASS): 2.0,
    (Type.BUG, Type.FIGHTING): 0.5,
    (Type.BUG, Type.POISON): 0.5,
    (Type.BUG, Type.FLYING): 0.5,
    (Type.BUG, Type.PSYCHIC): 2.0,
    (Type.BUG, Type.GHOST): 0.5,
    (Type.BUG, Type.DARK): 2.0,
    (Type.BUG, Type.STEEL): 0.5,
    (Type.BUG, Type.FAIRY): 0.5,
    # Rock
    (Type.ROCK, Type.FIRE): 2.0,
    (Type.ROCK, Type.ICE): 2.0,
    (Type.ROCK, Type.FIGHTING): 0.5,
    (Type.ROCK, Type.GROUND): 0.5,
    (Type.ROCK, Type.FLYING): 2.0,
    (Type.ROCK, Type.BUG): 2.0,
    (Type.ROCK, Type.STEEL): 0.5,
    # Ghost
    (Type.GHOST, Type.NORMAL): 0.0,
    (Type.GHOST, Type.PSYCHIC): 2.0,
    (Type.GHOST, Type.GHOST): 2.0,
    (Type.GHOST, Type.DARK): 0.5,
    # Dragon
    (Type.DRAGON, Type.DRAGON): 2.0,
    (Type.DRAGON, Type.STEEL): 0.5,
    (Type.DRAGON, Type.FAIRY): 0.0,
    # Dark
    (Type.DARK, Type.FIGHTING): 0.5,
    (Type.DARK, Type.PSYCHIC): 2.0,
    (Type.DARK, Type.GHOST): 2.0,
    (Type.DARK, Type.DARK): 0.5,
    (Type.DARK, Type.FAIRY): 0.5,
    # Steel
    (Type.STEEL, Type.FIRE): 0.5,
    (Type.STEEL, Type.WATER): 0.5,
    (Type.STEEL, Type.ELECTRIC): 0.5,
    (Type.STEEL, Type.ICE): 2.0,
    (Type.STEEL, Type.ROCK): 2.0,
    (Type.STEEL, Type.STEEL): 0.5,
    (Type.STEEL, Type.FAIRY): 2.0,
    # Fairy
    (Type.FAIRY, Type.FIRE): 0.5,
    (Type.FAIRY, Type.FIGHTING): 2.0,
    (Type.FAIRY, Type.POISON): 0.5,
    (Type.FAIRY, Type.DRAGON): 2.0,
    (Type.FAIRY, Type.DARK): 2.0,
    (Type.FAIRY, Type.STEEL): 0.5,
    # --- New Types ---
    # Cosmic: strong vs Psychic, Dragon, Dark. Weak to Steel, Ground.
    (Type.COSMIC, Type.PSYCHIC): 2.0,
    (Type.COSMIC, Type.DRAGON): 2.0,
    (Type.COSMIC, Type.DARK): 2.0,
    (Type.COSMIC, Type.STEEL): 0.5,
    (Type.COSMIC, Type.GROUND): 0.5,
    (Type.COSMIC, Type.COSMIC): 0.5,
    # Sound: strong vs Ice, Ghost, Fairy. Weak to Ground, Steel.
    (Type.SOUND, Type.ICE): 2.0,
    (Type.SOUND, Type.GHOST): 2.0,
    (Type.SOUND, Type.FAIRY): 2.0,
    (Type.SOUND, Type.GROUND): 0.5,
    (Type.SOUND, Type.STEEL): 0.5,
    (Type.SOUND, Type.SOUND): 0.5,
    # Digital: strong vs Electric, Steel, Psychic. Weak to Bug, Ghost. Immune: none
    (Type.DIGITAL, Type.ELECTRIC): 2.0,
    (Type.DIGITAL, Type.STEEL): 2.0,
    (Type.DIGITAL, Type.PSYCHIC): 2.0,
    (Type.DIGITAL, Type.BUG): 0.5,
    (Type.DIGITAL, Type.GHOST): 0.5,
    (Type.DIGITAL, Type.DIGITAL): 0.5,
    # Defensive matchups for new types (what hits them super effectively)
    # Cosmic is weak to: Dark, Bug (darkness and the unknown unsettle it)
    (Type.DARK, Type.COSMIC): 2.0,
    (Type.BUG, Type.COSMIC): 2.0,
    # Cosmic resists: Fire, Ice, Psychic (celestial resilience)
    (Type.FIRE, Type.COSMIC): 0.5,
    (Type.ICE, Type.COSMIC): 0.5,
    (Type.PSYCHIC, Type.COSMIC): 0.5,
    # Sound is weak to: Electric, Psychic (interference and mental dampening)
    (Type.ELECTRIC, Type.SOUND): 2.0,
    (Type.PSYCHIC, Type.SOUND): 2.0,
    # Sound resists: Fighting, Normal (sonic barriers deflect physical force)
    (Type.FIGHTING, Type.SOUND): 0.5,
    (Type.NORMAL, Type.SOUND): 0.5,
    # Digital is weak to: Water, Electric (short circuits)
    (Type.WATER, Type.DIGITAL): 2.0,
    (Type.ELECTRIC, Type.DIGITAL): 2.0,
    # Digital resists: Normal, Fighting, Poison (intangible, can't be conventionally harmed)
    (Type.NORMAL, Type.DIGITAL): 0.5,
    (Type.FIGHTING, Type.DIGITAL): 0.5,
    (Type.POISON, Type.DIGITAL): 0.5,
    # Digital immune to Ground (no physical form)
    (Type.GROUND, Type.DIGITAL): 0.0,
}


def get_effectiveness(attack_type: Type, defender_types: list[Type]) -> float:
    """Calculate combined type effectiveness multiplier."""
    multiplier = 1.0
    for def_type in defender_types:
        multiplier *= _EFFECTIVENESS.get((attack_type, def_type), 1.0)
    return multiplier


# Color mapping for UI
TYPE_COLORS: dict[Type, tuple[int, int, int]] = {
    Type.NORMAL: (168, 168, 120),
    Type.FIRE: (240, 128, 48),
    Type.WATER: (104, 144, 240),
    Type.GRASS: (120, 200, 80),
    Type.ELECTRIC: (248, 208, 48),
    Type.ICE: (152, 216, 216),
    Type.FIGHTING: (192, 48, 40),
    Type.POISON: (160, 64, 160),
    Type.GROUND: (224, 192, 104),
    Type.FLYING: (168, 144, 240),
    Type.PSYCHIC: (248, 88, 136),
    Type.BUG: (168, 184, 32),
    Type.ROCK: (184, 160, 56),
    Type.GHOST: (112, 88, 152),
    Type.DRAGON: (112, 56, 248),
    Type.DARK: (112, 88, 72),
    Type.STEEL: (184, 184, 208),
    Type.FAIRY: (238, 153, 172),
    Type.COSMIC: (75, 0, 130),
    Type.SOUND: (255, 165, 0),
    Type.DIGITAL: (0, 255, 128),
}
