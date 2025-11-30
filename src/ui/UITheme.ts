/**
 * Modern UI Theme for MapleStory-style menus
 * Sleek, clean design with subtle depth and polish
 */

import Phaser from 'phaser';

// ============================================
// Color Palette - Modern Clean Theme
// ============================================

export const UI_COLORS = {
  // Panel backgrounds - Clean with subtle transparency
  panelBg: 0x1a1a2e,           // Deep navy blue
  panelLight: 0x25253d,        // Lighter navy
  panelDark: 0x12121f,         // Darker navy
  panelGlass: 0x2a2a4a,        // Glass-like overlay
  panelInnerBg: 0x1e1e32,      // Inner content area

  // Accent colors
  accentBlue: 0x4a9eff,        // Bright blue accent
  accentGold: 0xffc857,        // Warm gold
  accentPurple: 0x9d6bff,      // Soft purple
  accentCyan: 0x5cfffa,        // Cyan highlight

  // Borders - Subtle and clean
  borderOuter: 0x3d3d5c,       // Subtle outer border
  borderInner: 0x4a4a6a,       // Inner border
  borderHighlight: 0x6a6a8a,   // Highlight edge
  borderGold: 0xffc857,        // Gold accent border
  borderShadow: 0x0a0a14,      // Deep shadow

  // Title bar
  titleBarBg: 0x2d2d4a,        // Title background
  titleGradientTop: 0x3a3a5a,
  titleGradientBottom: 0x252540,

  // Slots - Dark inset style
  slotBg: 0x15152a,            // Dark slot background
  slotBorder: 0x3a3a55,        // Slot border
  slotHoverBg: 0x2a2a45,       // Hover state
  slotHoverBorder: 0x5cfffa,   // Cyan hover glow
  slotEmpty: 0x101020,         // Empty slot darker

  // Button colors
  buttonNormal: 0x3a3a5c,
  buttonHover: 0x4a4a6c,
  buttonPressed: 0x2a2a4c,
  buttonBorder: 0x5a5a7c,
  buttonGlow: 0x4a9eff,

  // Text colors
  textWhite: '#ffffff',
  textLight: '#e0e0f0',
  textGray: '#8888aa',
  textDark: '#666688',
  textGold: '#ffc857',
  textCyan: '#5cfffa',
  textBlue: '#4a9eff',
  textBrown: '#4a3728',
  textYellow: '#ffcc00',

  // Status colors
  hpRed: '#ff5555',
  mpBlue: '#5599ff',
  expYellow: '#ffcc44',

  // Rarity colors
  rarityCommon: '#ffffff',
  rarityUncommon: '#55ff55',
  rarityRare: '#5599ff',
  rarityEpic: '#bb66ff',
  rarityLegendary: '#ffaa33',
};

// ============================================
// Drawing Utilities
// ============================================

/**
 * Draw a modern sleek panel with glass-like appearance
 */
