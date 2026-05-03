import { ApiError } from "../middleware/error.middleware";

export const MAX_USER_MESSAGE_CHARS = 2000;

const INJECTION_PATTERNS: RegExp[] = [
  /ignore (all|previous|above) (instructions|rules|prompts?)/i,
  /disregard (all|previous|above) (instructions|rules|prompts?)/i,
  /forget (everything|your instructions|the system prompt)/i,
  /reveal (your|the) (system )?prompt/i,
  /print (the )?system (prompt|instructions)/i,
  /you are (now|actually) (a|an) /i,
  /\bact as (a|an) (?!tutor|teacher|mentor|coach)/i,
];

/**
 * Validate and lightly sanitize a user chat message.
 * - Trims whitespace.
 * - Enforces a 2000-char cap.
 * - Flags obvious prompt-injection phrases (the system prompt also tells the model to
 *   ignore role-override attempts; this gives a friendlier client-facing rejection).
 */
export function sanitizeChatInput(raw: unknown): string {
  if (typeof raw !== "string") throw new ApiError(400, "Message must be a string");
  const trimmed = raw.trim();
  if (!trimmed) throw new ApiError(400, "Message cannot be empty");
  if (trimmed.length > MAX_USER_MESSAGE_CHARS) {
    throw new ApiError(400, `Message too long (max ${MAX_USER_MESSAGE_CHARS} chars)`);
  }
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      throw new ApiError(
        400,
        "That looks like a prompt-injection attempt. Please rephrase your question about a tech topic."
      );
    }
  }
  return trimmed;
}
