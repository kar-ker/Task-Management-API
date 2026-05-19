import type { Response } from "express";

export function sendMessage(res: Response, statusCode: number, messages: string[]): Response {
  return res.status(statusCode).json({ messages });
}

export function sendProblemDetails(
  res: Response,
  statusCode: number,
  title: string,
  detail?: string
): Response {
  return res.status(statusCode).json({
    type: "about:blank",
    title,
    status: statusCode,
    detail: detail ?? title,
  });
}