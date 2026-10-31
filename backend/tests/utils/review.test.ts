import { collectMistakes, reviewKey } from "../../src/utils/review.util";

const q = (question: string, correctIndex = 0) => ({
  question,
  options: ["a", "b", "c", "d"],
  correctIndex,
  explanation: `because ${question}`,
});

const T1 = "11111111-1111-1111-1111-111111111111";
const T2 = "22222222-2222-2222-2222-222222222222";

describe("reviewKey", () => {
  it("is stable, 20 hex chars, and ignores case/whitespace noise", () => {
    const k = reviewKey(T1, "What is a CPU?");
    expect(k).toMatch(/^[a-f0-9]{20}$/);
    expect(reviewKey(T1, "  what  is a cpu? ")).toBe(k);
  });

  it("differs per topic for the same question text", () => {
    expect(reviewKey(T1, "Same?")).not.toBe(reviewKey(T2, "Same?"));
  });
});

describe("collectMistakes", () => {
  const day = (n: number) => new Date(Date.UTC(2026, 9, n));

  it("returns only wrong answers, newest attempt first", () => {
    const res = collectMistakes(
      [
        { topicId: T1, attemptedAt: day(1), questions: [q("old wrong"), q("old right")], userAnswers: [2, 0] },
        { topicId: T2, attemptedAt: day(3), questions: [q("new wrong", 1)], userAnswers: [0] },
      ],
      new Set()
    );
    expect(res.map((m) => m.question)).toEqual(["new wrong", "old wrong"]);
    expect(res[0]).toMatchObject({ topicId: T2, selectedIndex: 0, correctIndex: 1 });
  });

  it("de-duplicates by key and lets the latest answer decide", () => {
    const res = collectMistakes(
      [
        { topicId: T1, attemptedAt: day(1), questions: [q("repeat"), q("cleared")], userAnswers: [3, 3] },
        { topicId: T1, attemptedAt: day(2), questions: [q("repeat"), q("cleared")], userAnswers: [1, 0] },
      ],
      new Set()
    );
    expect(res).toHaveLength(1);
    expect(res[0]).toMatchObject({ question: "repeat", selectedIndex: 1, attemptedAt: day(2) });
  });

  it("excludes keys already fixed through review", () => {
    const fixed = new Set([reviewKey(T1, "fixed one")]);
    const res = collectMistakes(
      [{ topicId: T1, attemptedAt: day(1), questions: [q("fixed one"), q("still open")], userAnswers: [1, 1] }],
      fixed
    );
    expect(res.map((m) => m.question)).toEqual(["still open"]);
  });

  it("skips malformed questions instead of throwing", () => {
    const res = collectMistakes(
      [{ topicId: T1, attemptedAt: day(1), questions: [null, { question: 3 }, q("ok")], userAnswers: "nope" }],
      new Set()
    );
    expect(res).toHaveLength(1);
    expect(res[0].selectedIndex).toBe(-1);
  });
});
