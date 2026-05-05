import { heuristicIntent } from "../../src/prompts/intent.prompt";

describe("heuristicIntent", () => {
  it.each([
    ["quiz me on react hooks", "quiz"],
    ["give me an MCQ on TCP", "quiz"],
    ["test me on closures please", "quiz"],
    ["I need a roadmap to learn rust", "roadmap"],
    ["where do I start with kubernetes?", "roadmap"],
    ["what's the learning path for ML?", "roadmap"],
    ["recommend a video on transformers", "recommend"],
    ["any good books on system design?", "recommend"],
    ["suggest some courses for backend", "recommend"],
    ["my code throws a TypeError, why doesn't this work", "doubt"],
    ["I'm stuck on this bug, help", "doubt"],
    ["server crash on cold start fix?", "doubt"],
    ["I'm losing motivation in this domain", "motivational"],
    ["I feel like giving up on coding", "motivational"],
    ["I'm completely burnt out", "motivational"],
  ] as const)("classifies %s as %s", (msg, expected) => {
    expect(heuristicIntent(msg)).toBe(expected);
  });

  it("returns null for ambiguous explain-style questions (LLM will handle)", () => {
    expect(heuristicIntent("what is a closure")).toBeNull();
    expect(heuristicIntent("explain how DNS works")).toBeNull();
  });

  it("is case-insensitive", () => {
    expect(heuristicIntent("QUIZ ME on AI")).toBe("quiz");
    expect(heuristicIntent("ROADMAP for python")).toBe("roadmap");
  });
});
