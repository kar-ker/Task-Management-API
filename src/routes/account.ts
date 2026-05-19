import type { Request, Response } from "express";
import { Router } from "express";
import bcrypt from "bcrypt";
import { accountRepository } from "../db/accountRepository.js";
import { generateAccessToken, generateRefreshToken } from "../auth.js";
import { parseExpiresInSeconds, validateExactKeys, isRecord, isNonEmptyString } from "../validation.js";
import { sendMessage } from "../http.js";

const router = Router();

function validateAccountBody(body: unknown, allowedKeys: string[]): string[] {
  const errors: string[] = [];

  if (!isRecord(body)) {
    return ["Request body must be a JSON object"];
  }

  validateExactKeys(body, allowedKeys, errors);
  return errors;
}

router.post("/Login", async (req: Request, res: Response) => {
  const errors = validateAccountBody(req.body, ["email", "password"]);
  if (errors.length > 0) {
    sendMessage(res, 400, errors);
    return;
  }

  const { email, password } = req.body as { email?: string; password?: string };
  if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
    sendMessage(res, 400, ["email and password are required"]);
    return;
  }

  const user = accountRepository.findUserByEmail(email);
  if (!user) {
    sendMessage(res, 404, ["Invalid email or password"]);
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    sendMessage(res, 404, ["Invalid email or password"]);
    return;
  }

  const expiresInSeconds = parseExpiresInSeconds(req.query.expiresInSeconds, 900);
  const token = generateAccessToken({ userId: user.id, email: user.email }, expiresInSeconds);
  const refreshToken = generateRefreshToken();
  const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  accountRepository.storeRefreshToken(user.id, refreshToken, refreshExpiresAt);

  res.json({
    token,
    refreshToken,
    firstName: user.firstName,
    lastName: user.lastName,
  });
});

router.post("/Register", async (req: Request, res: Response) => {
  const errors = validateAccountBody(req.body, ["email", "password", "firstName", "lastName"]);
  if (errors.length > 0) {
    sendMessage(res, 400, errors);
    return;
  }

  const { email, password, firstName, lastName } = req.body as {
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
  };

  if (!isNonEmptyString(email) || !isNonEmptyString(password) || !isNonEmptyString(firstName) || !isNonEmptyString(lastName)) {
    sendMessage(res, 400, ["email, password, firstName, and lastName are required"]);
    return;
  }

  if (password.length < 8) {
    sendMessage(res, 400, ["password must be at least 8 characters"]);
    return;
  }

  if (accountRepository.findUserByEmail(email)) {
    sendMessage(res, 400, ["Email already registered"]);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = accountRepository.createUser({ email, passwordHash, firstName, lastName });
  const expiresInSeconds = parseExpiresInSeconds(req.query.expiresInSeconds, 900);
  const token = generateAccessToken({ userId: user.id, email: user.email }, expiresInSeconds);
  const refreshToken = generateRefreshToken();
  const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  accountRepository.storeRefreshToken(user.id, refreshToken, refreshExpiresAt);

  res.json({
    token,
    refreshToken,
    firstName: user.firstName,
    lastName: user.lastName,
  });
});

router.post("/RefreshToken", async (req: Request, res: Response) => {
  const errors = validateAccountBody(req.body, ["jwt", "refreshToken"]);
  if (errors.length > 0) {
    sendMessage(res, 400, errors);
    return;
  }

  const { jwt: currentJwt, refreshToken } = req.body as { jwt?: string; refreshToken?: string };
  if (!isNonEmptyString(currentJwt) || !isNonEmptyString(refreshToken)) {
    sendMessage(res, 400, ["jwt and refreshToken are required"]);
    return;
  }

  const storedToken = accountRepository.findRefreshToken(refreshToken);
  if (!storedToken) {
    sendMessage(res, 400, ["Invalid or expired refresh token"]);
    return;
  }

  if (new Date(storedToken.expiresAt).getTime() <= Date.now()) {
    accountRepository.deleteRefreshToken(refreshToken);
    sendMessage(res, 400, ["Invalid or expired refresh token"]);
    return;
  }

  const user = accountRepository.findUserById(storedToken.userId);
  if (!user) {
    sendMessage(res, 400, ["Invalid or expired refresh token"]);
    return;
  }

  accountRepository.deleteRefreshToken(refreshToken);

  const expiresInSeconds = parseExpiresInSeconds(req.query.expiresInSeconds, 900);
  const token = generateAccessToken({ userId: user.id, email: user.email }, expiresInSeconds);
  const nextRefreshToken = generateRefreshToken();
  const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  accountRepository.storeRefreshToken(user.id, nextRefreshToken, refreshExpiresAt);

  res.json({
    token,
    refreshToken: nextRefreshToken,
    firstName: user.firstName,
    lastName: user.lastName,
  });
});

export default router;