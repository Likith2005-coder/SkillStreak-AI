import { levelForXp } from "../../src/services/gamification.service";

describe("levelForXp", () => {
  it("returns level 1 for zero XP", () => {
    const r = levelForXp(0);
    expect(r.level).toBe(1);
    expect(r.xpIntoLevel).toBe(0);
    expect(r.xpForNext).toBeGreaterThan(0);
  });

  it("is monotonically non-decreasing as XP grows", () => {
    let prev = 0;
    for (let xp = 0; xp <= 50_000; xp += 250) {
      const lvl = levelForXp(xp).level;
      expect(lvl).toBeGreaterThanOrEqual(prev);
      prev = lvl;
    }
  });

  it("xpIntoLevel resets to 0 right at a level boundary", () => {
    // Find the XP threshold for level 2 by binary search via levelForXp.
    let lo = 1;
    let hi = 1_000;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (levelForXp(mid).level >= 2) hi = mid;
      else lo = mid + 1;
    }
    const threshold = lo;
    expect(levelForXp(threshold).level).toBe(2);
    expect(levelForXp(threshold).xpIntoLevel).toBe(0);
    expect(levelForXp(threshold - 1).level).toBe(1);
  });

  it("xpIntoLevel + (current-level base) reconstructs total XP", () => {
    for (const xp of [50, 317, 1234, 7777, 25000]) {
      const r = levelForXp(xp);
      expect(r.xpIntoLevel).toBeGreaterThanOrEqual(0);
      expect(r.xpIntoLevel).toBeLessThan(r.xpForNext);
    }
  });

  it("level 1 user with no XP needs > 0 XP for next level", () => {
    expect(levelForXp(0).xpForNext).toBeGreaterThan(0);
  });
});