export function drawPanel(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  options: {
    hasTitle?: boolean;
    titleHeight?: number;
    cornerRadius?: number;
    glowColor?: number;
  } = {}
): void {
  const { hasTitle = true, titleHeight = 32, cornerRadius = 8, glowColor } = options;

  // Outer glow/shadow
  graphics.fillStyle(0x000000, 0.5);
  graphics.fillRoundedRect(x + 2, y + 2, width, height, cornerRadius);

  // Optional colored glow
  if (glowColor) {
    graphics.lineStyle(3, glowColor, 0.3);
    graphics.strokeRoundedRect(x - 1, y - 1, width + 2, height + 2, cornerRadius + 1);
  }

  // Main panel background
  graphics.fillStyle(UI_COLORS.panelBg, 0.95);
  graphics.fillRoundedRect(x, y, width, height, cornerRadius);

  // Subtle inner gradient simulation (top lighter)
  graphics.fillStyle(UI_COLORS.panelLight, 0.3);
  graphics.fillRoundedRect(x + 1, y + 1, width - 2, height / 3, { tl: cornerRadius - 1, tr: cornerRadius - 1, bl: 0, br: 0 });

  // Border - subtle gradient effect
  graphics.lineStyle(1, UI_COLORS.borderOuter, 0.8);
  graphics.strokeRoundedRect(x, y, width, height, cornerRadius);

  // Inner highlight line (top edge)
  graphics.lineStyle(1, UI_COLORS.borderHighlight, 0.2);
  graphics.beginPath();
  graphics.moveTo(x + cornerRadius, y + 1);
  graphics.lineTo(x + width - cornerRadius, y + 1);
  graphics.strokePath();

  // Title bar area
  if (hasTitle) {
    // Title bar background
    graphics.fillStyle(UI_COLORS.titleBarBg, 1);
    graphics.fillRoundedRect(x + 2, y + 2, width - 4, titleHeight, { tl: cornerRadius - 2, tr: cornerRadius - 2, bl: 0, br: 0 });

    // Title bar gradient overlay
    graphics.fillStyle(0xffffff, 0.05);
    graphics.fillRoundedRect(x + 2, y + 2, width - 4, titleHeight / 2, { tl: cornerRadius - 2, tr: cornerRadius - 2, bl: 0, br: 0 });

    // Title bar bottom line
    graphics.lineStyle(1, UI_COLORS.borderOuter, 0.6);
    graphics.beginPath();
    graphics.moveTo(x + 8, y + titleHeight + 2);
    graphics.lineTo(x + width - 8, y + titleHeight + 2);
    graphics.strokePath();

    // Accent line under title
    graphics.lineStyle(2, UI_COLORS.accentBlue, 0.4);
    graphics.beginPath();
    graphics.moveTo(x + 8, y + titleHeight + 3);
    graphics.lineTo(x + width - 8, y + titleHeight + 3);
    graphics.strokePath();
  }
}

/**
 * Draw a modern item slot with subtle depth
 */
export function drawSlot(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  size: number,
  isHovered: boolean = false,
  _isEmpty: boolean = true
): void {
  const halfSize = size / 2;
  const radius = 4;

  if (isHovered) {
    // Hover glow
    graphics.lineStyle(2, UI_COLORS.slotHoverBorder, 0.6);
    graphics.strokeRoundedRect(x - halfSize - 2, y - halfSize - 2, size + 4, size + 4, radius + 1);

    // Hover background
    graphics.fillStyle(UI_COLORS.slotHoverBg, 1);
    graphics.fillRoundedRect(x - halfSize, y - halfSize, size, size, radius);
  } else {
    // Normal slot background
    graphics.fillStyle(UI_COLORS.slotBg, 1);
    graphics.fillRoundedRect(x - halfSize, y - halfSize, size, size, radius);

    // Inner shadow for depth
    graphics.fillStyle(0x000000, 0.3);
    graphics.fillRoundedRect(x - halfSize + 1, y - halfSize + 1, size - 2, 4, { tl: radius - 1, tr: radius - 1, bl: 0, br: 0 });
  }

  // Border
  graphics.lineStyle(1, isHovered ? UI_COLORS.slotHoverBorder : UI_COLORS.slotBorder, isHovered ? 0.8 : 0.5);
  graphics.strokeRoundedRect(x - halfSize, y - halfSize, size, size, radius);
}

/**
 * Draw a modern button with hover states
 */
export function drawButton(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  state: 'normal' | 'hover' | 'pressed' = 'normal'
): void {
  const radius = 4;

  const colors = {
    normal: { bg: UI_COLORS.buttonNormal, border: UI_COLORS.buttonBorder, glow: 0 },
    hover: { bg: UI_COLORS.buttonHover, border: UI_COLORS.buttonGlow, glow: UI_COLORS.buttonGlow },
    pressed: { bg: UI_COLORS.buttonPressed, border: UI_COLORS.buttonBorder, glow: 0 },
  };

  const c = colors[state];

  // Glow effect on hover
  if (c.glow) {
    graphics.lineStyle(3, c.glow, 0.3);
    graphics.strokeRoundedRect(x - 1, y - 1, width + 2, height + 2, radius + 1);
  }

  // Button background
  graphics.fillStyle(c.bg, 1);
  graphics.fillRoundedRect(x, y, width, height, radius);

  // Top highlight
  graphics.fillStyle(0xffffff, state === 'pressed' ? 0.02 : 0.08);
  graphics.fillRoundedRect(x + 1, y + 1, width - 2, height / 2 - 1, { tl: radius - 1, tr: radius - 1, bl: 0, br: 0 });

  // Border
  graphics.lineStyle(1, c.border, 0.6);
  graphics.strokeRoundedRect(x, y, width, height, radius);
}

