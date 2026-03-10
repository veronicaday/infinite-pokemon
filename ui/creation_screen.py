import pygame

from ui.scene_manager import Scene, SceneManager
from ui.components import Button, TextInput, Slider
from ui.colors import (
    BG_COLOR, PANEL_COLOR, PANEL_BORDER, TEXT_COLOR, TEXT_DIM,
    ACCENT, WHITE, DARK_GRAY,
)
from core.types import Type, TYPE_COLORS
from core.stats import Stats
from core.creature import Creature
from core.moves import Move
from ui.sprite_generator import generate_sprite
from config import SCREEN_WIDTH, SCREEN_HEIGHT, STAT_BUDGET, MIN_STAT, MAX_STAT, STAT_NAMES


# Display-friendly stat names
STAT_LABELS = {
    "hp": "HP",
    "attack": "ATK",
    "defense": "DEF",
    "sp_attack": "SpATK",
    "sp_defense": "SpDEF",
    "speed": "SPD",
}


class CreationScreen(Scene):
    def __init__(self, manager: SceneManager, player_number: int, existing_creature: Creature | None = None):
        super().__init__(manager)
        self.player_number = player_number
        self.creature: Creature | None = existing_creature

        # Fonts
        self.title_font = pygame.font.Font(None, 42)
        self.label_font = pygame.font.Font(None, 26)
        self.small_font = pygame.font.Font(None, 22)
        self.preview_font = pygame.font.Font(None, 28)

        # Description input
        self.description_input = TextInput(
            60, 120, SCREEN_WIDTH - 120, 40,
            placeholder="Describe your creature... (e.g., 'A crystal dragon that controls sound waves')",
            max_length=300,
        )

        # Stat sliders
        self.sliders: dict[str, Slider] = {}
        default_val = STAT_BUDGET // 6
        slider_x = 100
        slider_w = 280
        start_y = 230
        for i, stat_name in enumerate(STAT_NAMES):
            self.sliders[stat_name] = Slider(
                slider_x, start_y + i * 55, slider_w, 24,
                MIN_STAT, MAX_STAT, default_val,
                label=STAT_LABELS[stat_name],
            )

        self.active_slider: str | None = None
        self.budget_remaining = STAT_BUDGET - (default_val * 6)

        # Buttons
        self.generate_btn = Button(
            60, SCREEN_HEIGHT - 100, 200, 48,
            "Generate with AI", font_size=24,
        )
        self.ready_btn = Button(
            SCREEN_WIDTH - 260, SCREEN_HEIGHT - 100, 200, 48,
            "Ready!", font_size=24,
        )
        self.ready_btn.enabled = False

        # Generation state
        self.generating = False
        self.gen_error: str | None = None
        self.gen_thread = None

        # Preview
        self._preview_creature: Creature | None = existing_creature
        self._preview_sprite: pygame.Surface | None = None
        if existing_creature:
            self._preview_sprite = generate_sprite(existing_creature, size=120)

    def handle_event(self, event: pygame.event.Event) -> None:
        self.description_input.handle_event(event)

        # Handle sliders with budget enforcement
        for stat_name, slider in self.sliders.items():
            old_val = slider.value
            if slider.handle_event(event):
                self._enforce_budget(stat_name, old_val)

        if event.type == pygame.MOUSEBUTTONUP:
            self.active_slider = None

        if self.generate_btn.handle_event(event):
            self._start_generation()

        if self.ready_btn.handle_event(event) and self._preview_creature:
            self._on_ready()

        # Back button (Escape)
        if event.type == pygame.KEYDOWN and event.key == pygame.K_ESCAPE:
            self.manager.pop()

    def _enforce_budget(self, changed_stat: str, old_value: int) -> None:
        """When one slider changes, redistribute others to maintain budget."""
        self.active_slider = changed_stat
        total = sum(s.value for s in self.sliders.values())
        diff = total - STAT_BUDGET

        if diff == 0:
            return

        # Get other sliders we can adjust
        other_stats = [n for n in STAT_NAMES if n != changed_stat]

        if diff > 0:
            # Over budget - reduce others
            while diff > 0 and other_stats:
                reducible = [n for n in other_stats if self.sliders[n].value > MIN_STAT]
                if not reducible:
                    # Can't reduce others, revert this slider
                    self.sliders[changed_stat].value = old_value
                    break
                per_stat = max(1, diff // len(reducible))
                for n in reducible:
                    if diff <= 0:
                        break
                    can_reduce = self.sliders[n].value - MIN_STAT
                    reduce = min(per_stat, can_reduce, diff)
                    self.sliders[n].value -= reduce
                    diff -= reduce
        else:
            # Under budget - increase others
            surplus = -diff
            while surplus > 0 and other_stats:
                growable = [n for n in other_stats if self.sliders[n].value < MAX_STAT]
                if not growable:
                    break
                per_stat = max(1, surplus // len(growable))
                for n in growable:
                    if surplus <= 0:
                        break
                    can_grow = MAX_STAT - self.sliders[n].value
                    grow = min(per_stat, can_grow, surplus)
                    self.sliders[n].value += grow
                    surplus -= grow

    def _get_current_stats(self) -> Stats:
        return Stats(**{name: slider.value for name, slider in self.sliders.items()})

    def _start_generation(self) -> None:
        if self.generating:
            return
        description = self.description_input.text.strip()
        if not description:
            self.gen_error = "Please describe your creature first!"
            return

        self.generating = True
        self.gen_error = None

        import threading
        self.gen_thread = threading.Thread(target=self._generate_creature, args=(description,), daemon=True)
        self.gen_thread.start()

    def _generate_creature(self, description: str) -> None:
        try:
            from generation.generator import CreatureGenerator
            generator = CreatureGenerator()
            stats = self._get_current_stats()
            creature = generator.generate(description, stat_preferences=stats)
            self._preview_creature = creature
            self._preview_sprite = generate_sprite(creature, size=120)
            # Update sliders to match generated stats
            for name in STAT_NAMES:
                self.sliders[name].value = getattr(creature.base_stats, name)
            self.generating = False
        except Exception as e:
            self.gen_error = str(e)
            self.generating = False

    def _on_ready(self) -> None:
        """Player confirmed their creature."""
        creature = self._preview_creature
        if not creature:
            return

        # Update stats from sliders (player may have tweaked after generation)
        creature.base_stats = self._get_current_stats()

        if self.player_number == 1:
            # Store creature and go to player 2 creation
            self.manager._p1_creature = creature
            self.manager.replace(CreationScreen(self.manager, player_number=2))
        else:
            # Both creatures ready, start battle
            from ui.battle_screen import BattleScreen
            self.manager._p2_creature = creature
            self.manager.replace(BattleScreen(
                self.manager,
                self.manager._p1_creature,
                self.manager._p2_creature,
            ))

    def update(self, dt: float) -> None:
        self.description_input.update(dt)
        # Enable ready button if we have a creature
        self.ready_btn.enabled = self._preview_creature is not None

    def draw(self, screen: pygame.Surface) -> None:
        screen.fill(BG_COLOR)

        # Title
        title = self.title_font.render(f"Player {self.player_number} - Create Your Creature", True, TEXT_COLOR)
        screen.blit(title, (60, 40))

        # Description label
        label = self.label_font.render("Describe your creature:", True, TEXT_DIM)
        screen.blit(label, (60, 98))
        self.description_input.draw(screen)

        # Stat sliders section
        stat_label = self.label_font.render("Allocate Stats:", True, TEXT_DIM)
        screen.blit(stat_label, (60, 200))

        budget_total = sum(s.value for s in self.sliders.values())
        budget_color = ACCENT if budget_total == STAT_BUDGET else (220, 50, 50)
        budget_text = self.small_font.render(f"Budget: {budget_total}/{STAT_BUDGET}", True, budget_color)
        screen.blit(budget_text, (300, 202))

        for slider in self.sliders.values():
            slider.draw(screen)

        # Preview panel (right side)
        preview_rect = pygame.Rect(480, 190, SCREEN_WIDTH - 520, 380)
        pygame.draw.rect(screen, PANEL_COLOR, preview_rect, border_radius=10)
        pygame.draw.rect(screen, PANEL_BORDER, preview_rect, width=2, border_radius=10)

        if self._preview_creature:
            c = self._preview_creature

            # Sprite
            if self._preview_sprite:
                sprite_x = preview_rect.right - 136
                sprite_y = preview_rect.y + 12
                screen.blit(self._preview_sprite, (sprite_x, sprite_y))

            # Name
            name_surf = self.preview_font.render(c.name, True, WHITE)
            screen.blit(name_surf, (preview_rect.x + 16, preview_rect.y + 16))

            # Types
            type_x = preview_rect.x + 16
            type_y = preview_rect.y + 50
            for t in c.types:
                color = TYPE_COLORS.get(t, DARK_GRAY)
                type_surf = self.small_font.render(t.value, True, WHITE)
                w = type_surf.get_width() + 16
                tag_rect = pygame.Rect(type_x, type_y, w, 24)
                pygame.draw.rect(screen, color, tag_rect, border_radius=4)
                screen.blit(type_surf, (type_x + 8, type_y + 3))
                type_x += w + 6

            # Description
            desc_y = type_y + 36
            desc = c.description[:120]
            desc_surf = self.small_font.render(desc, True, TEXT_DIM)
            screen.blit(desc_surf, (preview_rect.x + 16, desc_y))

            # Moves
            move_y = desc_y + 36
            moves_label = self.label_font.render("Moves:", True, TEXT_COLOR)
            screen.blit(moves_label, (preview_rect.x + 16, move_y))
            move_y += 28
            for move in c.moves:
                move_color = TYPE_COLORS.get(move.type, DARK_GRAY)
                # Move name and type badge
                badge_surf = self.small_font.render(move.type.value, True, WHITE)
                badge_w = badge_surf.get_width() + 10
                badge_rect = pygame.Rect(preview_rect.x + 16, move_y, badge_w, 20)
                pygame.draw.rect(screen, move_color, badge_rect, border_radius=3)
                screen.blit(badge_surf, (preview_rect.x + 21, move_y + 2))

                move_text = f"{move.name}  PWR:{move.power}  ACC:{move.accuracy}"
                if move.effect:
                    move_text += f"  [{move.effect} {move.effect_chance}%]"
                move_surf = self.small_font.render(move_text, True, TEXT_COLOR)
                screen.blit(move_surf, (preview_rect.x + 20 + badge_w + 6, move_y + 1))
                move_y += 28
        else:
            hint = self.label_font.render("Your creature will appear here", True, TEXT_DIM)
            hint_rect = hint.get_rect(center=preview_rect.center)
            screen.blit(hint, hint_rect)

        # Generation status
        if self.generating:
            gen_text = self.label_font.render("Generating creature...", True, ACCENT)
            screen.blit(gen_text, (60, SCREEN_HEIGHT - 140))
        elif self.gen_error:
            err_text = self.small_font.render(self.gen_error, True, (220, 50, 50))
            screen.blit(err_text, (60, SCREEN_HEIGHT - 140))

        # Buttons
        self.generate_btn.draw(screen)
        self.ready_btn.draw(screen)

        # Escape hint
        esc_hint = self.small_font.render("ESC to go back", True, TEXT_DIM)
        screen.blit(esc_hint, (SCREEN_WIDTH // 2 - esc_hint.get_width() // 2, SCREEN_HEIGHT - 40))
