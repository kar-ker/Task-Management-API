// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // If headers were already sent, delegate to Express default handler
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ messages: [err.message] });
    return;
  }

  console.error(`Unhandled error: ${err.message}`);
  res.status(500).json({
    type: "about:blank",
    title: "Internal Server Error",
    status: 500,
    detail: "Internal server error",
  });
}