import Phaser from 'phaser';
import { MAPS } from '../config/MapData';
import type { MapDefinition, BackgroundTheme } from '../config/MapData';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { UI_COLORS, drawPanel, drawContentPanel, createCloseButton, getTitleStyle } from './UITheme';

interface MapNode {
  mapId: string;
  map: MapDefinition;
  x: number;
  y: number;
  container: Phaser.GameObjects.Container;
  bg: Phaser.GameObjects.Graphics;
  connections: string[]; // Connected map IDs
}

export class WorldMapUI extends Phaser.GameObjects.Container {
  private overlay!: Phaser.GameObjects.Graphics;
  private panel!: Phaser.GameObjects.Graphics;
  private contentPanel!: Phaser.GameObjects.Graphics;
  private titleText!: Phaser.GameObjects.Text;
  private mapNodes: Map<string, MapNode> = new Map();
  private currentMapId: string = 'henesys_field';
  private playerMarker!: Phaser.GameObjects.Container;
  private connectionLines!: Phaser.GameObjects.Graphics;

  private readonly PANEL_WIDTH = 700;
  private readonly PANEL_HEIGHT = 500;
  private readonly NODE_WIDTH = 100;
  private readonly NODE_HEIGHT = 60;

  // Content panel bounds (where map nodes go)
  private contentX: number = 0;
  private contentY: number = 0;
  private contentWidth: number = 0;
  private contentHeight: number = 0;

  public isOpen: boolean = false;

  constructor(scene: Phaser.Scene) {
    super(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2);

    this.createPanel();
    this.createMapLayout();
    this.createPlayerMarker();

    scene.add.existing(this);
    this.setDepth(2500);
    this.setVisible(false);
  }

  private createPanel(): void {
    // Dark overlay
    this.overlay = this.scene.add.graphics();
    this.overlay.fillStyle(0x000000, 0.75);
    this.overlay.fillRect(-GAME_WIDTH / 2, -GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT);
    this.add(this.overlay);

    // Main panel
    this.panel = this.scene.add.graphics();
    drawPanel(this.panel, -this.PANEL_WIDTH / 2, -this.PANEL_HEIGHT / 2, this.PANEL_WIDTH, this.PANEL_HEIGHT);
    this.add(this.panel);

    // Title
    this.titleText = this.scene.add.text(0, -this.PANEL_HEIGHT / 2 + 20, 'World Map', getTitleStyle());
    this.titleText.setOrigin(0.5);
    this.add(this.titleText);

    // Close button
    const closeBtn = createCloseButton(this.scene, this.PANEL_WIDTH / 2 - 20, -this.PANEL_HEIGHT / 2 + 16, () => this.close());
    this.add(closeBtn);

    // Content panel - area where map nodes are displayed
    const padding = 15;
    const headerHeight = 50;
    this.contentX = -this.PANEL_WIDTH / 2 + padding;
    this.contentY = -this.PANEL_HEIGHT / 2 + headerHeight;
    this.contentWidth = this.PANEL_WIDTH - padding * 2;
    this.contentHeight = this.PANEL_HEIGHT - headerHeight - padding;

    this.contentPanel = this.scene.add.graphics();
    drawContentPanel(this.contentPanel, this.contentX, this.contentY, this.contentWidth, this.contentHeight);
    this.add(this.contentPanel);
  }

  private createMapLayout(): void {
    // Connection lines layer (drawn first, behind nodes)
    this.connectionLines = this.scene.add.graphics();
    this.add(this.connectionLines);

    // Calculate content panel center for positioning nodes
    const contentCenterX = this.contentX + this.contentWidth / 2;
    const contentCenterY = this.contentY + this.contentHeight / 2;

    // Map positions as offsets from content center
    const mapPositions: Record<string, { x: number; y: number; connections: string[] }> = {
      'forest_deep': {
        x: contentCenterX - 220,
        y: contentCenterY - 80,
        connections: ['forest_path']
      },
      'forest_path': {
        x: contentCenterX - 100,
        y: contentCenterY + 60,
        connections: ['forest_deep', 'henesys_town']
      },
      'henesys_town': {
        x: contentCenterX,
        y: contentCenterY + 60,
        connections: ['forest_path', 'henesys_field']
      },
      'henesys_field': {
        x: contentCenterX + 100,
        y: contentCenterY - 40,
        connections: ['henesys_town', 'henesys_field_2']
      },
      'henesys_field_2': {
        x: contentCenterX + 180,
        y: contentCenterY + 100,
        connections: ['henesys_field', 'dungeon_entrance']
      },
      'dungeon_entrance': {
        x: contentCenterX + 250,
        y: contentCenterY,
        connections: ['henesys_field_2', 'dungeon_depths']
      },
      'dungeon_depths': {
        x: contentCenterX + 250,
        y: contentCenterY - 100,
        connections: ['dungeon_entrance']
      },
    };

    // Create nodes for each map
    Object.entries(MAPS).forEach(([mapId, map]) => {
      const pos = mapPositions[mapId];
      if (!pos) return;

      const node = this.createMapNode(mapId, map, pos.x, pos.y, pos.connections);
      this.mapNodes.set(mapId, node);
    });

    // Draw connection lines
    this.drawConnections();
  }

