/**
 * Shared UI Theme for MapleStory-style menus
 * Authentic MapleStory UI with cream/beige panels and orange-brown accents
 */

import Phaser from 'phaser';

// ============================================
// Color Palette - Authentic MapleStory Theme
// ============================================

export const UI_COLORS = {
  // Panel backgrounds - Cream/Beige tones like real MapleStory
  panelBg: 0xf5e6c8,          // Main cream background
  panelDark: 0xe8d4a8,        // Slightly darker cream
  panelLight: 0xfdf5e6,       // Light cream/off-white
  panelHeader: 0xc9a86c,      // Golden header
  panelInnerBg: 0xf0dcc0,     // Inner panel background

  // Borders - Orange-brown tones
  borderOuter: 0x8b6914,      // Dark orange-brown
  borderMid: 0xb8860b,        // DarkGoldenrod
  borderInner: 0xdaa520,      // Goldenrod
  borderHighlight: 0xffd700,  // Gold highlight
  borderGold: 0xd4a574,       // Warm gold/tan
  borderShadow: 0x5c4033,     // Dark brown shadow

  // Title bar
  titleBarBg: 0xc19a6b,       // Camel/tan
  titleBarDark: 0xa67c52,     // Darker tan
  titleGold: 0x4a3728,        // Dark brown for title text

  // Slots - Darker inset look
  slotBg: 0x3a3020,           // Dark slot background
  slotBorder: 0x8b7355,       // Tan border
  slotHoverBg: 0x4a4030,      // Hover state
  slotHoverBorder: 0xffd700,  // Gold hover border
  slotInner: 0x2a2018,        // Inner shadow

  // Button colors
  buttonNormal: 0xdeb887,     // BurlyWood
  buttonHover: 0xf5deb3,      // Wheat
  buttonPressed: 0xc9a86c,    // Darker tan
  buttonBorder: 0x8b6914,     // Dark border

  // Text colors
  textWhite: '#ffffff',
  textBlack: '#1a1a1a',
  textBrown: '#4a3728',
  textGold: '#8b6914',
  textYellow: '#ffcc00',
  textGray: '#666666',
  textDark: '#333333',
  textLight: '#f5e6c8',

  // Status colors
  hpRed: '#ff4444',
  mpBlue: '#4488ff',
  expYellow: '#ffcc00',

  // Rarity colors (keep same)
  rarityCommon: '#ffffff',
  rarityUncommon: '#66ff66',
  rarityRare: '#6699ff',
  rarityEpic: '#cc66ff',
  rarityLegendary: '#ff9933',
};

// ============================================
// Drawing Utilities
// ============================================

/**
 * Draw a MapleStory-style panel with cream background and orange-brown frame
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
    cornerStyle?: 'rounded' | 'pointed';
  } = {}
): void {
  const { hasTitle = true, titleHeight = 28, cornerStyle = 'rounded' } = options;
  const radius = cornerStyle === 'rounded' ? 6 : 0;

  // Outer shadow
  graphics.fillStyle(0x000000, 0.3);
  graphics.fillRoundedRect(x + 4, y + 4, width, height, radius);

  // Outer dark border frame
  graphics.fillStyle(UI_COLORS.borderShadow, 1);
  graphics.fillRoundedRect(x, y, width, height, radius);

  // Orange-brown border
  graphics.fillStyle(UI_COLORS.borderOuter, 1);
  graphics.fillRoundedRect(x + 2, y + 2, width - 4, height - 4, radius);

  // Inner gold border
  graphics.fillStyle(UI_COLORS.borderGold, 1);
  graphics.fillRoundedRect(x + 4, y + 4, width - 8, height - 8, radius);

  // Main cream panel background
  graphics.fillStyle(UI_COLORS.panelBg, 1);
  graphics.fillRoundedRect(x + 6, y + 6, width - 12, height - 12, radius - 2);

  // Title bar area
  if (hasTitle) {
    // Title bar gradient background
    graphics.fillStyle(UI_COLORS.titleBarBg, 1);
    graphics.fillRoundedRect(x + 6, y + 6, width - 12, titleHeight, { tl: radius - 2, tr: radius - 2, bl: 0, br: 0 });

    // Title bar top highlight
    graphics.fillStyle(UI_COLORS.buttonHover, 0.5);
    graphics.fillRect(x + 8, y + 8, width - 16, 2);

    // Title bar bottom border
    graphics.lineStyle(2, UI_COLORS.borderOuter, 1);
    graphics.beginPath();
    graphics.moveTo(x + 6, y + 6 + titleHeight);
    graphics.lineTo(x + width - 6, y + 6 + titleHeight);
    graphics.strokePath();

    // Gold accent line below title
    graphics.lineStyle(1, UI_COLORS.borderHighlight, 0.6);
    graphics.beginPath();
    graphics.moveTo(x + 8, y + 8 + titleHeight);
    graphics.lineTo(x + width - 8, y + 8 + titleHeight);
    graphics.strokePath();
  }

  // Decorative corner accents
  drawMapleCorners(graphics, x, y, width, height);

  // Inner content area shadow
  if (hasTitle) {
    graphics.fillStyle(UI_COLORS.panelDark, 0.3);
    graphics.fillRect(x + 8, y + titleHeight + 12, width - 16, 2);
  }
}

/**
 * Draw MapleStory-style decorative corners
 */
