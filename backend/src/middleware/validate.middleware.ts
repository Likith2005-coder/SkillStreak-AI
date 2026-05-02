import { RequestHandler } from "express";
import { ZodSchema } from "zod";
import { ApiError } from "./error.middleware";

type Source = "body" | "query" | "params";

export function validate<T>(schema: ZodSchema<T>, source: Source = "body"): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(new ApiError(400, "Validation failed", result.error.flatten().fieldErrors));
    }
    // Replace with parsed (and coerced) data so handlers see the typed shape.
    (req as Record<Source, unknown>)[source] = result.data as unknown;
    next();
  };
}
