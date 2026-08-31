import React from 'react';

/**
 * Screencast Icon: Outline dual screens with share/broadcast arrow
 */
export const ScreencastIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Rear monitor */}
    <path d="M4 6V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2" />
    {/* Front screen */}
    <rect x="2" y="8" width="14" height="12" rx="2" />
    {/* Share arrow */}
    <path d="M18 18l4-4-4-4" />
    <path d="M22 14h-8" />
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
 * End Call Icon: Flaticon styled downward curved telephone receiver
 */
export const SolidEndCallIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M12 4C7.8 4 3.9 5.5 0.8 8.1C0.2 8.6 0.1 9.5 0.6 10.1L2.8 12.3C3.3 12.8 4.2 12.9 4.8 12.4C6.5 11.1 7.6 10.4 9.8 9.9C10.5 9.7 11 9.1 11 8.3V5.5C11.3 5.5 11.7 5.5 12 5.5C12.3 5.5 12.7 5.5 13 5.5V8.3C13 9.1 13.5 9.7 14.2 9.9C16.4 10.4 17.5 11.1 19.2 12.4C19.8 12.9 20.7 12.8 21.2 12.3L23.4 10.1C23.9 9.5 23.8 8.6 23.2 8.1C20.1 5.5 16.2 4 12 4Z" />
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

