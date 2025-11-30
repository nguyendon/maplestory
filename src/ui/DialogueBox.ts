import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { UI_COLORS, drawPanel } from './UITheme';

export interface DialogueLine {
  speaker: string;
  text: string;
  choices?: DialogueChoice[];
}

export interface DialogueChoice {
  text: string;
  nextDialogueKey?: string;
  action?: string;
}

export interface DialogueData {
  lines: DialogueLine[];
}

export class DialogueBox extends Phaser.GameObjects.Container {
  private background: Phaser.GameObjects.Graphics;
  private speakerText: Phaser.GameObjects.Text;
  private dialogueText: Phaser.GameObjects.Text;
  private continuePrompt: Phaser.GameObjects.Text;
  private choiceTexts: Phaser.GameObjects.Text[] = [];
  private speakerBox: Phaser.GameObjects.Graphics;

  private currentDialogue: DialogueData | null = null;
  private currentLineIndex: number = 0;
  private isTyping: boolean = false;
  private fullText: string = '';
  private displayedChars: number = 0;
  private typewriterTimer: Phaser.Time.TimerEvent | null = null;
  private selectedChoice: number = 0;

  private readonly BOX_WIDTH = GAME_WIDTH - 100;
  private readonly BOX_HEIGHT = 140;
  private readonly BOX_X = 50;
  private readonly BOX_Y = GAME_HEIGHT - 190;
  private readonly PADDING = 20;
  private readonly CHARS_PER_SECOND = 40;

  public isOpen: boolean = false;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    // Background box
    this.background = scene.add.graphics();
    this.drawBackground();
    this.add(this.background);

    // Speaker name box
    this.speakerBox = scene.add.graphics();
    this.add(this.speakerBox);

    // Speaker name
    this.speakerText = scene.add.text(this.BOX_X + this.PADDING + 5, this.BOX_Y - 8, '', {
      fontFamily: 'Arial',
      fontSize: '13px',
      color: UI_COLORS.textWhite,
      fontStyle: 'bold'
    });
    this.add(this.speakerText);

    // Dialogue text
    this.dialogueText = scene.add.text(
      this.BOX_X + this.PADDING,
      this.BOX_Y + 25,
      '',
      {
        fontFamily: 'Arial',
        fontSize: '13px',
        color: UI_COLORS.textLight,
        wordWrap: { width: this.BOX_WIDTH - this.PADDING * 2 },
        lineSpacing: 4
      }
    );
    this.add(this.dialogueText);

    // Continue prompt
    this.continuePrompt = scene.add.text(
      this.BOX_X + this.BOX_WIDTH - this.PADDING - 90,
      this.BOX_Y + this.BOX_HEIGHT - 25,
      '[SPACE] Continue',
      {
        fontFamily: 'Arial',
        fontSize: '10px',
        color: UI_COLORS.textGray
      }
    );
    this.add(this.continuePrompt);

    // Add blinking animation to continue prompt
    scene.tweens.add({
      targets: this.continuePrompt,
      alpha: 0.4,
      duration: 800,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });

