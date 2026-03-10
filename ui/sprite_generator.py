"""Procedural creature sprite generator.

Generates unique pixel-art-style creatures using pygame drawing primitives.
The creature's appearance is determined by its name (as a seed), types, and stats.
"""

import hashlib
import math
import random

import pygame

from core.types import Type, TYPE_COLORS


def _seed_from_name(name: str) -> int:
    """Generate a deterministic seed from a creature name."""
    return int(hashlib.md5(name.encode()).hexdigest(), 16)


def generate_sprite(creature, size: int = 128) -> pygame.Surface:
    """Generate a unique sprite for a creature.

    The sprite is symmetrical (mirrored left-right) and uses the creature's
    type colors. Stats influence the body shape:
      - High HP -> larger body
      - High Attack -> bigger arms/claws
      - High Defense -> thicker outline / shell
      - High Sp.Attack -> glowing aura / eye details
      - High Speed -> streamlined / angular shape
    """
    rng = random.Random(_seed_from_name(creature.name))

    surface = pygame.Surface((size, size), pygame.SRCALPHA)

    # Colors from types
    primary_color = TYPE_COLORS.get(creature.types[0], (128, 128, 128))
    secondary_color = TYPE_COLORS.get(creature.types[1], primary_color) if len(creature.types) > 1 else _lighten(primary_color, 40)
    dark_color = _darken(primary_color, 60)
    highlight = _lighten(primary_color, 80)

    stats = creature.base_stats
    cx, cy = size // 2, size // 2

    # --- Body shape based on stats ---
    # HP determines body size
    body_scale = 0.25 + (stats.hp / 100) * 0.25  # 0.25 to 0.50 of sprite size
    body_w = int(size * body_scale)
    body_h = int(size * body_scale * rng.uniform(0.8, 1.3))

    # Speed makes it taller and thinner, defense makes it wider
    if stats.speed > 60:
        body_h = int(body_h * 1.2)
        body_w = int(body_w * 0.85)
    if stats.defense > 60:
        body_w = int(body_w * 1.2)
        body_h = int(body_h * 0.9)

    body_y = cy - body_h // 4  # Slightly above center

    # Choose body shape variant
    body_type = rng.choice(["round", "diamond", "blob", "angular", "tall"])

    # --- Draw body ---
    if body_type == "round":
        _draw_ellipse_mirrored(surface, primary_color, cx, body_y, body_w, body_h)
        _draw_ellipse_mirrored(surface, secondary_color, cx, body_y + body_h // 6, body_w - 8, body_h // 2)
    elif body_type == "diamond":
        points = [
            (cx, body_y - body_h // 2),
            (cx + body_w // 2, body_y),
            (cx, body_y + body_h // 2),
            (cx - body_w // 2, body_y),
        ]
        pygame.draw.polygon(surface, primary_color, points)
        # Inner diamond
        inner = [(p[0] * 0.8 + cx * 0.2, p[1] * 0.8 + body_y * 0.2) for p in points]
        pygame.draw.polygon(surface, secondary_color, inner)
    elif body_type == "blob":
        _draw_blob(surface, primary_color, cx, body_y, body_w, body_h, rng)
        _draw_blob(surface, secondary_color, cx, body_y + 4, body_w - 10, body_h - 10, rng, offset=3)
    elif body_type == "angular":
        hw, hh = body_w // 2, body_h // 2
        points = [
            (cx - hw, body_y - hh // 2),
            (cx - hw // 3, body_y - hh),
            (cx + hw // 3, body_y - hh),
            (cx + hw, body_y - hh // 2),
            (cx + hw, body_y + hh),
            (cx - hw, body_y + hh),
        ]
        pygame.draw.polygon(surface, primary_color, points)
        pygame.draw.polygon(surface, dark_color, points, width=2)
    elif body_type == "tall":
        rect = pygame.Rect(cx - body_w // 2, body_y - body_h // 2, body_w, body_h)
        pygame.draw.rect(surface, primary_color, rect, border_radius=body_w // 3)
        inner = rect.inflate(-8, -8)
        pygame.draw.rect(surface, secondary_color, inner, border_radius=body_w // 3)

    # --- Eyes ---
    eye_style = rng.choice(["round", "angry", "cute", "glow", "slit"])
    eye_y = body_y - body_h // 6
    eye_spacing = body_w // 4
    eye_size = max(3, int(size * 0.04 + (stats.sp_attack / 100) * size * 0.03))

    for ex in [cx - eye_spacing, cx + eye_spacing]:
        if eye_style == "round":
            pygame.draw.circle(surface, (255, 255, 255), (ex, eye_y), eye_size)
            pygame.draw.circle(surface, (20, 20, 20), (ex, eye_y), eye_size // 2)
        elif eye_style == "angry":
            pygame.draw.circle(surface, (255, 60, 60), (ex, eye_y), eye_size)
            pygame.draw.circle(surface, (20, 20, 20), (ex, eye_y), eye_size // 2)
            # Angry brow
            brow_dir = -1 if ex < cx else 1
            pygame.draw.line(surface, dark_color,
                             (ex - eye_size, eye_y - eye_size),
                             (ex + eye_size * brow_dir, eye_y - eye_size - 3), 2)
        elif eye_style == "cute":
            pygame.draw.circle(surface, (20, 20, 20), (ex, eye_y), eye_size)
            # Shine
            pygame.draw.circle(surface, (255, 255, 255), (ex - eye_size // 3, eye_y - eye_size // 3), eye_size // 3)
        elif eye_style == "glow":
            # Glowing eyes for high sp_attack
            glow_color = highlight if stats.sp_attack > 50 else (200, 200, 255)
            for r in range(eye_size + 4, eye_size, -1):
                alpha = 60 - (r - eye_size) * 15
                glow_surf = pygame.Surface((r * 2, r * 2), pygame.SRCALPHA)
                pygame.draw.circle(glow_surf, (*glow_color, max(0, alpha)), (r, r), r)
                surface.blit(glow_surf, (ex - r, eye_y - r))
            pygame.draw.circle(surface, glow_color, (ex, eye_y), eye_size)
            pygame.draw.circle(surface, (255, 255, 255), (ex, eye_y), eye_size // 2)
        elif eye_style == "slit":
            pygame.draw.circle(surface, (200, 200, 50), (ex, eye_y), eye_size)
            pygame.draw.ellipse(surface, (20, 20, 20),
                                (ex - eye_size // 4, eye_y - eye_size, eye_size // 2, eye_size * 2))

    # --- Appendages based on stats ---
    # High Attack -> arms/claws
    if stats.attack > 40:
        arm_len = int(body_w * 0.4 + (stats.attack / 100) * body_w * 0.4)
        arm_y = body_y
        arm_width = max(2, int(3 + stats.attack / 30))
        arm_style = rng.choice(["claw", "arm", "tentacle", "wing_arm"])

        for side in [-1, 1]:
            ax = cx + side * (body_w // 2)
            if arm_style == "claw":
                end_x = ax + side * arm_len
                pygame.draw.line(surface, dark_color, (ax, arm_y), (end_x, arm_y - 8), arm_width)
                # Claw tips
                for angle in [-30, 0, 30]:
                    rad = math.radians(angle)
                    tip_x = end_x + side * int(8 * math.cos(rad))
                    tip_y = arm_y - 8 + int(8 * math.sin(rad))
                    pygame.draw.line(surface, dark_color, (end_x, arm_y - 8), (tip_x, tip_y), 2)
            elif arm_style == "arm":
                end_x = ax + side * arm_len
                pygame.draw.line(surface, dark_color, (ax, arm_y), (end_x, arm_y + 5), arm_width)
                pygame.draw.circle(surface, secondary_color, (end_x, arm_y + 5), arm_width + 1)
            elif arm_style == "tentacle":
                points = [(ax, arm_y)]
                for i in range(1, 5):
                    t = i / 4
                    px = ax + side * int(arm_len * t)
                    py = arm_y + int(math.sin(t * math.pi * 2) * 8)
                    points.append((px, py))
                if len(points) > 1:
                    pygame.draw.lines(surface, dark_color, False, points, arm_width)
            elif arm_style == "wing_arm":
                points = [
                    (ax, arm_y - body_h // 4),
                    (ax + side * arm_len, arm_y - body_h // 2),
                    (ax + side * arm_len * 0.7, arm_y),
                    (ax, arm_y + body_h // 6),
                ]
                pygame.draw.polygon(surface, secondary_color, points)
                pygame.draw.polygon(surface, dark_color, points, width=2)

    # --- Legs/feet ---
    leg_style = rng.choice(["feet", "stubs", "tail", "hover", "claws"])
    foot_y = body_y + body_h // 2
    leg_spread = body_w // 3

    if leg_style == "feet":
        for side in [-1, 1]:
            lx = cx + side * leg_spread
            pygame.draw.rect(surface, dark_color,
                             (lx - 5, foot_y, 10, 8), border_radius=2)
    elif leg_style == "stubs":
        for side in [-1, 1]:
            lx = cx + side * leg_spread
            pygame.draw.ellipse(surface, dark_color,
                                (lx - 6, foot_y - 2, 12, 10))
    elif leg_style == "tail":
        # Tail curling down
        points = [(cx, foot_y)]
        for i in range(1, 6):
            t = i / 5
            px = cx + int(body_w * 0.4 * t)
            py = foot_y + int(15 * t)
            points.append((px, py))
        pygame.draw.lines(surface, dark_color, False, points, 3)
    elif leg_style == "hover":
        # Floating effect - shadow underneath
        shadow_surf = pygame.Surface((body_w, 8), pygame.SRCALPHA)
        pygame.draw.ellipse(shadow_surf, (0, 0, 0, 40), (0, 0, body_w, 8))
        surface.blit(shadow_surf, (cx - body_w // 2, foot_y + 8))
    elif leg_style == "claws":
        for side in [-1, 1]:
            lx = cx + side * leg_spread
            for dx in [-3, 0, 3]:
                pygame.draw.line(surface, dark_color,
                                 (lx + dx, foot_y), (lx + dx + side * 2, foot_y + 8), 2)

    # --- Extra features based on type ---
    _draw_type_features(surface, creature.types[0], cx, body_y, body_w, body_h, rng, primary_color)

    # --- Defense > 60: add shell/armor outline ---
    if stats.defense > 60:
        armor_alpha = min(180, 80 + stats.defense)
        armor_surf = pygame.Surface((size, size), pygame.SRCALPHA)
        if body_type == "round":
            pygame.draw.ellipse(armor_surf, (*dark_color, armor_alpha),
                                (cx - body_w // 2 - 2, body_y - body_h // 2 - 2,
                                 body_w + 4, body_h + 4), width=3)
        else:
            rect = pygame.Rect(cx - body_w // 2 - 2, body_y - body_h // 2 - 2,
                               body_w + 4, body_h + 4)
            pygame.draw.rect(armor_surf, (*dark_color, armor_alpha), rect, width=3, border_radius=6)
        surface.blit(armor_surf, (0, 0))

    # --- Sp. Attack > 60: aura glow ---
    if stats.sp_attack > 60:
        aura_surf = pygame.Surface((size, size), pygame.SRCALPHA)
        aura_size = int(body_w * 0.8 + (stats.sp_attack / 100) * body_w * 0.3)
        for i in range(3):
            r = aura_size + i * 6
            alpha = 25 - i * 7
            pygame.draw.ellipse(aura_surf, (*highlight, max(0, alpha)),
                                (cx - r, body_y - r // 2 - 10, r * 2, r + 10))
        surface.blit(aura_surf, (0, 0))

    # --- Head features ---
    head_feature = rng.choice(["horn", "ears", "crown", "antenna", "crest", "none"])
    head_y = body_y - body_h // 2

    if head_feature == "horn":
        horn_h = int(10 + stats.attack / 8)
        pygame.draw.polygon(surface, dark_color, [
            (cx - 4, head_y),
            (cx, head_y - horn_h),
            (cx + 4, head_y),
        ])
    elif head_feature == "ears":
        for side in [-1, 1]:
            ex = cx + side * body_w // 4
            points = [(ex, head_y), (ex + side * 8, head_y - 14), (ex + side * 2, head_y)]
            pygame.draw.polygon(surface, primary_color, points)
            pygame.draw.polygon(surface, secondary_color,
                                [(ex, head_y + 2), (ex + side * 5, head_y - 10), (ex + side * 1, head_y + 2)])
    elif head_feature == "crown":
        for i in range(3):
            px = cx - 10 + i * 10
            pygame.draw.polygon(surface, (255, 215, 0), [
                (px - 3, head_y),
                (px, head_y - 10),
                (px + 3, head_y),
            ])
    elif head_feature == "antenna":
        for side in [-1, 1]:
            ax = cx + side * body_w // 5
            pygame.draw.line(surface, dark_color, (ax, head_y), (ax + side * 6, head_y - 16), 2)
            pygame.draw.circle(surface, highlight, (ax + side * 6, head_y - 16), 3)
    elif head_feature == "crest":
        points = [
            (cx - body_w // 4, head_y),
            (cx, head_y - 18),
            (cx + body_w // 4, head_y),
        ]
        pygame.draw.polygon(surface, secondary_color, points)

    # --- Mouth ---
    mouth_style = rng.choice(["smile", "fangs", "beak", "none", "open"])
    mouth_y = body_y + body_h // 8

    if mouth_style == "smile":
        pygame.draw.arc(surface, dark_color,
                        (cx - 6, mouth_y - 3, 12, 8), math.pi, 2 * math.pi, 2)
    elif mouth_style == "fangs":
        pygame.draw.line(surface, dark_color, (cx - 8, mouth_y), (cx + 8, mouth_y), 2)
        for dx in [-5, 5]:
            pygame.draw.line(surface, (255, 255, 255), (cx + dx, mouth_y), (cx + dx, mouth_y + 4), 2)
    elif mouth_style == "beak":
        pygame.draw.polygon(surface, (220, 180, 50), [
            (cx - 4, mouth_y),
            (cx, mouth_y + 8),
            (cx + 4, mouth_y),
        ])
    elif mouth_style == "open":
        pygame.draw.ellipse(surface, dark_color, (cx - 5, mouth_y - 2, 10, 6))

    return surface


def _draw_type_features(surface: pygame.Surface, ptype: Type, cx: int, cy: int,
                        bw: int, bh: int, rng: random.Random, color: tuple) -> None:
    """Add type-specific visual flair."""
    size = surface.get_width()

    if ptype == Type.FIRE:
        # Flame wisps
        for _ in range(3):
            fx = cx + rng.randint(-bw // 3, bw // 3)
            fy = cy - bh // 2 - rng.randint(5, 20)
            _draw_flame(surface, fx, fy, rng.randint(4, 8))
    elif ptype == Type.WATER:
        # Water droplets
        for _ in range(3):
            dx = cx + rng.randint(-bw // 2, bw // 2)
            dy = cy + rng.randint(-bh // 3, bh // 2)
            pygame.draw.circle(surface, (100, 180, 255, 120), (dx, dy), 3)
    elif ptype == Type.ELECTRIC:
        # Lightning bolts
        for _ in range(2):
            sx = cx + rng.randint(-bw // 2, bw // 2)
            sy = cy + rng.randint(-bh // 2, bh // 2)
            _draw_lightning(surface, sx, sy, rng)
    elif ptype == Type.ICE:
        # Ice crystals
        for _ in range(4):
            ix = cx + rng.randint(-bw // 2, bw // 2)
            iy = cy + rng.randint(-bh // 2, bh // 2)
            _draw_snowflake(surface, ix, iy, rng.randint(3, 6))
    elif ptype == Type.GHOST:
        # Wispy trail
        for _ in range(3):
            gx = cx + rng.randint(-bw // 2, bw // 2)
            gy = cy + bh // 2 + rng.randint(0, 10)
            wisp_surf = pygame.Surface((12, 12), pygame.SRCALPHA)
            pygame.draw.circle(wisp_surf, (*color, 60), (6, 6), 6)
            surface.blit(wisp_surf, (gx - 6, gy - 6))
    elif ptype == Type.DRAGON:
        # Small wing shapes on sides
        for side in [-1, 1]:
            wx = cx + side * (bw // 2 + 5)
            points = [
                (wx, cy - 5),
                (wx + side * 18, cy - 15),
                (wx + side * 12, cy),
                (wx + side * 18, cy + 10),
                (wx, cy + 5),
            ]
            pygame.draw.polygon(surface, _darken(color, 30), points)
    elif ptype == Type.COSMIC:
        # Orbiting dots
        for i in range(4):
            angle = (i / 4) * math.pi * 2
            ox = cx + int(bw * 0.6 * math.cos(angle))
            oy = cy + int(bh * 0.4 * math.sin(angle))
            star_surf = pygame.Surface((8, 8), pygame.SRCALPHA)
            pygame.draw.circle(star_surf, (200, 180, 255, 150), (4, 4), 3)
            pygame.draw.circle(star_surf, (255, 255, 255, 200), (4, 4), 1)
            surface.blit(star_surf, (ox - 4, oy - 4))
    elif ptype == Type.SOUND:
        # Sound waves
        for i in range(3):
            r = bw // 2 + 8 + i * 8
            wave_surf = pygame.Surface((size, size), pygame.SRCALPHA)
            alpha = 80 - i * 25
            pygame.draw.arc(wave_surf, (*color, max(10, alpha)),
                            (cx - r, cy - r // 2, r * 2, r), -0.5, 0.5, 2)
            surface.blit(wave_surf, (0, 0))
    elif ptype == Type.DIGITAL:
        # Pixel glitch effect
        for _ in range(6):
            gx = cx + rng.randint(-bw // 2, bw // 2)
            gy = cy + rng.randint(-bh // 2, bh // 2)
            gw = rng.randint(2, 6)
            gh = rng.randint(1, 3)
            glitch_surf = pygame.Surface((gw, gh), pygame.SRCALPHA)
            glitch_surf.fill((*color, rng.randint(80, 160)))
            surface.blit(glitch_surf, (gx, gy))
    elif ptype == Type.FAIRY:
        # Sparkles
        for _ in range(4):
            sx = cx + rng.randint(-bw // 2 - 5, bw // 2 + 5)
            sy = cy + rng.randint(-bh // 2 - 5, bh // 2 + 5)
            _draw_sparkle(surface, sx, sy, rng.randint(3, 5))
    elif ptype == Type.POISON:
        # Bubbles
        for _ in range(3):
            bx = cx + rng.randint(-bw // 3, bw // 3)
            by = cy + rng.randint(-bh // 3, bh // 3)
            br = rng.randint(3, 5)
            bubble_surf = pygame.Surface((br * 2, br * 2), pygame.SRCALPHA)
            pygame.draw.circle(bubble_surf, (*color, 80), (br, br), br)
            pygame.draw.circle(bubble_surf, (255, 255, 255, 100), (br - 1, br - 1), br // 2)
            surface.blit(bubble_surf, (bx - br, by - br))


def _draw_flame(surface: pygame.Surface, x: int, y: int, size: int) -> None:
    """Draw a small flame wisp."""
    points = [
        (x, y - size),
        (x + size // 2, y),
        (x - size // 2, y),
    ]
    flame_surf = pygame.Surface((size * 2, size * 2), pygame.SRCALPHA)
    adjusted = [(p[0] - x + size, p[1] - y + size) for p in points]
    pygame.draw.polygon(flame_surf, (255, 160, 40, 180), adjusted)
    surface.blit(flame_surf, (x - size, y - size))


def _draw_lightning(surface: pygame.Surface, x: int, y: int, rng: random.Random) -> None:
    """Draw a small lightning bolt."""
    points = [(x, y)]
    for _ in range(3):
        x += rng.randint(-4, 4)
        y += rng.randint(3, 6)
        points.append((x, y))
    if len(points) > 1:
        pygame.draw.lines(surface, (255, 255, 100), False, points, 2)


def _draw_snowflake(surface: pygame.Surface, x: int, y: int, size: int) -> None:
    """Draw a tiny snowflake."""
    for angle in range(0, 360, 60):
        rad = math.radians(angle)
        ex = x + int(size * math.cos(rad))
        ey = y + int(size * math.sin(rad))
        pygame.draw.line(surface, (200, 230, 255), (x, y), (ex, ey), 1)


def _draw_sparkle(surface: pygame.Surface, x: int, y: int, size: int) -> None:
    """Draw a small sparkle/star."""
    for angle in [0, 90]:
        rad = math.radians(angle)
        dx = int(size * math.cos(rad))
        dy = int(size * math.sin(rad))
        pygame.draw.line(surface, (255, 255, 220), (x - dx, y - dy), (x + dx, y + dy), 1)
    pygame.draw.circle(surface, (255, 255, 255), (x, y), 1)


def _draw_blob(surface: pygame.Surface, color: tuple, cx: int, cy: int,
               w: int, h: int, rng: random.Random, offset: int = 0) -> None:
    """Draw an organic blob shape."""
    points = []
    num_points = 12
    for i in range(num_points):
        angle = (i / num_points) * math.pi * 2
        rx = w // 2 + rng.randint(-4, 4) + offset
        ry = h // 2 + rng.randint(-4, 4) + offset
        px = cx + int(rx * math.cos(angle))
        py = cy + int(ry * math.sin(angle))
        points.append((px, py))
    if len(points) > 2:
        pygame.draw.polygon(surface, color, points)


def _lighten(color: tuple, amount: int) -> tuple:
    return tuple(min(255, c + amount) for c in color)


def _darken(color: tuple, amount: int) -> tuple:
    return tuple(max(0, c - amount) for c in color)
