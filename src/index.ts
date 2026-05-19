// src/index.ts
import "dotenv/config"; // side-effect import — loads .env into process.env
import app from "./app.js";
import { initializeDatabase } from "./db/database.js";

initializeDatabase();

const PORT = process.env.PORT || 3001;

app.listen(PORT, (error?: Error) => {
  if (error) throw error;
  console.log(`Server running on http://localhost:${PORT}`);
});