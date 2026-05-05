import { buildQuizUserPrompt, buildQuizValidatorPrompt, QUIZ_GENERATOR_SYSTEM } from "../../src/prompts/quiz.prompt";

describe("quiz prompt builders", () => {
  describe("buildQuizUserPrompt", () => {
    it("includes topic title, summary, level", () => {
      const p = buildQuizUserPrompt({
        topicTitle: "Closures",
        topicSummary: "Functions that capture lexical scope.",
        level: "beginner",
      });
      expect(p).toContain("Closures");
      expect(p).toContain("Functions that capture lexical scope.");
      expect(p).toContain("beginner");
      expect(p).toContain("Generate 5 multiple-choice questions");
    });

    it("includes seed when provided (variation hint)", () => {
      const p = buildQuizUserPrompt({
        topicTitle: "X",
        topicSummary: "Y",
        level: "intermediate",
        seed: 42,
      });
      expect(p).toMatch(/seed:\s*42/i);
    });

    it("omits the variation line when no seed", () => {
      const p = buildQuizUserPrompt({ topicTitle: "X", topicSummary: "Y", level: "advanced" });
      expect(p).not.toMatch(/seed:/i);
    });
  });

  describe("buildQuizValidatorPrompt", () => {
    it("formats options with letter labels and marks the correct one", () => {
      const p = buildQuizValidatorPrompt({
        question: "Which is mutable?",
        options: ["str", "tuple", "list", "frozenset"],
        correctIndex: 2,
        explanation: "Lists allow item assignment.",
      });
      expect(p).toContain("A. str");
      expect(p).toContain("B. tuple");
      expect(p).toContain("C. list");
      expect(p).toContain("D. frozenset");
      expect(p).toContain("Marked correct: C. list");
      expect(p).toContain("Lists allow item assignment.");
    });
  });

  describe("QUIZ_GENERATOR_SYSTEM", () => {
    it("hard-codes the 5-question / 4-option contract", () => {
      expect(QUIZ_GENERATOR_SYSTEM).toMatch(/EXACTLY 5 questions/);
      expect(QUIZ_GENERATOR_SYSTEM).toMatch(/EXACTLY 4 options/);
      expect(QUIZ_GENERATOR_SYSTEM).toMatch(/correctIndex must be 0, 1, 2, or 3/);
    });
  });
});
