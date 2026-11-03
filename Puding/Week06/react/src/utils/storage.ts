import type { StateStorage } from "zustand/middleware";

// Storage can be unavailable in private browsers or when its quota is full.
// Returning null on read errors lets the app keep using its initial state.
export const safeLocalStorage: StateStorage = {
  getItem(key) {
    try {
      const value = window.localStorage.getItem(key);
      if (value === null) return null;
      JSON.parse(value);
      return value;
    } catch {
      return null;
    }
  },
  setItem(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Bookmark changes still work in memory when saving is unavailable.
    }
  },
  removeItem(key) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Clearing an unavailable storage must not crash the application.
    }
  },
};