    scene.add.existing(this);
    this.setVisible(false);
    this.setDepth(1000);
  }

  private drawBackground(): void {
    this.background.clear();

    // Outer shadow
    this.background.fillStyle(0x000000, 0.4);
    this.background.fillRoundedRect(this.BOX_X + 4, this.BOX_Y + 4, this.BOX_WIDTH, this.BOX_HEIGHT, 6);

    // Draw panel using theme
    drawPanel(this.background, this.BOX_X, this.BOX_Y, this.BOX_WIDTH, this.BOX_HEIGHT, { hasTitle: false });

    // Decorative lines on sides
    this.background.lineStyle(1, UI_COLORS.borderGold, 0.3);

    // Left decorative element
    this.background.beginPath();
    this.background.moveTo(this.BOX_X + 10, this.BOX_Y + 15);
    this.background.lineTo(this.BOX_X + 10, this.BOX_Y + this.BOX_HEIGHT - 15);
    this.background.strokePath();

    // Right decorative element
    this.background.beginPath();
    this.background.moveTo(this.BOX_X + this.BOX_WIDTH - 10, this.BOX_Y + 15);
    this.background.lineTo(this.BOX_X + this.BOX_WIDTH - 10, this.BOX_Y + this.BOX_HEIGHT - 15);
    this.background.strokePath();
  }

  private drawSpeakerBox(speakerName: string): void {
    this.speakerBox.clear();

    if (!speakerName) return;

    // Calculate speaker box width based on text
    const tempText = this.scene.add.text(0, 0, speakerName, { fontSize: '13px', fontStyle: 'bold' });
    const textWidth = tempText.width + 20;
    tempText.destroy();

    const boxHeight = 22;
    const boxX = this.BOX_X + this.PADDING;
    const boxY = this.BOX_Y - boxHeight / 2 - 4;

    // Speaker name background - sleek tab
    this.speakerBox.fillStyle(UI_COLORS.titleBarBg, 1);
    this.speakerBox.fillRoundedRect(boxX, boxY, textWidth, boxHeight, 4);

    // Border with accent
    this.speakerBox.lineStyle(1, UI_COLORS.accentBlue, 0.6);
    this.speakerBox.strokeRoundedRect(boxX, boxY, textWidth, boxHeight, 4);

    // Top highlight
    this.speakerBox.fillStyle(0xffffff, 0.1);
    this.speakerBox.fillRoundedRect(boxX + 1, boxY + 1, textWidth - 2, boxHeight / 2, { tl: 3, tr: 3, bl: 0, br: 0 });
  }

  public openDialogue(dialogue: DialogueData): void {
    this.currentDialogue = dialogue;
    this.currentLineIndex = 0;
    this.isOpen = true;
    this.setVisible(true);
    this.showCurrentLine();
  }

  public closeDialogue(): void {
    this.isOpen = false;
    this.setVisible(false);
    this.currentDialogue = null;
    this.clearChoices();
    if (this.typewriterTimer) {
      this.typewriterTimer.destroy();
      this.typewriterTimer = null;
    }
    this.scene.events.emit('dialogue:closed');
  }

  private showCurrentLine(): void {
    if (!this.currentDialogue || this.currentLineIndex >= this.currentDialogue.lines.length) {
      this.closeDialogue();
      return;
    }

    const line = this.currentDialogue.lines[this.currentLineIndex];
    this.speakerText.setText(line.speaker);
    this.drawSpeakerBox(line.speaker);
    this.fullText = line.text;
    this.displayedChars = 0;
    this.dialogueText.setText('');
    this.isTyping = true;
    this.clearChoices();

    // Hide continue prompt during typing if there are choices
    this.continuePrompt.setVisible(!line.choices || line.choices.length === 0);

    // Start typewriter effect
    if (this.typewriterTimer) {
      this.typewriterTimer.destroy();
    }

    this.typewriterTimer = this.scene.time.addEvent({
      delay: 1000 / this.CHARS_PER_SECOND,
      callback: this.typeNextChar,
      callbackScope: this,
      repeat: this.fullText.length - 1
    });
  }

  private typeNextChar(): void {
    this.displayedChars++;
    this.dialogueText.setText(this.fullText.substring(0, this.displayedChars));

    if (this.displayedChars >= this.fullText.length) {
      this.isTyping = false;
      const line = this.currentDialogue?.lines[this.currentLineIndex];
      if (line?.choices && line.choices.length > 0) {
        this.showChoices(line.choices);
      }
    }
  }

  private showChoices(choices: DialogueChoice[]): void {
    this.continuePrompt.setVisible(false);
    this.selectedChoice = 0;

    choices.forEach((choice, index) => {
      const isSelected = index === this.selectedChoice;
      const choiceText = this.scene.add.text(
        this.BOX_X + this.PADDING + 15,
        this.BOX_Y + 70 + index * 22,
        `${isSelected ? '>' : '  '} ${choice.text}`,
        {
          fontFamily: 'Arial',
          fontSize: '12px',
          color: isSelected ? UI_COLORS.textCyan : UI_COLORS.textLight,
          fontStyle: isSelected ? 'bold' : 'normal'
        }
      );
      this.choiceTexts.push(choiceText);
      this.add(choiceText);
    });
  }

  private clearChoices(): void {
    this.choiceTexts.forEach(text => text.destroy());
    this.choiceTexts = [];
    this.selectedChoice = 0;
  }

  private updateChoiceSelection(): void {
    const line = this.currentDialogue?.lines[this.currentLineIndex];
    if (!line?.choices) return;

    this.choiceTexts.forEach((text, index) => {
      const choice = line.choices![index];
      const isSelected = index === this.selectedChoice;
      text.setText(`${isSelected ? '>' : '  '} ${choice.text}`);
      text.setColor(isSelected ? UI_COLORS.textCyan : UI_COLORS.textLight);
      text.setFontStyle(isSelected ? 'bold' : 'normal');
    });
  }

  public handleInput(key: string): void {
    if (!this.isOpen) return;

    const line = this.currentDialogue?.lines[this.currentLineIndex];
    const hasChoices = line?.choices && line.choices.length > 0;

    if (key === 'SPACE' || key === 'ENTER') {
      if (this.isTyping) {
        // Skip typewriter, show full text
        if (this.typewriterTimer) {
          this.typewriterTimer.destroy();
          this.typewriterTimer = null;
        }
        this.displayedChars = this.fullText.length;
        this.dialogueText.setText(this.fullText);
        this.isTyping = false;

        if (hasChoices) {
          this.showChoices(line!.choices!);
        }
      } else if (hasChoices) {
        // Select choice
        const choice = line!.choices![this.selectedChoice];
        this.scene.events.emit('dialogue:choice', {
          choiceIndex: this.selectedChoice,
          choice
        });

        if (choice.nextDialogueKey) {
          this.scene.events.emit('dialogue:loadNext', choice.nextDialogueKey);
        } else {
          this.currentLineIndex++;
          this.showCurrentLine();
        }
      } else {
        // Next line
        this.currentLineIndex++;
        this.showCurrentLine();
      }
    } else if (key === 'UP' && hasChoices && !this.isTyping) {
      this.selectedChoice = Math.max(0, this.selectedChoice - 1);
      this.updateChoiceSelection();
    } else if (key === 'DOWN' && hasChoices && !this.isTyping) {
      this.selectedChoice = Math.min(line!.choices!.length - 1, this.selectedChoice + 1);
      this.updateChoiceSelection();
    } else if (key === 'ESC') {
      this.closeDialogue();
    }
  }
}
