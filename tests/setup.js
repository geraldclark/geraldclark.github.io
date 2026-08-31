/** In-memory localStorage for Vitest (Node 22+ may leave it undefined). */
class MemoryStorage {
  constructor() {
    this.store = new Map();
  }

  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }

  setItem(key, value) {
    this.store.set(String(key), String(value));
  }

  removeItem(key) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }

  get length() {
    return this.store.size;
  }

  key(index) {
    return [...this.store.keys()][index] ?? null;
  }
}

const storage = new MemoryStorage();
Object.defineProperty(globalThis, 'localStorage', {
  value: storage,
  configurable: true,
  writable: true,
});