/**
 * Draw a modern close button
 */
export function createCloseButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  onClick: () => void
): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y);
  const size = 22;

  const bg = scene.add.graphics();
  const drawBg = (hover: boolean) => {
    bg.clear();

    if (hover) {
      // Red glow on hover
      bg.lineStyle(2, 0xff4444, 0.4);
      bg.strokeRoundedRect(-size / 2 - 1, -size / 2 - 1, size + 2, size + 2, 5);

      bg.fillStyle(0xff3333, 0.9);
      bg.fillRoundedRect(-size / 2, -size / 2, size, size, 4);
    } else {
      bg.fillStyle(UI_COLORS.buttonNormal, 0.8);
      bg.fillRoundedRect(-size / 2, -size / 2, size, size, 4);
    }

    // X mark
    bg.lineStyle(2, hover ? 0xffffff : 0x8888aa, 1);
    const s = 5;
    bg.beginPath();
    bg.moveTo(-s, -s);
    bg.lineTo(s, s);
    bg.moveTo(s, -s);
    bg.lineTo(-s, s);
    bg.strokePath();
  };

  drawBg(false);
  container.add(bg);

  const hitArea = scene.add.rectangle(0, 0, size, size, 0x000000, 0);
  hitArea.setInteractive({ useHandCursor: true });
  hitArea.on('pointerover', () => drawBg(true));
  hitArea.on('pointerout', () => drawBg(false));
  hitArea.on('pointerdown', onClick);
  container.add(hitArea);

  return container;
}

/**
 * Get text style for panel titles
 */
export function getTitleStyle(): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: 'Arial, sans-serif',
    fontSize: '14px',
    color: UI_COLORS.textWhite,
    fontStyle: 'bold',
  };
}

/**
 * Get text style for body text
 */
export function getBodyStyle(): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: 'Arial, sans-serif',
    fontSize: '12px',
    color: UI_COLORS.textLight,
  };
}

/**
 * Get text style for small labels
 */
export function getLabelStyle(): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: 'Arial, sans-serif',
    fontSize: '10px',
    color: UI_COLORS.textGray,
  };
}

/**
 * Get text style for key bindings
 */
export function getKeyStyle(): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: 'Arial, sans-serif',
    fontSize: '10px',
    color: UI_COLORS.textCyan,
    stroke: '#000000',
    strokeThickness: 2,
  };
}

/**
 * Draw a modern tooltip
 */
export function drawTooltip(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  const radius = 6;

  // Shadow
  graphics.fillStyle(0x000000, 0.5);
  graphics.fillRoundedRect(x + 2, y + 2, width, height, radius);

  // Background
  graphics.fillStyle(UI_COLORS.panelBg, 0.98);
  graphics.fillRoundedRect(x, y, width, height, radius);

  // Subtle top gradient
  graphics.fillStyle(0xffffff, 0.05);
  graphics.fillRoundedRect(x + 1, y + 1, width - 2, height / 4, { tl: radius - 1, tr: radius - 1, bl: 0, br: 0 });

  // Border with accent
  graphics.lineStyle(1, UI_COLORS.accentBlue, 0.5);
  graphics.strokeRoundedRect(x, y, width, height, radius);
}

/**
 * Draw a horizontal divider line
 */
export function drawDivider(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number
): void {
  // Main line
  graphics.lineStyle(1, UI_COLORS.borderOuter, 0.6);
  graphics.beginPath();
  graphics.moveTo(x, y);
  graphics.lineTo(x + width, y);
  graphics.strokePath();

  // Subtle highlight below
  graphics.lineStyle(1, UI_COLORS.borderHighlight, 0.15);
  graphics.beginPath();
  graphics.moveTo(x, y + 1);
  graphics.lineTo(x + width, y + 1);
  graphics.strokePath();
}

