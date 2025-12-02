/**
 * ChatCommands - GM/Admin command handler
 * Parses and executes slash commands for testing and administration
 */

import { PlayerStats } from './CharacterStats';
import { PlayerSkillTree } from '../skills/PlayerSkillTree';
import { JobId, JOBS } from './JobData';
import { ChatUI } from '../ui/ChatUI';
import { MAPS } from '../config/MapData';

export interface CommandContext {
  playerStats: PlayerStats;
  skillTree: PlayerSkillTree;
  chatUI: ChatUI;
  changeMap?: (mapId: string) => void;
  giveItem?: (itemId: string, amount: number) => void;
  spawnMonster?: (monsterId: string, count: number) => void;
}

interface CommandDefinition {
  name: string;
  aliases: string[];
  description: string;
  usage: string;
  execute: (ctx: CommandContext, args: string[]) => void;
}

const commands: CommandDefinition[] = [
  // ============== Character Commands ==============
  {
    name: 'job',
    aliases: ['j', 'setjob'],
    description: 'Change your job class',
    usage: '/job <warrior|mage|archer|thief|beginner>',
    execute: (ctx, args) => {
      if (args.length < 1) {
        ctx.chatUI.addErrorMessage('Usage: /job <warrior|mage|archer|thief|beginner>');
        ctx.chatUI.addSystemMessage('Available jobs: warrior, mage, archer, thief, beginner');
        return;
      }

      const jobName = args[0].toUpperCase();
      const jobMap: Record<string, JobId> = {
        'WARRIOR': JobId.WARRIOR,
        'MAGE': JobId.MAGE,
        'ARCHER': JobId.ARCHER,
        'THIEF': JobId.THIEF,
        'BEGINNER': JobId.BEGINNER,
        // Short aliases
        'W': JobId.WARRIOR,
        'M': JobId.MAGE,
        'A': JobId.ARCHER,
        'T': JobId.THIEF,
        'B': JobId.BEGINNER,
      };

      const targetJob = jobMap[jobName];
      if (!targetJob) {
        ctx.chatUI.addErrorMessage(`Unknown job: ${args[0]}`);
        ctx.chatUI.addSystemMessage('Available: warrior, mage, archer, thief, beginner');
        return;
      }

      ctx.playerStats.setJob(targetJob);
      const jobDef = JOBS[targetJob];
      ctx.chatUI.addSuccessMessage(`Job changed to ${jobDef.name}!`);
    }
  },

  {
    name: 'level',
    aliases: ['lv', 'lvl', 'setlevel'],
    description: 'Set your level',
    usage: '/level <number>',
    execute: (ctx, args) => {
      if (args.length < 1) {
        ctx.chatUI.addErrorMessage('Usage: /level <number>');
        return;
      }

      const level = parseInt(args[0], 10);
      if (isNaN(level) || level < 1 || level > 200) {
        ctx.chatUI.addErrorMessage('Level must be between 1 and 200');
        return;
      }

      // Calculate how much EXP is needed
      const currentLevel = ctx.playerStats.level;
      if (level > currentLevel) {
        // Gain levels
        const expNeeded = PlayerStats.getExpForLevel(level) - ctx.playerStats.exp;
        if (expNeeded > 0) {
          ctx.playerStats.gainExp(expNeeded + 1);
        }
      } else if (level < currentLevel) {
        // Can't decrease level directly, but we can inform user
        ctx.chatUI.addErrorMessage('Cannot decrease level. Use /reset to start fresh.');
        return;
      }

      ctx.chatUI.addSuccessMessage(`Level set to ${ctx.playerStats.level}!`);
    }
  },

  {
    name: 'sp',
    aliases: ['givesp', 'addsp'],
    description: 'Give yourself skill points',
    usage: '/sp <amount>',
    execute: (ctx, args) => {
      const amount = args.length > 0 ? parseInt(args[0], 10) : 10;
      if (isNaN(amount) || amount < 1) {
        ctx.chatUI.addErrorMessage('Usage: /sp <amount>');
        return;
      }

      ctx.playerStats.addSP(amount);
      ctx.chatUI.addSuccessMessage(`Added ${amount} SP! Total: ${ctx.playerStats.unassignedSP}`);
    }
  },

  {
    name: 'ap',
    aliases: ['giveap', 'addap'],
    description: 'Give yourself ability points',
    usage: '/ap <amount>',
    execute: (ctx, args) => {
      const amount = args.length > 0 ? parseInt(args[0], 10) : 10;
      if (isNaN(amount) || amount < 1) {
        ctx.chatUI.addErrorMessage('Usage: /ap <amount>');
        return;
      }

      // Access private field via any cast (for GM commands only)
      (ctx.playerStats as any)._unassignedAP += amount;
      ctx.playerStats.emit('statsChanged');
      ctx.chatUI.addSuccessMessage(`Added ${amount} AP! Total: ${ctx.playerStats.unassignedAP}`);
    }
  },

  {
    name: 'resetskills',
    aliases: ['rskills', 'skillreset'],
    description: 'Reset all skills and refund SP',
    usage: '/resetskills',
    execute: (ctx, _args) => {
      const refunded = ctx.skillTree.resetSkills();
      ctx.chatUI.addSuccessMessage(`Skills reset! Refunded ${refunded} SP.`);
    }
  },

  {
    name: 'resetstats',
    aliases: ['rstats', 'statreset'],
    description: 'Reset all stats to base and refund AP',
    usage: '/resetstats',
    execute: (ctx, _args) => {
      // Calculate AP to refund (all points above base 4 in each stat)
      const baseStats = { STR: 4, DEX: 4, INT: 4, LUK: 4 };
      let apRefunded = 0;

      apRefunded += ctx.playerStats.STR - baseStats.STR;
      apRefunded += ctx.playerStats.DEX - baseStats.DEX;
      apRefunded += ctx.playerStats.INT - baseStats.INT;
      apRefunded += ctx.playerStats.LUK - baseStats.LUK;

      // Reset via private fields (GM command)
      const ps = ctx.playerStats as any;
      ps._baseStats = { ...baseStats };
      ps._unassignedAP += apRefunded;
      ps._currentHP = ctx.playerStats.getMaxHP();
      ps._currentMP = ctx.playerStats.getMaxMP();
      ctx.playerStats.emit('statsChanged');
      ctx.playerStats.emit('hpChanged', ctx.playerStats.currentHP, ctx.playerStats.getMaxHP());
      ctx.playerStats.emit('mpChanged', ctx.playerStats.currentMP, ctx.playerStats.getMaxMP());

      ctx.chatUI.addSuccessMessage(`Stats reset! Refunded ${apRefunded} AP.`);
    }
  },

  {
    name: 'heal',
    aliases: ['h', 'fullheal'],
    description: 'Fully restore HP and MP',
    usage: '/heal',
    execute: (ctx, _args) => {
      const ps = ctx.playerStats as any;
      ps._currentHP = ctx.playerStats.getMaxHP();
      ps._currentMP = ctx.playerStats.getMaxMP();
      ctx.playerStats.emit('hpChanged', ctx.playerStats.currentHP, ctx.playerStats.getMaxHP());
      ctx.playerStats.emit('mpChanged', ctx.playerStats.currentMP, ctx.playerStats.getMaxMP());
      ctx.chatUI.addSuccessMessage('HP and MP fully restored!');
    }
  },

  {
    name: 'maxstats',
    aliases: ['max', 'godmode'],
    description: 'Max out all stats (sets each to 999)',
    usage: '/maxstats',
    execute: (ctx, _args) => {
      const ps = ctx.playerStats as any;
      ps._baseStats = { STR: 999, DEX: 999, INT: 999, LUK: 999 };
      ps._currentHP = ctx.playerStats.getMaxHP();
      ps._currentMP = ctx.playerStats.getMaxMP();
      ctx.playerStats.emit('statsChanged');
      ctx.playerStats.emit('hpChanged', ctx.playerStats.currentHP, ctx.playerStats.getMaxHP());
      ctx.playerStats.emit('mpChanged', ctx.playerStats.currentMP, ctx.playerStats.getMaxMP());
      ctx.chatUI.addSuccessMessage('All stats maxed to 999!');
    }
  },

  {
    name: 'exp',
    aliases: ['giveexp', 'addexp'],
    description: 'Give yourself experience points',
    usage: '/exp <amount>',
    execute: (ctx, args) => {
      const amount = args.length > 0 ? parseInt(args[0], 10) : 1000;
      if (isNaN(amount) || amount < 1) {
        ctx.chatUI.addErrorMessage('Usage: /exp <amount>');
        return;
      }

      const levelsGained = ctx.playerStats.gainExp(amount);
      ctx.chatUI.addSuccessMessage(`Gained ${amount} EXP!`);
      if (levelsGained > 0) {
        ctx.chatUI.addSuccessMessage(`Leveled up ${levelsGained} times! Now level ${ctx.playerStats.level}`);
      }
    }
  },

  // ============== Map Commands ==============
  {
    name: 'map',
    aliases: ['warp', 'goto'],
    description: 'Warp to a map',
    usage: '/map <mapId>',
    execute: (ctx, args) => {
      if (!ctx.changeMap) {
        ctx.chatUI.addErrorMessage('Map warping not available');
        return;
      }

      if (args.length < 1) {
        ctx.chatUI.addSystemMessage('Available maps:');
        Object.values(MAPS).forEach(map => {
          ctx.chatUI.addSystemMessage(`  ${map.id} - ${map.name}`);
        });
        return;
      }

      const mapId = args[0].toLowerCase();
      const map = Object.values(MAPS).find(m =>
        m.id.toLowerCase() === mapId || m.name.toLowerCase().includes(mapId)
      );

      if (!map) {
        ctx.chatUI.addErrorMessage(`Map not found: ${args[0]}`);
        ctx.chatUI.addSystemMessage('Use /map to list available maps');
        return;
      }

      ctx.changeMap(map.id);
      ctx.chatUI.addSuccessMessage(`Warped to ${map.name}!`);
    }
  },

  // ============== Info Commands ==============
  {
    name: 'stats',
    aliases: ['info', 'status'],
    description: 'Show your current stats',
    usage: '/stats',
    execute: (ctx, _args) => {
      const ps = ctx.playerStats;
      const job = JOBS[ps.job];
      ctx.chatUI.addSystemMessage(`=== ${job.name} Lv.${ps.level} ===`);
      ctx.chatUI.addSystemMessage(`HP: ${ps.currentHP}/${ps.getMaxHP()} | MP: ${ps.currentMP}/${ps.getMaxMP()}`);
      ctx.chatUI.addSystemMessage(`STR: ${ps.STR} | DEX: ${ps.DEX} | INT: ${ps.INT} | LUK: ${ps.LUK}`);
      ctx.chatUI.addSystemMessage(`ATK: ${ps.getATK()} | MATK: ${ps.getMATK()} | DEF: ${ps.getDEF()}`);
      ctx.chatUI.addSystemMessage(`AP: ${ps.unassignedAP} | SP: ${ps.unassignedSP}`);
    }
  },

  {
    name: 'help',
    aliases: ['?', 'commands'],
    description: 'Show available commands',
    usage: '/help [command]',
    execute: (ctx, args) => {
      if (args.length > 0) {
        const cmdName = args[0].toLowerCase();
        const cmd = commands.find(c =>
          c.name === cmdName || c.aliases.includes(cmdName)
        );

        if (cmd) {
          ctx.chatUI.addSystemMessage(`/${cmd.name} - ${cmd.description}`);
          ctx.chatUI.addSystemMessage(`Usage: ${cmd.usage}`);
          if (cmd.aliases.length > 0) {
            ctx.chatUI.addSystemMessage(`Aliases: ${cmd.aliases.join(', ')}`);
          }
        } else {
          ctx.chatUI.addErrorMessage(`Unknown command: ${args[0]}`);
        }
        return;
      }

      ctx.chatUI.addSystemMessage('=== Available Commands ===');
      ctx.chatUI.addSystemMessage('/job, /level, /sp, /ap, /exp');
      ctx.chatUI.addSystemMessage('/heal, /maxstats');
      ctx.chatUI.addSystemMessage('/resetskills, /resetstats');
      ctx.chatUI.addSystemMessage('/map, /stats, /help');
      ctx.chatUI.addSystemMessage('Use /help <command> for details');
    }
  },
];

/**
 * Execute a chat command
 */
export function executeCommand(
  command: string,
  args: string[],
  context: CommandContext
): boolean {
  const cmdDef = commands.find(c =>
    c.name === command || c.aliases.includes(command)
  );

  if (!cmdDef) {
    context.chatUI.addErrorMessage(`Unknown command: /${command}`);
    context.chatUI.addSystemMessage('Type /help for available commands');
    return false;
  }

  try {
    cmdDef.execute(context, args);
    return true;
  } catch (error) {
    console.error(`Error executing command /${command}:`, error);
    context.chatUI.addErrorMessage(`Command error: ${error}`);
    return false;
  }
}
