/**
 * Check if a user is actively online based on is_online flag and last_seen timestamp
 * Cutoff: 60 seconds
 */
export function isUserActiveOnline(user: { is_online?: boolean | null; last_seen?: Date | string | null } | null | undefined): boolean {
  if (!user || !user.is_online) return false;
  if (!user.last_seen) return false;
  const lastSeenTime = new Date(user.last_seen).getTime();
  if (isNaN(lastSeenTime)) return false;
  const diffMs = Date.now() - lastSeenTime;
  return diffMs < 60 * 1000;
}
