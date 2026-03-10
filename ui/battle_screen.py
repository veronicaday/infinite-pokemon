import pygame

from ui.scene_manager import Scene, SceneManager
from ui.components import Button, HealthBar, TextLog
from ui.colors import (
    BG_COLOR, PANEL_COLOR, PANEL_BORDER, TEXT_COLOR, TEXT_DIM,
    WHITE, DARK_GRAY, ACCENT, TITLE_COLOR,
)
from core.types import TYPE_COLORS
from core.creature import Creature
from core.battle import BattleEngine, BattleEvent
from ui.sprite_generator import generate_sprite
from config import SCREEN_WIDTH, SCREEN_HEIGHT


class BattleScreen(Scene):
    def __init__(self, manager: SceneManager, creature1: Creature, creature2: Creature):
        super().__init__(manager)
        self.engine = BattleEngine(creature1, creature2)
        self.c1 = creature1
        self.c2 = creature2

        # Fonts
        self.name_font = pygame.font.Font(None, 32)
        self.label_font = pygame.font.Font(None, 24)
        self.small_font = pygame.font.Font(None, 22)
        self.big_font = pygame.font.Font(None, 56)

        # Health bars
        self.hp_bar1 = HealthBar(100, 470, 300, 20)
        self.hp_bar2 = HealthBar(SCREEN_WIDTH - 400, 140, 300, 20)

        # Generate sprites
        self.sprite1 = generate_sprite(self.c1, size=160)
        self.sprite2 = generate_sprite(self.c2, size=128)

        # Battle log
        self.log = TextLog(40, 520, SCREEN_WIDTH - 80, 100, font_size=22)

        # Move buttons (for current player)
        self.move_buttons: list[Button] = []

        # Turn state
        self.phase = "gate_p1"  # gate_p1, select_p1, gate_p2, select_p2, animating, result
        self.p1_move = None
        self.p2_move = None
        self.pending_events: list[BattleEvent] = []
        self.event_timer = 0
        self.event_delay = 0.8  # seconds between events

        # Gate button
        self.gate_btn = Button(
            SCREEN_WIDTH // 2 - 120, SCREEN_HEIGHT // 2 + 40, 240, 48,
            "Ready", font_size=28,
        )

        # Result state
        self.result_btn = Button(
            SCREEN_WIDTH // 2 - 120, SCREEN_HEIGHT // 2 + 60, 240, 48,
            "Main Menu", font_size=28,
        )

        self._build_move_buttons(self.c1)

    def _build_move_buttons(self, creature: Creature) -> None:
        """Build move selection buttons for the given creature."""
        self.move_buttons.clear()
        btn_w, btn_h = 220, 48
        start_x = SCREEN_WIDTH // 2 - btn_w - 10
        start_y = SCREEN_HEIGHT - 180

        for i, move in enumerate(creature.moves):
            x = start_x + (i % 2) * (btn_w + 20)
            y = start_y + (i // 2) * (btn_h + 12)
            color = TYPE_COLORS.get(move.type, DARK_GRAY)
            # Darken the color slightly for button background
            btn_color = tuple(max(0, c - 40) for c in color)
            hover_color = color
            label = f"{move.name} ({move.power}/{move.accuracy})"
            btn = Button(x, y, btn_w, btn_h, label, color=btn_color, hover_color=hover_color, font_size=20)
            self.move_buttons.append(btn)

    def handle_event(self, event: pygame.event.Event) -> None:
        if self.phase == "gate_p1" or self.phase == "gate_p2":
            if self.gate_btn.handle_event(event):
                if self.phase == "gate_p1":
                    self.phase = "select_p1"
                    self._build_move_buttons(self.c1)
                else:
                    self.phase = "select_p2"
                    self._build_move_buttons(self.c2)

        elif self.phase == "select_p1":
            for i, btn in enumerate(self.move_buttons):
                if btn.handle_event(event):
                    self.p1_move = self.c1.moves[i]
                    self.phase = "gate_p2"
                    self.gate_btn.text = "Ready"

        elif self.phase == "select_p2":
            for i, btn in enumerate(self.move_buttons):
                if btn.handle_event(event):
                    self.p2_move = self.c2.moves[i]
                    self._execute_turn()

        elif self.phase == "result":
            if self.result_btn.handle_event(event):
                from ui.main_menu import MainMenuScene
                self.manager.replace(MainMenuScene(self.manager))

    def _execute_turn(self) -> None:
        """Run the battle engine for this turn."""
        self.phase = "animating"
        self.log.clear()
        events = self.engine.execute_turn(self.p1_move, self.p2_move)
        self.pending_events = events
        self.event_timer = 0

    def update(self, dt: float) -> None:
        self.hp_bar1.set_hp(self.c1.current_hp, self.c1.max_hp)
        self.hp_bar2.set_hp(self.c2.current_hp, self.c2.max_hp)
        self.hp_bar1.update(dt)
        self.hp_bar2.update(dt)

        if self.phase == "animating":
            self.event_timer += dt
            if self.event_timer >= self.event_delay and self.pending_events:
                event = self.pending_events.pop(0)
                self.log.add(event.message)
                self.event_timer = 0

            if not self.pending_events and self.event_timer >= self.event_delay:
                # All events shown
                if self.engine.winner:
                    self.phase = "result"
                else:
                    # Next turn
                    self.p1_move = None
                    self.p2_move = None
                    self.phase = "gate_p1"
                    self.gate_btn.text = "Ready"

    def draw(self, screen: pygame.Surface) -> None:
        screen.fill(BG_COLOR)

        # --- Opponent (Player 2's creature) - top right ---
        self._draw_creature_panel(screen, self.c2, "Player 2",
                                  SCREEN_WIDTH - 420, 40, right_align=True)
        self.hp_bar2.draw(screen)
        hp2_text = self.small_font.render(
            f"{self.c2.current_hp}/{self.c2.max_hp}", True, TEXT_COLOR)
        screen.blit(hp2_text, (SCREEN_WIDTH - 400, 162))

        # --- Player (Player 1's creature) - bottom left ---
        self._draw_creature_panel(screen, self.c1, "Player 1", 60, 370, right_align=False)
        self.hp_bar1.draw(screen)
        hp1_text = self.small_font.render(
            f"{self.c1.current_hp}/{self.c1.max_hp}", True, TEXT_COLOR)
        screen.blit(hp1_text, (100, 492))

        # --- Creature sprites ---
        # Player 1's creature (bottom left area) - larger, in foreground
        screen.blit(self.sprite1, (140, 240))

        # Player 2's creature (top right area) - smaller, in background
        screen.blit(self.sprite2, (SCREEN_WIDTH - 310, 30))

        # --- Battle log ---
        log_bg = pygame.Rect(30, 515, SCREEN_WIDTH - 60, 110)
        pygame.draw.rect(screen, PANEL_COLOR, log_bg, border_radius=8)
        pygame.draw.rect(screen, PANEL_BORDER, log_bg, width=2, border_radius=8)
        self.log.draw(screen)

        # --- Phase-specific UI ---
        if self.phase == "gate_p1":
            self._draw_gate(screen, "Player 1 - Choose your move!")
        elif self.phase == "gate_p2":
            self._draw_gate(screen, "Player 2 - Choose your move!")
        elif self.phase in ("select_p1", "select_p2"):
            player_name = "Player 1" if self.phase == "select_p1" else "Player 2"
            prompt = self.label_font.render(f"{player_name}: Select a move", True, ACCENT)
            screen.blit(prompt, (SCREEN_WIDTH // 2 - prompt.get_width() // 2, SCREEN_HEIGHT - 210))
            for btn in self.move_buttons:
                btn.draw(screen)
        elif self.phase == "result":
            self._draw_result(screen)

    def _draw_creature_panel(self, screen: pygame.Surface, creature: Creature,
                             player_label: str, x: int, y: int, right_align: bool) -> None:
        """Draw creature info panel."""
        # Player label
        pl_surf = self.small_font.render(player_label, True, TEXT_DIM)
        screen.blit(pl_surf, (x, y))

        # Name
        name_surf = self.name_font.render(creature.name, True, WHITE)
        screen.blit(name_surf, (x, y + 20))

        # Types
        type_x = x
        for t in creature.types:
            color = TYPE_COLORS.get(t, DARK_GRAY)
            type_surf = self.small_font.render(t.value, True, WHITE)
            w = type_surf.get_width() + 10
            tag_rect = pygame.Rect(type_x, y + 52, w, 20)
            pygame.draw.rect(screen, color, tag_rect, border_radius=3)
            screen.blit(type_surf, (type_x + 5, y + 53))
            type_x += w + 4

        # Status
        if creature.status:
            status_surf = self.small_font.render(creature.status.value.upper(), True, (255, 100, 100))
            screen.blit(status_surf, (x, y + 76))

    def _draw_gate(self, screen: pygame.Surface, message: str) -> None:
        """Draw the turn gate (pass-the-device screen)."""
        overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
        overlay.fill((0, 0, 0, 160))
        screen.blit(overlay, (0, 0))

        msg_surf = self.name_font.render(message, True, WHITE)
        msg_rect = msg_surf.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 - 20))
        screen.blit(msg_surf, msg_rect)

        hint = self.small_font.render("(Pass the device to the right player)", True, TEXT_DIM)
        hint_rect = hint.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 10))
        screen.blit(hint, hint_rect)

        self.gate_btn.draw(screen)

    def _draw_result(self, screen: pygame.Surface) -> None:
        """Draw the battle result screen."""
        overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
        overlay.fill((0, 0, 0, 180))
        screen.blit(overlay, (0, 0))

        winner = self.engine.creatures[self.engine.winner]
        winner_num = self.engine.winner

        result_text = self.big_font.render(f"Player {winner_num} Wins!", True, TITLE_COLOR)
        result_rect = result_text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 - 40))
        screen.blit(result_text, result_rect)

        creature_text = self.name_font.render(f"{winner.name} is victorious!", True, WHITE)
        creature_rect = creature_text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 10))
        screen.blit(creature_text, creature_rect)

        self.result_btn.draw(screen)
