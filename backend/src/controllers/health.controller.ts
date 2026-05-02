import { RequestHandler } from "express";
import { pingDatabase } from "../config/db";
import { pingRedis } from "../config/redis";

export const getHealth: RequestHandler = async (_req, res) => {
  const [dbUp, cacheStatus] = await Promise.all([pingDatabase(), pingRedis()]);

  const dbOk = dbUp;
  const cacheOk = cacheStatus !== "down";
  const status = dbOk && cacheOk ? "ok" : "degraded";

  res.status(status === "ok" ? 200 : 503).json({
    status,
    service: "skillstreak-backend",
    timestamp: new Date().toISOString(),
    checks: {
      database: dbUp ? "up" : "down",
      redis: cacheStatus,
    },
  });
};
