import pygame

from ui.scene_manager import Scene, SceneManager
from ui.components import Button
from ui.colors import BG_COLOR, TITLE_COLOR, SUBTITLE_COLOR, ACCENT
from config import SCREEN_WIDTH, SCREEN_HEIGHT


class MainMenuScene(Scene):
    def __init__(self, manager: SceneManager):
        super().__init__(manager)
        self.title_font = pygame.font.Font(None, 72)
        self.subtitle_font = pygame.font.Font(None, 28)

        btn_width, btn_height = 280, 56
        center_x = SCREEN_WIDTH // 2 - btn_width // 2

        self.new_game_btn = Button(
            center_x, 380, btn_width, btn_height,
            "New Game", font_size=30,
        )
        self.quit_btn = Button(
            center_x, 460, btn_width, btn_height,
            "Quit", font_size=30,
        )

        # Animated background particles
        self._particles: list[list[float]] = []
        import random
        for _ in range(40):
            self._particles.append([
                random.uniform(0, SCREEN_WIDTH),
                random.uniform(0, SCREEN_HEIGHT),
                random.uniform(10, 40),
                random.uniform(0.2, 0.6),
            ])

    def handle_event(self, event: pygame.event.Event) -> None:
        if self.new_game_btn.handle_event(event):
            from ui.creation_screen import CreationScreen
            self.manager.push(CreationScreen(self.manager, player_number=1))
        if self.quit_btn.handle_event(event):
            pygame.event.post(pygame.event.Event(pygame.QUIT))

    def update(self, dt: float) -> None:
        # Drift particles
        for p in self._particles:
            p[1] -= p[3] * dt * 30
            if p[1] < -p[2]:
                import random
                p[0] = random.uniform(0, SCREEN_WIDTH)
                p[1] = SCREEN_HEIGHT + p[2]

    def draw(self, screen: pygame.Surface) -> None:
        screen.fill(BG_COLOR)

        # Particles
        for x, y, size, alpha in self._particles:
            surf = pygame.Surface((size, size), pygame.SRCALPHA)
            a = int(alpha * 40)
            pygame.draw.circle(surf, (*ACCENT, a), (size // 2, size // 2), size // 2)
            screen.blit(surf, (x - size // 2, y - size // 2))

        # Title
        title_surf = self.title_font.render("INFINITE POKEMON", True, TITLE_COLOR)
        title_rect = title_surf.get_rect(centerx=SCREEN_WIDTH // 2, y=180)
        screen.blit(title_surf, title_rect)

        # Subtitle
        sub_surf = self.subtitle_font.render("Create. Battle. Evolve.", True, SUBTITLE_COLOR)
        sub_rect = sub_surf.get_rect(centerx=SCREEN_WIDTH // 2, y=260)
        screen.blit(sub_surf, sub_rect)

        # Buttons
        self.new_game_btn.draw(screen)
        self.quit_btn.draw(screen)
