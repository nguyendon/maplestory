export type StateCallback = () => void;

export interface State {
  name: string;
  onEnter?: StateCallback;
  onUpdate?: StateCallback;
  onExit?: StateCallback;
}

export class StateMachine {
  private states: Map<string, State> = new Map();
  private currentState: State | null = null;
  private previousState: State | null = null;

  addState(state: State): this {
    this.states.set(state.name, state);
    return this;
  }

  setState(name: string): void {
    if (this.currentState?.name === name) return;

    const newState = this.states.get(name);
    if (!newState) {
      console.warn(`State "${name}" not found`);
      return;
    }

    // Exit current state
    if (this.currentState?.onExit) {
      this.currentState.onExit();
    }

    this.previousState = this.currentState;
    this.currentState = newState;

    // Enter new state
    if (this.currentState.onEnter) {
      this.currentState.onEnter();
    }
  }

  update(): void {
    if (this.currentState?.onUpdate) {
      this.currentState.onUpdate();
    }
  }

  getCurrentState(): string | null {
    return this.currentState?.name ?? null;
  }

  getPreviousState(): string | null {
    return this.previousState?.name ?? null;
  }

  isInState(name: string): boolean {
    return this.currentState?.name === name;
  }
}
