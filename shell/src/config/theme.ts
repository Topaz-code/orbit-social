/**
 * Orbit Mobile Shell — Unified Design Tokens
 * Matched 1:1 with Orbit Web's Deep Space Void Palette
 */
export const THEME = {
  colors: {
    // Void & surfaces
    void: '#141819',
    surface: '#171A1C',
    card: '#202A2D',
    cardRaised: '#2B3940',
    border: '#3A4B4D',

    // Celestial Gold primary accent
    gold: '#D0A56A',
    goldLight: '#E0B779',
    goldDark: '#8a5a1e',
    goldGlow: 'rgba(208, 165, 106, 0.25)',

    // Starlight Typography
    textPrimary: '#D9D0B8',
    textSecondary: '#A8AAA0',
    textMuted: '#7F8B86',

    // Accents & status
    teal: '#71877B',
    deepTeal: '#496D6B',
    coral: '#B87568',
    online: '#71877B',
  },
} as const;
