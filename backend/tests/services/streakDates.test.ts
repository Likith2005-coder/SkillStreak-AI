import {
  utcDateOnly,
  daysBetweenUtc,
  isMondayUtc,
  startOfIsoWeekUtc,
} from "../../src/services/gamification.service";

describe("streak date helpers", () => {
  describe("utcDateOnly", () => {
    it("zeroes the time component but preserves the UTC date", () => {
      const d = new Date("2026-05-05T18:42:11.500Z");
      const out = utcDateOnly(d);
      expect(out.getUTCHours()).toBe(0);
      expect(out.getUTCMinutes()).toBe(0);
      expect(out.getUTCSeconds()).toBe(0);
      expect(out.getUTCMilliseconds()).toBe(0);
      expect(out.toISOString().slice(0, 10)).toBe("2026-05-05");
    });
  });

  describe("daysBetweenUtc", () => {
    it("returns 0 for the same UTC day even with different times", () => {
      const a = new Date("2026-05-05T01:00:00Z");
      const b = new Date("2026-05-05T23:59:00Z");
      expect(daysBetweenUtc(a, b)).toBe(0);
    });

    it("returns 1 for consecutive days", () => {
      const a = new Date("2026-05-05T22:00:00Z");
      const b = new Date("2026-05-06T01:00:00Z");
      expect(daysBetweenUtc(a, b)).toBe(1);
    });

    it("handles a midnight-crossing scenario for streaks", () => {
      // User finishes quiz at 23:59 UTC on day 1, again at 00:01 UTC on day 2 → gap is 1 day, streak ticks.
      const before = new Date("2026-05-05T23:59:00Z");
      const after = new Date("2026-05-06T00:01:00Z");
      expect(daysBetweenUtc(before, after)).toBe(1);
    });

    it("returns the right multi-day delta", () => {
      expect(daysBetweenUtc(new Date("2026-05-01T00:00:00Z"), new Date("2026-05-08T00:00:00Z"))).toBe(7);
    });
  });

  describe("isMondayUtc", () => {
    it("returns true for Monday UTC", () => {
      // 2026-05-04 is a Monday UTC
      expect(isMondayUtc(new Date("2026-05-04T05:00:00Z"))).toBe(true);
    });
    it("returns false for non-Monday days", () => {
      expect(isMondayUtc(new Date("2026-05-05T05:00:00Z"))).toBe(false); // Tue
      expect(isMondayUtc(new Date("2026-05-03T05:00:00Z"))).toBe(false); // Sun
    });
  });

  describe("startOfIsoWeekUtc", () => {
    it("returns the Monday of the same ISO week", () => {
      // Tuesday → previous Monday
      expect(startOfIsoWeekUtc(new Date("2026-05-05T15:00:00Z")).toISOString().slice(0, 10)).toBe(
        "2026-05-04"
      );
      // Sunday → previous Monday (same calendar week)
      expect(startOfIsoWeekUtc(new Date("2026-05-10T15:00:00Z")).toISOString().slice(0, 10)).toBe(
        "2026-05-04"
      );
      // Monday → itself
      expect(startOfIsoWeekUtc(new Date("2026-05-04T15:00:00Z")).toISOString().slice(0, 10)).toBe(
        "2026-05-04"
      );
    });
  });
});
