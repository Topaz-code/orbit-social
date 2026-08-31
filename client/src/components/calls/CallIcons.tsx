import React from 'react';

/**
 * Screencast Icon: Google Cast / Chromecast TV frame with bottom-left radiating arcs (Matching Reference)
 */
export const ScreencastIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.3"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M2 8V6a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-4" />
    <path d="M2 12a9 9 0 0 1 9 9" />
    <path d="M2 16a5 5 0 0 1 5 5" />
    <path d="M2 20h.01" />
  </svg>
);

/**
 * Outline Video Camera Icon (Flaticon Style)
 */
export const SolidVideoIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M15 10l5-3.5v11L15 14" />
    <rect x="2" y="6" width="13" height="12" rx="3" />
  </svg>
);

/**
 * Outline Video Camera Off Icon
 */
export const SolidVideoOffIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M10.5 6H12a3 3 0 0 1 3 3v1.5l5-3.5v11l-2.5-1.75" />
    <path d="M2 9a3 3 0 0 1 3-3h1" />
    <path d="M2 6.5v8.5a3 3 0 0 0 3 3h8a3 3 0 0 0 2.5-1.35" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </svg>
);

/**
 * End Call Icon: Flaticon styled downward curved telephone receiver outline (Matching Reference)
 */
export const SolidEndCallIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3.5 15.5C3.5 9 20.5 9 20.5 15.5l-3.2 1.2c-.7.3-1.5-.1-1.8-.8l-.8-2c-.3-.7-1-1.2-1.8-1.2h-1.8c-.8 0-1.5.5-1.8 1.2l-.8 2c-.3.7-1.1 1.1-1.8.8l-3.2-1.2z" />
  </svg>
);


/**
 * Start Call Icon: Flaticon styled upright phone receiver
 */
export const SolidStartCallIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

/**
 * Outline Studio Microphone (Flaticon Style)
 */
export const SolidMicIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="8" y="2" width="8" height="12" rx="4" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="22" />
    <line x1="8" y1="22" x2="16" y2="22" />
  </svg>
);

/**
 * Outline Studio Microphone Off / Muted
 */
export const SolidMicOffIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="2" y1="2" x2="22" y2="22" />
    <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" />
    <path d="M5 10v2a7 7 0 0 0 10.74 5.92" />
    <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
    <line x1="12" y1="19" x2="12" y2="22" />
    <line x1="8" y1="22" x2="16" y2="22" />
  </svg>
);

/**
 * Outline Cancel / Close Icon
 */
export const SolidCancelIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

