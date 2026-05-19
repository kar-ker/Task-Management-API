import { Router, type Request, type Response } from "express";
import { todoCategoryRepository } from "../db/todoCategoryRepository.js";
import { isRecord, isNonEmptyString, isInteger, validateExactKeys } from "../validation.js";
import { sendMessage, sendProblemDetails } from "../http.js";

const router = Router();

function validateCategoryCreate(body: unknown): string[] {
  const errors: string[] = [];
  if (!isRecord(body)) {
    return ["Request body must be a JSON object"];
  }

  validateExactKeys(body, ["id", "categoryName", "categorySort", "syncDt", "tag"], errors);
  if (body.categoryName !== undefined && body.categoryName !== null && !isNonEmptyString(body.categoryName, 128)) {
    errors.push("categoryName must be a string up to 128 characters");
  }
  if (body.categorySort !== undefined && !isInteger(body.categorySort)) {
    errors.push("categorySort must be an integer");
  }
  if (body.tag !== undefined && body.tag !== null && typeof body.tag !== "string") {
    errors.push("tag must be a string or null");
  }
  return errors;
}

function validateCategoryUpdate(body: unknown): string[] {
  const errors = validateCategoryCreate(body);
  if (!isRecord(body)) {
    return errors;
  }
  if (!isNonEmptyString(body.categoryName, 128)) {
    errors.push("categoryName is required and must be a string up to 128 characters");
  }
  if (!isInteger(body.categorySort)) {
    errors.push("categorySort is required and must be an integer");
  }
  return errors;
}

router.get("/", (req: Request, res: Response) => {
  const categories = todoCategoryRepository.findAll(req.user!.userId);
  res.json(categories);
});

router.post("/", (req: Request, res: Response) => {
  const errors = validateCategoryCreate(req.body);
  if (errors.length > 0) {
    sendMessage(res, 400, errors);
    return;
  }

  const category = todoCategoryRepository.create(req.body, req.user!.userId);
  res.status(201).json(category);
});

router.get("/:id", (req: Request, res: Response) => {
  const categoryId = req.params.id as string;
  const category = todoCategoryRepository.findById(categoryId, req.user!.userId);
  if (!category) {
    sendProblemDetails(res, 404, "Not Found", "Todo category not found");
    return;
  }

  res.json(category);
});

router.put("/:id", (req: Request, res: Response) => {
  const errors = validateCategoryUpdate(req.body);
  if (errors.length > 0) {
    sendProblemDetails(res, 400, "Bad Request", errors[0]);
    return;
  }

  const categoryId = req.params.id as string;
  const category = todoCategoryRepository.update(categoryId, req.body, req.user!.userId);
  if (!category) {
    sendProblemDetails(res, 404, "Not Found", "Todo category not found");
    return;
  }

  res.json(category);
});

router.delete("/:id", (req: Request, res: Response) => {
  const categoryId = req.params.id as string;
  const deleted = todoCategoryRepository.delete(categoryId, req.user!.userId);
  if (!deleted) {
    sendProblemDetails(res, 404, "Not Found", "Todo category not found");
    return;
  }

  res.status(204).send();
});

export default router;