function drawMapleCorners(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  const cornerSize = 12;
  const offset = 1;

  graphics.lineStyle(2, UI_COLORS.borderHighlight, 0.8);

  // Top-left corner flourish
  graphics.beginPath();
  graphics.moveTo(x + offset, y + offset + cornerSize);
  graphics.lineTo(x + offset, y + offset);
  graphics.lineTo(x + offset + cornerSize, y + offset);
  graphics.strokePath();

  // Top-right corner flourish
  graphics.beginPath();
  graphics.moveTo(x + width - offset - cornerSize, y + offset);
  graphics.lineTo(x + width - offset, y + offset);
  graphics.lineTo(x + width - offset, y + offset + cornerSize);
  graphics.strokePath();

  // Bottom-left corner flourish
  graphics.beginPath();
  graphics.moveTo(x + offset, y + height - offset - cornerSize);
  graphics.lineTo(x + offset, y + height - offset);
  graphics.lineTo(x + offset + cornerSize, y + height - offset);
  graphics.strokePath();

  // Bottom-right corner flourish
  graphics.beginPath();
  graphics.moveTo(x + width - offset - cornerSize, y + height - offset);
  graphics.lineTo(x + width - offset, y + height - offset);
  graphics.lineTo(x + width - offset, y + height - offset - cornerSize);
  graphics.strokePath();
}

/**
 * Draw a MapleStory-style item slot (inset dark style)
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

  // Outer border
  graphics.fillStyle(UI_COLORS.borderOuter, 1);
  graphics.fillRoundedRect(x - halfSize - 2, y - halfSize - 2, size + 4, size + 4, 3);

  if (isHovered) {
    // Hover state with gold glow
    graphics.fillStyle(UI_COLORS.slotHoverBg, 1);
    graphics.fillRoundedRect(x - halfSize, y - halfSize, size, size, 2);

    graphics.lineStyle(2, UI_COLORS.slotHoverBorder, 1);
    graphics.strokeRoundedRect(x - halfSize - 1, y - halfSize - 1, size + 2, size + 2, 3);
  } else {
    // Normal state - dark inset
    graphics.fillStyle(UI_COLORS.slotBg, 1);
    graphics.fillRoundedRect(x - halfSize, y - halfSize, size, size, 2);

    // Inner shadow for depth
    graphics.fillStyle(UI_COLORS.slotInner, 1);
    graphics.fillRect(x - halfSize + 1, y - halfSize + 1, size - 2, 3);

    graphics.lineStyle(1, UI_COLORS.slotBorder, 0.6);
    graphics.strokeRoundedRect(x - halfSize, y - halfSize, size, size, 2);
  }
}

/**
 * Draw a MapleStory-style button (3D raised look)
 */
export function drawButton(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  state: 'normal' | 'hover' | 'pressed' = 'normal'
): void {
  const colors = {
    normal: { bg: UI_COLORS.buttonNormal, top: 0xf5deb3, bottom: 0xa67c52, border: UI_COLORS.buttonBorder },
    hover: { bg: UI_COLORS.buttonHover, top: 0xffffff, bottom: 0xc9a86c, border: 0xffd700 },
    pressed: { bg: UI_COLORS.buttonPressed, top: 0xb89968, bottom: 0xdeb887, border: UI_COLORS.buttonBorder },
  };

  const c = colors[state];

  // Shadow
  if (state !== 'pressed') {
    graphics.fillStyle(0x000000, 0.3);
    graphics.fillRoundedRect(x + 2, y + 2, width, height, 4);
  }

  // Button outer border
  graphics.fillStyle(c.border, 1);
  graphics.fillRoundedRect(x, y, width, height, 4);

  // Button body
  graphics.fillStyle(c.bg, 1);
  graphics.fillRoundedRect(x + 2, y + 2, width - 4, height - 4, 3);

  // Top highlight (3D effect)
  graphics.fillStyle(c.top, 0.6);
  graphics.fillRoundedRect(x + 2, y + 2, width - 4, height / 3, { tl: 3, tr: 3, bl: 0, br: 0 });

  // Bottom shadow (3D effect)
  graphics.fillStyle(c.bottom, 0.4);
  graphics.fillRoundedRect(x + 2, y + height - height / 3 - 2, width - 4, height / 3, { tl: 0, tr: 0, bl: 3, br: 3 });
}

