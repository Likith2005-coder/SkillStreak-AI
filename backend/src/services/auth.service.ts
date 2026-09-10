import { prisma } from "../config/db";
import { hashPassword, verifyPassword } from "../utils/password.util";
import { signToken } from "../utils/jwt.util";
import { ApiError } from "../middleware/error.middleware";

const PUBLIC_USER_FIELDS = {
  id: true,
  email: true,
  name: true,
  role: true,
  level: true,
  xp: true,
  createdAt: true,
} as const;

const PROFILE_FIELDS = {
  priorLevel: true,
  goal: true,
  pace: true,
  preferredDomains: true,
  reminderTime: true,
  digestEnabled: true,
  onboardedAt: true,
} as const;

export type RegisterInput = { email: string; password: string; name: string };
export type LoginInput = { email: string; password: string };
export type ProfileInput = {
  priorLevel: "none" | "some" | "experienced";
  goal: "interview" | "awareness" | "curiosity";
  pace: "relaxed" | "standard" | "intense";
  preferredDomains?: string[];
  reminderTime?: string | null;
  digestEnabled?: boolean;
};
export type SettingsInput = {
  reminderTime?: string | null;
  digestEnabled?: boolean;
};

function assertRole(role: string): "user" | "admin" {
  return role === "admin" ? "admin" : "user";
}

export async function register(input: RegisterInput) {
  const email = input.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ApiError(409, "An account with that email already exists");
  }

  const passwordHash = await hashPassword(input.password);
  // A profile is created up front with neutral defaults. There is no longer a
  // generic onboarding questionnaire — the real personalisation happens per
  // domain in the assessment wizard, which asks the same things with far more
  // context. These defaults keep settings, career paths and the tutor's level
  // hints working, and the learner can change them in Settings at any time.
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: input.name.trim(),
      profile: {
        create: {
          priorLevel: "some",
          goal: "curiosity",
          pace: "standard",
        },
      },
    },
    select: PUBLIC_USER_FIELDS,
  });

  const token = signToken({ sub: user.id, email: user.email, role: assertRole(user.role) });
  return { user, token };
}

export async function login(input: LoginInput) {
  const email = input.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(401, "Invalid email or password");

  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) throw new ApiError(401, "Invalid email or password");

  const token = signToken({ sub: user.id, email: user.email, role: assertRole(user.role) });
  const { passwordHash: _omit, updatedAt: _omit2, ...publicUser } = user;
  return { user: publicUser, token };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { ...PUBLIC_USER_FIELDS, profile: { select: PROFILE_FIELDS } },
  });
  if (!user) throw new ApiError(404, "User not found");

  // Backfill for accounts created before the onboarding questionnaire was
  // removed: they may have signed up and never completed it, which would
  // otherwise leave them with no profile and a dead dashboard.
  if (!user.profile) {
    const profile = await prisma.userProfile.create({
      data: { userId, priorLevel: "some", goal: "curiosity", pace: "standard" },
      select: PROFILE_FIELDS,
    });
    return { ...user, profile };
  }

  return user;
}

export async function upsertProfile(userId: string, input: ProfileInput) {
  // Ensure user exists (FK guard).
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) throw new ApiError(404, "User not found");

  const data = {
    priorLevel: input.priorLevel,
    goal: input.goal,
    pace: input.pace,
    preferredDomains: input.preferredDomains ?? [],
    reminderTime: input.reminderTime ?? null,
    ...(input.digestEnabled !== undefined && { digestEnabled: input.digestEnabled }),
  };

  const profile = await prisma.userProfile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
    select: PROFILE_FIELDS,
  });

  return profile;
}

/**
 * Partial update for the Phase 8 settings page — only touches notification
 * fields, doesn't require the full onboarding payload.
 */
export async function updateSettings(userId: string, input: SettingsInput) {
  const profile = await prisma.userProfile.findUnique({ where: { userId } });
  if (!profile) throw new ApiError(404, "Complete onboarding first");

  const updated = await prisma.userProfile.update({
    where: { userId },
    data: {
      ...(input.reminderTime !== undefined && { reminderTime: input.reminderTime }),
      ...(input.digestEnabled !== undefined && { digestEnabled: input.digestEnabled }),
    },
    select: PROFILE_FIELDS,
  });
  return updated;
}
