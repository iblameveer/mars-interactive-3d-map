// Simple in-memory localStorage polyfill for Node server runtime.
if (typeof globalThis.localStorage === "undefined" || globalThis.localStorage === null || typeof globalThis.localStorage?.getItem !== 'function') {
  (function () {
    const store = new Map();
    const ls = {
      getItem(key) {
        const k = String(key);
        return store.has(k) ? store.get(k) : null;
      },
      setItem(key, value) {
        store.set(String(key), String(value));
      },
      removeItem(key) {
        store.delete(String(key));
      },
      clear() {
        store.clear();
      },
      key(i) {
        return Array.from(store.keys())[i] || null;
      },
      get length() {
        return store.size;
      },
    };
    try {
      globalThis.localStorage = ls;
    } catch (err) {
      // ignore
    }
  })();
}
