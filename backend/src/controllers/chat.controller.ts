import { RequestHandler } from "express";
import { z } from "zod";
import * as chatService from "../services/chat.service";
import { ApiError } from "../middleware/error.middleware";
import { sanitizeChatInput } from "../utils/sanitize.util";
import { log } from "../utils/logger.util";

export const idParamSchema = z.object({
  id: z.string().uuid("Invalid session id"),
});

export const createSessionSchema = z.object({
  topicId: z.string().uuid().optional().nullable(),
  title: z.string().max(120).optional(),
});

export const renameSchema = z.object({
  title: z.string().min(1).max(120),
});

export const sendMessageSchema = z.object({
  message: z.string().min(1).max(2000),
  regenerate: z.boolean().optional().default(false),
});

const sid = (req: { params: Record<string, unknown> }) => req.params.id as string;

export const list: RequestHandler = async (req, res) => {
  if (!req.user) throw new ApiError(401, "Unauthenticated");
  const sessions = await chatService.listSessions(req.user.sub);
  res.json({ sessions });
};

export const create: RequestHandler = async (req, res) => {
  if (!req.user) throw new ApiError(401, "Unauthenticated");
  const body = req.body as z.infer<typeof createSessionSchema>;
  const session = await chatService.createSession({
    userId: req.user.sub,
    topicId: body.topicId ?? null,
    title: body.title,
  });
  res.status(201).json({ session });
};

export const getOne: RequestHandler = async (req, res) => {
  if (!req.user) throw new ApiError(401, "Unauthenticated");
  const session = await chatService.getSession(sid(req), req.user.sub);
  res.json({ session });
};

export const rename: RequestHandler = async (req, res) => {
  if (!req.user) throw new ApiError(401, "Unauthenticated");
  const body = req.body as z.infer<typeof renameSchema>;
  const session = await chatService.renameSession(sid(req), req.user.sub, body.title);
  res.json({ session });
};

export const remove: RequestHandler = async (req, res) => {
  if (!req.user) throw new ApiError(401, "Unauthenticated");
  await chatService.deleteSession(sid(req), req.user.sub);
  res.status(204).end();
};

function writeSse(res: import("express").Response, event: string, data: unknown) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

/**
 * POST /chat/:id/messages — streams assistant reply via Server-Sent Events.
 * Events:
 *   - "intent"   { intent }
 *   - "delta"    { text }
 *   - "done"     { messageId, followUps }
 *   - "error"    { error }
 */
export const sendMessage: RequestHandler = async (req, res, next) => {
  if (!req.user) throw new ApiError(401, "Unauthenticated");
  const body = req.body as z.infer<typeof sendMessageSchema>;
  const message = sanitizeChatInput(body.message);

  res.status(200);
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();

  // Heartbeat so reverse proxies don't drop the connection on slow first token.
  const heartbeat = setInterval(() => {
    res.write(": ping\n\n");
  }, 15000);

  req.on("close", () => clearInterval(heartbeat));

  try {
    const stream = chatService.streamMessage({
      sessionId: sid(req),
      userId: req.user.sub,
      userMessage: message,
      regenerate: body.regenerate,
    });

    for await (const event of stream) {
      if (req.destroyed) break;
      writeSse(res, event.type, event);
    }
  } catch (err) {
    log.error("chat stream error", {
      error: err instanceof Error ? err.message : String(err),
    });
    if (!res.headersSent) {
      // Headers were already flushed; downgrade to next() if not.
      return next(err);
    }
    const status = err instanceof ApiError ? err.status : 500;
    const errMsg = err instanceof ApiError ? err.message : "Stream failed";
    writeSse(res, "error", { error: errMsg, status });
  } finally {
    clearInterval(heartbeat);
    res.end();
  }
};
