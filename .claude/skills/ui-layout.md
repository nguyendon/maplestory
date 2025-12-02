# UI Layout Patterns

Guidelines for creating UI elements that fit properly within containers.

## Core Principles

### 1. Calculate Sizes from Container, Not Content
Always start with the container bounds and work inward:

```typescript
// GOOD: Calculate child sizes from container
const PANEL_WIDTH = 600;
const PADDING = 20;
const CONTENT_WIDTH = PANEL_WIDTH - (PADDING * 2); // 560px available
const NUM_COLUMNS = 4;
const GAP = 10;
const ITEM_WIDTH = (CONTENT_WIDTH - (GAP * (NUM_COLUMNS - 1))) / NUM_COLUMNS;

// BAD: Hardcode child sizes and hope they fit
const ITEM_WIDTH = 150; // May overflow!
```

### 2. Define Layout Constants Together
Keep all related dimensions in one place:

```typescript
// Panel dimensions
private readonly PANEL_WIDTH = 600;
private readonly PANEL_HEIGHT = 400;
private readonly PADDING = 20;
private readonly TITLE_HEIGHT = 35;

// Derived values (calculate, don't hardcode)
private readonly CONTENT_X = -this.PANEL_WIDTH / 2 + this.PADDING;
private readonly CONTENT_Y = -this.PANEL_HEIGHT / 2 + this.TITLE_HEIGHT + this.PADDING;
private readonly CONTENT_WIDTH = this.PANEL_WIDTH - (this.PADDING * 2);
private readonly CONTENT_HEIGHT = this.PANEL_HEIGHT - this.TITLE_HEIGHT - (this.PADDING * 2);
```

### 3. Grid Layout Formula
For items in a grid:

```typescript
function calculateGridLayout(
  containerWidth: number,
  containerHeight: number,
  numColumns: number,
  numRows: number,
  gap: number
) {
  const itemWidth = (containerWidth - (gap * (numColumns - 1))) / numColumns;
  const itemHeight = (containerHeight - (gap * (numRows - 1))) / numRows;
  return { itemWidth, itemHeight };
}
```

### 4. Keyboard Layout Pattern
For keyboard-style grids where rows have different key counts:

```typescript
// Find the row with most keys to determine base width
const maxKeysInRow = Math.max(...rows.map(r => r.keys.length));
const keyboardWidth = maxKeysInRow * (KEY_SIZE + KEY_SPACING) - KEY_SPACING;

// Verify it fits in panel
const availableWidth = PANEL_WIDTH - (PADDING * 2);
if (keyboardWidth > availableWidth) {
  // Recalculate KEY_SIZE to fit
  const newKeySize = (availableWidth + KEY_SPACING) / maxKeysInRow - KEY_SPACING;
}
```

### 5. Scrollable Content
When content might exceed container, use masking:

```typescript
// Create mask for scrollable area
const mask = this.scene.add.graphics();
mask.fillRect(contentX, contentY, contentWidth, contentHeight);
contentContainer.setMask(mask.createGeometryMask());

// Track scroll position
let scrollY = 0;
const maxScroll = Math.max(0, totalContentHeight - contentHeight);
```

## Common Patterns

### Panel with Title Bar
```typescript
const PANEL = {
  width: 400,
  height: 300,
  padding: 15,
  titleHeight: 32,
  cornerRadius: 8
};

// Content area bounds
const content = {
  x: -PANEL.width / 2 + PANEL.padding,
  y: -PANEL.height / 2 + PANEL.titleHeight + PANEL.padding,
  width: PANEL.width - PANEL.padding * 2,
  height: PANEL.height - PANEL.titleHeight - PANEL.padding * 2
};
```

### Item Slots Grid
```typescript
function createSlotGrid(
  container: Phaser.GameObjects.Container,
  startX: number,
  startY: number,
  cols: number,
  rows: number,
  slotSize: number,
  gap: number
) {
  const slots = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = startX + col * (slotSize + gap);
      const y = startY + row * (slotSize + gap);
      slots.push({ x, y, size: slotSize });
    }
  }
  return slots;
}
```

### Positioning Relative to Screen Edges
```typescript
// Bottom-left, above UI elements
const chatY = GAME_HEIGHT - INPUT_HEIGHT - BOTTOM_UI_HEIGHT - PADDING;

// Centered horizontally
const panelX = GAME_WIDTH / 2;

// Right-aligned with margin
const minimapX = GAME_WIDTH - MINIMAP_WIDTH - MARGIN;
```

## Validation Helper

Add this to catch layout issues during development:

```typescript
function validateBounds(
  childWidth: number,
  childHeight: number,
  containerWidth: number,
  containerHeight: number,
  name: string
) {
  if (childWidth > containerWidth) {
    console.warn(`[Layout] ${name} width (${childWidth}) exceeds container (${containerWidth})`);
  }
  if (childHeight > containerHeight) {
    console.warn(`[Layout] ${name} height (${childHeight}) exceeds container (${containerHeight})`);
  }
}
```

## Depth (Z-Index) Guidelines

```typescript
// Background/world elements: 0-100
// Game entities: 100-500
// Effects/particles: 500-1000
// In-game UI (health bars): 1000-2000
// Menus/panels: 2000-5000
// Modal overlays: 5000-8000
// Chat/notifications: 8000-9000
// Tooltips: 9000-9500
// Debug/system: 9500+
```

## Checklist Before Creating UI

1. [ ] Define panel dimensions as constants
2. [ ] Calculate content area from panel minus padding/title
3. [ ] Determine number of items and calculate item sizes to fit
4. [ ] Verify total width/height doesn't exceed container
5. [ ] Set appropriate depth for the UI layer
6. [ ] Consider scroll if content might overflow
7. [ ] Test at different content amounts (empty, few, many items)
