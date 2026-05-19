import { Router, type Request, type Response } from "express";
import { todoPriorityRepository } from "../db/todoPriorityRepository.js";
import { isRecord, isNonEmptyString, isInteger, validateExactKeys } from "../validation.js";
import { sendMessage, sendProblemDetails } from "../http.js";

const router = Router();

function validatePriorityCreate(body: unknown): string[] {
  const errors: string[] = [];
  if (!isRecord(body)) {
    return ["Request body must be a JSON object"];
  }

  validateExactKeys(body, ["id", "priorityName", "prioritySort", "syncDt"], errors);
  if (body.priorityName !== undefined && body.priorityName !== null && !isNonEmptyString(body.priorityName, 128)) {
    errors.push("priorityName must be a string up to 128 characters");
  }
  if (body.prioritySort !== undefined && !isInteger(body.prioritySort)) {
    errors.push("prioritySort must be an integer");
  }
  if (body.syncDt !== undefined && body.syncDt !== null && typeof body.syncDt !== "string") {
    errors.push("syncDt must be a string or null");
  }
  return errors;
}

function validatePriorityUpdate(body: unknown): string[] {
  const errors = validatePriorityCreate(body);
  if (!isRecord(body)) {
    return errors;
  }
  if (!isNonEmptyString(body.priorityName, 128)) {
    errors.push("priorityName is required and must be a string up to 128 characters");
  }
  if (!isInteger(body.prioritySort)) {
    errors.push("prioritySort is required and must be an integer");
  }
  if (body.syncDt !== undefined && typeof body.syncDt !== "string") {
    errors.push("syncDt is required and must be a string");
  }
  return errors;
}

router.get("/", (req: Request, res: Response) => {
  res.json(todoPriorityRepository.findAll(req.user!.userId));
});

router.post("/", (req: Request, res: Response) => {
  const errors = validatePriorityCreate(req.body);
  if (errors.length > 0) {
    sendMessage(res, 400, errors);
    return;
  }

  res.json(todoPriorityRepository.create(req.body, req.user!.userId));
});

router.get("/:id", (req: Request, res: Response) => {
  const priorityId = req.params.id as string;
  const priority = todoPriorityRepository.findById(priorityId, req.user!.userId);
  if (!priority) {
    sendProblemDetails(res, 404, "Not Found", "Todo priority not found");
    return;
  }

  res.json(priority);
});

router.put("/:id", (req: Request, res: Response) => {
  const errors = validatePriorityUpdate(req.body);
  if (errors.length > 0) {
    sendProblemDetails(res, 400, "Bad Request", errors[0]);
    return;
  }

  const priorityId = req.params.id as string;
  const priority = todoPriorityRepository.update(priorityId, req.body, req.user!.userId);
  if (!priority) {
    sendProblemDetails(res, 404, "Not Found", "Todo priority not found");
    return;
  }

  res.status(200).send();
});

router.delete("/:id", (req: Request, res: Response) => {
  const priorityId = req.params.id as string;
  const deleted = todoPriorityRepository.delete(priorityId, req.user!.userId);
  if (!deleted) {
    sendProblemDetails(res, 404, "Not Found", "Todo priority not found");
    return;
  }

  res.status(200).send();
});

export default router;