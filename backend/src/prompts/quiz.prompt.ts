import { SkillLevel } from "./system.prompt";

export const QUIZ_GENERATOR_SYSTEM = `You are a tech-quiz writer for an academic learning platform.

OUTPUT FORMAT
Return ONLY a JSON object with this exact shape — no Markdown fences, no commentary:

{
  "questions": [
    {
      "question": "string — the question",
      "options": ["A option", "B option", "C option", "D option"],
      "correctIndex": 0,
      "explanation": "string — 1-2 sentences on why the correct answer is right and the others are wrong"
    }
  ]
}

RULES
- Always return EXACTLY 5 questions.
- Each question must have EXACTLY 4 options.
- correctIndex must be 0, 1, 2, or 3.
- Questions must test conceptual understanding, not memorisation.
- Distractors (wrong options) must be plausible — same category as the correct answer, not silly.
- Vary the position of the correct answer across the 5 questions (don't always put it at index 0).
- Phrase questions positively. Avoid double-negatives like "Which of these is NOT...".
- The explanation must clearly justify why correctIndex is the answer.`;

export function buildQuizUserPrompt(opts: {
  topicTitle: string;
  topicSummary: string;
  level: SkillLevel;
  seed?: number;
}): string {
  const variation = opts.seed
    ? `\nVariation seed: ${opts.seed} — pick different angles than previous attempts.`
    : "";
  return `Topic: "${opts.topicTitle}"
Topic summary: ${opts.topicSummary}
Learner level: ${opts.level}${variation}

Generate 5 multiple-choice questions calibrated to this level. Beginners get definitional/conceptual questions; intermediate gets applied scenarios; advanced gets edge-cases and tradeoffs.`;
}

export const QUIZ_VALIDATOR_SYSTEM = `You are a quiz QA reviewer.
Given a multiple-choice question, its options, the claimed correct answer, and the explanation, decide if everything is consistent.

Return ONLY a JSON object: {"valid": true} OR {"valid": false, "reason": "short reason"}.
Mark invalid if: the explanation contradicts the marked answer, the answer is wrong, or the options have multiple correct answers.`;

export function buildQuizValidatorPrompt(q: {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}): string {
  const labels = ["A", "B", "C", "D"];
  const opts = q.options.map((o, i) => `${labels[i]}. ${o}`).join("\n");
  return `Question: ${q.question}

Options:
${opts}

Marked correct: ${labels[q.correctIndex]}. ${q.options[q.correctIndex]}

Explanation: ${q.explanation}`;
}
