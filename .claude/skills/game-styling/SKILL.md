---
name: game-styling
description: Modern game UI styling patterns, color theory, and visual polish techniques. Auto-activates when working with UI themes, colors, panels, or visual design.
activation:
  - "UITheme"
  - "styling"
  - "colors"
  - "look better"
  - "modern"
  - "sleek"
  - "polish"
  - "visual"
  - "theme"
  - "palette"
---

# Game UI Styling Guide

## Current Project Theme (UITheme.ts)

This project uses a **modern dark theme** with the following palette:

```typescript
// Base colors
panelBg: 0x1a1a2e      // Deep navy - main background
panelLight: 0x25253d   // Lighter navy - gradients
panelDark: 0x12121f    // Darker navy - shadows

// Accents
accentBlue: 0x4a9eff   // Primary interaction color
accentCyan: 0x5cfffa   // Selection/highlight
accentGold: 0xffc857   // Rewards/special

// Borders
borderOuter: 0x3d3d5c  // Subtle borders
borderHighlight: 0x6a6a8a  // Edge highlights
```

## Quick Style Recipes

### Modern Panel
```typescript
// Shadow → Background → Gradient → Border → Highlight
g.fillStyle(0x000000, 0.4);
g.fillRoundedRect(x+2, y+2, w, h, 8);  // Shadow

g.fillStyle(0x1a1a2e, 0.95);
g.fillRoundedRect(x, y, w, h, 8);  // Background

g.fillStyle(0x25253d, 0.3);
g.fillRoundedRect(x+1, y+1, w-2, h/3, {tl:7, tr:7, bl:0, br:0});  // Top gradient

g.lineStyle(1, 0x3d3d5c, 0.8);
g.strokeRoundedRect(x, y, w, h, 8);  // Border

g.lineStyle(1, 0x6a6a8a, 0.2);
g.beginPath(); g.moveTo(x+8, y+1); g.lineTo(x+w-8, y+1); g.strokePath();  // Top highlight
```

### Hover Glow Effect
```typescript
// Add before drawing the element
g.lineStyle(2, 0x4a9eff, 0.4);  // Blue glow
g.strokeRoundedRect(x-1, y-1, w+2, h+2, radius+1);
```

### Selection State
```typescript
// Cyan glow for selected items
g.lineStyle(2, 0x5cfffa, 0.6);
g.strokeRoundedRect(x-2, y-2, w+4, h+4, radius+2);
```

### Inset/Slot Style
```typescript
g.fillStyle(0x15152a, 1);  // Dark background
g.fillRoundedRect(x, y, size, size, 4);

g.fillStyle(0x000000, 0.3);  // Top inner shadow
g.fillRect(x+1, y+1, size-2, 4);

g.lineStyle(1, 0x3a3a55, 0.5);  // Border
g.strokeRoundedRect(x, y, size, size, 4);
```

## Typography

```typescript
// Title - White, bold, 14px
{ fontFamily: 'Arial', fontSize: '14px', color: '#ffffff', fontStyle: 'bold' }

// Body - Light gray, 12px
{ fontFamily: 'Arial', fontSize: '12px', color: '#e0e0f0' }

// Caption - Gray, 10px
{ fontFamily: 'Arial', fontSize: '10px', color: '#8888aa' }

// Accent - Cyan, bold
{ fontFamily: 'Arial', fontSize: '12px', color: '#5cfffa', fontStyle: 'bold' }
```

## Common Patterns

### 60-30-10 Rule
- **60%** - Base dark colors (panels, backgrounds)
- **30%** - Secondary (borders, text, subtle elements)
- **10%** - Accent colors (highlights, important actions)

### Depth Hierarchy
1. **Background** (0x12121f) - Furthest back
2. **Panel** (0x1a1a2e) - Main content
3. **Elevated** (0x25253d) - Title bars, overlays
4. **Focus** (accent glow) - Active/selected elements

### Spacing Guidelines
- Panel padding: 15-20px
- Element spacing: 8-12px
- Button padding: 8px horizontal, 6px vertical
- Corner radius: 4px (buttons), 6-8px (panels)

## Polish Checklist

- [ ] Shadows on panels (2px offset, 40% opacity)
- [ ] Rounded corners everywhere (no sharp edges)
- [ ] Hover states with glow
- [ ] Top gradient on panels for depth
- [ ] Subtle top-edge highlight line
- [ ] Consistent border opacity (0.5-0.8)
- [ ] Accent color used sparingly
- [ ] Text has appropriate contrast

## File Reference

Main theme file: `src/ui/UITheme.ts`
- `drawPanel()` - Standard panel with title
- `drawSlot()` - Inventory/skill slots
- `drawButton()` - Button with states
- `drawTooltip()` - Tooltip popups
- `drawTab()` - Tab buttons
- `createCloseButton()` - X button with hover
