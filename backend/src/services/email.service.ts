/**
 * Phase 8 — Email service.
 *
 * Wraps Resend's SDK with a graceful no-key fallback so the app keeps working
 * in dev/CI without RESEND_API_KEY set. When the key is missing, sendEmail()
 * logs the message and resolves successfully — no real send.
 *
 * To wire real email:
 *   1. Sign up at https://resend.com (free tier: 100 emails/day, 3000/month)
 *   2. Create an API key, add to backend/.env: RESEND_API_KEY=re_...
 *   3. (Optional) verify a domain so EMAIL_FROM can be your own address.
 *      Until then, the default `onboarding@resend.dev` only delivers to your
 *      Resend account email.
 */

import { Resend } from "resend";
import { env } from "../config/env";
import { log } from "../utils/logger.util";

let client: Resend | null = null;
function getClient(): Resend | null {
  if (!env.RESEND_API_KEY) return null;
  if (!client) client = new Resend(env.RESEND_API_KEY);
  return client;
}

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  /** Plain-text fallback. If omitted, Resend strips tags from html. */
  text?: string;
};

export type SendResult =
  | { sent: true; id: string }
  | { sent: false; reason: "no_api_key" | "send_error"; error?: string };

export async function sendEmail(msg: EmailMessage): Promise<SendResult> {
  const c = getClient();
  if (!c) {
    log.warn("email skipped — RESEND_API_KEY not set", {
      to: msg.to,
      subject: msg.subject,
    });
    return { sent: false, reason: "no_api_key" };
  }

  try {
    const result = await c.emails.send({
      from: env.EMAIL_FROM,
      to: [msg.to],
      subject: msg.subject,
      html: msg.html,
      ...(msg.text ? { text: msg.text } : {}),
    });

    if (result.error) {
      log.error("email send failed", {
        to: msg.to,
        subject: msg.subject,
        error: result.error.message,
      });
      return { sent: false, reason: "send_error", error: result.error.message };
    }

    log.info("email sent", { to: msg.to, subject: msg.subject, id: result.data?.id });
    return { sent: true, id: result.data?.id ?? "" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error("email send threw", { to: msg.to, error: message });
    return { sent: false, reason: "send_error", error: message };
  }
}

export function isEmailConfigured(): boolean {
  return !!env.RESEND_API_KEY;
}
