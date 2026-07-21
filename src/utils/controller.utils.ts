import { Response } from "express";
import { AppError, isAppError } from "./app-error";

export function handleControllerError(
  res: Response,
  err: unknown,
  fallbackMessage: string
): void {
  if (isAppError(err)) {
    const body: Record<string, unknown> = { message: err.message };
    if (err.details && typeof err.details === "object") {
      Object.assign(body, err.details);
    }
    res.status(err.statusCode).json(body);
    return;
  }

  console.error(err);
  res.status(500).json({ message: fallbackMessage });
}

export { AppError };
