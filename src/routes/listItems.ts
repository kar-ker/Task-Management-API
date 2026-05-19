import { Router, type Request, type Response } from "express";
import { listItemRepository } from "../db/listItemRepository.js";
import { isBoolean, isRecord, isUuid, validateExactKeys } from "../validation.js";
import { sendMessage, sendProblemDetails } from "../http.js";

const router = Router();

function getApiKey(req: Request, res: Response): string | null {
  const apiKey = req.query.apiKey;
  if (!isUuid(apiKey)) {
    sendMessage(res, 400, ["apiKey must be a UUID string"]);
    return null;
  }

  return apiKey;
}

function validateListItemBody(body: unknown): string[] {
  const errors: string[] = [];
  if (!isRecord(body)) {
    return ["Request body must be a JSON object"];
  }

  validateExactKeys(body, ["id", "description", "completed"], errors);
  if (body.id !== undefined && body.id !== null && !isUuid(body.id)) {
    errors.push("id must be a UUID string");
  }
  if (
    body.description !== undefined &&
    body.description !== null &&
    (typeof body.description !== "string" || body.description.length < 1 || body.description.length > 255)
  ) {
    errors.push("description must be a string between 1 and 255 characters or null");
  }
  if (body.completed !== undefined && !isBoolean(body.completed)) {
    errors.push("completed must be a boolean");
  }
  return errors;
}

router.get("/", (req: Request, res: Response) => {
  const apiKey = getApiKey(req, res);
  if (!apiKey) {
    return;
  }

  const completed = req.query.completed;
  const completedFilter = typeof completed === "string" ? completed === "true" : undefined;
  res.json(listItemRepository.findAll(apiKey, completedFilter));
});

router.post("/", (req: Request, res: Response) => {
  const apiKey = getApiKey(req, res);
  if (!apiKey) {
    return;
  }

  const errors = validateListItemBody(req.body);
  if (errors.length > 0) {
    sendMessage(res, 400, errors);
    return;
  }

  res.json(listItemRepository.create(apiKey, req.body));
});

router.get("/:id", (req: Request, res: Response) => {
  const apiKey = getApiKey(req, res);
  if (!apiKey) {
    return;
  }

  const itemId = req.params.id as string;
  const item = listItemRepository.findById(itemId, apiKey);
  if (!item) {
    sendProblemDetails(res, 404, "Not Found", "List item not found");
    return;
  }

  res.json(item);
});

router.put("/:id", (req: Request, res: Response) => {
  const apiKey = getApiKey(req, res);
  if (!apiKey) {
    return;
  }

  const errors = validateListItemBody(req.body);
  if (errors.length > 0) {
    sendMessage(res, 400, errors);
    return;
  }

  const itemId = req.params.id as string;
  const item = listItemRepository.update(itemId, apiKey, req.body);
  if (!item) {
    sendProblemDetails(res, 404, "Not Found", "List item not found");
    return;
  }

  res.status(200).send();
});

router.delete("/:id", (req: Request, res: Response) => {
  const apiKey = getApiKey(req, res);
  if (!apiKey) {
    return;
  }

  const itemId = req.params.id as string;
  const existing = listItemRepository.findById(itemId, apiKey);
  if (!existing) {
    sendProblemDetails(res, 404, "Not Found", "List item not found");
    return;
  }

  listItemRepository.delete(itemId, apiKey);

  res.json(existing);
});

export default router;