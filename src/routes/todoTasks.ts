import { Router, type Request, type Response } from "express";
import { todoTaskRepository } from "../db/todoTaskRepository.js";
import { isRecord, isNonEmptyString, isInteger, isIsoDateString, isUuid, validateExactKeys } from "../validation.js";
import { sendMessage, sendProblemDetails } from "../http.js";

const router = Router();

function validateTaskCreate(body: unknown): string[] {
  const errors: string[] = [];
  if (!isRecord(body)) {
    return ["Request body must be a JSON object"];
  }

  validateExactKeys(body, ["id", "taskName", "taskSort", "createdDt", "dueDt", "isCompleted", "isArchived", "todoCategoryId", "todoPriorityId", "syncDt"], errors);
  if (body.taskName !== undefined && body.taskName !== null && !isNonEmptyString(body.taskName, 128)) {
    errors.push("taskName must be a string up to 128 characters");
  }
  if (body.taskSort !== undefined && !isInteger(body.taskSort)) {
    errors.push("taskSort must be an integer");
  }
  if (body.createdDt !== undefined && body.createdDt !== null && !isIsoDateString(body.createdDt)) {
    errors.push("createdDt must be a valid ISO date string");
  }
  if (body.dueDt !== undefined && body.dueDt !== null && !isIsoDateString(body.dueDt)) {
    errors.push("dueDt must be a valid ISO date string or null");
  }
  if (body.isCompleted !== undefined && typeof body.isCompleted !== "boolean") {
    errors.push("isCompleted must be a boolean");
  }
  if (body.isArchived !== undefined && typeof body.isArchived !== "boolean") {
    errors.push("isArchived must be a boolean");
  }
  if (body.todoCategoryId !== undefined && body.todoCategoryId !== null && !isUuid(body.todoCategoryId)) {
    errors.push("todoCategoryId must be a UUID string");
  }
  if (body.todoPriorityId !== undefined && body.todoPriorityId !== null && !isUuid(body.todoPriorityId)) {
    errors.push("todoPriorityId must be a UUID string");
  }
  if (body.syncDt !== undefined && body.syncDt !== null && typeof body.syncDt !== "string") {
    errors.push("syncDt must be a string or null");
  }
  return errors;
}

function validateTaskUpdate(body: unknown): string[] {
  const errors = validateTaskCreate(body);
  if (!isRecord(body)) {
    return errors;
  }

  if (!isNonEmptyString(body.taskName, 128)) {
    errors.push("taskName is required and must be a string up to 128 characters");
  }
  if (!isInteger(body.taskSort)) {
    errors.push("taskSort is required and must be an integer");
  }
  if (!isIsoDateString(body.createdDt)) {
    errors.push("createdDt is required and must be a valid ISO date string");
  }
  if (body.dueDt !== null && !isIsoDateString(body.dueDt)) {
    errors.push("dueDt must be a valid ISO date string or null");
  }
  if (typeof body.isCompleted !== "boolean") {
    errors.push("isCompleted is required and must be a boolean");
  }
  if (typeof body.isArchived !== "boolean") {
    errors.push("isArchived is required and must be a boolean");
  }
  if (!isUuid(body.todoCategoryId)) {
    errors.push("todoCategoryId is required and must be a UUID string");
  }
  if (!isUuid(body.todoPriorityId)) {
    errors.push("todoPriorityId is required and must be a UUID string");
  }
  return errors;
}

router.get("/", (req: Request, res: Response) => {
  res.json(todoTaskRepository.findAll(req.user!.userId));
});

router.post("/", (req: Request, res: Response) => {
  const errors = validateTaskCreate(req.body);
  if (errors.length > 0) {
    sendMessage(res, 400, errors);
    return;
  }

  res.json(todoTaskRepository.create(req.body, req.user!.userId));
});

router.get("/:id", (req: Request, res: Response) => {
  const taskId = req.params.id as string;
  const task = todoTaskRepository.findById(taskId, req.user!.userId);
  if (!task) {
    sendProblemDetails(res, 404, "Not Found", "Todo task not found");
    return;
  }

  res.json(task);
});

router.put("/:id", (req: Request, res: Response) => {
  const errors = validateTaskUpdate(req.body);
  if (errors.length > 0) {
    sendMessage(res, 400, errors);
    return;
  }

  const taskId = req.params.id as string;
  const task = todoTaskRepository.update(taskId, req.body, req.user!.userId);
  if (!task) {
    sendProblemDetails(res, 404, "Not Found", "Todo task not found");
    return;
  }

  res.json(task);
});

router.delete("/:id", (req: Request, res: Response) => {
  const taskId = req.params.id as string;
  const deleted = todoTaskRepository.delete(taskId, req.user!.userId);
  if (!deleted) {
    sendProblemDetails(res, 404, "Not Found", "Todo task not found");
    return;
  }

  res.status(200).send();
});

export default router;