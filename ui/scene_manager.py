from abc import ABC, abstractmethod

import pygame


class Scene(ABC):
    """Base class for all game scenes."""

    def __init__(self, manager: "SceneManager"):
        self.manager = manager

    @abstractmethod
    def handle_event(self, event: pygame.event.Event) -> None:
        pass

    @abstractmethod
    def update(self, dt: float) -> None:
        pass

    @abstractmethod
    def draw(self, screen: pygame.Surface) -> None:
        pass

    def on_enter(self) -> None:
        """Called when this scene becomes active."""
        pass

    def on_exit(self) -> None:
        """Called when this scene is removed."""
        pass


class SceneManager:
    """Manages a stack of scenes."""

    def __init__(self):
        self._scenes: list[Scene] = []

    @property
    def current(self) -> Scene | None:
        return self._scenes[-1] if self._scenes else None

    def push(self, scene: Scene) -> None:
        scene.on_enter()
        self._scenes.append(scene)

    def pop(self) -> None:
        if self._scenes:
            self._scenes[-1].on_exit()
            self._scenes.pop()
            if self._scenes:
                self._scenes[-1].on_enter()

    def replace(self, scene: Scene) -> None:
        if self._scenes:
            self._scenes[-1].on_exit()
            self._scenes.pop()
        scene.on_enter()
        self._scenes.append(scene)

    def handle_event(self, event: pygame.event.Event) -> None:
        if self.current:
            self.current.handle_event(event)

    def update(self, dt: float) -> None:
        if self.current:
            self.current.update(dt)

    def draw(self, screen: pygame.Surface) -> None:
        if self.current:
            self.current.draw(screen)
