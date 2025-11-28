import Phaser from 'phaser';

interface PoolableGameObject extends Phaser.GameObjects.GameObject {
  setVisible(value: boolean): this;
}

export class ObjectPool<T extends PoolableGameObject> {
  private pool: T[] = [];
  private active: Set<T> = new Set();
  private factory: () => T;
  private onAcquire?: (obj: T) => void;
  private onRelease?: (obj: T) => void;

  constructor(
    _scene: Phaser.Scene,
    factory: () => T,
    options?: {
      onAcquire?: (obj: T) => void;
      onRelease?: (obj: T) => void;
    }
  ) {
    this.factory = factory;
    this.onAcquire = options?.onAcquire;
    this.onRelease = options?.onRelease;
  }

  get(): T {
    let obj: T;

    if (this.pool.length > 0) {
      obj = this.pool.pop()!;
    } else {
      obj = this.factory();
    }

    this.active.add(obj);
    obj.setActive(true);
    obj.setVisible(true);

    if (this.onAcquire) {
      this.onAcquire(obj);
    }

    return obj;
  }

  release(obj: T): void {
    if (!this.active.has(obj)) {
      return;
    }

    this.active.delete(obj);
    obj.setActive(false);
    obj.setVisible(false);

    if (this.onRelease) {
      this.onRelease(obj);
    }

    this.pool.push(obj);
  }

  preWarm(count: number): void {
    for (let i = 0; i < count; i++) {
      const obj = this.factory();
      obj.setActive(false);
      obj.setVisible(false);
      this.pool.push(obj);
    }
  }

  getStats(): { available: number; active: number; total: number } {
    return {
      available: this.pool.length,
      active: this.active.size,
      total: this.pool.length + this.active.size
    };
  }

  destroy(): void {
    this.active.forEach(obj => obj.destroy());
    this.active.clear();
    this.pool.forEach(obj => obj.destroy());
    this.pool = [];
  }
}
