import Phaser from 'phaser';
import { SCENES, COLORS, PLAYER, ANIM } from '../config/constants';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.BOOT });
  }

  preload(): void {
    this.showLoadingScreen();
    this.createPlaceholderTextures();
  }

  create(): void {
    this.createAnimations();
    this.createHitEffects();
    this.scene.start(SCENES.GAME);
  }

  private showLoadingScreen(): void {
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(240, 270, 320, 50);

    const { width, height } = this.cameras.main;
    const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
      font: '20px monospace',
      color: '#ffffff',
    });
    loadingText.setOrigin(0.5, 0.5);

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(250, 280, 300 * value, 30);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });
  }

  private createPlaceholderTextures(): void {
    // Player sprite sheet (5 columns x 3 rows = 15 frames)
    this.createPlayerSpriteSheet();

    // Platform texture
    const platformGraphics = this.make.graphics({ x: 0, y: 0 });
    platformGraphics.fillStyle(COLORS.PLATFORM);
    platformGraphics.fillRect(0, 0, 200, 32);
    platformGraphics.generateTexture('platform', 200, 32);
    platformGraphics.destroy();

    // Ground texture - wide enough for the full game width
    const groundGraphics = this.make.graphics({ x: 0, y: 0 });
    groundGraphics.fillStyle(COLORS.GROUND);
    groundGraphics.fillRect(0, 0, 1600, 64);
    groundGraphics.generateTexture('ground', 1600, 64);
    groundGraphics.destroy();

    // Monster texture
    const monsterGraphics = this.make.graphics({ x: 0, y: 0 });
    monsterGraphics.fillStyle(COLORS.MONSTER);
    monsterGraphics.fillRect(0, 0, 40, 40);
    monsterGraphics.generateTexture('monster', 40, 40);
    monsterGraphics.destroy();
  }

  private createPlayerSpriteSheet(): void {
    const frameWidth = PLAYER.WIDTH;
    const frameHeight = PLAYER.HEIGHT;

    // Frame counts per state
    const frames = {
      idle: 2,
      walk: 4,
      jump: 2,
      fall: 2,
      attack: 3,
      climb: 2,
    };

    const columns = 5;
    const totalFrames = Object.values(frames).reduce((a, b) => a + b, 0);
    const rows = Math.ceil(totalFrames / columns);

    const width = columns * frameWidth;
    const height = rows * frameHeight;

    const canvas = this.textures.createCanvas('player-sheet', width, height);
    if (!canvas) return;

    const ctx = canvas.context;
    let frameIndex = 0;

    // State colors for visual debugging
    const stateColors: Record<string, string> = {
      idle: '#4a90e2',   // Blue
      walk: '#50c878',   // Green
      jump: '#ffd700',   // Gold
      fall: '#ff6b6b',   // Red
      attack: '#ff69b4', // Pink
      climb: '#9b59b6',  // Purple
    };

    // Draw frames for each state
    for (const [state, count] of Object.entries(frames)) {
      for (let i = 0; i < count; i++) {
        const col = frameIndex % columns;
        const row = Math.floor(frameIndex / columns);
        this.drawPlayerFrame(ctx, col, row, frameWidth, frameHeight, stateColors[state], i);
        frameIndex++;
      }
    }

    canvas.refresh();

    // Create spritesheet from canvas
    this.textures.addSpriteSheet('player', canvas.canvas as unknown as HTMLImageElement, {
      frameWidth,
      frameHeight,
    });
  }

  private drawPlayerFrame(
    ctx: CanvasRenderingContext2D,
    col: number,
    row: number,
    frameWidth: number,
    frameHeight: number,
    color: string,
    variant: number
  ): void {
    const x = col * frameWidth;
    const y = row * frameHeight;

    // Background (transparent)
    ctx.clearRect(x, y, frameWidth, frameHeight);

    // Body with slight animation variant
    const wobble = Math.sin(variant * Math.PI / 2) * 2;
    const bodyX = x + 4;
    const bodyY = y + 12 + wobble;
    const bodyWidth = frameWidth - 8;
    const bodyHeight = frameHeight - 16;

    ctx.fillStyle = color;
    ctx.fillRect(bodyX, bodyY, bodyWidth, bodyHeight);

    // Head
    ctx.beginPath();
    ctx.arc(x + frameWidth / 2, y + 10, 6, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + frameWidth / 2 - 4, y + 8, 2, 2);
    ctx.fillRect(x + frameWidth / 2 + 2, y + 8, 2, 2);
  }

  private createAnimations(): void {
    // Frame indices for each animation
    const frameMap = {
      idle: [0, 1],
      walk: [2, 3, 4, 5],
      jump: [6, 7],
      fall: [8, 9],
      attack: [10, 11, 12],
      climb: [13, 14],
    };

    // IDLE - slow breathing
    this.anims.create({
      key: 'player-idle',
      frames: this.anims.generateFrameNumbers('player', { frames: frameMap.idle }),
      frameRate: ANIM.IDLE_FPS,
      repeat: -1,
      yoyo: true,
    });

    // WALK - walking cycle
    this.anims.create({
      key: 'player-walk',
      frames: this.anims.generateFrameNumbers('player', { frames: frameMap.walk }),
      frameRate: ANIM.WALK_FPS,
      repeat: -1,
    });

    // JUMP
    this.anims.create({
      key: 'player-jump',
      frames: this.anims.generateFrameNumbers('player', { frames: frameMap.jump }),
      frameRate: ANIM.JUMP_FPS,
      repeat: 0,
    });

    // FALL
    this.anims.create({
      key: 'player-fall',
      frames: this.anims.generateFrameNumbers('player', { frames: frameMap.fall }),
      frameRate: ANIM.FALL_FPS,
      repeat: 0,
    });

    // ATTACK (placeholder for Phase 3)
    this.anims.create({
      key: 'player-attack',
      frames: this.anims.generateFrameNumbers('player', { frames: frameMap.attack }),
      frameRate: ANIM.ATTACK_FPS,
      repeat: 0,
    });

    // CLIMB animations
    this.anims.create({
      key: 'player-climb-idle',
      frames: this.anims.generateFrameNumbers('player', { frames: [frameMap.climb[0]] }),
      frameRate: 1,
      repeat: -1,
    });

    this.anims.create({
      key: 'player-climb-up',
      frames: this.anims.generateFrameNumbers('player', { frames: frameMap.climb }),
      frameRate: ANIM.CLIMB_FPS,
      repeat: -1,
    });

    this.anims.create({
      key: 'player-climb-down',
      frames: this.anims.generateFrameNumbers('player', { frames: frameMap.climb }),
      frameRate: ANIM.CLIMB_FPS,
      repeat: -1,
    });
  }

  private createHitEffects(): void {
    // Physical hit effect - star burst
    const physicalGraphics = this.make.graphics({ x: 0, y: 0 });
    physicalGraphics.fillStyle(0xffffff, 1);

    const centerX = 16;
    const centerY = 16;
    const numPoints = 8;
    const outerRadius = 12;
    const innerRadius = 6;

    physicalGraphics.beginPath();
    for (let i = 0; i < numPoints * 2; i++) {
      const angle = (i * Math.PI) / numPoints;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      if (i === 0) {
        physicalGraphics.moveTo(x, y);
      } else {
        physicalGraphics.lineTo(x, y);
      }
    }
    physicalGraphics.closePath();
    physicalGraphics.fillPath();

    physicalGraphics.generateTexture('hit-effect-physical', 32, 32);
    physicalGraphics.destroy();

    // Magic hit effect - circular rings
    const magicGraphics = this.make.graphics({ x: 0, y: 0 });

    magicGraphics.lineStyle(3, 0x88ccff, 1);
    magicGraphics.strokeCircle(16, 16, 12);

    magicGraphics.lineStyle(2, 0xccffff, 1);
    magicGraphics.strokeCircle(16, 16, 8);

    magicGraphics.fillStyle(0xffffff, 1);
    magicGraphics.fillCircle(16, 16, 3);

    magicGraphics.generateTexture('hit-effect-magic', 32, 32);
    magicGraphics.destroy();

    // Create animations
    this.anims.create({
      key: 'hit-physical',
      frames: [{ key: 'hit-effect-physical', frame: 0 }],
      frameRate: 20,
      repeat: 0
    });

    this.anims.create({
      key: 'hit-magic',
      frames: [{ key: 'hit-effect-magic', frame: 0 }],
      frameRate: 20,
      repeat: 0
    });
  }
}