/**
 * Draw a close button (X) with MapleStory style
 */
export function createCloseButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  onClick: () => void
): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y);
  const size = 20;

  const bg = scene.add.graphics();
  const drawBg = (hover: boolean) => {
    bg.clear();

    // Button background
    if (hover) {
      bg.fillStyle(0xcc4444, 1);
      bg.fillRoundedRect(-size / 2, -size / 2, size, size, 3);
      bg.lineStyle(1, 0xff6666, 1);
    } else {
      bg.fillStyle(UI_COLORS.buttonNormal, 1);
      bg.fillRoundedRect(-size / 2, -size / 2, size, size, 3);
      bg.lineStyle(1, UI_COLORS.borderOuter, 1);
    }
    bg.strokeRoundedRect(-size / 2, -size / 2, size, size, 3);

    // X mark
    bg.lineStyle(2, hover ? 0xffffff : UI_COLORS.borderShadow, 1);
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
 * Get text style for panel titles (dark on light background)
 */
export function getTitleStyle(): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: 'Arial Black, Arial, sans-serif',
    fontSize: '13px',
    color: UI_COLORS.textBrown,
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
    color: UI_COLORS.textDark,
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
 * Get text style for key bindings (on dark slot backgrounds)
 */
export function getKeyStyle(): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: 'Arial, sans-serif',
    fontSize: '10px',
    color: UI_COLORS.textYellow,
    stroke: '#000000',
    strokeThickness: 2,
  };
}

/**
 * Draw a MapleStory-style tooltip
 */
export function drawTooltip(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  // Shadow
  graphics.fillStyle(0x000000, 0.4);
  graphics.fillRoundedRect(x + 3, y + 3, width, height, 4);

  // Border
  graphics.fillStyle(UI_COLORS.borderOuter, 1);
  graphics.fillRoundedRect(x, y, width, height, 4);

  // Background
  graphics.fillStyle(UI_COLORS.panelBg, 0.98);
  graphics.fillRoundedRect(x + 2, y + 2, width - 4, height - 4, 3);

  // Inner highlight
  graphics.lineStyle(1, UI_COLORS.borderHighlight, 0.4);
  graphics.strokeRoundedRect(x + 3, y + 3, width - 6, height - 6, 2);
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
  graphics.lineStyle(1, UI_COLORS.borderOuter, 0.6);
  graphics.beginPath();
  graphics.moveTo(x, y);
  graphics.lineTo(x + width, y);
  graphics.strokePath();

  graphics.lineStyle(1, UI_COLORS.borderHighlight, 0.3);
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

  // Gold outer circle
  graphics.fillStyle(0xc9a86c, 1);
  graphics.fillCircle(x, y, r);

  // Lighter center
  graphics.fillStyle(0xd4af37, 1);
  graphics.fillCircle(x - r * 0.1, y - r * 0.1, r * 0.7);

  // Highlight
  graphics.fillStyle(0xffe4b5, 0.6);
  graphics.fillCircle(x - r * 0.25, y - r * 0.25, r * 0.3);

  // Border
  graphics.lineStyle(1, 0x8b6914, 1);
  graphics.strokeCircle(x, y, r);
}

/**
 * Draw a scroll-style header decoration
 */
export function drawScrollHeader(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number
): void {
  const height = 6;
  const curlSize = 8;

  // Main scroll bar
  graphics.fillStyle(UI_COLORS.borderGold, 1);
  graphics.fillRect(x + curlSize, y, width - curlSize * 2, height);

  // Left curl
  graphics.fillCircle(x + curlSize, y + height / 2, curlSize / 2);

  // Right curl
  graphics.fillCircle(x + width - curlSize, y + height / 2, curlSize / 2);

  // Highlight
  graphics.fillStyle(UI_COLORS.borderHighlight, 0.5);
  graphics.fillRect(x + curlSize, y, width - curlSize * 2, 2);
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
 * Draw an inner content panel (for separating sections)
 */
export function drawContentPanel(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  // Inset shadow
  graphics.fillStyle(UI_COLORS.borderOuter, 0.3);
  graphics.fillRoundedRect(x, y, width, height, 4);

  // Content background
  graphics.fillStyle(UI_COLORS.panelInnerBg, 1);
  graphics.fillRoundedRect(x + 1, y + 1, width - 2, height - 2, 3);

  // Inner shadow for inset effect
  graphics.lineStyle(1, UI_COLORS.borderOuter, 0.4);
  graphics.beginPath();
  graphics.moveTo(x + 4, y + 2);
  graphics.lineTo(x + width - 4, y + 2);
  graphics.strokePath();

  // Border
  graphics.lineStyle(1, UI_COLORS.borderOuter, 0.5);
  graphics.strokeRoundedRect(x, y, width, height, 4);
}
