import pygame
import sys

# Initialize Pygame
pygame.init()

# Constants
WINDOW_WIDTH = 800
WINDOW_HEIGHT = 600
PLAYER_SPEED = 5
GRAVITY = 0.5
JUMP_POWER = -10

# Colors
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)

# Set up the display
screen = pygame.display.set_mode((WINDOW_WIDTH, WINDOW_HEIGHT))
pygame.display.set_caption("MapleStory Clone")
clock = pygame.time.Clock()

class Player(pygame.sprite.Sprite):
    def __init__(self):
        super().__init__()
        # Temporary rectangle as player sprite
        self.image = pygame.Surface([40, 60])
        self.image.fill(WHITE)
        self.rect = self.image.get_rect()
        self.rect.x = WINDOW_WIDTH // 4
        self.rect.y = WINDOW_HEIGHT // 2
        self.velocity_y = 0
        self.on_ground = False

    def update(self):
        # Apply gravity
        self.velocity_y += GRAVITY
        self.rect.y += self.velocity_y

        # Basic ground collision
        if self.rect.bottom > WINDOW_HEIGHT:
            self.rect.bottom = WINDOW_HEIGHT
            self.velocity_y = 0
            self.on_ground = True
        else:
            self.on_ground = False

    def jump(self):
        if self.on_ground:
            self.velocity_y = JUMP_POWER

    def move(self, direction):
        self.rect.x += direction * PLAYER_SPEED

# Create player
player = Player()
all_sprites = pygame.sprite.Group()
all_sprites.add(player)

# Game loop
running = True
while running:
    # Event handling
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        elif event.type == pygame.KEYDOWN:
            if event.key == pygame.K_SPACE:
                player.jump()

    # Get keyboard state
    keys = pygame.key.get_pressed()
    if keys[pygame.K_LEFT]:
        player.move(-1)
    if keys[pygame.K_RIGHT]:
        player.move(1)

    # Update
    all_sprites.update()

    # Draw
    screen.fill(BLACK)
    all_sprites.draw(screen)
    pygame.display.flip()

    # Cap the frame rate
    clock.tick(60)

pygame.quit()
sys.exit()