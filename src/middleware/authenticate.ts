import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../auth.js";

declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; email: string };
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authorization header required" });
    return;
  }

  try {
    const token = header.slice(7);
    const payload = verifyAccessToken(token);
    req.user = { userId: payload.userId, email: payload.email };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export {};