/**
 * Draw a mesos coin icon
 */
export function drawCoinIcon(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  size: number = 16
): void {
  const r = size / 2;

  // Outer ring
  graphics.fillStyle(UI_COLORS.accentGold, 1);
  graphics.fillCircle(x, y, r);

  // Inner shine
  graphics.fillStyle(0xffe4a0, 1);
  graphics.fillCircle(x - r * 0.15, y - r * 0.15, r * 0.65);

  // Highlight
  graphics.fillStyle(0xffffff, 0.5);
  graphics.fillCircle(x - r * 0.25, y - r * 0.3, r * 0.25);

  // Border
  graphics.lineStyle(1, 0xcc9933, 1);
  graphics.strokeCircle(x, y, r);
}

/**
 * Rarity color mapping
 */
export function getRarityColor(rarity: string): string {
  const colors: Record<string, string> = {
    common: UI_COLORS.rarityCommon,
    uncommon: UI_COLORS.rarityUncommon,
    rare: UI_COLORS.rarityRare,
    epic: UI_COLORS.rarityEpic,
    legendary: UI_COLORS.rarityLegendary,
  };
  return colors[rarity.toLowerCase()] || UI_COLORS.rarityCommon;
}

/**
 * Draw a content area panel (inset style)
 */
export function drawContentPanel(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  const radius = 4;

  // Inset shadow
  graphics.fillStyle(0x000000, 0.3);
  graphics.fillRoundedRect(x, y, width, height, radius);

  // Content background
  graphics.fillStyle(UI_COLORS.panelInnerBg, 1);
  graphics.fillRoundedRect(x + 1, y + 1, width - 2, height - 2, radius - 1);

  // Top inner shadow
  graphics.fillStyle(0x000000, 0.2);
  graphics.fillRect(x + 2, y + 2, width - 4, 3);

  // Border
  graphics.lineStyle(1, UI_COLORS.borderOuter, 0.4);
  graphics.strokeRoundedRect(x, y, width, height, radius);
}

/**
 * Draw a tab button
 */
export function drawTab(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  selected: boolean
): void {
  const radius = 4;

  if (selected) {
    // Selected tab - blends with content
    graphics.fillStyle(UI_COLORS.panelInnerBg, 1);
    graphics.fillRoundedRect(x, y, width, height + 2, { tl: radius, tr: radius, bl: 0, br: 0 });

    // Accent line on top
    graphics.lineStyle(2, UI_COLORS.accentBlue, 0.8);
    graphics.beginPath();
    graphics.moveTo(x + 4, y + 1);
    graphics.lineTo(x + width - 4, y + 1);
    graphics.strokePath();
  } else {
    // Unselected tab
    graphics.fillStyle(UI_COLORS.panelDark, 0.8);
    graphics.fillRoundedRect(x, y, width, height, { tl: radius, tr: radius, bl: 0, br: 0 });

    // Subtle border
    graphics.lineStyle(1, UI_COLORS.borderOuter, 0.4);
    graphics.strokeRoundedRect(x, y, width, height, { tl: radius, tr: radius, bl: 0, br: 0 });
  }
}

/**
 * Draw a progress bar (for HP/MP/EXP)
 */
export function drawProgressBar(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  percent: number,
  color: number
): void {
  const radius = height / 2;

  // Background
  graphics.fillStyle(UI_COLORS.slotBg, 1);
  graphics.fillRoundedRect(x, y, width, height, radius);

  // Fill
  if (percent > 0) {
    const fillWidth = Math.max(height, width * Math.min(1, percent));
    graphics.fillStyle(color, 1);
    graphics.fillRoundedRect(x, y, fillWidth, height, radius);

    // Shine on top
    graphics.fillStyle(0xffffff, 0.3);
    graphics.fillRoundedRect(x + 1, y + 1, fillWidth - 2, height / 3, { tl: radius - 1, tr: radius - 1, bl: 0, br: 0 });
  }

  // Border
  graphics.lineStyle(1, UI_COLORS.borderOuter, 0.5);
  graphics.strokeRoundedRect(x, y, width, height, radius);
}
