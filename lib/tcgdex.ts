import TCGdex from '@tcgdex/sdk';

// React Native defines a global `window` for library compatibility, which makes
// TCGdex's SDK think it's running in a browser and try to use real localStorage/
// sessionStorage for its request cache — neither exists in RN, so it throws.
// A tiny in-memory Storage shim is enough; it's only used as a cache.
class MemoryStorage implements Storage {
  private store = new Map<string, string>();
  get length() {
    return this.store.size;
  }
  clear() {
    this.store.clear();
  }
  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null;
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
}

const globalAny = globalThis as any;
if (typeof globalAny.localStorage === 'undefined') {
  globalAny.localStorage = new MemoryStorage();
}
if (typeof globalAny.sessionStorage === 'undefined') {
  globalAny.sessionStorage = new MemoryStorage();
}

export const tcgdex = new TCGdex('en');

export function cardImageUrl(
  image: string | null | undefined,
  quality: 'low' | 'high' = 'high',
  extension: 'webp' | 'png' = 'webp'
) {
  if (!image) return undefined;
  return `${image}/${quality}.${extension}`;
}
