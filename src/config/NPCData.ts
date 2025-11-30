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
          { text: 'Tell me more about combat', nextDialogueKey: 'guide_combat' },
          { text: 'How do I use skills?', nextDialogueKey: 'guide_skills' },
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
  },
  chief_stan: {
    lines: [
      {
        speaker: 'Chief Stan',
        text: 'Welcome to Henesys Town, traveler!'
      },
      {
        speaker: 'Chief Stan',
        text: 'This is a safe haven for adventurers. Rest here before venturing out.'
      },
      {
        speaker: 'Chief Stan',
        text: 'The hunting grounds lie to the east, and the enchanted forest to the west.',
        choices: [
          { text: 'Tell me about the hunting grounds', nextDialogueKey: 'chief_hunting' },
          { text: 'What about the forest?', nextDialogueKey: 'chief_forest' },
          { text: 'Thanks for the info!' }
        ]
      }
    ]
  },
  chief_hunting: {
    lines: [
      {
        speaker: 'Chief Stan',
        text: 'The Henesys Hunting Ground is perfect for beginners.'
      },
      {
        speaker: 'Chief Stan',
        text: 'You will find slimes and snails there. Further east lies a dungeon with stronger foes.'
      }
    ]
  },
  chief_forest: {
    lines: [
      {
        speaker: 'Chief Stan',
        text: 'Ellinia Forest is home to mushrooms and other creatures.'
      },
      {
        speaker: 'Chief Stan',
        text: 'The deeper you go, the more dangerous it becomes. Be prepared!'
      }
    ]
  },
  healer_greeting: {
    lines: [
      {
        speaker: 'Healer',
        text: 'Blessings upon you, adventurer.'
      },
      {
        speaker: 'Healer',
        text: 'If your wounds are grave, rest here in town. Your HP and MP recover faster in safe zones.',
        choices: [
          { text: 'Thank you for the advice' },
          { text: 'Do you sell potions?', nextDialogueKey: 'healer_potions' }
        ]
      }
    ]
  },
  healer_potions: {
    lines: [
      {
        speaker: 'Healer',
        text: 'I do not sell potions myself, but the Merchant upstairs has a fine selection.'
      },
      {
        speaker: 'Healer',
        text: 'Red potions restore HP, blue potions restore MP. Always keep some with you!'
      }
    ]
  },
  trainer_intro: {
    lines: [
      {
        speaker: 'Trainer',
        text: 'Ah, you look like you could use some training!'
      },
      {
        speaker: 'Trainer',
        text: 'Press ESC to configure your key bindings. You can assign skills to any key.',
        choices: [
          { text: 'Tell me about skills', nextDialogueKey: 'trainer_skills' },
          { text: 'I am good for now' }
        ]
      }
    ]
  },
  trainer_skills: {
    lines: [
      {
        speaker: 'Trainer',
        text: 'Skills are powerful attacks that cost MP to use.'
      },
      {
        speaker: 'Trainer',
        text: 'Power Strike hits hard. Double Strike attacks twice. Slash Blast can hit multiple enemies!'
      },
      {
        speaker: 'Trainer',
        text: 'Use Rage to boost your attack power temporarily. Practice combining your skills!'
      }
    ]
  },
  fairy_greeting: {
    lines: [
      {
        speaker: 'Fairy',
        text: '*sparkles* Tee hee! A visitor to our forest!'
      },
      {
        speaker: 'Fairy',
        text: 'The trees here are ancient and wise. Be respectful of nature, and she will be kind to you.'
      },
      {
        speaker: 'Fairy',
        text: 'If you venture deeper into the forest, watch out for the mushrooms. They are quite territorial!'
      }
    ]
  },
  dungeon_guard: {
    lines: [
      {
        speaker: 'Guard',
        text: 'Halt! Beyond this point lies danger.'
      },
      {
        speaker: 'Guard',
        text: 'This dungeon was once a mine, but something dark has taken residence within.',
        choices: [
          { text: 'I am not afraid', nextDialogueKey: 'guard_brave' },
          { text: 'Maybe I should prepare more' }
        ]
      }
    ]
  },
  guard_brave: {
    lines: [
      {
        speaker: 'Guard',
        text: 'Brave words! The portal above leads to the dungeon depths.'
      },
      {
        speaker: 'Guard',
        text: 'Watch your step, adventurer. Not many return from the lowest levels.'
      }
    ]
  },
  // Job Advancement Dialogues
  job_instructor: {
    lines: [
      {
        speaker: 'Job Instructor',
        text: 'Greetings, adventurer. I sense great potential in you.'
      },
      {
        speaker: 'Job Instructor',
        text: 'When you reach level 10, you may choose a job path.',
        choices: [
          { text: 'Tell me about Warriors', nextDialogueKey: 'job_warrior_info' },
          { text: 'Tell me about Mages', nextDialogueKey: 'job_mage_info' },
          { text: 'Tell me about Archers', nextDialogueKey: 'job_archer_info' },
          { text: 'Tell me about Thieves', nextDialogueKey: 'job_thief_info' }
        ]
      }
    ]
  },
  job_warrior_info: {
    lines: [
      {
        speaker: 'Job Instructor',
        text: 'Warriors are mighty fighters who excel in close combat.'
      },
      {
        speaker: 'Job Instructor',
        text: 'They have high HP and physical attack power. Primary stat: STR.'
      },
      {
        speaker: 'Job Instructor',
        text: 'Skills: Power Strike, Slash Blast, Ground Smash, Rage, Iron Body.',
        choices: [
          { text: 'I want to become a Warrior!', nextDialogueKey: 'job_advance_warrior' },
          { text: 'Tell me about other jobs', nextDialogueKey: 'job_instructor' }
        ]
      }
    ]
  },
  job_mage_info: {
    lines: [
      {
        speaker: 'Job Instructor',
        text: 'Mages wield devastating elemental magic from a distance.'
      },
      {
        speaker: 'Job Instructor',
        text: 'They have high MP and magical attack. Primary stat: INT.'
      },
      {
        speaker: 'Job Instructor',
        text: 'Skills: Magic Bolt, Fire Arrow, Ice Beam, Teleport, Magic Guard.',
        choices: [
          { text: 'I want to become a Mage!', nextDialogueKey: 'job_advance_mage' },
          { text: 'Tell me about other jobs', nextDialogueKey: 'job_instructor' }
        ]
      }
    ]
  },
  job_archer_info: {
    lines: [
      {
        speaker: 'Job Instructor',
        text: 'Archers strike from a distance with deadly precision.'
      },
      {
        speaker: 'Job Instructor',
        text: 'They have balanced stats and ranged attacks. Primary stat: DEX.'
      },
      {
        speaker: 'Job Instructor',
        text: 'Skills: Double Shot, Arrow Bomb, Arrow Rain, Soul Arrow, Focus.',
        choices: [
          { text: 'I want to become an Archer!', nextDialogueKey: 'job_advance_archer' },
          { text: 'Tell me about other jobs', nextDialogueKey: 'job_instructor' }
        ]
      }
    ]
  },
  job_thief_info: {
    lines: [
      {
        speaker: 'Job Instructor',
        text: 'Thieves are swift assassins with high critical rates.'
      },
      {
        speaker: 'Job Instructor',
        text: 'They excel at speed and evasion. Primary stat: LUK.'
      },
      {
        speaker: 'Job Instructor',
        text: 'Skills: Lucky Seven, Double Stab, Disorder, Haste, Dark Sight.',
        choices: [
          { text: 'I want to become a Thief!', nextDialogueKey: 'job_advance_thief' },
          { text: 'Tell me about other jobs', nextDialogueKey: 'job_instructor' }
        ]
      }
    ]
  },
  job_advance_warrior: {
    lines: [
      {
        speaker: 'Job Instructor',
        text: 'You wish to walk the path of the Warrior?'
      },
      {
        speaker: 'Job Instructor',
        text: 'This choice cannot be undone. Are you ready?',
        choices: [
          { text: 'Yes, make me a Warrior!', nextDialogueKey: 'job_confirm_warrior' },
          { text: 'Let me think about it' }
        ]
      }
    ]
  },
  job_advance_mage: {
    lines: [
      {
        speaker: 'Job Instructor',
        text: 'You wish to walk the path of the Mage?'
      },
      {
        speaker: 'Job Instructor',
        text: 'This choice cannot be undone. Are you ready?',
        choices: [
          { text: 'Yes, make me a Mage!', nextDialogueKey: 'job_confirm_mage' },
          { text: 'Let me think about it' }
        ]
      }
    ]
  },
  job_advance_archer: {
    lines: [
      {
        speaker: 'Job Instructor',
        text: 'You wish to walk the path of the Archer?'
      },
      {
        speaker: 'Job Instructor',
        text: 'This choice cannot be undone. Are you ready?',
        choices: [
          { text: 'Yes, make me an Archer!', nextDialogueKey: 'job_confirm_archer' },
          { text: 'Let me think about it' }
        ]
      }
    ]
  },
  job_advance_thief: {
    lines: [
      {
        speaker: 'Job Instructor',
        text: 'You wish to walk the path of the Thief?'
      },
      {
        speaker: 'Job Instructor',
        text: 'This choice cannot be undone. Are you ready?',
        choices: [
          { text: 'Yes, make me a Thief!', nextDialogueKey: 'job_confirm_thief' },
          { text: 'Let me think about it' }
        ]
      }
    ]
  },
  // These dialogue keys will be handled specially in GameScene to trigger job change
  job_confirm_warrior: {
    lines: [{ speaker: 'Job Instructor', text: 'Congratulations! You are now a Warrior!' }]
  },
  job_confirm_mage: {
    lines: [{ speaker: 'Job Instructor', text: 'Congratulations! You are now a Mage!' }]
  },
  job_confirm_archer: {
    lines: [{ speaker: 'Job Instructor', text: 'Congratulations! You are now an Archer!' }]
  },
  job_confirm_thief: {
    lines: [{ speaker: 'Job Instructor', text: 'Congratulations! You are now a Thief!' }]
  },
  job_already_advanced: {
    lines: [
      {
        speaker: 'Job Instructor',
        text: 'You have already chosen your path. Train hard and grow stronger!'
      }
    ]
  },
  job_level_required: {
    lines: [
      {
        speaker: 'Job Instructor',
        text: 'You must reach level 10 before you can advance to a job class.'
      },
      {
        speaker: 'Job Instructor',
        text: 'Keep training and return when you are ready!'
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
