# Claude Code Workflow for MapleStory Clone

This directory contains Claude Code workflows for game development.

## Quick Start

### Available Commands

Run these with the `/` prefix in Claude Code:

**Development:**
- `/dev` - Start the development server
- `/build` - Build for production
- `/typecheck` - Run TypeScript type checking

**Content Creation:**
- `/new-monster <name>` - Generate a new monster with stats, AI, and sprites
- `/new-skill <name>` - Create a new player skill
- `/new-map <name>` - Set up a new map with Tiled integration
- `/balance-check` - Analyze game balance (DPS, TTK, XP curves)

### Available Agents

Invoke by asking naturally (not a slash command):

**Core Development:**
- **engine** - Game engine specialist (Phaser 3, performance, rendering)
- **combat** - Combat system designer (hitboxes, damage, skills)
- **ai** - Monster AI programmer (state machines, behaviors, bosses)
- **rpg** - RPG systems designer (stats, progression, economy)

**Content & Polish:**
- **ui** - UI/UX specialist (HUD, menus, inventory)
- **artist** - Asset and animation guide (sprites, atlases, animation timing)
- **audio** - Sound designer (effects, music, Web Audio)

**Quality:**
- **reviewer** - Code review for game-specific issues
- **tester** - Test generation for game systems

**Examples:**
```
Use the engine agent to optimize this game loop
Use the combat agent to design a new skill system
Use the ai agent to create a boss fight pattern
Use the rpg agent to balance the experience curve
Use the ui agent to design the inventory screen
```

### Available Skills (Auto-Triggered)

Skills activate automatically when Claude detects relevant context.

| Skill | Auto-Triggers When |
|-------|-------------------|
| **phaser-patterns** | Working with scenes, sprites, physics |
| **game-balance** | Editing stats, damage, XP, drop rates |
| **animation-timing** | Working with sprite animations |

## Directory Structure

```
.claude/
├── agents/          # Sub-agents for specialized tasks
├── commands/        # Slash commands for workflows
├── skills/          # Auto-triggered capabilities
└── README.md        # This file
```

## Adding New Agents

Create a file in `.claude/agents/` with YAML frontmatter:

```markdown
---
name: My Agent
description: What it does
tools:
  - Bash
  - Read
  - Edit
---

You are an expert at...
```

Then invoke: "Use the my-agent agent to..."

## Game Development Tips

1. **Use agents for specialized work** - Let the combat agent handle damage formulas
2. **Run `/balance-check` regularly** - Catch issues before playtesting
3. **Profile before optimizing** - Use engine agent for performance work