  private createMapNode(mapId: string, map: MapDefinition, x: number, y: number, connections: string[]): MapNode {
    const container = this.scene.add.container(x, y);

    // Background
    const bg = this.scene.add.graphics();
    this.drawNodeBackground(bg, map, false);
    container.add(bg);

    // Safe zone indicator
    if (map.isSafeZone) {
      const safeIcon = this.scene.add.text(this.NODE_WIDTH / 2 - 8, -this.NODE_HEIGHT / 2 + 4, '*', {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#ffff00',
        fontStyle: 'bold'
      });
      safeIcon.setOrigin(0.5);
      container.add(safeIcon);
    }

    // Map name
    const displayName = this.truncateName(map.name, 14);
    const nameText = this.scene.add.text(0, -8, displayName, {
      fontFamily: 'Arial',
      fontSize: '10px',
      color: UI_COLORS.textWhite,
      fontStyle: 'bold'
    });
    nameText.setOrigin(0.5);
    container.add(nameText);

    // Monster count or "Safe"
    const monsterCount = map.monsters.length;
    const infoText = this.scene.add.text(0, 8, map.isSafeZone ? 'Safe Zone' : `${monsterCount} monsters`, {
      fontFamily: 'Arial',
      fontSize: '8px',
      color: map.isSafeZone ? '#88ff88' : '#aaaaaa'
    });
    infoText.setOrigin(0.5);
    container.add(infoText);

    // Hit area
    const hitArea = this.scene.add.rectangle(0, 0, this.NODE_WIDTH, this.NODE_HEIGHT, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    container.add(hitArea);

    // Hover effects
    hitArea.on('pointerover', () => {
      this.drawNodeBackground(bg, map, true);
      this.showMapTooltip(map, x, y);
    });

    hitArea.on('pointerout', () => {
      this.drawNodeBackground(bg, map, false);
      this.hideMapTooltip();
    });

    this.add(container);

    return {
      mapId,
      map,
      x,
      y,
      container,
      bg,
      connections
    };
  }

  private drawNodeBackground(bg: Phaser.GameObjects.Graphics, map: MapDefinition, highlighted: boolean): void {
    bg.clear();

    const color = this.getThemeColor(map.backgroundTheme);

    // Glow effect when highlighted
    if (highlighted) {
      bg.lineStyle(3, UI_COLORS.accentCyan, 0.6);
      bg.strokeRoundedRect(-this.NODE_WIDTH / 2 - 2, -this.NODE_HEIGHT / 2 - 2, this.NODE_WIDTH + 4, this.NODE_HEIGHT + 4, 8);
    }

    // Main background
    bg.fillStyle(color, 0.9);
    bg.fillRoundedRect(-this.NODE_WIDTH / 2, -this.NODE_HEIGHT / 2, this.NODE_WIDTH, this.NODE_HEIGHT, 6);

    // Top highlight
    bg.fillStyle(0xffffff, 0.15);
    bg.fillRoundedRect(-this.NODE_WIDTH / 2 + 2, -this.NODE_HEIGHT / 2 + 2, this.NODE_WIDTH - 4, this.NODE_HEIGHT / 3, { tl: 4, tr: 4, bl: 0, br: 0 });

    // Border
    const borderColor = highlighted ? UI_COLORS.accentCyan : 0x666688;
    bg.lineStyle(2, borderColor, 1);
    bg.strokeRoundedRect(-this.NODE_WIDTH / 2, -this.NODE_HEIGHT / 2, this.NODE_WIDTH, this.NODE_HEIGHT, 6);
  }

  private drawConnections(): void {
    this.connectionLines.clear();
    this.connectionLines.lineStyle(2, 0x556677, 0.6);

    const drawnConnections = new Set<string>();

    this.mapNodes.forEach((node) => {
      node.connections.forEach(targetId => {
        // Create a unique key for this connection to avoid drawing twice
        const connectionKey = [node.mapId, targetId].sort().join('-');
        if (drawnConnections.has(connectionKey)) return;
        drawnConnections.add(connectionKey);

        const targetNode = this.mapNodes.get(targetId);
        if (!targetNode) return;

        this.connectionLines.moveTo(node.x, node.y);
        this.connectionLines.lineTo(targetNode.x, targetNode.y);
        this.connectionLines.strokePath();
      });
    });
  }

  private createPlayerMarker(): void {
    this.playerMarker = this.scene.add.container(0, 0);

    // Pulsing circle
    const pulse = this.scene.add.graphics();
    pulse.fillStyle(0x00ff00, 0.3);
    pulse.fillCircle(0, 0, 15);
    this.playerMarker.add(pulse);

    // Player icon (simple arrow/triangle)
    const icon = this.scene.add.graphics();
    icon.fillStyle(0x00ff00, 1);
    icon.fillTriangle(0, -10, -7, 7, 7, 7);
    icon.lineStyle(2, 0xffffff, 1);
    icon.strokeTriangle(0, -10, -7, 7, 7, 7);
    this.playerMarker.add(icon);

    // "You" label
    const label = this.scene.add.text(0, 15, 'You', {
      fontFamily: 'Arial',
      fontSize: '9px',
      color: '#00ff00',
      fontStyle: 'bold'
    });
    label.setOrigin(0.5);
    this.playerMarker.add(label);

    this.add(this.playerMarker);

    // Add pulsing animation
    this.scene.tweens.add({
      targets: pulse,
      scaleX: 1.3,
      scaleY: 1.3,
      alpha: 0,
      duration: 1000,
      repeat: -1
    });
  }

  private updatePlayerMarker(): void {
    const node = this.mapNodes.get(this.currentMapId);
    if (node) {
      this.playerMarker.setPosition(node.x, node.y - this.NODE_HEIGHT / 2 - 20);
    }
  }

  private getThemeColor(theme: BackgroundTheme): number {
    switch (theme) {
      case 'town': return 0x4a6fa5;
      case 'field': return 0x5a8f4a;
      case 'forest': return 0x2d5a3d;
      case 'dungeon': return 0x6a5a4a;
      case 'night': return 0x3a3a5a;
      default: return 0x4a4a6a;
    }
  }

  private truncateName(name: string, maxLength: number): string {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength - 2) + '..';
  }

