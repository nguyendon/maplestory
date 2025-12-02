/**
 * ChatUI - Chat input box and message display
 * Press Enter to open chat, type commands with /
 */

import Phaser from 'phaser';
import { GAME_HEIGHT } from '../config/constants';
import { UI_COLORS } from './UITheme';

export interface ChatMessage {
  text: string;
  color: string;
  timestamp: number;
}

export class ChatUI {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;
  private inputContainer!: Phaser.GameObjects.Container;
  private inputBg!: Phaser.GameObjects.Graphics;
  private inputText!: Phaser.GameObjects.Text;
  private cursorBlink!: Phaser.GameObjects.Rectangle;
  private messageContainer!: Phaser.GameObjects.Container;
  private messages: ChatMessage[] = [];
  private _isOpen: boolean = false;
  private inputValue: string = '';
  private cursorPosition: number = 0;
  private maxMessages: number = 8;
  private messageTexts: Phaser.GameObjects.Text[] = [];
  private commandHistory: string[] = [];
  private historyIndex: number = -1;
  private onCommandCallback?: (command: string, args: string[]) => void;

  // Dimensions
  private readonly INPUT_WIDTH = 350;
  private readonly INPUT_HEIGHT = 28;
  private readonly MESSAGE_WIDTH = 350;
  private readonly MESSAGE_HEIGHT = 150;
  private readonly PADDING = 10;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.create();
  }

  private create(): void {
    const x = this.PADDING;
    const y = GAME_HEIGHT - this.INPUT_HEIGHT - this.PADDING;

    // Main container
    this.container = this.scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(8000);

    // Message display area (above input)
    this.createMessageArea(x, y - this.MESSAGE_HEIGHT - 5);

    // Input box
    this.createInputBox(x, y);

    // Initially hidden
    this.inputContainer.setVisible(false);
  }

  private createMessageArea(x: number, y: number): void {
    this.messageContainer = this.scene.add.container(x, y);
    this.container.add(this.messageContainer);

    // Create message text objects
    for (let i = 0; i < this.maxMessages; i++) {
      const text = this.scene.add.text(0, i * 18, '', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        color: UI_COLORS.textWhite,
        stroke: '#000000',
        strokeThickness: 2,
        wordWrap: { width: this.MESSAGE_WIDTH - 10 }
      });
      this.messageTexts.push(text);
      this.messageContainer.add(text);
    }
  }

  private createInputBox(x: number, y: number): void {
    this.inputContainer = this.scene.add.container(x, y);
    this.container.add(this.inputContainer);

    // Background
    this.inputBg = this.scene.add.graphics();
    this.drawInputBg();
    this.inputContainer.add(this.inputBg);

    // Input text
    this.inputText = this.scene.add.text(8, 6, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: UI_COLORS.textWhite,
      wordWrap: { width: this.INPUT_WIDTH - 20 }
    });
    this.inputContainer.add(this.inputText);

    // Blinking cursor
    this.cursorBlink = this.scene.add.rectangle(8, 6, 2, 16, 0xffffff);
    this.cursorBlink.setOrigin(0, 0);
    this.inputContainer.add(this.cursorBlink);

    // Cursor blink animation
    this.scene.tweens.add({
      targets: this.cursorBlink,
      alpha: 0,
      duration: 500,
      yoyo: true,
      repeat: -1
    });
  }

  private drawInputBg(): void {
    this.inputBg.clear();

    // Shadow
    this.inputBg.fillStyle(0x000000, 0.5);
    this.inputBg.fillRoundedRect(2, 2, this.INPUT_WIDTH, this.INPUT_HEIGHT, 4);

    // Background
    this.inputBg.fillStyle(UI_COLORS.panelBg, 0.95);
    this.inputBg.fillRoundedRect(0, 0, this.INPUT_WIDTH, this.INPUT_HEIGHT, 4);

    // Border
    this.inputBg.lineStyle(1, UI_COLORS.borderOuter, 0.8);
    this.inputBg.strokeRoundedRect(0, 0, this.INPUT_WIDTH, this.INPUT_HEIGHT, 4);

    // Inner highlight
    this.inputBg.lineStyle(1, UI_COLORS.accentBlue, 0.3);
    this.inputBg.strokeRoundedRect(1, 1, this.INPUT_WIDTH - 2, this.INPUT_HEIGHT - 2, 3);
  }

  open(): void {
    if (this._isOpen) return;
    this._isOpen = true;
    this.inputContainer.setVisible(true);
    this.inputValue = '';
    this.cursorPosition = 0;
    this.historyIndex = -1;
    this.updateInputDisplay();
  }

  close(): void {
    if (!this._isOpen) return;
    this._isOpen = false;
    this.inputContainer.setVisible(false);
    this.inputValue = '';
    this.cursorPosition = 0;
  }

  get isOpen(): boolean {
    return this._isOpen;
  }

  /**
   * Set callback for when a command is entered
   */
  onCommand(callback: (command: string, args: string[]) => void): void {
    this.onCommandCallback = callback;
  }

  /**
   * Handle keyboard input when chat is open
   */
  handleKeyDown(event: KeyboardEvent): boolean {
    if (!this._isOpen) return false;

    switch (event.key) {
      case 'Enter':
        this.submitInput();
        return true;
      case 'Escape':
        this.close();
        return true;
      case 'Backspace':
        if (this.cursorPosition > 0) {
          this.inputValue = this.inputValue.slice(0, this.cursorPosition - 1) +
                           this.inputValue.slice(this.cursorPosition);
          this.cursorPosition--;
          this.updateInputDisplay();
        }
        return true;
      case 'Delete':
        if (this.cursorPosition < this.inputValue.length) {
          this.inputValue = this.inputValue.slice(0, this.cursorPosition) +
                           this.inputValue.slice(this.cursorPosition + 1);
          this.updateInputDisplay();
        }
        return true;
      case 'ArrowLeft':
        if (this.cursorPosition > 0) {
          this.cursorPosition--;
          this.updateInputDisplay();
        }
        return true;
      case 'ArrowRight':
        if (this.cursorPosition < this.inputValue.length) {
          this.cursorPosition++;
          this.updateInputDisplay();
        }
        return true;
      case 'ArrowUp':
        // Navigate command history
        if (this.commandHistory.length > 0) {
          if (this.historyIndex < this.commandHistory.length - 1) {
            this.historyIndex++;
            this.inputValue = this.commandHistory[this.commandHistory.length - 1 - this.historyIndex];
            this.cursorPosition = this.inputValue.length;
            this.updateInputDisplay();
          }
        }
        return true;
      case 'ArrowDown':
        if (this.historyIndex > 0) {
          this.historyIndex--;
          this.inputValue = this.commandHistory[this.commandHistory.length - 1 - this.historyIndex];
          this.cursorPosition = this.inputValue.length;
          this.updateInputDisplay();
        } else if (this.historyIndex === 0) {
          this.historyIndex = -1;
          this.inputValue = '';
          this.cursorPosition = 0;
          this.updateInputDisplay();
        }
        return true;
      case 'Home':
        this.cursorPosition = 0;
        this.updateInputDisplay();
        return true;
      case 'End':
        this.cursorPosition = this.inputValue.length;
        this.updateInputDisplay();
        return true;
      default:
        // Add printable characters
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
          this.inputValue = this.inputValue.slice(0, this.cursorPosition) +
                           event.key +
                           this.inputValue.slice(this.cursorPosition);
          this.cursorPosition++;
          this.updateInputDisplay();
          return true;
        }
        break;
    }

    return true; // Consume all keyboard events when open
  }

  private submitInput(): void {
    const input = this.inputValue.trim();
    if (!input) {
      this.close();
      return;
    }

    // Add to history
    if (this.commandHistory[this.commandHistory.length - 1] !== input) {
      this.commandHistory.push(input);
      if (this.commandHistory.length > 50) {
        this.commandHistory.shift();
      }
    }

    // Check if it's a command
    if (input.startsWith('/')) {
      const parts = input.slice(1).split(/\s+/);
      const command = parts[0].toLowerCase();
      const args = parts.slice(1);

      if (this.onCommandCallback) {
        this.onCommandCallback(command, args);
      }
    } else {
      // Regular chat message (could broadcast in multiplayer)
      this.addMessage(input, UI_COLORS.textWhite);
    }

    this.close();
  }

  private updateInputDisplay(): void {
    this.inputText.setText(this.inputValue);

    // Update cursor position
    const textBeforeCursor = this.inputValue.slice(0, this.cursorPosition);
    const textWidth = this.scene.add.text(0, 0, textBeforeCursor, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px'
    }).width;
    this.scene.children.getByName('temp')?.destroy();

    this.cursorBlink.setX(8 + textWidth);
  }

  /**
   * Add a message to the chat display
   */
  addMessage(text: string, color: string = UI_COLORS.textWhite): void {
    const message: ChatMessage = {
      text,
      color,
      timestamp: Date.now()
    };

    this.messages.push(message);
    if (this.messages.length > this.maxMessages) {
      this.messages.shift();
    }

    this.updateMessageDisplay();
  }

  /**
   * Add a system message (yellow)
   */
  addSystemMessage(text: string): void {
    this.addMessage(`[System] ${text}`, UI_COLORS.textGold);
  }

  /**
   * Add an error message (red)
   */
  addErrorMessage(text: string): void {
    this.addMessage(`[Error] ${text}`, '#ff5555');
  }

  /**
   * Add a success message (green)
   */
  addSuccessMessage(text: string): void {
    this.addMessage(text, '#55ff55');
  }

  private updateMessageDisplay(): void {
    // Clear all texts
    this.messageTexts.forEach(t => t.setText(''));

    // Show recent messages
    const startIdx = Math.max(0, this.messages.length - this.maxMessages);
    for (let i = 0; i < this.maxMessages; i++) {
      const msgIdx = startIdx + i;
      if (msgIdx < this.messages.length) {
        const msg = this.messages[msgIdx];
        this.messageTexts[i].setText(msg.text);
        this.messageTexts[i].setColor(msg.color);
        this.messageTexts[i].setAlpha(1);

        // Fade out old messages
        const age = Date.now() - msg.timestamp;
        if (age > 8000) {
          this.messageTexts[i].setAlpha(Math.max(0, 1 - (age - 8000) / 2000));
        }
      }
    }
  }

  /**
   * Update - call each frame to fade messages
   */
  update(): void {
    if (this.messages.length > 0) {
      this.updateMessageDisplay();
    }
  }

  destroy(): void {
    this.container.destroy();
  }
}
