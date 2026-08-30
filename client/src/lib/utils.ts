import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNowStrict, format, isToday, isYesterday } from 'date-fns';
import confetti from 'canvas-confetti';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(dateString: string | Date | undefined): string {
  if (!dateString) return '';
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return formatDistanceToNowStrict(date, { addSuffix: true });
  } catch {
    return '';
  }
}

export function formatChatTime(dateString: string | Date | undefined): string {
  if (!dateString) return '';
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (isToday(date)) {
      return format(date, 'h:mm a');
    }
    if (isYesterday(date)) {
      return `Yesterday ${format(date, 'h:mm a')}`;
    }
    return format(date, 'MMM d, h:mm a');
  } catch {
    return '';
  }
}

export function formatCallDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function getMediaUrl(pathOrUrl: string | undefined): string {
  if (!pathOrUrl) return '';
  if (
    pathOrUrl.startsWith('http://') ||
    pathOrUrl.startsWith('https://') ||
    pathOrUrl.startsWith('blob:') ||
    pathOrUrl.startsWith('data:')
  ) {
    return pathOrUrl;
  }

  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  if (apiUrl.startsWith('http://') || apiUrl.startsWith('https://')) {
    try {
      const url = new URL(apiUrl);
      const serverOrigin = url.origin;
      const cleanPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
      return `${serverOrigin}${cleanPath}`;
    } catch {
      // Fallback
    }
  }

  return pathOrUrl;
}

export function triggerHeartBurst(event?: React.MouseEvent) {
  const x = event ? event.clientX / window.innerWidth : 0.5;
  const y = event ? event.clientY / window.innerHeight : 0.5;

  confetti({
    particleCount: 18,
    spread: 60,
    origin: { x, y },
    colors: ['#f43f5e', '#ec4899', '#8b5cf6', '#e11d48'],
    shapes: ['circle'],
    ticks: 40,
    gravity: 1.2,
    scalar: 0.8,
    disableForReducedMotion: true,
  });
}
