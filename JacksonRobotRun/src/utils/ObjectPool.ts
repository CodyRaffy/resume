/**
 * Generic object pool for reusing game objects and reducing garbage collection.
 * Will be used in Phase 2 for obstacle/collectible recycling.
 */
export class ObjectPool<T> {
  private pool: T[] = [];
  private factory: () => T;

  constructor(factory: () => T, initialSize: number = 0) {
    this.factory = factory;
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.factory());
    }
  }

  get(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.factory();
  }

  release(obj: T): void {
    this.pool.push(obj);
  }

  getPoolSize(): number {
    return this.pool.length;
  }
}
