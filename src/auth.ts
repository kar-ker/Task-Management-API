import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import type { AuthUser } from "./types/index.js";

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error("JWT_SECRET environment variable is required");
}

const JWT_SECRET: string = jwtSecret;

export function generateAccessToken(user: AuthUser, expiresInSeconds: number): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: expiresInSeconds });
}

export function generateRefreshToken(): string {
  return uuidv4();
}

export function verifyAccessToken(token: string): AuthUser {
  return jwt.verify(token, JWT_SECRET) as unknown as AuthUser;
}