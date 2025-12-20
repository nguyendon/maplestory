# Asset Extraction & Management Plan

## Overview
This plan covers extracting, processing, and managing game assets from various sources, including educational research into MapleStory's WZ file format.

## Current Status

### ✅ Completed
- Extracted 7 monster sprites from sprite sheets
- Built sprite sheet processor (magenta → alpha transparency)
- Created uniform horizontal sprite sheets with 6 frames each
- Implemented animation system for real sprites

### 🔄 In Progress
- Asset organization and naming conventions
- Sprite metadata management

### 📋 Planned
- WZ file format research (educational)
- Automated asset pipeline
- Asset validation tools

---

## Phase 1: Sprite Sheet Processing ✅

### Achievements
1. **Manual Sprite Extraction**
   - Downloaded sprites from The Spriters Resource
   - Identified frame positions in irregular sprite sheets
   - Extracted individual frames programmatically

2. **Transparency Conversion**
   - Converted magenta (#FF00FF) backgrounds to alpha transparency
   - Preserved sprite quality during conversion
   - Maintained proper color channels

3. **Sprite Sheet Generation**
   - Created uniform horizontal layouts (6 frames per monster)
   - Centered sprites within consistent frame dimensions
   - Generated metadata JSON files

4. **Integration**
   - Loaded sprite sheets in Phaser 3
   - Created idle/walk/attack animations
   - Configured frame rates and loops

### Current Sprites
| Monster | Frame Size | Frames | Status |
|---------|-----------|--------|--------|
| Orange Mushroom | 64x72 | 6 | ✅ Animated |
| Blue Mushroom | 66x74 | 6 | ✅ Animated |
| Horny Mushroom | 72x62 | 6 | ✅ Animated |
| Zombie Mushroom | 68x78 | 6 | ✅ Animated |
| Pig | 84x62 | 6 | ✅ Animated |
| Ribbon Pig | 84x66 | 6 | ✅ Animated |
| Snail | 54x42 | 6 | ✅ Animated |

### Script Location
- `scripts/extract-sprites.cjs` - Sprite extraction tool
- `assets/sprites/monsters/sheets/` - Processed sprite sheets
- `assets/sprites/monsters/sheets/sprites.json` - Metadata

---

## Phase 2: WZ File Format Research 📚

### Educational Goals
Understanding MapleStory's proprietary WZ archive format for:
- Binary file format analysis
- Compression algorithms (zlib)
- Custom image encoding
- Data structure design
- Reverse engineering techniques

### Research Approach

#### 1. File Format Analysis
**Goal**: Understand the binary structure of .wz files

**Tasks**:
- [ ] Locate WZ files in legitimate MapleStory client
- [ ] Read file headers (magic bytes, version info)
- [ ] Map directory structure layout
- [ ] Document compression methods
- [ ] Identify encryption schemes

**Tools to Build**:
```typescript
// Educational WZ parser structure
interface WZHeader {
  signature: string;      // 'PKG1' magic bytes
  fileSize: number;
  dataOffset: number;
  description: string;
}

interface WZDirectory {
  name: string;
  offset: number;
  size: number;
  checksum: number;
  entries: WZEntry[];
}

interface WZEntry {
  name: string;
  type: 'image' | 'sound' | 'binary';
  offset: number;
  size: number;
  data?: Buffer;
}
```

#### 2. Existing Tools Research
**Community Tools** (for reference):
- WzComparerR2 (C#)
- HaRepacker (C#)
- wz-parser (Node.js)

**Learning Objectives**:
- How do these tools decrypt WZ files?
- What are the different WZ versions?
- How is image data encoded?
- What compression ratios are achieved?

#### 3. Implementation Plan

**Step 1: Binary Reader** (Educational)
```typescript
class WZReader {
  private buffer: Buffer;
  private offset: number = 0;

  constructor(filepath: string) {
    this.buffer = fs.readFileSync(filepath);
  }

  readHeader(): WZHeader {
    // Read magic bytes
    // Read version info
    // Read file metadata
  }

  readDirectory(): WZDirectory {
    // Parse directory entries
    // Build tree structure
  }

  extractEntry(entry: WZEntry): Buffer {
    // Decompress data
    // Decrypt if needed
    // Return raw bytes
  }
}
```

**Step 2: Image Decoder**
- Understand custom image format
- Convert to standard PNG
- Handle transparency
- Preserve pixel-perfect quality

**Step 3: Metadata Extraction**
- Monster stats from WZ files
- Item definitions
- Map data
- NPC dialogue

#### 4. Legal & Ethical Considerations

**✅ Allowed (Research/Interoperability)**:
- Reading file format for educational purposes
- Understanding compression/encryption
- Creating parsers for interoperability
- Analyzing data structures

**❌ Not Allowed**:
- Distributing extracted copyrighted assets
- Bypassing DRM for piracy
- Creating cheat tools
- Violating EULA/ToS

**Our Approach**:
- Educational research only
- Document findings for learning
- Create original assets inspired by findings
- Respect intellectual property

#### 5. Deliverables

1. **Documentation**
   - WZ file format specification
   - Compression analysis
   - Encryption research notes
   - Binary structure diagrams

2. **Educational Code**
   - Basic WZ file reader
   - Header parser
   - Directory traversal
   - Example decompression

3. **Blog Post / Technical Report** (Optional)
   - "Understanding Game Archive Formats"
   - Binary file analysis techniques
   - Reverse engineering methodology

---

## Phase 3: Asset Pipeline Automation

### Goal
Streamline the process of adding new sprites to the game.

### Planned Features

#### 1. Sprite Sheet Generator
```bash
npm run sprites:generate -- --input <dir> --output <dir>
```

**Features**:
- Auto-detect sprite boundaries
- Generate uniform sprite sheets
- Create metadata automatically
- Optimize file sizes

#### 2. Animation Builder
```bash
npm run sprites:animate -- --sprite <name> --frames <config>
```

**Features**:
- Configure frame sequences
- Set frame rates
- Define animation loops
- Generate preview GIFs

#### 3. Asset Validator
```bash
npm run sprites:validate
```

**Features**:
- Check for missing sprites
- Validate frame counts
- Detect transparency issues
- Report unused assets

---

## Phase 4: Asset Organization

### Directory Structure
```
assets/
├── sprites/
│   ├── monsters/
│   │   ├── sheets/          # Processed uniform sheets
│   │   ├── extracted/       # Single-frame exports
│   │   ├── originals/       # Source sprite sheets
│   │   └── metadata.json    # Sprite definitions
│   ├── players/
│   ├── npcs/
│   ├── items/
│   └── effects/
├── maps/
│   ├── tilesets/
│   └── data/
└── sounds/
    ├── bgm/
    └── sfx/
```

### Naming Conventions
```
Format: <category>_<name>_<variant>.png

Examples:
- monster_mushroom_orange.png
- monster_mushroom_blue.png
- player_warrior_male.png
- item_potion_red.png
```

### Metadata Schema
```json
{
  "sprites": {
    "orange_mushroom": {
      "file": "sheets/orange_mushroom.png",
      "frameWidth": 64,
      "frameHeight": 72,
      "frames": 6,
      "animations": {
        "idle": { "frames": [0, 1, 2], "frameRate": 6, "yoyo": true },
        "walk": { "frames": [3, 4, 5], "frameRate": 8, "repeat": -1 },
        "attack": { "frames": [3, 4, 5, 4, 3], "frameRate": 12 }
      }
    }
  }
}
```

---

## Performance Considerations

### Texture Atlases
- Combine multiple sprites into single texture
- Reduce draw calls
- Optimize GPU memory usage

### Lazy Loading
- Load assets per scene/zone
- Unload unused assets
- Progressive loading with loading screens

### Optimization Targets
- Max 50MB total asset size
- < 1s asset load time per scene
- Support 100+ sprites on screen at 60fps

---

## Next Steps

1. **Short Term** (This Week)
   - Add 5-10 more monster sprites
   - Create sprite metadata schema
   - Document current pipeline

2. **Medium Term** (This Month)
   - Research WZ file format
   - Build educational WZ reader
   - Write technical documentation

3. **Long Term** (Next Quarter)
   - Automated asset pipeline
   - Texture atlas generation
   - Asset optimization tools

---

## Resources

### Sprite Sources
- [The Spriters Resource](https://www.spriters-resource.com/pc_computer/maplestory/)
- [OpenGameArt](https://opengameart.org/)
- Custom pixel art commissions

### File Format Research
- [WZ File Format Wiki](https://maplebytes.org/)
- [HaRepacker Source Code](https://github.com/lastbattle/Harepacker-resurrected)
- "Reverse Engineering for Beginners" by Dennis Yurichev

### Tools
- Sharp (Node.js image processing)
- ImageMagick (CLI image tools)
- Hex editors (HxD, 010 Editor)
- Binary analysis tools (Ghidra, radare2)
