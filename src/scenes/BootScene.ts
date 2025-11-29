import Phaser from 'phaser';
import { SCENES, PLAYER, ANIM } from '../config/constants';

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
    this.createMonsterAnimations();
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
    this.createPlayerSpriteSheet();
    this.createSlimeSpriteSheet();
    this.createPlatformTexture();
    this.createGroundTexture();
  }

  private createPlayerSpriteSheet(): void {
    const frameWidth = PLAYER.WIDTH;
    const frameHeight = PLAYER.HEIGHT;

    const frames = {
      idle: 4,
      walk: 6,
      jump: 2,
      fall: 2,
      attack: 4,
      climb: 2,
    };

    const columns = 6;
    const totalFrames = Object.values(frames).reduce((a, b) => a + b, 0);
    const rows = Math.ceil(totalFrames / columns);

    const width = columns * frameWidth;
    const height = rows * frameHeight;

    const canvas = this.textures.createCanvas('player-sheet', width, height);
    if (!canvas) return;

    const ctx = canvas.context;
    let frameIndex = 0;

    // Draw IDLE frames (breathing animation)
    for (let i = 0; i < frames.idle; i++) {
      const col = frameIndex % columns;
      const row = Math.floor(frameIndex / columns);
      const breathOffset = Math.sin(i * Math.PI / 2) * 1;
      this.drawPixelCharacter(ctx, col * frameWidth, row * frameHeight, frameWidth, frameHeight, 'idle', breathOffset, i);
      frameIndex++;
    }

    // Draw WALK frames
    for (let i = 0; i < frames.walk; i++) {
      const col = frameIndex % columns;
      const row = Math.floor(frameIndex / columns);
      this.drawPixelCharacter(ctx, col * frameWidth, row * frameHeight, frameWidth, frameHeight, 'walk', 0, i);
      frameIndex++;
    }

    // Draw JUMP frames
    for (let i = 0; i < frames.jump; i++) {
      const col = frameIndex % columns;
      const row = Math.floor(frameIndex / columns);
      this.drawPixelCharacter(ctx, col * frameWidth, row * frameHeight, frameWidth, frameHeight, 'jump', 0, i);
      frameIndex++;
    }

    // Draw FALL frames
    for (let i = 0; i < frames.fall; i++) {
      const col = frameIndex % columns;
      const row = Math.floor(frameIndex / columns);
      this.drawPixelCharacter(ctx, col * frameWidth, row * frameHeight, frameWidth, frameHeight, 'fall', 0, i);
      frameIndex++;
    }

    // Draw ATTACK frames
    for (let i = 0; i < frames.attack; i++) {
      const col = frameIndex % columns;
      const row = Math.floor(frameIndex / columns);
      this.drawPixelCharacter(ctx, col * frameWidth, row * frameHeight, frameWidth, frameHeight, 'attack', 0, i);
      frameIndex++;
    }

    // Draw CLIMB frames
    for (let i = 0; i < frames.climb; i++) {
      const col = frameIndex % columns;
      const row = Math.floor(frameIndex / columns);
      this.drawPixelCharacter(ctx, col * frameWidth, row * frameHeight, frameWidth, frameHeight, 'climb', 0, i);
      frameIndex++;
    }

    canvas.refresh();

    this.textures.addSpriteSheet('player', canvas.canvas as unknown as HTMLImageElement, {
      frameWidth,
      frameHeight,
    });
  }

  private drawPixelCharacter(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    _frameWidth: number,
    _frameHeight: number,
    state: string,
    breathOffset: number,
    frameNum: number
  ): void {
    ctx.imageSmoothingEnabled = false;

    // Colors - cute chibi style
    const skinColor = '#FFE0BD';
    const skinShadow = '#E8C4A0';
    const hairColor = '#5D4E37';
    const hairHighlight = '#7A6B54';
    const shirtColor = '#4A90D9';
    const shirtShadow = '#3A7BC8';
    const pantsColor = '#2C3E50';
    const pantsShadow = '#1A252F';
    const outlineColor = '#2C2C2C';
    const eyeWhite = '#FFFFFF';
    const eyeColor = '#2C2C2C';
    const blushColor = '#FFAAAA';

    // Animation offsets
    let bodyOffsetY = breathOffset;
    let armAngle = 0;
    let legOffset = 0;

    if (state === 'walk') {
      legOffset = Math.sin(frameNum * Math.PI / 3) * 3;
      bodyOffsetY = Math.abs(Math.sin(frameNum * Math.PI / 3)) * -2;
    } else if (state === 'jump') {
      bodyOffsetY = -2;
      armAngle = frameNum === 0 ? -0.3 : -0.5;
    } else if (state === 'fall') {
      bodyOffsetY = 0;
      armAngle = 0.3;
    } else if (state === 'attack') {
      armAngle = frameNum < 2 ? -0.5 - frameNum * 0.3 : 0.8 - (frameNum - 2) * 0.4;
    } else if (state === 'climb') {
      armAngle = frameNum === 0 ? -0.5 : 0.5;
      legOffset = frameNum === 0 ? 2 : -2;
    }

    const centerX = x + 16;
    const baseY = y + 8 + bodyOffsetY;

    // Helper to draw pixel
    const pixel = (px: number, py: number, color: string, size: number = 2) => {
      ctx.fillStyle = color;
      ctx.fillRect(Math.floor(px), Math.floor(py), size, size);
    };

    // Draw legs first (behind body)
    const legY = baseY + 28;
    // Left leg
    pixel(centerX - 6 + (state === 'walk' ? legOffset : 0), legY, pantsColor, 4);
    pixel(centerX - 6 + (state === 'walk' ? legOffset : 0), legY + 4, pantsColor, 4);
    pixel(centerX - 6 + (state === 'walk' ? legOffset : 0), legY + 8, pantsShadow, 4);
    // Right leg
    pixel(centerX + 2 + (state === 'walk' ? -legOffset : 0), legY, pantsColor, 4);
    pixel(centerX + 2 + (state === 'walk' ? -legOffset : 0), legY + 4, pantsColor, 4);
    pixel(centerX + 2 + (state === 'walk' ? -legOffset : 0), legY + 8, pantsShadow, 4);

    // Draw body/shirt
    const bodyY = baseY + 18;
    for (let i = 0; i < 5; i++) {
      const rowWidth = i < 2 ? 12 : 10;
      const offsetX = i < 2 ? -6 : -5;
      pixel(centerX + offsetX, bodyY + i * 2, i < 3 ? shirtColor : shirtShadow, rowWidth);
    }

    // Draw arms
    const armY = baseY + 20;
    if (state === 'attack' && frameNum >= 1 && frameNum <= 2) {
      // Sword swing - arm extended
      pixel(centerX + 8, armY - 2, skinColor, 4);
      pixel(centerX + 12, armY - 4, skinColor, 4);
      // Sword
      pixel(centerX + 16, armY - 8, '#CCCCCC', 2);
      pixel(centerX + 16, armY - 12, '#CCCCCC', 2);
      pixel(centerX + 16, armY - 16, '#FFFFFF', 2);
      pixel(centerX + 16, armY - 20, '#FFFFFF', 2);
      // Left arm normal
      pixel(centerX - 10, armY + Math.sin(armAngle) * 2, skinColor, 4);
    } else {
      // Normal arms with slight animation
      const armSwing = Math.sin(armAngle) * 4;
      pixel(centerX - 10, armY + armSwing, skinColor, 4);
      pixel(centerX + 6, armY - armSwing, skinColor, 4);
    }

    // Draw head (large chibi head)
    const headY = baseY;
    // Head base - oval shape
    for (let row = 0; row < 8; row++) {
      let rowWidth: number;
      let offsetX: number;
      if (row === 0) { rowWidth = 8; offsetX = -4; }
      else if (row === 1) { rowWidth = 14; offsetX = -7; }
      else if (row < 6) { rowWidth = 16; offsetX = -8; }
      else if (row === 6) { rowWidth = 14; offsetX = -7; }
      else { rowWidth = 10; offsetX = -5; }

      const color = row < 4 ? skinColor : skinShadow;
      pixel(centerX + offsetX, headY + row * 2, color, rowWidth);
    }

    // Hair (top and sides)
    // Top hair
    for (let row = 0; row < 4; row++) {
      let rowWidth: number;
      let offsetX: number;
      if (row === 0) { rowWidth = 10; offsetX = -5; }
      else if (row === 1) { rowWidth = 16; offsetX = -8; }
      else { rowWidth = 18; offsetX = -9; }
      pixel(centerX + offsetX, headY - 4 + row * 2, row === 0 ? hairHighlight : hairColor, rowWidth);
    }
    // Side hair bangs
    pixel(centerX - 9, headY + 4, hairColor, 3);
    pixel(centerX - 9, headY + 6, hairColor, 2);
    pixel(centerX + 6, headY + 4, hairColor, 3);
    pixel(centerX + 7, headY + 6, hairColor, 2);
    // Hair spikes on top
    pixel(centerX - 4, headY - 6, hairColor, 2);
    pixel(centerX + 2, headY - 6, hairHighlight, 2);
    pixel(centerX - 1, headY - 8, hairColor, 2);

    // Eyes
    const eyeY = headY + 6;
    // Left eye
    pixel(centerX - 5, eyeY, eyeWhite, 4);
    pixel(centerX - 5, eyeY + 2, eyeWhite, 4);
    pixel(centerX - 4, eyeY + (state === 'jump' ? 0 : 1), eyeColor, 2);
    // Right eye
    pixel(centerX + 1, eyeY, eyeWhite, 4);
    pixel(centerX + 1, eyeY + 2, eyeWhite, 4);
    pixel(centerX + 2, eyeY + (state === 'jump' ? 0 : 1), eyeColor, 2);

    // Blush marks
    pixel(centerX - 7, headY + 10, blushColor, 2);
    pixel(centerX + 5, headY + 10, blushColor, 2);

    // Mouth
    if (state === 'jump' || state === 'attack') {
      // Open mouth (excited)
      pixel(centerX - 1, headY + 12, outlineColor, 2);
    } else {
      // Small smile
      pixel(centerX - 2, headY + 12, outlineColor, 4);
    }

    // Outline (subtle)
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 1;
  }

  private createSlimeSpriteSheet(): void {
    const frameWidth = 40;
    const frameHeight = 40;
    const frameCount = 6; // idle bounce animation + squish

    const canvas = this.textures.createCanvas('slime-sheet', frameWidth * frameCount, frameHeight);
    if (!canvas) return;

    const ctx = canvas.context;
    ctx.imageSmoothingEnabled = false;

    for (let i = 0; i < frameCount; i++) {
      this.drawSlimeFrame(ctx, i * frameWidth, 0, frameWidth, frameHeight, i);
    }

    canvas.refresh();

    this.textures.addSpriteSheet('slime', canvas.canvas as unknown as HTMLImageElement, {
      frameWidth,
      frameHeight,
    });
  }

  private drawSlimeFrame(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    frameNum: number
  ): void {
    const slimeColor = '#7EC850';
    const slimeLight = '#A8E060';
    const slimeDark = '#5AA030';
    const slimeOutline = '#3D7020';
    const eyeWhite = '#FFFFFF';
    const eyePupil = '#2C2C2C';

    // Bounce animation - squash and stretch
    const bouncePhase = frameNum / 6;
    const squash = Math.sin(bouncePhase * Math.PI * 2);
    const heightMod = 1 - squash * 0.15;
    const widthMod = 1 + squash * 0.1;

    const centerX = x + width / 2;
    const baseY = y + height - 8;

    const slimeWidth = 28 * widthMod;
    const slimeHeight = 24 * heightMod;

    // Draw slime body (blob shape)
    ctx.fillStyle = slimeColor;
    ctx.beginPath();
    ctx.ellipse(centerX, baseY - slimeHeight / 2, slimeWidth / 2, slimeHeight / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Highlight (top)
    ctx.fillStyle = slimeLight;
    ctx.beginPath();
    ctx.ellipse(centerX - 4, baseY - slimeHeight / 2 - 4, slimeWidth / 4, slimeHeight / 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Shadow (bottom)
    ctx.fillStyle = slimeDark;
    ctx.beginPath();
    ctx.ellipse(centerX, baseY - 4, slimeWidth / 2 - 2, 6, 0, 0, Math.PI);
    ctx.fill();

    // Outline
    ctx.strokeStyle = slimeOutline;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(centerX, baseY - slimeHeight / 2, slimeWidth / 2, slimeHeight / 2, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Eyes
    const eyeY = baseY - slimeHeight / 2 - 2 + squash * 2;
    // Left eye
    ctx.fillStyle = eyeWhite;
    ctx.beginPath();
    ctx.ellipse(centerX - 6, eyeY, 5, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = eyePupil;
    ctx.beginPath();
    ctx.ellipse(centerX - 5, eyeY + 1, 2, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Right eye
    ctx.fillStyle = eyeWhite;
    ctx.beginPath();
    ctx.ellipse(centerX + 6, eyeY, 5, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = eyePupil;
    ctx.beginPath();
    ctx.ellipse(centerX + 7, eyeY + 1, 2, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cute mouth
    ctx.strokeStyle = slimeOutline;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, eyeY + 8, 3, 0, Math.PI);
    ctx.stroke();

    // Shine spot
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.ellipse(centerX - 8, baseY - slimeHeight / 2 - 6, 3, 2, -0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  private createPlatformTexture(): void {
    const width = 200;
    const height = 32;

    const canvas = this.textures.createCanvas('platform-canvas', width, height);
    if (!canvas) return;

    const ctx = canvas.context;
    ctx.imageSmoothingEnabled = false;

    // Grass top
    const grassColor = '#4CAF50';
    const grassLight = '#66BB6A';
    const grassDark = '#388E3C';

    // Dirt body
    const dirtColor = '#8D6E63';
    const dirtLight = '#A1887F';
    const dirtDark = '#6D4C41';

    // Draw dirt base
    ctx.fillStyle = dirtColor;
    ctx.fillRect(0, 8, width, height - 8);

    // Dirt texture (random darker spots)
    ctx.fillStyle = dirtDark;
    for (let i = 0; i < 20; i++) {
      const px = Math.random() * width;
      const py = 10 + Math.random() * (height - 12);
      ctx.fillRect(px, py, 4 + Math.random() * 4, 2 + Math.random() * 3);
    }

    // Dirt highlights
    ctx.fillStyle = dirtLight;
    for (let i = 0; i < 10; i++) {
      const px = Math.random() * width;
      const py = 8 + Math.random() * 8;
      ctx.fillRect(px, py, 3 + Math.random() * 3, 2);
    }

    // Grass layer on top
    ctx.fillStyle = grassColor;
    ctx.fillRect(0, 0, width, 10);

    // Grass highlights
    ctx.fillStyle = grassLight;
    for (let i = 0; i < width; i += 6) {
      ctx.fillRect(i, 0, 4, 4 + Math.random() * 4);
    }

    // Grass tufts on top
    ctx.fillStyle = grassDark;
    for (let i = 0; i < width; i += 8) {
      const tuftHeight = 2 + Math.random() * 3;
      ctx.fillRect(i + 2, -tuftHeight + 2, 2, tuftHeight);
    }

    // Edge shadows
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(0, height - 4, width, 4);

    canvas.refresh();
    this.textures.addSpriteSheet('platform', canvas.canvas as unknown as HTMLImageElement, {
      frameWidth: width,
      frameHeight: height,
    });
  }

  private createGroundTexture(): void {
    const width = 1600;
    const height = 64;

    const canvas = this.textures.createCanvas('ground-canvas', width, height);
    if (!canvas) return;

    const ctx = canvas.context;
    ctx.imageSmoothingEnabled = false;

    // Grass top
    const grassColor = '#4CAF50';
    const grassLight = '#66BB6A';
    const grassDark = '#388E3C';

    // Dirt/stone layers
    const dirtColor = '#8D6E63';
    const dirtDark = '#6D4C41';
    const stoneColor = '#757575';
    const stoneDark = '#616161';

    // Draw stone base layer
    ctx.fillStyle = stoneColor;
    ctx.fillRect(0, 32, width, 32);

    // Stone texture
    ctx.fillStyle = stoneDark;
    for (let i = 0; i < 100; i++) {
      const px = Math.random() * width;
      const py = 34 + Math.random() * 28;
      ctx.fillRect(px, py, 6 + Math.random() * 10, 3 + Math.random() * 5);
    }

    // Draw dirt layer
    ctx.fillStyle = dirtColor;
    ctx.fillRect(0, 12, width, 24);

    // Dirt texture
    ctx.fillStyle = dirtDark;
    for (let i = 0; i < 80; i++) {
      const px = Math.random() * width;
      const py = 14 + Math.random() * 18;
      ctx.fillRect(px, py, 4 + Math.random() * 6, 2 + Math.random() * 4);
    }

    // Grass layer on top
    ctx.fillStyle = grassColor;
    ctx.fillRect(0, 0, width, 14);

    // Grass highlights
    ctx.fillStyle = grassLight;
    for (let i = 0; i < width; i += 4) {
      ctx.fillRect(i, 0, 3, 6 + Math.random() * 6);
    }

    // Grass tufts
    ctx.fillStyle = grassDark;
    for (let i = 0; i < width; i += 6) {
      const tuftHeight = 3 + Math.random() * 4;
      ctx.fillRect(i + 2, -tuftHeight + 3, 2, tuftHeight);
    }

    // Flowers scattered on grass
    const flowerColors = ['#FF6B6B', '#FFE66D', '#4ECDC4', '#FF69B4'];
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = flowerColors[Math.floor(Math.random() * flowerColors.length)];
      const fx = Math.random() * width;
      ctx.fillRect(fx, 2, 3, 3);
      ctx.fillStyle = '#FFEB3B';
      ctx.fillRect(fx + 1, 3, 1, 1);
    }

    canvas.refresh();
    this.textures.addSpriteSheet('ground', canvas.canvas as unknown as HTMLImageElement, {
      frameWidth: width,
      frameHeight: height,
    });
  }

  private createAnimations(): void {
    // Updated frame indices for new sprite sheet
    const frameMap = {
      idle: [0, 1, 2, 3],
      walk: [4, 5, 6, 7, 8, 9],
      jump: [10, 11],
      fall: [12, 13],
      attack: [14, 15, 16, 17],
      climb: [18, 19],
    };

    this.anims.create({
      key: 'player-idle',
      frames: this.anims.generateFrameNumbers('player', { frames: frameMap.idle }),
      frameRate: ANIM.IDLE_FPS,
      repeat: -1,
      yoyo: true,
    });

    this.anims.create({
      key: 'player-walk',
      frames: this.anims.generateFrameNumbers('player', { frames: frameMap.walk }),
      frameRate: ANIM.WALK_FPS,
      repeat: -1,
    });

    this.anims.create({
      key: 'player-jump',
      frames: this.anims.generateFrameNumbers('player', { frames: frameMap.jump }),
      frameRate: ANIM.JUMP_FPS,
      repeat: 0,
    });

    this.anims.create({
      key: 'player-fall',
      frames: this.anims.generateFrameNumbers('player', { frames: frameMap.fall }),
      frameRate: ANIM.FALL_FPS,
      repeat: 0,
    });

    this.anims.create({
      key: 'player-attack',
      frames: this.anims.generateFrameNumbers('player', { frames: frameMap.attack }),
      frameRate: ANIM.ATTACK_FPS,
      repeat: 0,
    });

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

  private createMonsterAnimations(): void {
    // Slime bounce animation
    this.anims.create({
      key: 'slime-idle',
      frames: this.anims.generateFrameNumbers('slime', { start: 0, end: 5 }),
      frameRate: 8,
      repeat: -1,
    });

    this.anims.create({
      key: 'slime-walk',
      frames: this.anims.generateFrameNumbers('slime', { start: 0, end: 5 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: 'slime-attack',
      frames: this.anims.generateFrameNumbers('slime', { frames: [2, 3, 4, 5, 0] }),
      frameRate: 12,
      repeat: 0,
    });
  }

  private createHitEffects(): void {
    // Improved physical hit effect - slash marks
    const slashCanvas = this.textures.createCanvas('slash-canvas', 48, 48);
    if (slashCanvas) {
      const ctx = slashCanvas.context;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';

      // Draw slash marks
      ctx.beginPath();
      ctx.moveTo(8, 40);
      ctx.lineTo(40, 8);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(16, 42);
      ctx.lineTo(42, 16);
      ctx.stroke();

      ctx.strokeStyle = '#FFE066';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(12, 38);
      ctx.lineTo(38, 12);
      ctx.stroke();

      slashCanvas.refresh();
      this.textures.addSpriteSheet('hit-effect-physical', slashCanvas.canvas as unknown as HTMLImageElement, {
        frameWidth: 48,
        frameHeight: 48,
      });
    }

    // Magic hit effect - sparkle burst
    const magicCanvas = this.textures.createCanvas('magic-canvas', 48, 48);
    if (magicCanvas) {
      const ctx = magicCanvas.context;
      const centerX = 24;
      const centerY = 24;

      // Outer glow
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 20);
      gradient.addColorStop(0, 'rgba(100, 200, 255, 0.8)');
      gradient.addColorStop(0.5, 'rgba(100, 150, 255, 0.4)');
      gradient.addColorStop(1, 'rgba(100, 100, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 48, 48);

      // Sparkle points
      ctx.fillStyle = '#FFFFFF';
      const points = 8;
      for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const dist = 12;
        const px = centerX + Math.cos(angle) * dist;
        const py = centerY + Math.sin(angle) * dist;
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Center star
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
      ctx.fill();

      magicCanvas.refresh();
      this.textures.addSpriteSheet('hit-effect-magic', magicCanvas.canvas as unknown as HTMLImageElement, {
        frameWidth: 48,
        frameHeight: 48,
      });
    }

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
