import Phaser from 'phaser';

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

  private currentDialogue: DialogueData | null = null;
  private currentLineIndex: number = 0;
  private isTyping: boolean = false;
  private fullText: string = '';
  private displayedChars: number = 0;
  private typewriterTimer: Phaser.Time.TimerEvent | null = null;
  private selectedChoice: number = 0;

  private readonly BOX_WIDTH = 700;
  private readonly BOX_HEIGHT = 140;
  private readonly BOX_X = 50;
  private readonly BOX_Y = 410;
  private readonly PADDING = 15;
  private readonly CHARS_PER_SECOND = 40;

  public isOpen: boolean = false;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    // Background box
    this.background = scene.add.graphics();
    this.drawBackground();
    this.add(this.background);

    // Speaker name
    this.speakerText = scene.add.text(this.BOX_X + this.PADDING, this.BOX_Y + 10, '', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#ffff00',
      fontStyle: 'bold'
    });
    this.add(this.speakerText);

    // Dialogue text
    this.dialogueText = scene.add.text(
      this.BOX_X + this.PADDING,
      this.BOX_Y + 35,
      '',
      {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#ffffff',
        wordWrap: { width: this.BOX_WIDTH - this.PADDING * 2 }
      }
    );
    this.add(this.dialogueText);

    // Continue prompt
    this.continuePrompt = scene.add.text(
      this.BOX_X + this.BOX_WIDTH - this.PADDING - 80,
      this.BOX_Y + this.BOX_HEIGHT - 25,
      '[SPACE] Continue',
      {
        fontFamily: 'Arial',
        fontSize: '11px',
        color: '#aaaaaa'
      }
    );
    this.add(this.continuePrompt);

    // Add blinking animation to continue prompt
    scene.tweens.add({
      targets: this.continuePrompt,
      alpha: 0.3,
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

    // Main box background
    this.background.fillStyle(0x1a1a2e, 0.95);
    this.background.fillRoundedRect(this.BOX_X, this.BOX_Y, this.BOX_WIDTH, this.BOX_HEIGHT, 8);

    // Border
    this.background.lineStyle(2, 0x4a4a6a, 1);
    this.background.strokeRoundedRect(this.BOX_X, this.BOX_Y, this.BOX_WIDTH, this.BOX_HEIGHT, 8);

    // Inner highlight
    this.background.lineStyle(1, 0x6a6a8a, 0.5);
    this.background.strokeRoundedRect(
      this.BOX_X + 2,
      this.BOX_Y + 2,
      this.BOX_WIDTH - 4,
      this.BOX_HEIGHT - 4,
      6
    );
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
      const choiceText = this.scene.add.text(
        this.BOX_X + this.PADDING + 20,
        this.BOX_Y + 75 + index * 20,
        `${index === this.selectedChoice ? '▶ ' : '   '}${choice.text}`,
        {
          fontFamily: 'Arial',
          fontSize: '13px',
          color: index === this.selectedChoice ? '#ffff00' : '#ffffff'
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
      text.setText(`${index === this.selectedChoice ? '▶ ' : '   '}${choice.text}`);
      text.setColor(index === this.selectedChoice ? '#ffff00' : '#ffffff');
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
