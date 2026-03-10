import sys

import pygame

from config import SCREEN_WIDTH, SCREEN_HEIGHT, FPS, GAME_TITLE
from ui.scene_manager import SceneManager
from ui.main_menu import MainMenuScene


def main():
    pygame.init()
    screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
    pygame.display.set_caption(GAME_TITLE)
    clock = pygame.time.Clock()

    manager = SceneManager()
    manager.push(MainMenuScene(manager))

    running = True
    while running:
        dt = clock.tick(FPS) / 1000.0  # Delta time in seconds

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            manager.handle_event(event)

        manager.update(dt)
        manager.draw(screen)
        pygame.display.flip()

    pygame.quit()
    sys.exit()


if __name__ == "__main__":
    main()
