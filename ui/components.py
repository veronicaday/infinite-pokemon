import pygame

from ui.colors import (
    BUTTON_COLOR, BUTTON_HOVER, BUTTON_TEXT, WHITE, BLACK,
    INPUT_BG, INPUT_BORDER, INPUT_ACTIVE_BORDER, TEXT_COLOR,
    SLIDER_BG, SLIDER_FILL, SLIDER_HANDLE,
    HP_GREEN, HP_YELLOW, HP_RED, DARK_GRAY, TEXT_DIM,
)


class Button:
    def __init__(self, x: int, y: int, width: int, height: int, text: str,
                 color: tuple = BUTTON_COLOR, hover_color: tuple = BUTTON_HOVER,
                 text_color: tuple = BUTTON_TEXT, font_size: int = 24):
        self.rect = pygame.Rect(x, y, width, height)
        self.text = text
        self.color = color
        self.hover_color = hover_color
        self.text_color = text_color
        self.font = pygame.font.Font(None, font_size)
        self.hovered = False
        self.enabled = True

    def handle_event(self, event: pygame.event.Event) -> bool:
        """Returns True if button was clicked."""
        if not self.enabled:
            return False
        if event.type == pygame.MOUSEMOTION:
            self.hovered = self.rect.collidepoint(event.pos)
        if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
            if self.rect.collidepoint(event.pos):
                return True
        return False

    def draw(self, screen: pygame.Surface) -> None:
        color = self.hover_color if self.hovered and self.enabled else self.color
        if not self.enabled:
            color = DARK_GRAY
        pygame.draw.rect(screen, color, self.rect, border_radius=8)
        pygame.draw.rect(screen, WHITE if self.hovered and self.enabled else DARK_GRAY,
                         self.rect, width=2, border_radius=8)
        text_surf = self.font.render(self.text, True, self.text_color if self.enabled else TEXT_DIM)
        text_rect = text_surf.get_rect(center=self.rect.center)
        screen.blit(text_surf, text_rect)


