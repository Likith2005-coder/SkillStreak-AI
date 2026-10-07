/**
 * Level curve, mirrored from backend gamification.service:
 * level N requires 100 * N * log2(N + 1) cumulative XP.
 */
export function xpRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.round(100 * level * Math.log2(level + 1));
}

export function levelForXp(xp: number) {
  let level = 1;
  while (xpRequiredForLevel(level + 1) <= xp) level++;
  const base = xpRequiredForLevel(level);
  const next = xpRequiredForLevel(level + 1);
  return { level, into: xp - base, span: next - base, nextAt: next };
}
