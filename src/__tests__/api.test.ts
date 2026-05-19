import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import fs from "fs";
import { randomUUID } from "node:crypto";

// Configure env BEFORE importing app modules.
// Static imports are hoisted in ESM — they run before module body code.
// Dynamic import() is evaluated at runtime, so env is set first.
const TEST_DB = "test-express1.db";
process.env.DB_PATH = TEST_DB;
process.env.JWT_SECRET = "test-secret-key-at-least-32-chars-long";

const { default: app } = await import("../app.js");
const { initializeDatabase, closeDb } = await import("../db/database.js");

let jwt: string;

beforeAll(async () => {
  initializeDatabase();

  const res = await request(app)
    .post("/api/v1/Account/Register")
    .send({
      email: `test-${randomUUID()}@test.com`,
      password: "password123",
      firstName: "Test",
      lastName: "User",
    });

  jwt = res.body.token;
});

afterAll(() => {
  // Close the database connection before deleting files
  closeDb();

  // Clean up test database
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
  if (fs.existsSync(`${TEST_DB}-wal`)) fs.unlinkSync(`${TEST_DB}-wal`);
  if (fs.existsSync(`${TEST_DB}-shm`)) fs.unlinkSync(`${TEST_DB}-shm`);
});

// Helper functions for authenticated requests
async function authGet(url: string) {
  return request(app).get(url).set("Authorization", `Bearer ${jwt}`);
}

async function authPost(url: string, body: Record<string, unknown> | string) {
  return request(app).post(url).set("Authorization", `Bearer ${jwt}`).send(body);
}

async function authPut(url: string, body: Record<string, unknown> | string) {
  return request(app).put(url).set("Authorization", `Bearer ${jwt}`).send(body);
}

async function authDelete(url: string) {
  return request(app).delete(url).set("Authorization", `Bearer ${jwt}`);
}

describe("Account", () => {
  it("logs in with the documented response shape", async () => {
    const email = `login-${randomUUID()}@test.com`;

    const registerResponse = await request(app)
      .post("/api/v1/Account/Register")
      .send({
        email,
        password: "password123",
        firstName: "Login",
        lastName: "User",
      });

    const loginResponse = await request(app)
      .post("/api/v1/Account/Login")
      .send({ email, password: "password123" });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.token).toBeTypeOf("string");
    expect(loginResponse.body.refreshToken).toBeTypeOf("string");
    expect(loginResponse.body.firstName).toBe("Login");
    expect(loginResponse.body.lastName).toBe("User");
    expect(registerResponse.body.refreshToken).toBeTypeOf("string");
  });

  it("returns 404 for invalid login", async () => {
    const response = await request(app).post("/api/v1/Account/Login").send({
      email: "missing@test.com",
      password: "password123",
    });

    expect(response.status).toBe(404);
    expect(response.body.messages).toEqual(["Invalid email or password"]);
  });
});

describe("Protected routes", () => {
  it("rejects requests without a bearer token", async () => {
    const response = await request(app).get("/api/v1/TodoCategories");
    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Authorization header required");
  });
});

describe("TodoCategories", () => {
  it("supports create, read, update, and delete", async () => {
    const createResponse = await authPost("/api/v1/TodoCategories", {
      categoryName: "Work",
      categorySort: 1,
      tag: "important",
    });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.id).toBeTypeOf("string");
    expect(createResponse.body.categoryName).toBe("Work");

    const categoryId = createResponse.body.id as string;

    const getResponse = await authGet(`/api/v1/TodoCategories/${categoryId}`);
    expect(getResponse.status).toBe(200);
    expect(getResponse.body.id).toBe(categoryId);

    const updateResponse = await authPut(`/api/v1/TodoCategories/${categoryId}`, {
      id: categoryId,
      categoryName: "Work Updated",
      categorySort: 2,
      syncDt: new Date().toISOString(),
      tag: "important",
    });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.categoryName).toBe("Work Updated");

    const deleteResponse = await authDelete(`/api/v1/TodoCategories/${categoryId}`);
    expect(deleteResponse.status).toBe(204);
  });
});

