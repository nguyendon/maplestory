import type { DialogueData } from '../ui/DialogueBox';

export interface NPCDefinition {
  id: string;
  name: string;
  dialogueKey: string;
  spriteKey?: string;
  width?: number;
  height?: number;
}

export const NPC_DEFINITIONS: Record<string, NPCDefinition> = {
  GUIDE_NPC: {
    id: 'GUIDE_NPC',
    name: 'Maple Guide',
    dialogueKey: 'guide_intro',
    width: 32,
    height: 48
  },
  SHOP_NPC: {
    id: 'SHOP_NPC',
    name: 'Shopkeeper',
    dialogueKey: 'shop_greeting',
    width: 32,
    height: 48
  },
  QUEST_NPC: {
    id: 'QUEST_NPC',
    name: 'Quest Giver',
    dialogueKey: 'quest_intro',
    width: 32,
    height: 48
  }
};

export const DIALOGUES: Record<string, DialogueData> = {
  guide_intro: {
    lines: [
      {
        speaker: 'Maple Guide',
        text: 'Welcome to Maple Island, adventurer! I see you are new here.'
      },
      {
        speaker: 'Maple Guide',
        text: 'Use the arrow keys to move, SPACE to jump, and Z to attack.'
      },
      {
        speaker: 'Maple Guide',
        text: 'Defeat monsters to gain experience and level up!',
        choices: [
          { text: 'Tell me more about combat' },
          { text: 'How do I use skills?' },
          { text: 'Thanks, bye!' }
        ]
      }
    ]
  },
  guide_combat: {
    lines: [
      {
        speaker: 'Maple Guide',
        text: 'Combat is simple! Press Z to perform a basic attack.'
      },
      {
        speaker: 'Maple Guide',
        text: 'When you defeat monsters, you gain EXP and mesos.'
      },
      {
        speaker: 'Maple Guide',
        text: 'Be careful not to let your HP drop to zero!'
      }
    ]
  },
  guide_skills: {
    lines: [
      {
        speaker: 'Maple Guide',
        text: 'Skills will become available as you level up.'
      },
      {
        speaker: 'Maple Guide',
        text: 'Each skill uses MP, so keep an eye on your MP bar.'
      }
    ]
  },
  shop_greeting: {
    lines: [
      {
        speaker: 'Shopkeeper',
        text: 'Welcome to my shop! Take a look at my wares.'
      },
      {
        speaker: 'Shopkeeper',
        text: 'I have potions, equipment, and more!',
        choices: [
          { text: 'Show me potions' },
          { text: 'Show me equipment' },
          { text: 'Maybe later' }
        ]
      }
    ]
  },
  quest_intro: {
    lines: [
      {
        speaker: 'Quest Giver',
        text: 'Ah, a brave adventurer! I have a task for you.'
      },
      {
        speaker: 'Quest Giver',
        text: 'The slimes in this area have become a nuisance.',
        choices: [
          { text: 'Accept Quest: Defeat 10 Slimes' },
          { text: 'Not interested right now' }
        ]
      }
    ]
  }
};

export function getNPCDefinition(id: string): NPCDefinition | undefined {
  return NPC_DEFINITIONS[id];
}

export function getDialogue(key: string): DialogueData | undefined {
  return DIALOGUES[key];
}
