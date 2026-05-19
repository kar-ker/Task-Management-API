// src/routes/tasks.ts
import { Router, Request, Response } from "express";

const router = Router();

const tasks = [
  { id: "1", title: "Learn Express", status: "in_progress" },
  { id: "2", title: "Build API", status: "todo" },
];

router.get("/", (req: Request, res: Response) => {
  res.json(tasks);
});

router.get("/:id", (req: Request, res: Response) => {
  const task = tasks.find((t) => t.id === req.params.id);
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  res.json(task);
});

export default router;