  private tooltipContainer: Phaser.GameObjects.Container | null = null;

  private showMapTooltip(map: MapDefinition, nodeX: number, nodeY: number): void {
    this.hideMapTooltip();

    const tooltipWidth = 160;
    const tooltipHeight = 80;

    // Position tooltip above or below node depending on space
    const tooltipY = nodeY < 0 ? nodeY + this.NODE_HEIGHT / 2 + 10 : nodeY - this.NODE_HEIGHT / 2 - tooltipHeight - 10;

    this.tooltipContainer = this.scene.add.container(nodeX, tooltipY);

    // Background
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.95);
    bg.fillRoundedRect(-tooltipWidth / 2, 0, tooltipWidth, tooltipHeight, 6);
    bg.lineStyle(1, 0x4a4a6a, 1);
    bg.strokeRoundedRect(-tooltipWidth / 2, 0, tooltipWidth, tooltipHeight, 6);
    this.tooltipContainer.add(bg);

    // Full map name
    const nameText = this.scene.add.text(0, 10, map.name, {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    nameText.setOrigin(0.5, 0);
    this.tooltipContainer.add(nameText);

    // Details
    const details = [
      `Theme: ${map.backgroundTheme}`,
      `Monsters: ${map.monsters.length}`,
      `NPCs: ${map.npcs.length}`,
      `Portals: ${map.portals.length}`
    ];

    details.forEach((detail, index) => {
      const text = this.scene.add.text(0, 28 + index * 12, detail, {
        fontFamily: 'Arial',
        fontSize: '9px',
        color: '#aaaaaa'
      });
      text.setOrigin(0.5, 0);
      this.tooltipContainer!.add(text);
    });

    this.add(this.tooltipContainer);
  }

  private hideMapTooltip(): void {
    if (this.tooltipContainer) {
      this.tooltipContainer.destroy();
      this.tooltipContainer = null;
    }
  }

  setCurrentMap(mapId: string): void {
    this.currentMapId = mapId;
    this.updatePlayerMarker();
  }

  open(): void {
    this.isOpen = true;
    this.setVisible(true);
    this.updatePlayerMarker();
  }

  close(): void {
    this.isOpen = false;
    this.setVisible(false);
    this.hideMapTooltip();
  }

  toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }
}