class TextInput:
    def __init__(self, x: int, y: int, width: int, height: int,
                 placeholder: str = "", font_size: int = 22, max_length: int = 200):
        self.rect = pygame.Rect(x, y, width, height)
        self.text = ""
        self.placeholder = placeholder
        self.font = pygame.font.Font(None, font_size)
        self.active = False
        self.max_length = max_length
        self.cursor_visible = True
        self.cursor_timer = 0

    def handle_event(self, event: pygame.event.Event) -> None:
        if event.type == pygame.MOUSEBUTTONDOWN:
            self.active = self.rect.collidepoint(event.pos)
        if event.type == pygame.KEYDOWN and self.active:
            if event.key == pygame.K_BACKSPACE:
                self.text = self.text[:-1]
            elif event.key == pygame.K_RETURN:
                self.active = False
            elif len(self.text) < self.max_length and event.unicode.isprintable():
                self.text += event.unicode

    def update(self, dt: float) -> None:
        self.cursor_timer += dt
        if self.cursor_timer > 0.5:
            self.cursor_visible = not self.cursor_visible
            self.cursor_timer = 0

    def draw(self, screen: pygame.Surface) -> None:
        border_color = INPUT_ACTIVE_BORDER if self.active else INPUT_BORDER
        pygame.draw.rect(screen, INPUT_BG, self.rect, border_radius=6)
        pygame.draw.rect(screen, border_color, self.rect, width=2, border_radius=6)

        if self.text:
            text_surf = self.font.render(self.text, True, TEXT_COLOR)
        else:
            text_surf = self.font.render(self.placeholder, True, TEXT_DIM)

        # Clip text to input area
        clip_rect = pygame.Rect(self.rect.x + 8, self.rect.y, self.rect.width - 16, self.rect.height)
        screen.set_clip(clip_rect)
        screen.blit(text_surf, (self.rect.x + 8, self.rect.centery - text_surf.get_height() // 2))

        # Cursor
        if self.active and self.cursor_visible:
            cursor_x = self.rect.x + 8 + self.font.size(self.text)[0]
            cursor_x = min(cursor_x, self.rect.right - 8)
            pygame.draw.line(screen, TEXT_COLOR,
                             (cursor_x, self.rect.y + 6),
                             (cursor_x, self.rect.bottom - 6), 2)
        screen.set_clip(None)


class Slider:
    def __init__(self, x: int, y: int, width: int, height: int,
                 min_val: int, max_val: int, value: int, label: str = "",
                 font_size: int = 20):
        self.rect = pygame.Rect(x, y, width, height)
        self.min_val = min_val
        self.max_val = max_val
        self.value = value
        self.label = label
        self.font = pygame.font.Font(None, font_size)
        self.dragging = False
        self.handle_radius = height // 2

    @property
    def _track_rect(self) -> pygame.Rect:
        return pygame.Rect(self.rect.x, self.rect.centery - 4, self.rect.width, 8)

    @property
    def _handle_x(self) -> int:
        ratio = (self.value - self.min_val) / max(1, self.max_val - self.min_val)
        return int(self.rect.x + ratio * self.rect.width)

    def handle_event(self, event: pygame.event.Event) -> bool:
        """Returns True if value changed."""
        if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
            handle_pos = (self._handle_x, self.rect.centery)
            dist = ((event.pos[0] - handle_pos[0]) ** 2 + (event.pos[1] - handle_pos[1]) ** 2) ** 0.5
            if dist <= self.handle_radius + 4 or self._track_rect.collidepoint(event.pos):
                self.dragging = True
                return self._update_value(event.pos[0])
        if event.type == pygame.MOUSEBUTTONUP:
            self.dragging = False
        if event.type == pygame.MOUSEMOTION and self.dragging:
            return self._update_value(event.pos[0])
        return False

    def _update_value(self, mouse_x: int) -> bool:
        ratio = (mouse_x - self.rect.x) / max(1, self.rect.width)
        ratio = max(0, min(1, ratio))
        new_value = int(self.min_val + ratio * (self.max_val - self.min_val))
        if new_value != self.value:
            self.value = new_value
            return True
        return False

    def draw(self, screen: pygame.Surface) -> None:
        # Label
        if self.label:
            label_surf = self.font.render(self.label, True, TEXT_COLOR)
            screen.blit(label_surf, (self.rect.x, self.rect.y - 20))

        # Value
        val_surf = self.font.render(str(self.value), True, TEXT_COLOR)
        screen.blit(val_surf, (self.rect.right + 8, self.rect.centery - val_surf.get_height() // 2))

        # Track
        track = self._track_rect
        pygame.draw.rect(screen, SLIDER_BG, track, border_radius=4)

        # Fill
        fill_width = self._handle_x - track.x
        if fill_width > 0:
            fill_rect = pygame.Rect(track.x, track.y, fill_width, track.height)
            pygame.draw.rect(screen, SLIDER_FILL, fill_rect, border_radius=4)

        # Handle
        pygame.draw.circle(screen, SLIDER_HANDLE, (self._handle_x, self.rect.centery), self.handle_radius)


class HealthBar:
    def __init__(self, x: int, y: int, width: int, height: int):
        self.rect = pygame.Rect(x, y, width, height)
        self.current = 1.0  # Display ratio (0-1), smoothly animated
        self.target = 1.0

    def set_hp(self, current_hp: int, max_hp: int) -> None:
        self.target = max(0, current_hp / max_hp)

    def update(self, dt: float) -> None:
        # Smoothly animate towards target
        speed = 0.8
        if abs(self.current - self.target) < 0.005:
            self.current = self.target
        elif self.current > self.target:
            self.current -= speed * dt
            self.current = max(self.current, self.target)
        else:
            self.current += speed * dt
            self.current = min(self.current, self.target)

    def draw(self, screen: pygame.Surface) -> None:
        # Background
        pygame.draw.rect(screen, DARK_GRAY, self.rect, border_radius=4)

        # Fill
        if self.current > 0:
            if self.current > 0.5:
                color = HP_GREEN
            elif self.current > 0.2:
                color = HP_YELLOW
            else:
                color = HP_RED
            fill_width = int(self.rect.width * self.current)
            fill_rect = pygame.Rect(self.rect.x, self.rect.y, fill_width, self.rect.height)
            pygame.draw.rect(screen, color, fill_rect, border_radius=4)

        # Border
        pygame.draw.rect(screen, WHITE, self.rect, width=2, border_radius=4)


class TextLog:
    def __init__(self, x: int, y: int, width: int, height: int, font_size: int = 20):
        self.rect = pygame.Rect(x, y, width, height)
        self.font = pygame.font.Font(None, font_size)
        self.lines: list[str] = []
        self.max_visible = height // (font_size + 2)

    def add(self, text: str) -> None:
        self.lines.append(text)

    def clear(self) -> None:
        self.lines.clear()

    def draw(self, screen: pygame.Surface) -> None:
        visible = self.lines[-self.max_visible:]
        y = self.rect.y
        for line in visible:
            surf = self.font.render(line, True, TEXT_COLOR)
            screen.blit(surf, (self.rect.x + 4, y))
            y += self.font.get_height() + 2
