import Phaser from 'phaser';
import { SCENES, PLAYER, ANIM } from '../config/constants';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.BOOT });
  }

  preload(): void {
    this.showLoadingScreen();
    this.loadMonsterSprites();
    this.createPlaceholderTextures();
  }

  private loadMonsterSprites(): void {
    // Load animated monster sprite sheets
    // Each sprite has: frameWidth, frameHeight, 6 frames (3 idle + 3 move)
    const monsterSheets: Record<string, { frameWidth: number; frameHeight: number }> = {
      'orange_mushroom': { frameWidth: 64, frameHeight: 72 },
      'blue_mushroom': { frameWidth: 66, frameHeight: 74 },
      'horny_mushroom': { frameWidth: 72, frameHeight: 62 },
      'zombie_mushroom': { frameWidth: 68, frameHeight: 78 },
      'pig': { frameWidth: 84, frameHeight: 62 },
      'ribbon_pig': { frameWidth: 84, frameHeight: 66 },
      'snail': { frameWidth: 54, frameHeight: 42 },
    };

    for (const [name, config] of Object.entries(monsterSheets)) {
      this.load.spritesheet(name, `assets/sprites/monsters/sheets/${name}.png`, {
        frameWidth: config.frameWidth,
        frameHeight: config.frameHeight,
      });
    }
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
    this.createMushroomSpriteSheet();
    this.createSnailSpriteSheet();
    // Additional monster types
    this.createPigSpriteSheet();
    this.createEyeSpriteSheet();
    this.createBoarSpriteSheet();
    this.createGolemSpriteSheet();
    this.createYetiSpriteSheet();
    this.createCrabSpriteSheet();
    this.createDrakeSpriteSheet();
    this.createBossMushroomSpriteSheet();
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

  private createMushroomSpriteSheet(): void {
    const frameWidth = 40;
    const frameHeight = 44;
    const frameCount = 6;

    const canvas = this.textures.createCanvas('mushroom-sheet', frameWidth * frameCount, frameHeight);
    if (!canvas) return;

    const ctx = canvas.context;
    ctx.imageSmoothingEnabled = false;

    for (let i = 0; i < frameCount; i++) {
      this.drawMushroomFrame(ctx, i * frameWidth, 0, frameWidth, frameHeight, i);
    }

    canvas.refresh();

    this.textures.addSpriteSheet('mushroom', canvas.canvas as unknown as HTMLImageElement, {
      frameWidth,
      frameHeight,
    });
  }

  private drawMushroomFrame(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    frameNum: number
  ): void {
    const capColor = '#FF8C00';
    const capLight = '#FFA500';
    const capDark = '#CC7000';
    const stemColor = '#FFF8DC';
    const stemDark = '#F5DEB3';
    const spotColor = '#FFFACD';
    const eyeWhite = '#FFFFFF';
    const eyePupil = '#2C2C2C';
    const outlineColor = '#8B4513';

    // Bounce animation
    const bouncePhase = frameNum / 6;
    const bounce = Math.sin(bouncePhase * Math.PI * 2) * 2;

    const centerX = x + width / 2;
    const baseY = y + height - 6;

    // Draw stem
    ctx.fillStyle = stemColor;
    ctx.beginPath();
    ctx.ellipse(centerX, baseY - 10, 8, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Stem shadow
    ctx.fillStyle = stemDark;
    ctx.beginPath();
    ctx.ellipse(centerX + 2, baseY - 8, 4, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw cap
    const capY = baseY - 22 + bounce;
    ctx.fillStyle = capColor;
    ctx.beginPath();
    ctx.ellipse(centerX, capY, 16, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cap highlight
    ctx.fillStyle = capLight;
    ctx.beginPath();
    ctx.ellipse(centerX - 4, capY - 4, 8, 6, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Cap shadow (bottom)
    ctx.fillStyle = capDark;
    ctx.beginPath();
    ctx.ellipse(centerX, capY + 6, 14, 4, 0, 0, Math.PI);
    ctx.fill();

    // Spots on cap
    ctx.fillStyle = spotColor;
    ctx.beginPath();
    ctx.arc(centerX - 6, capY - 2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX + 5, capY - 4, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX + 2, capY + 2, 2, 0, Math.PI * 2);
    ctx.fill();

    // Eyes on stem
    const eyeY = baseY - 12;
    // Left eye
    ctx.fillStyle = eyeWhite;
    ctx.beginPath();
    ctx.ellipse(centerX - 4, eyeY, 3, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = eyePupil;
    ctx.beginPath();
    ctx.arc(centerX - 3, eyeY + 1, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Right eye
    ctx.fillStyle = eyeWhite;
    ctx.beginPath();
    ctx.ellipse(centerX + 4, eyeY, 3, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = eyePupil;
    ctx.beginPath();
    ctx.arc(centerX + 5, eyeY + 1, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Angry eyebrows
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX - 6, eyeY - 4);
    ctx.lineTo(centerX - 2, eyeY - 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX + 6, eyeY - 4);
    ctx.lineTo(centerX + 2, eyeY - 2);
    ctx.stroke();

    // Outline
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(centerX, capY, 16, 12, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  private createSnailSpriteSheet(): void {
    const frameWidth = 44;
    const frameHeight = 32;
    const frameCount = 6;

    const canvas = this.textures.createCanvas('snail-sheet', frameWidth * frameCount, frameHeight);
    if (!canvas) return;

    const ctx = canvas.context;
    ctx.imageSmoothingEnabled = false;

    for (let i = 0; i < frameCount; i++) {
      this.drawSnailFrame(ctx, i * frameWidth, 0, frameWidth, frameHeight, i);
    }

    canvas.refresh();

    this.textures.addSpriteSheet('snail', canvas.canvas as unknown as HTMLImageElement, {
      frameWidth,
      frameHeight,
    });
  }

  private drawSnailFrame(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    frameNum: number
  ): void {
    const shellColor = '#CD5C5C';
    const shellLight = '#F08080';
    const shellDark = '#8B0000';
    const bodyColor = '#DEB887';
    const bodyDark = '#D2A679';
    const eyeWhite = '#FFFFFF';
    const eyePupil = '#2C2C2C';
    const outlineColor = '#8B4513';

    // Crawl animation - body stretches
    const crawlPhase = frameNum / 6;
    const stretch = Math.sin(crawlPhase * Math.PI * 2) * 2;

    const centerX = x + width / 2;
    const baseY = y + height - 4;

    // Draw body (slug part)
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(centerX - 4 - stretch, baseY - 6, 14 + stretch, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body shadow
    ctx.fillStyle = bodyDark;
    ctx.beginPath();
    ctx.ellipse(centerX - 4 - stretch, baseY - 4, 12 + stretch, 3, 0, 0, Math.PI);
    ctx.fill();

    // Draw shell
    const shellX = centerX + 6;
    const shellY = baseY - 12;

    // Shell spiral
    ctx.fillStyle = shellColor;
    ctx.beginPath();
    ctx.arc(shellX, shellY, 10, 0, Math.PI * 2);
    ctx.fill();

    // Shell highlight
    ctx.fillStyle = shellLight;
    ctx.beginPath();
    ctx.arc(shellX - 2, shellY - 2, 5, 0, Math.PI * 2);
    ctx.fill();

    // Shell spiral lines
    ctx.strokeStyle = shellDark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(shellX, shellY, 6, 0.5, Math.PI * 1.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(shellX, shellY, 3, 0, Math.PI);
    ctx.stroke();

    // Shell outline
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(shellX, shellY, 10, 0, Math.PI * 2);
    ctx.stroke();

    // Eye stalks
    const eyeStalkX = centerX - 14 - stretch;
    ctx.strokeStyle = bodyColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(eyeStalkX, baseY - 8);
    ctx.lineTo(eyeStalkX - 4, baseY - 16);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(eyeStalkX + 6, baseY - 8);
    ctx.lineTo(eyeStalkX + 2, baseY - 16);
    ctx.stroke();

    // Eyes
    ctx.fillStyle = eyeWhite;
    ctx.beginPath();
    ctx.arc(eyeStalkX - 4, baseY - 17, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(eyeStalkX + 2, baseY - 17, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = eyePupil;
    ctx.beginPath();
    ctx.arc(eyeStalkX - 4, baseY - 16, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(eyeStalkX + 2, baseY - 16, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // ===== NEW MONSTER SPRITE SHEETS =====

  private createPigSpriteSheet(): void {
    const frameWidth = 48;
    const frameHeight = 40;
    const frameCount = 6;

    const canvas = this.textures.createCanvas('pig-sheet', frameWidth * frameCount, frameHeight);
    if (!canvas) return;

    const ctx = canvas.context;
    ctx.imageSmoothingEnabled = false;

    for (let i = 0; i < frameCount; i++) {
      this.drawPigFrame(ctx, i * frameWidth, 0, frameWidth, frameHeight, i);
    }

    canvas.refresh();
    this.textures.addSpriteSheet('pig', canvas.canvas as unknown as HTMLImageElement, { frameWidth, frameHeight });
  }

  private drawPigFrame(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, frameNum: number): void {
    const bodyColor = '#FFB6C1';
    const bodyDark = '#FF91A4';
    const snoutColor = '#FFC0CB';
    const outlineColor = '#8B4563';
    const eyeColor = '#2C2C2C';

    const bouncePhase = frameNum / 6;
    const bounce = Math.sin(bouncePhase * Math.PI * 2) * 2;
    const centerX = x + width / 2;
    const baseY = y + height - 8;

    // Body (oval)
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(centerX, baseY - 14 + bounce, 18, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body shadow
    ctx.fillStyle = bodyDark;
    ctx.beginPath();
    ctx.ellipse(centerX + 4, baseY - 10 + bounce, 10, 8, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Legs
    ctx.fillStyle = bodyDark;
    ctx.fillRect(centerX - 12, baseY - 6, 6, 8);
    ctx.fillRect(centerX + 6, baseY - 6, 6, 8);

    // Head
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(centerX - 10, baseY - 18 + bounce, 10, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Snout
    ctx.fillStyle = snoutColor;
    ctx.beginPath();
    ctx.ellipse(centerX - 18, baseY - 16 + bounce, 6, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Nostrils
    ctx.fillStyle = bodyDark;
    ctx.beginPath();
    ctx.arc(centerX - 20, baseY - 16 + bounce, 1.5, 0, Math.PI * 2);
    ctx.arc(centerX - 16, baseY - 16 + bounce, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Ears
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.moveTo(centerX - 14, baseY - 26 + bounce);
    ctx.lineTo(centerX - 10, baseY - 32 + bounce);
    ctx.lineTo(centerX - 6, baseY - 26 + bounce);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(centerX - 6, baseY - 26 + bounce);
    ctx.lineTo(centerX - 2, baseY - 32 + bounce);
    ctx.lineTo(centerX + 2, baseY - 26 + bounce);
    ctx.fill();

    // Eye
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(centerX - 8, baseY - 20 + bounce, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = eyeColor;
    ctx.beginPath();
    ctx.arc(centerX - 7, baseY - 19 + bounce, 2, 0, Math.PI * 2);
    ctx.fill();

    // Tail (curly)
    ctx.strokeStyle = bodyDark;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX + 16, baseY - 18 + bounce, 4, 0, Math.PI * 1.5);
    ctx.stroke();

    // Outline
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(centerX, baseY - 14 + bounce, 18, 12, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  private createEyeSpriteSheet(): void {
    const frameWidth = 44;
    const frameHeight = 44;
    const frameCount = 6;

    const canvas = this.textures.createCanvas('evil_eye-sheet', frameWidth * frameCount, frameHeight);
    if (!canvas) return;

    const ctx = canvas.context;
    ctx.imageSmoothingEnabled = false;

    for (let i = 0; i < frameCount; i++) {
      this.drawEyeFrame(ctx, i * frameWidth, 0, frameWidth, frameHeight, i, '#9932CC', '#6B238E'); // Purple for evil eye
    }

    canvas.refresh();
    this.textures.addSpriteSheet('evil_eye', canvas.canvas as unknown as HTMLImageElement, { frameWidth, frameHeight });

    // Create curse eye variant (darker purple)
    const curseCanvas = this.textures.createCanvas('curse_eye-sheet', frameWidth * frameCount, frameHeight);
    if (!curseCanvas) return;

    const curseCtx = curseCanvas.context;
    curseCtx.imageSmoothingEnabled = false;

    for (let i = 0; i < frameCount; i++) {
      this.drawEyeFrame(curseCtx, i * frameWidth, 0, frameWidth, frameHeight, i, '#4B0082', '#2E0854'); // Indigo for curse eye
    }

    curseCanvas.refresh();
    this.textures.addSpriteSheet('curse_eye', curseCanvas.canvas as unknown as HTMLImageElement, { frameWidth, frameHeight });
  }

  private drawEyeFrame(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, frameNum: number, mainColor: string, darkColor: string): void {
    const floatPhase = frameNum / 6;
    const float = Math.sin(floatPhase * Math.PI * 2) * 3;
    const centerX = x + width / 2;
    const centerY = y + height / 2 + float;

    // Outer body (sphere)
    ctx.fillStyle = mainColor;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 16, 0, Math.PI * 2);
    ctx.fill();

    // Shadow
    ctx.fillStyle = darkColor;
    ctx.beginPath();
    ctx.arc(centerX + 4, centerY + 4, 14, 0, Math.PI * 2);
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.ellipse(centerX - 6, centerY - 6, 6, 4, -0.5, 0, Math.PI * 2);
    ctx.fill();

    // Large central eye
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, 10, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Iris
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
    ctx.fill();

    // Pupil
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
    ctx.fill();

    // Eye shine
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(centerX - 2, centerY - 2, 2, 0, Math.PI * 2);
    ctx.fill();

    // Small bat-like wings
    ctx.fillStyle = darkColor;
    // Left wing
    ctx.beginPath();
    ctx.moveTo(centerX - 14, centerY - 4);
    ctx.quadraticCurveTo(centerX - 24, centerY - 10, centerX - 20, centerY + 2);
    ctx.quadraticCurveTo(centerX - 18, centerY - 2, centerX - 14, centerY);
    ctx.fill();
    // Right wing
    ctx.beginPath();
    ctx.moveTo(centerX + 14, centerY - 4);
    ctx.quadraticCurveTo(centerX + 24, centerY - 10, centerX + 20, centerY + 2);
    ctx.quadraticCurveTo(centerX + 18, centerY - 2, centerX + 14, centerY);
    ctx.fill();
  }

  private createBoarSpriteSheet(): void {
    const frameWidth = 56;
    const frameHeight = 48;
    const frameCount = 6;

    // Regular boar (brown)
    const canvas = this.textures.createCanvas('wild_boar-sheet', frameWidth * frameCount, frameHeight);
    if (!canvas) return;
    const ctx = canvas.context;
    ctx.imageSmoothingEnabled = false;
    for (let i = 0; i < frameCount; i++) {
      this.drawBoarFrame(ctx, i * frameWidth, 0, frameWidth, frameHeight, i, '#8B4513', '#654321', false);
    }
    canvas.refresh();
    this.textures.addSpriteSheet('wild_boar', canvas.canvas as unknown as HTMLImageElement, { frameWidth, frameHeight });

    // Fire boar (red/orange)
    const fireCanvas = this.textures.createCanvas('fire_boar-sheet', frameWidth * frameCount, frameHeight);
    if (!fireCanvas) return;
    const fireCtx = fireCanvas.context;
    fireCtx.imageSmoothingEnabled = false;
    for (let i = 0; i < frameCount; i++) {
      this.drawBoarFrame(fireCtx, i * frameWidth, 0, frameWidth, frameHeight, i, '#8B0000', '#FF4500', true);
    }
    fireCanvas.refresh();
    this.textures.addSpriteSheet('fire_boar', fireCanvas.canvas as unknown as HTMLImageElement, { frameWidth, frameHeight });
  }

  private drawBoarFrame(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, frameNum: number, bodyColor: string, accentColor: string, hasFlames: boolean): void {
    const runPhase = frameNum / 6;
    const run = Math.sin(runPhase * Math.PI * 2) * 3;
    const legOffset = Math.sin(runPhase * Math.PI * 2) * 4;
    const centerX = x + width / 2;
    const baseY = y + height - 6;

    // Legs
    ctx.fillStyle = accentColor;
    ctx.fillRect(centerX - 18 + legOffset, baseY - 8, 6, 12);
    ctx.fillRect(centerX - 8 - legOffset, baseY - 8, 6, 12);
    ctx.fillRect(centerX + 6 + legOffset, baseY - 8, 6, 12);
    ctx.fillRect(centerX + 14 - legOffset, baseY - 8, 6, 12);

    // Body
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(centerX, baseY - 18 + run * 0.3, 22, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.beginPath();
    ctx.ellipse(centerX - 18, baseY - 22 + run * 0.3, 12, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Snout
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.ellipse(centerX - 28, baseY - 20 + run * 0.3, 6, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tusks
    ctx.fillStyle = '#FFFFF0';
    ctx.beginPath();
    ctx.moveTo(centerX - 26, baseY - 18 + run * 0.3);
    ctx.lineTo(centerX - 32, baseY - 14 + run * 0.3);
    ctx.lineTo(centerX - 28, baseY - 16 + run * 0.3);
    ctx.fill();

    // Eye
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(centerX - 16, baseY - 24 + run * 0.3, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(centerX - 15, baseY - 24 + run * 0.3, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Mohawk/mane
    ctx.fillStyle = accentColor;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(centerX - 12 + i * 6, baseY - 30 + run * 0.3);
      ctx.lineTo(centerX - 10 + i * 6, baseY - 38 + run * 0.3 - i);
      ctx.lineTo(centerX - 8 + i * 6, baseY - 30 + run * 0.3);
      ctx.fill();
    }

    // Fire effect for fire boar
    if (hasFlames) {
      ctx.fillStyle = '#FF6600';
      for (let i = 0; i < 4; i++) {
        const flameX = centerX - 10 + i * 8 + Math.sin(frameNum + i) * 2;
        const flameY = baseY - 34 + run * 0.3;
        ctx.beginPath();
        ctx.moveTo(flameX - 3, flameY);
        ctx.quadraticCurveTo(flameX, flameY - 8 - Math.sin(frameNum * 2 + i) * 3, flameX + 3, flameY);
        ctx.fill();
      }
      ctx.fillStyle = '#FFFF00';
      for (let i = 0; i < 3; i++) {
        const flameX = centerX - 6 + i * 8;
        const flameY = baseY - 32 + run * 0.3;
        ctx.beginPath();
        ctx.arc(flameX, flameY, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private createGolemSpriteSheet(): void {
    const frameWidth = 60;
    const frameHeight = 64;
    const frameCount = 6;

    // Stone golem (gray)
    const canvas = this.textures.createCanvas('stone_golem-sheet', frameWidth * frameCount, frameHeight);
    if (!canvas) return;
    const ctx = canvas.context;
    ctx.imageSmoothingEnabled = false;
    for (let i = 0; i < frameCount; i++) {
      this.drawGolemFrame(ctx, i * frameWidth, 0, frameWidth, frameHeight, i, '#696969', '#4A4A4A', '#808080');
    }
    canvas.refresh();
    this.textures.addSpriteSheet('stone_golem', canvas.canvas as unknown as HTMLImageElement, { frameWidth, frameHeight });

    // Block golem (colorful - toy blocks)
    const blockCanvas = this.textures.createCanvas('block_golem-sheet', frameWidth * frameCount, frameHeight);
    if (!blockCanvas) return;
    const blockCtx = blockCanvas.context;
    blockCtx.imageSmoothingEnabled = false;
    for (let i = 0; i < frameCount; i++) {
      this.drawGolemFrame(blockCtx, i * frameWidth, 0, frameWidth, frameHeight, i, '#FF6B6B', '#4ECDC4', '#FFE66D');
    }
    blockCanvas.refresh();
    this.textures.addSpriteSheet('block_golem', blockCanvas.canvas as unknown as HTMLImageElement, { frameWidth, frameHeight });
  }

  private drawGolemFrame(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, frameNum: number, color1: string, color2: string, color3: string): void {
    const walkPhase = frameNum / 6;
    const walk = Math.sin(walkPhase * Math.PI * 2) * 2;
    const centerX = x + width / 2;
    const baseY = y + height - 4;

    // Legs (blocky)
    ctx.fillStyle = color2;
    ctx.fillRect(centerX - 18, baseY - 20, 14, 22);
    ctx.fillRect(centerX + 4, baseY - 20, 14, 22);

    // Body (large rectangle)
    ctx.fillStyle = color1;
    ctx.fillRect(centerX - 22, baseY - 48 + walk, 44, 32);

    // Chest pattern
    ctx.fillStyle = color3;
    ctx.fillRect(centerX - 10, baseY - 44 + walk, 20, 8);

    // Head
    ctx.fillStyle = color1;
    ctx.fillRect(centerX - 14, baseY - 62 + walk, 28, 18);

    // Eyes (glowing)
    ctx.fillStyle = '#FFFF00';
    ctx.fillRect(centerX - 10, baseY - 56 + walk, 6, 6);
    ctx.fillRect(centerX + 4, baseY - 56 + walk, 6, 6);
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(centerX - 8, baseY - 54 + walk, 3, 3);
    ctx.fillRect(centerX + 6, baseY - 54 + walk, 3, 3);

    // Arms
    const armSwing = Math.sin(walkPhase * Math.PI * 2) * 8;
    ctx.fillStyle = color2;
    // Left arm
    ctx.save();
    ctx.translate(centerX - 22, baseY - 44 + walk);
    ctx.rotate(armSwing * 0.05);
    ctx.fillRect(-12, 0, 12, 28);
    ctx.restore();
    // Right arm
    ctx.save();
    ctx.translate(centerX + 22, baseY - 44 + walk);
    ctx.rotate(-armSwing * 0.05);
    ctx.fillRect(0, 0, 12, 28);
    ctx.restore();

    // Cracks/details
    ctx.strokeStyle = color2;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX - 5, baseY - 40 + walk);
    ctx.lineTo(centerX + 5, baseY - 35 + walk);
    ctx.stroke();
  }

  private createYetiSpriteSheet(): void {
    const frameWidth = 52;
    const frameHeight = 56;
    const frameCount = 6;

    // Jr Yeti (smaller)
    const jrCanvas = this.textures.createCanvas('jr_yeti-sheet', frameWidth * frameCount, frameHeight);
    if (!jrCanvas) return;
    const jrCtx = jrCanvas.context;
    jrCtx.imageSmoothingEnabled = false;
    for (let i = 0; i < frameCount; i++) {
      this.drawYetiFrame(jrCtx, i * frameWidth, 0, frameWidth, frameHeight, i, 0.8);
    }
    jrCanvas.refresh();
    this.textures.addSpriteSheet('jr_yeti', jrCanvas.canvas as unknown as HTMLImageElement, { frameWidth, frameHeight });

    // Regular Yeti (larger frame)
    const yetiWidth = 68;
    const yetiHeight = 72;
    const yetiCanvas = this.textures.createCanvas('yeti-sheet', yetiWidth * frameCount, yetiHeight);
    if (!yetiCanvas) return;
    const yetiCtx = yetiCanvas.context;
    yetiCtx.imageSmoothingEnabled = false;
    for (let i = 0; i < frameCount; i++) {
      this.drawYetiFrame(yetiCtx, i * yetiWidth, 0, yetiWidth, yetiHeight, i, 1.0);
    }
    yetiCanvas.refresh();
    this.textures.addSpriteSheet('yeti', yetiCanvas.canvas as unknown as HTMLImageElement, { frameWidth: yetiWidth, frameHeight: yetiHeight });
  }

  private drawYetiFrame(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, frameNum: number, scale: number): void {
    const furColor = '#E8E8E8';
    const furDark = '#C0C0C0';
    const furLight = '#FFFFFF';

    const bouncePhase = frameNum / 6;
    const bounce = Math.sin(bouncePhase * Math.PI * 2) * 2;
    const centerX = x + width / 2;
    const baseY = y + height - 6;

    const s = scale;

    // Body (fluffy)
    ctx.fillStyle = furColor;
    ctx.beginPath();
    ctx.ellipse(centerX, baseY - 24 * s + bounce, 24 * s, 20 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    // Fur texture
    ctx.fillStyle = furLight;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const fx = centerX + Math.cos(angle) * 18 * s;
      const fy = baseY - 24 * s + bounce + Math.sin(angle) * 14 * s;
      ctx.beginPath();
      ctx.ellipse(fx, fy, 4 * s, 6 * s, angle, 0, Math.PI * 2);
      ctx.fill();
    }

    // Arms
    ctx.fillStyle = furColor;
    ctx.beginPath();
    ctx.ellipse(centerX - 26 * s, baseY - 20 * s + bounce, 10 * s, 14 * s, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(centerX + 26 * s, baseY - 20 * s + bounce, 10 * s, 14 * s, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Legs
    ctx.fillStyle = furDark;
    ctx.beginPath();
    ctx.ellipse(centerX - 10 * s, baseY - 6 * s, 8 * s, 10 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(centerX + 10 * s, baseY - 6 * s, 8 * s, 10 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = furColor;
    ctx.beginPath();
    ctx.ellipse(centerX, baseY - 44 * s + bounce, 16 * s, 14 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    // Horns
    ctx.fillStyle = '#4A4A4A';
    ctx.beginPath();
    ctx.moveTo(centerX - 12 * s, baseY - 52 * s + bounce);
    ctx.lineTo(centerX - 18 * s, baseY - 64 * s + bounce);
    ctx.lineTo(centerX - 8 * s, baseY - 54 * s + bounce);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(centerX + 12 * s, baseY - 52 * s + bounce);
    ctx.lineTo(centerX + 18 * s, baseY - 64 * s + bounce);
    ctx.lineTo(centerX + 8 * s, baseY - 54 * s + bounce);
    ctx.fill();

    // Face
    ctx.fillStyle = '#87CEEB';
    ctx.beginPath();
    ctx.ellipse(centerX, baseY - 42 * s + bounce, 10 * s, 8 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(centerX - 4 * s, baseY - 44 * s + bounce, 2 * s, 0, Math.PI * 2);
    ctx.arc(centerX + 4 * s, baseY - 44 * s + bounce, 2 * s, 0, Math.PI * 2);
    ctx.fill();

    // Mouth
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, baseY - 38 * s + bounce, 4 * s, 0, Math.PI);
    ctx.stroke();
  }

  private createCrabSpriteSheet(): void {
    const frameWidth = 52;
    const frameHeight = 44;
    const frameCount = 6;

    // Lorang (orange crab)
    const lorangCanvas = this.textures.createCanvas('lorang-sheet', frameWidth * frameCount, frameHeight);
    if (!lorangCanvas) return;
    const lorangCtx = lorangCanvas.context;
    lorangCtx.imageSmoothingEnabled = false;
    for (let i = 0; i < frameCount; i++) {
      this.drawCrabFrame(lorangCtx, i * frameWidth, 0, frameWidth, frameHeight, i, '#FF6B35', '#CC5500');
    }
    lorangCanvas.refresh();
    this.textures.addSpriteSheet('lorang', lorangCanvas.canvas as unknown as HTMLImageElement, { frameWidth, frameHeight });

    // Clang (blue crab)
    const clangCanvas = this.textures.createCanvas('clang-sheet', frameWidth * frameCount, frameHeight);
    if (!clangCanvas) return;
    const clangCtx = clangCanvas.context;
    clangCtx.imageSmoothingEnabled = false;
    for (let i = 0; i < frameCount; i++) {
      this.drawCrabFrame(clangCtx, i * frameWidth, 0, frameWidth, frameHeight, i, '#4169E1', '#2E4A8E');
    }
    clangCanvas.refresh();
    this.textures.addSpriteSheet('clang', clangCanvas.canvas as unknown as HTMLImageElement, { frameWidth, frameHeight });

    // Octopus
    const octoCanvas = this.textures.createCanvas('octopus-sheet', frameWidth * frameCount, frameHeight);
    if (!octoCanvas) return;
    const octoCtx = octoCanvas.context;
    octoCtx.imageSmoothingEnabled = false;
    for (let i = 0; i < frameCount; i++) {
      this.drawOctopusFrame(octoCtx, i * frameWidth, 0, frameWidth, frameHeight, i);
    }
    octoCanvas.refresh();
    this.textures.addSpriteSheet('octopus', octoCanvas.canvas as unknown as HTMLImageElement, { frameWidth, frameHeight });

    // Ligator
    const ligatorCanvas = this.textures.createCanvas('ligator-sheet', 56 * frameCount, 36);
    if (!ligatorCanvas) return;
    const ligatorCtx = ligatorCanvas.context;
    ligatorCtx.imageSmoothingEnabled = false;
    for (let i = 0; i < frameCount; i++) {
      this.drawLigatorFrame(ligatorCtx, i * 56, 0, 56, 36, i);
    }
    ligatorCanvas.refresh();
    this.textures.addSpriteSheet('ligator', ligatorCanvas.canvas as unknown as HTMLImageElement, { frameWidth: 56, frameHeight: 36 });
  }

  private drawCrabFrame(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, frameNum: number, bodyColor: string, darkColor: string): void {
    const walkPhase = frameNum / 6;
    const legMove = Math.sin(walkPhase * Math.PI * 2) * 4;
    const centerX = x + width / 2;
    const baseY = y + height - 8;

    // Legs (4 on each side)
    ctx.strokeStyle = darkColor;
    ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) {
      const move = (i % 2 === 0) ? legMove : -legMove;
      // Left legs
      ctx.beginPath();
      ctx.moveTo(centerX - 10, baseY - 10);
      ctx.lineTo(centerX - 18 - i * 2 + move, baseY - 4 + i * 2);
      ctx.stroke();
      // Right legs
      ctx.beginPath();
      ctx.moveTo(centerX + 10, baseY - 10);
      ctx.lineTo(centerX + 18 + i * 2 - move, baseY - 4 + i * 2);
      ctx.stroke();
    }

    // Body (shell)
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(centerX, baseY - 14, 16, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Shell highlight
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.ellipse(centerX - 4, baseY - 18, 8, 5, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Claws
    ctx.fillStyle = bodyColor;
    // Left claw
    ctx.beginPath();
    ctx.ellipse(centerX - 22, baseY - 18 + legMove * 0.5, 8, 10, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(centerX - 28, baseY - 14 + legMove * 0.5, 4, 6, 0.3, 0, Math.PI * 2);
    ctx.fill();
    // Right claw
    ctx.beginPath();
    ctx.ellipse(centerX + 22, baseY - 18 - legMove * 0.5, 8, 10, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(centerX + 28, baseY - 14 - legMove * 0.5, 4, 6, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Eyes on stalks
    ctx.fillStyle = darkColor;
    ctx.beginPath();
    ctx.moveTo(centerX - 6, baseY - 22);
    ctx.lineTo(centerX - 8, baseY - 32);
    ctx.lineTo(centerX - 4, baseY - 22);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(centerX + 6, baseY - 22);
    ctx.lineTo(centerX + 8, baseY - 32);
    ctx.lineTo(centerX + 4, baseY - 22);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(centerX - 8, baseY - 34, 4, 0, Math.PI * 2);
    ctx.arc(centerX + 8, baseY - 34, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(centerX - 8, baseY - 33, 2, 0, Math.PI * 2);
    ctx.arc(centerX + 8, baseY - 33, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawOctopusFrame(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, frameNum: number): void {
    const bodyColor = '#FF69B4';
    const darkColor = '#DB7093';
    const floatPhase = frameNum / 6;
    const float = Math.sin(floatPhase * Math.PI * 2) * 3;
    const tentacleWave = Math.sin(floatPhase * Math.PI * 2) * 5;
    const centerX = x + width / 2;
    const baseY = y + height - 6;

    // Tentacles
    ctx.strokeStyle = darkColor;
    ctx.lineWidth = 4;
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI - Math.PI / 2;
      const wave = Math.sin(floatPhase * Math.PI * 2 + i) * 4;
      ctx.beginPath();
      ctx.moveTo(centerX + Math.cos(angle) * 8, baseY - 8 + float);
      ctx.quadraticCurveTo(
        centerX + Math.cos(angle) * 14 + wave,
        baseY + 4 + float,
        centerX + Math.cos(angle) * 10 + tentacleWave * (i % 2 === 0 ? 1 : -1),
        baseY + 10 + float
      );
      ctx.stroke();
    }

    // Body (head)
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(centerX, baseY - 18 + float, 14, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body highlight
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.ellipse(centerX - 4, baseY - 24 + float, 6, 8, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(centerX - 5, baseY - 20 + float, 5, 6, 0, 0, Math.PI * 2);
    ctx.ellipse(centerX + 5, baseY - 20 + float, 5, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(centerX - 4, baseY - 18 + float, 2, 0, Math.PI * 2);
    ctx.arc(centerX + 6, baseY - 18 + float, 2, 0, Math.PI * 2);
    ctx.fill();

    // Mouth
    ctx.beginPath();
    ctx.arc(centerX, baseY - 10 + float, 3, 0, Math.PI);
    ctx.stroke();
  }

  private drawLigatorFrame(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, frameNum: number): void {
    const bodyColor = '#228B22';
    const darkColor = '#006400';
    const bellyColor = '#90EE90';
    const walkPhase = frameNum / 6;
    const walk = Math.sin(walkPhase * Math.PI * 2) * 2;
    const tailWave = Math.sin(walkPhase * Math.PI * 2) * 4;
    const centerX = x + width / 2;
    const baseY = y + height - 4;

    // Tail
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.moveTo(centerX + 16, baseY - 10 + walk);
    ctx.quadraticCurveTo(centerX + 28, baseY - 8 + tailWave, centerX + 26, baseY - 14 + walk);
    ctx.quadraticCurveTo(centerX + 22, baseY - 12 + tailWave * 0.5, centerX + 16, baseY - 14 + walk);
    ctx.fill();

    // Body
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(centerX, baseY - 12 + walk, 18, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Belly
    ctx.fillStyle = bellyColor;
    ctx.beginPath();
    ctx.ellipse(centerX, baseY - 10 + walk, 12, 4, 0, 0, Math.PI);
    ctx.fill();

    // Legs
    ctx.fillStyle = darkColor;
    ctx.fillRect(centerX - 12, baseY - 6, 6, 8);
    ctx.fillRect(centerX + 6, baseY - 6, 6, 8);

    // Head
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(centerX - 16, baseY - 14 + walk, 10, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Snout
    ctx.beginPath();
    ctx.ellipse(centerX - 26, baseY - 12 + walk, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Teeth
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(centerX - 30, baseY - 10 + walk);
    ctx.lineTo(centerX - 28, baseY - 6 + walk);
    ctx.lineTo(centerX - 26, baseY - 10 + walk);
    ctx.fill();

    // Eye
    ctx.fillStyle = '#FFFF00';
    ctx.beginPath();
    ctx.arc(centerX - 14, baseY - 16 + walk, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(centerX - 13, baseY - 16 + walk, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Scales on back
    ctx.fillStyle = darkColor;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(centerX - 8 + i * 6, baseY - 18 + walk);
      ctx.lineTo(centerX - 6 + i * 6, baseY - 22 + walk);
      ctx.lineTo(centerX - 4 + i * 6, baseY - 18 + walk);
      ctx.fill();
    }
  }

  private createDrakeSpriteSheet(): void {
    const frameWidth = 60;
    const frameHeight = 56;
    const frameCount = 6;

    const canvas = this.textures.createCanvas('drake-sheet', frameWidth * frameCount, frameHeight);
    if (!canvas) return;

    const ctx = canvas.context;
    ctx.imageSmoothingEnabled = false;

    for (let i = 0; i < frameCount; i++) {
      this.drawDrakeFrame(ctx, i * frameWidth, 0, frameWidth, frameHeight, i);
    }

    canvas.refresh();
    this.textures.addSpriteSheet('drake', canvas.canvas as unknown as HTMLImageElement, { frameWidth, frameHeight });
  }

  private drawDrakeFrame(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, frameNum: number): void {
    const bodyColor = '#8B0000';
    const wingColor = '#CD5C5C';
    const bellyColor = '#DEB887';

    const flapPhase = frameNum / 6;
    const flap = Math.sin(flapPhase * Math.PI * 2) * 0.3;
    const float = Math.sin(flapPhase * Math.PI * 2) * 3;
    const centerX = x + width / 2;
    const baseY = y + height - 10;

    // Wings
    ctx.fillStyle = wingColor;
    // Left wing
    ctx.save();
    ctx.translate(centerX - 8, baseY - 24 + float);
    ctx.rotate(-0.5 + flap);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-20, -8);
    ctx.lineTo(-16, 4);
    ctx.lineTo(-8, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Right wing
    ctx.save();
    ctx.translate(centerX + 8, baseY - 24 + float);
    ctx.rotate(0.5 - flap);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(20, -8);
    ctx.lineTo(16, 4);
    ctx.lineTo(8, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Tail
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.moveTo(centerX + 14, baseY - 14 + float);
    ctx.quadraticCurveTo(centerX + 26, baseY - 10 + float, centerX + 28, baseY - 16 + float);
    ctx.quadraticCurveTo(centerX + 24, baseY - 18 + float, centerX + 14, baseY - 18 + float);
    ctx.fill();

    // Body
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(centerX, baseY - 16 + float, 16, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Belly
    ctx.fillStyle = bellyColor;
    ctx.beginPath();
    ctx.ellipse(centerX, baseY - 12 + float, 10, 6, 0, 0, Math.PI);
    ctx.fill();

    // Legs
    ctx.fillStyle = bodyColor;
    ctx.fillRect(centerX - 10, baseY - 6 + float, 6, 10);
    ctx.fillRect(centerX + 4, baseY - 6 + float, 6, 10);
    // Claws
    ctx.fillStyle = '#4A4A4A';
    ctx.beginPath();
    ctx.moveTo(centerX - 10, baseY + 4 + float);
    ctx.lineTo(centerX - 14, baseY + 6 + float);
    ctx.lineTo(centerX - 8, baseY + 4 + float);
    ctx.fill();

    // Head
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(centerX - 14, baseY - 26 + float, 10, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Snout
    ctx.beginPath();
    ctx.ellipse(centerX - 24, baseY - 24 + float, 6, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Horns
    ctx.fillStyle = '#4A4A4A';
    ctx.beginPath();
    ctx.moveTo(centerX - 10, baseY - 34 + float);
    ctx.lineTo(centerX - 6, baseY - 42 + float);
    ctx.lineTo(centerX - 4, baseY - 32 + float);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(centerX - 18, baseY - 34 + float);
    ctx.lineTo(centerX - 22, baseY - 42 + float);
    ctx.lineTo(centerX - 20, baseY - 32 + float);
    ctx.fill();

    // Eye
    ctx.fillStyle = '#FFFF00';
    ctx.beginPath();
    ctx.arc(centerX - 12, baseY - 28 + float, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(centerX - 11, baseY - 28 + float, 2, 0, Math.PI * 2);
    ctx.fill();

    // Fire breath particles
    if (frameNum >= 3) {
      ctx.fillStyle = '#FF6600';
      ctx.beginPath();
      ctx.arc(centerX - 30, baseY - 22 + float, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFF00';
      ctx.beginPath();
      ctx.arc(centerX - 28, baseY - 24 + float, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private createBossMushroomSpriteSheet(): void {
    const frameWidth = 80;
    const frameHeight = 88;
    const frameCount = 6;

    // Mushmom
    const mushmomCanvas = this.textures.createCanvas('mushmom-sheet', frameWidth * frameCount, frameHeight);
    if (!mushmomCanvas) return;
    const mushmomCtx = mushmomCanvas.context;
    mushmomCtx.imageSmoothingEnabled = false;
    for (let i = 0; i < frameCount; i++) {
      this.drawBossMushroomFrame(mushmomCtx, i * frameWidth, 0, frameWidth, frameHeight, i, '#FF1493', '#C71585');
    }
    mushmomCanvas.refresh();
    this.textures.addSpriteSheet('mushmom', mushmomCanvas.canvas as unknown as HTMLImageElement, { frameWidth, frameHeight });

    // Zombie Mushmom
    const zombieCanvas = this.textures.createCanvas('zombie_mushmom-sheet', frameWidth * frameCount, frameHeight);
    if (!zombieCanvas) return;
    const zombieCtx = zombieCanvas.context;
    zombieCtx.imageSmoothingEnabled = false;
    for (let i = 0; i < frameCount; i++) {
      this.drawBossMushroomFrame(zombieCtx, i * frameWidth, 0, frameWidth, frameHeight, i, '#4B0082', '#2E0854');
    }
    zombieCanvas.refresh();
    this.textures.addSpriteSheet('zombie_mushmom', zombieCanvas.canvas as unknown as HTMLImageElement, { frameWidth, frameHeight });

    // Sentinel, Ratz, Tick, etc - simpler variants
    this.createSimpleMonsterVariants();
  }

  private drawBossMushroomFrame(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, frameNum: number, capColor: string, capDark: string): void {
    const stemColor = '#FFF8DC';
    const stemDark = '#DEB887';
    const spotColor = '#FFFFFF';

    const bouncePhase = frameNum / 6;
    const bounce = Math.sin(bouncePhase * Math.PI * 2) * 3;
    const centerX = x + width / 2;
    const baseY = y + height - 8;

    // Stem (large)
    ctx.fillStyle = stemColor;
    ctx.beginPath();
    ctx.ellipse(centerX, baseY - 24, 20, 28, 0, 0, Math.PI * 2);
    ctx.fill();

    // Stem shadow
    ctx.fillStyle = stemDark;
    ctx.beginPath();
    ctx.ellipse(centerX + 6, baseY - 20, 12, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // Feet
    ctx.fillStyle = stemDark;
    ctx.beginPath();
    ctx.ellipse(centerX - 12, baseY - 6, 10, 8, 0, 0, Math.PI * 2);
    ctx.ellipse(centerX + 12, baseY - 6, 10, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cap (giant)
    const capY = baseY - 52 + bounce;
    ctx.fillStyle = capColor;
    ctx.beginPath();
    ctx.ellipse(centerX, capY, 36, 28, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cap highlight
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.ellipse(centerX - 10, capY - 10, 16, 12, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Cap shadow
    ctx.fillStyle = capDark;
    ctx.beginPath();
    ctx.ellipse(centerX, capY + 16, 30, 8, 0, 0, Math.PI);
    ctx.fill();

    // Spots
    ctx.fillStyle = spotColor;
    ctx.beginPath();
    ctx.arc(centerX - 14, capY - 6, 6, 0, Math.PI * 2);
    ctx.arc(centerX + 10, capY - 10, 5, 0, Math.PI * 2);
    ctx.arc(centerX + 18, capY + 2, 4, 0, Math.PI * 2);
    ctx.arc(centerX - 6, capY + 8, 4, 0, Math.PI * 2);
    ctx.arc(centerX - 22, capY + 4, 3, 0, Math.PI * 2);
    ctx.fill();

    // Eyes (angry)
    const eyeY = baseY - 30;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(centerX - 8, eyeY, 6, 8, 0, 0, Math.PI * 2);
    ctx.ellipse(centerX + 8, eyeY, 6, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(centerX - 6, eyeY + 1, 3, 0, Math.PI * 2);
    ctx.arc(centerX + 10, eyeY + 1, 3, 0, Math.PI * 2);
    ctx.fill();

    // Angry eyebrows
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX - 14, eyeY - 8);
    ctx.lineTo(centerX - 4, eyeY - 4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX + 14, eyeY - 8);
    ctx.lineTo(centerX + 4, eyeY - 4);
    ctx.stroke();

    // Mouth (scary)
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(centerX, baseY - 14, 8, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Teeth
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(centerX - 6, baseY - 16);
    ctx.lineTo(centerX - 4, baseY - 12);
    ctx.lineTo(centerX - 2, baseY - 16);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(centerX + 2, baseY - 16);
    ctx.lineTo(centerX + 4, baseY - 12);
    ctx.lineTo(centerX + 6, baseY - 16);
    ctx.fill();
  }

  private createSimpleMonsterVariants(): void {
    const frameCount = 6;

    // Sentinel (floating guard) - reuse evil eye pattern
    const sentinelCanvas = this.textures.createCanvas('sentinel-sheet', 48 * frameCount, 56);
    if (sentinelCanvas) {
      const ctx = sentinelCanvas.context;
      ctx.imageSmoothingEnabled = false;
      for (let i = 0; i < frameCount; i++) {
        this.drawSentinelFrame(ctx, i * 48, 0, 48, 56, i);
      }
      sentinelCanvas.refresh();
      this.textures.addSpriteSheet('sentinel', sentinelCanvas.canvas as unknown as HTMLImageElement, { frameWidth: 48, frameHeight: 56 });
    }

    // Ratz (small rat)
    const ratzCanvas = this.textures.createCanvas('ratz-sheet', 44 * frameCount, 36);
    if (ratzCanvas) {
      const ctx = ratzCanvas.context;
      ctx.imageSmoothingEnabled = false;
      for (let i = 0; i < frameCount; i++) {
        this.drawRatzFrame(ctx, i * 44, 0, 44, 36, i);
      }
      ratzCanvas.refresh();
      this.textures.addSpriteSheet('ratz', ratzCanvas.canvas as unknown as HTMLImageElement, { frameWidth: 44, frameHeight: 36 });
    }

    // Tick (bug)
    const tickCanvas = this.textures.createCanvas('tick-sheet', 44 * frameCount, 40);
    if (tickCanvas) {
      const ctx = tickCanvas.context;
      ctx.imageSmoothingEnabled = false;
      for (let i = 0; i < frameCount; i++) {
        this.drawTickFrame(ctx, i * 44, 0, 44, 40, i);
      }
      tickCanvas.refresh();
      this.textures.addSpriteSheet('tick', tickCanvas.canvas as unknown as HTMLImageElement, { frameWidth: 44, frameHeight: 40 });
    }

    // Stump (tree stump)
    const stumpCanvas = this.textures.createCanvas('stump-sheet', 48 * frameCount, 52);
    if (stumpCanvas) {
      const ctx = stumpCanvas.context;
      ctx.imageSmoothingEnabled = false;
      for (let i = 0; i < frameCount; i++) {
        this.drawStumpFrame(ctx, i * 48, 0, 48, 52, i);
      }
      stumpCanvas.refresh();
      this.textures.addSpriteSheet('stump', stumpCanvas.canvas as unknown as HTMLImageElement, { frameWidth: 48, frameHeight: 52 });
    }

    // Skip creating procedural variants for sprites that are loaded from real PNG files
    // Real sprites loaded: blue_mushroom, horny_mushroom, zombie_mushroom, ribbon_pig, pig, snail, orange_mushroom
  }

  private drawSentinelFrame(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, frameNum: number): void {
    const floatPhase = frameNum / 6;
    const float = Math.sin(floatPhase * Math.PI * 2) * 4;
    const centerX = x + width / 2;
    const centerY = y + height / 2 + float;

    // Armor plating
    ctx.fillStyle = '#4682B4';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, 18, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    // Metal shine
    ctx.fillStyle = '#87CEEB';
    ctx.beginPath();
    ctx.ellipse(centerX - 6, centerY - 8, 8, 10, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Central eye
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, 8, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 2, 0, Math.PI * 2);
    ctx.fill();

    // Spikes
    ctx.fillStyle = '#2F4F4F';
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const sx = centerX + Math.cos(angle) * 18;
      const sy = centerY + Math.sin(angle) * 22;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + Math.cos(angle) * 8, sy + Math.sin(angle) * 10);
      ctx.lineTo(sx + Math.cos(angle + 0.3) * 4, sy + Math.sin(angle + 0.3) * 5);
      ctx.fill();
    }
  }

  private drawRatzFrame(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, frameNum: number): void {
    const runPhase = frameNum / 6;
    const run = Math.sin(runPhase * Math.PI * 2) * 2;
    const centerX = x + width / 2;
    const baseY = y + height - 4;

    // Tail
    ctx.strokeStyle = '#FF69B4';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX + 12, baseY - 8 + run);
    ctx.quadraticCurveTo(centerX + 22, baseY - 4 + run, centerX + 20, baseY - 12);
    ctx.stroke();

    // Body
    ctx.fillStyle = '#87CEEB';
    ctx.beginPath();
    ctx.ellipse(centerX, baseY - 10 + run, 14, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.beginPath();
    ctx.ellipse(centerX - 12, baseY - 14 + run, 8, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ears
    ctx.fillStyle = '#FF69B4';
    ctx.beginPath();
    ctx.ellipse(centerX - 18, baseY - 22 + run, 4, 6, -0.3, 0, Math.PI * 2);
    ctx.ellipse(centerX - 10, baseY - 22 + run, 4, 6, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(centerX - 14, baseY - 14 + run, 2, 0, Math.PI * 2);
    ctx.fill();

    // Nose
    ctx.fillStyle = '#FF69B4';
    ctx.beginPath();
    ctx.arc(centerX - 20, baseY - 12 + run, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawTickFrame(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, frameNum: number): void {
    const walkPhase = frameNum / 6;
    const walk = Math.sin(walkPhase * Math.PI * 2) * 2;
    const centerX = x + width / 2;
    const baseY = y + height - 6;

    // Legs
    ctx.strokeStyle = '#2F4F4F';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const legMove = Math.sin(walkPhase * Math.PI * 2 + i) * 3;
      ctx.beginPath();
      ctx.moveTo(centerX - 8, baseY - 12);
      ctx.lineTo(centerX - 14 - i * 2 + legMove, baseY - 2 + i * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(centerX + 8, baseY - 12);
      ctx.lineTo(centerX + 14 + i * 2 - legMove, baseY - 2 + i * 2);
      ctx.stroke();
    }

    // Body
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.ellipse(centerX, baseY - 16 + walk, 14, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Shell pattern
    ctx.strokeStyle = '#5D3A1A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, baseY - 16 + walk, 8, 0, Math.PI * 2);
    ctx.stroke();

    // Head
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.ellipse(centerX, baseY - 28 + walk, 6, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Antennae
    ctx.strokeStyle = '#5D3A1A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX - 4, baseY - 32 + walk);
    ctx.lineTo(centerX - 8, baseY - 38 + walk);
    ctx.moveTo(centerX + 4, baseY - 32 + walk);
    ctx.lineTo(centerX + 8, baseY - 38 + walk);
    ctx.stroke();

    // Eyes
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(centerX - 2, baseY - 28 + walk, 2, 0, Math.PI * 2);
    ctx.arc(centerX + 2, baseY - 28 + walk, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawStumpFrame(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, frameNum: number): void {
    const bouncePhase = frameNum / 6;
    const bounce = Math.sin(bouncePhase * Math.PI * 2) * 2;
    const centerX = x + width / 2;
    const baseY = y + height - 4;

    // Tree stump body
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(centerX - 16, baseY - 40 + bounce, 32, 42);

    // Wood grain
    ctx.strokeStyle = '#5D3A1A';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(centerX - 14, baseY - 36 + bounce + i * 10);
      ctx.lineTo(centerX + 14, baseY - 36 + bounce + i * 10);
      ctx.stroke();
    }

    // Top (tree rings)
    ctx.fillStyle = '#DEB887';
    ctx.beginPath();
    ctx.ellipse(centerX, baseY - 40 + bounce, 18, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(centerX, baseY - 40 + bounce, 12, 5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(centerX, baseY - 40 + bounce, 6, 2, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Face
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(centerX - 6, baseY - 24 + bounce, 3, 0, Math.PI * 2);
    ctx.arc(centerX + 6, baseY - 24 + bounce, 3, 0, Math.PI * 2);
    ctx.fill();

    // Angry mouth
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX - 6, baseY - 14 + bounce);
    ctx.lineTo(centerX, baseY - 10 + bounce);
    ctx.lineTo(centerX + 6, baseY - 14 + bounce);
    ctx.stroke();
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

    // Mushroom animations
    this.anims.create({
      key: 'mushroom-idle',
      frames: this.anims.generateFrameNumbers('mushroom', { start: 0, end: 5 }),
      frameRate: 8,
      repeat: -1,
    });

    this.anims.create({
      key: 'mushroom-walk',
      frames: this.anims.generateFrameNumbers('mushroom', { start: 0, end: 5 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: 'mushroom-attack',
      frames: this.anims.generateFrameNumbers('mushroom', { frames: [2, 3, 4, 5, 0] }),
      frameRate: 12,
      repeat: 0,
    });

    // Snail animations
    this.anims.create({
      key: 'snail-idle',
      frames: this.anims.generateFrameNumbers('snail', { start: 0, end: 5 }),
      frameRate: 6,
      repeat: -1,
    });

    this.anims.create({
      key: 'snail-walk',
      frames: this.anims.generateFrameNumbers('snail', { start: 0, end: 5 }),
      frameRate: 8,
      repeat: -1,
    });

    this.anims.create({
      key: 'snail-attack',
      frames: this.anims.generateFrameNumbers('snail', { frames: [2, 3, 4, 5, 0] }),
      frameRate: 10,
      repeat: 0,
    });

    // Create animations for all new monster types that have sprite sheets
    const newMonsters = [
      'pig', 'evil_eye', 'curse_eye', 'wild_boar', 'fire_boar',
      'stone_golem', 'block_golem', 'jr_yeti', 'yeti', 'lorang', 'clang',
      'octopus', 'ligator', 'drake', 'mushmom', 'zombie_mushmom'
    ];

    newMonsters.forEach(monster => {
      this.anims.create({
        key: `${monster}-idle`,
        frames: this.anims.generateFrameNumbers(monster, { start: 0, end: 5 }),
        frameRate: 8,
        repeat: -1,
      });

      this.anims.create({
        key: `${monster}-walk`,
        frames: this.anims.generateFrameNumbers(monster, { start: 0, end: 5 }),
        frameRate: 10,
        repeat: -1,
      });

      this.anims.create({
        key: `${monster}-attack`,
        frames: this.anims.generateFrameNumbers(monster, { frames: [2, 3, 4, 5, 0] }),
        frameRate: 12,
        repeat: 0,
      });
    });

    // Create animations for real sprite sheets (loaded from PNG files)
    // These have 6 frames: 0-2 = idle, 3-5 = move
    const realSprites = [
      'orange_mushroom', 'blue_mushroom', 'horny_mushroom', 'zombie_mushroom',
      'pig', 'ribbon_pig', 'snail'
    ];

    realSprites.forEach(sprite => {
      // Skip if animations already exist (e.g., pig is in both lists)
      if (this.anims.exists(`${sprite}-idle`)) return;

      this.anims.create({
        key: `${sprite}-idle`,
        frames: this.anims.generateFrameNumbers(sprite, { frames: [0, 1, 2] }),
        frameRate: 6,
        repeat: -1,
        yoyo: true,
      });

      this.anims.create({
        key: `${sprite}-walk`,
        frames: this.anims.generateFrameNumbers(sprite, { frames: [3, 4, 5] }),
        frameRate: 8,
        repeat: -1,
      });

      this.anims.create({
        key: `${sprite}-attack`,
        frames: this.anims.generateFrameNumbers(sprite, { frames: [3, 4, 5, 4, 3] }),
        frameRate: 12,
        repeat: 0,
      });
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
