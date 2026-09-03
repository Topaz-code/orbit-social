import { create } from 'zustand';
import { storage } from '../lib/storage';

interface ThemeState {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'dark',
  setTheme: (theme) => {
    storage.set('theme', theme);
    set({ theme });
  },
}));