describe("TodoPriorities", () => {
  it("matches the documented empty-body update and delete responses", async () => {
    const createResponse = await authPost("/api/v1/TodoPriorities", {
      priorityName: "High",
      prioritySort: 1,
      syncDt: new Date().toISOString(),
    });

    expect(createResponse.status).toBe(200);
    const priorityId = createResponse.body.id as string;

    const putResponse = await authPut(`/api/v1/TodoPriorities/${priorityId}`, {
      id: priorityId,
      priorityName: "Highest",
      prioritySort: 2,
      syncDt: new Date().toISOString(),
    });

    expect(putResponse.status).toBe(200);
    expect(putResponse.text).toBe("");

    const deleteResponse = await authDelete(`/api/v1/TodoPriorities/${priorityId}`);
    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.text).toBe("");
  });
});

describe("ListItems", () => {
  it("supports list filtering and the documented delete response body", async () => {
    const apiKey = randomUUID();

    const createResponse = await authPost(`/api/v1/ListItems?apiKey=${apiKey}`, {
      id: randomUUID(),
      description: "First item",
      completed: false,
    });

    expect(createResponse.status).toBe(200);
    expect(createResponse.body.description).toBe("First item");

    const itemId = createResponse.body.id as string;

    const listResponse = await authGet(`/api/v1/ListItems?apiKey=${apiKey}&completed=false`);
    expect(listResponse.status).toBe(200);
    expect(listResponse.body).toHaveLength(1);

    const putResponse = await authPut(`/api/v1/ListItems/${itemId}?apiKey=${apiKey}`, {
      id: itemId,
      description: "Updated item",
      completed: true,
    });

    expect(putResponse.status).toBe(200);
    expect(putResponse.text).toBe("");

    const deleteResponse = await authDelete(`/api/v1/ListItems/${itemId}?apiKey=${apiKey}`);
    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.id).toBe(itemId);
    expect(deleteResponse.body.description).toBe("Updated item");
  });
});

describe("TodoTasks", () => {
  it("supports the documented task CRUD contract", async () => {
    const categoryResponse = await authPost("/api/v1/TodoCategories", {
      categoryName: "Personal",
      categorySort: 10,
      tag: null,
    });

    const priorityResponse = await authPost("/api/v1/TodoPriorities", {
      priorityName: "Normal",
      prioritySort: 10,
      syncDt: new Date().toISOString(),
    });

    const taskResponse = await authPost("/api/v1/TodoTasks", {
      taskName: "Write tests",
      taskSort: 1,
      createdDt: new Date().toISOString(),
      dueDt: null,
      isCompleted: false,
      isArchived: false,
      todoCategoryId: categoryResponse.body.id,
      todoPriorityId: priorityResponse.body.id,
      syncDt: new Date().toISOString(),
    });

    expect(taskResponse.status).toBe(200);
    const taskId = taskResponse.body.id as string;

    const getResponse = await authGet(`/api/v1/TodoTasks/${taskId}`);
    expect(getResponse.status).toBe(200);

    const putResponse = await authPut(`/api/v1/TodoTasks/${taskId}`, {
      id: taskId,
      taskName: "Write more tests",
      taskSort: 2,
      createdDt: new Date().toISOString(),
      dueDt: new Date().toISOString(),
      isCompleted: true,
      isArchived: false,
      todoCategoryId: categoryResponse.body.id,
      todoPriorityId: priorityResponse.body.id,
      syncDt: new Date().toISOString(),
    });

    expect(putResponse.status).toBe(200);
    expect(putResponse.body.taskName).toBe("Write more tests");

    const deleteResponse = await authDelete(`/api/v1/TodoTasks/${taskId}`);
    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.text).toBe("");
  });
});