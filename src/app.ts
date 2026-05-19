// src/app.ts
import cors from "cors";
import express from "express";
import accountRouter from "./routes/account.js";
import listItemsRouter from "./routes/listItems.js";
import todoCategoriesRouter from "./routes/todoCategories.js";
import todoPrioritiesRouter from "./routes/todoPriorities.js";
import todoTasksRouter from "./routes/todoTasks.js";
import { authenticate } from "./middleware/authenticate.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3001",
      /^https?:\/\/[\w-]+\.proxy\.itcollege\.ee$/,
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.static("public"));

app.use(
  express.json({
    limit: "1mb",
    type: ["application/json", "text/json", "application/*+json"],
  })
);


// Logging middleware — runs for every request
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    console.log(`${req.method} ${req.url} ${res.statusCode} ${ms}ms`);
  });
  next();
});

app.use("/api/v1/Account", accountRouter);
app.use("/api/v1/ListItems", authenticate, listItemsRouter);
app.use("/api/v1/TodoCategories", authenticate, todoCategoriesRouter);
app.use("/api/v1/TodoPriorities", authenticate, todoPrioritiesRouter);
app.use("/api/v1/TodoTasks", authenticate, todoTasksRouter);

app.use("/api", (req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Error handler must be last
app.use(errorHandler);

export default app;