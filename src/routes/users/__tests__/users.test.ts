import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestApp } from "@/lib/create-app";
import usersRouter from "../users.index";

const mocks = vi.hoisted(() => {
  const findMany = vi.fn();
  const findFirst = vi.fn();
  const insertReturning = vi.fn();
  const insertValues = vi.fn(() => ({ returning: insertReturning }));
  const updateReturning = vi.fn();
  const updateWhere = vi.fn(() => ({ returning: updateReturning }));
  const updateSet = vi.fn(() => ({ where: updateWhere }));
  const deleteReturning = vi.fn();
  const deleteWhere = vi.fn(() => ({ returning: deleteReturning }));

  return {
    checkPermission: vi.fn(),
    db: {
      query: {
        users: {
          findMany,
          findFirst,
        },
      },
      insert: vi.fn(() => ({ values: insertValues })),
      update: vi.fn(() => ({ set: updateSet })),
      delete: vi.fn(() => ({ where: deleteWhere })),
    },
    deleteReturning,
    deleteWhere,
    findFirst,
    findMany,
    insertReturning,
    insertValues,
    updateReturning,
    updateSet,
    updateWhere,
    verifyAccessToken: vi.fn(),
  };
});

vi.mock("@/db", () => ({
  default: mocks.db,
}));

vi.mock("@/lib/jwt-utils", () => ({
  verifyAccessToken: mocks.verifyAccessToken,
}));

vi.mock("@/lib/permission-utils", () => ({
  checkPermission: mocks.checkPermission,
}));

const app = createTestApp(usersRouter);

const authHeaders = {
  Authorization: "Bearer test-token",
};

const userId = "b2ca172d-daba-4c09-b9b2-361076ff094d";

const user = {
  id: userId,
  username: "test_user",
  password: "hashed-password",
  ldapDn: null,
  accountType: "LOCAL",
  email: null,
  displayName: null,
  isActive: true,
  status: "ENABLED",
  createdAt: "2026-09-20 12:00:00",
  createdBy: null,
  updatedAt: "2026-09-20 12:00:00",
  updatedBy: null,
};

describe("users routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.verifyAccessToken.mockResolvedValue({
      sub: userId,
      accountType: "LOCAL",
      jti: "e5c5c380-4a30-4af9-ae34-5fed9f424ad0",
      exp: 1789886364,
    });
    mocks.checkPermission.mockResolvedValue(true);
  });

  it("lists users when the caller has read permission", async () => {
    mocks.findMany.mockResolvedValue([user]);

    const response = await app.request("/users", {
      headers: authHeaders,
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([user]);
    expect(mocks.verifyAccessToken).toHaveBeenCalledWith("test-token");
    expect(mocks.checkPermission).toHaveBeenCalledWith(userId, "users", "read");
    expect(mocks.findMany).toHaveBeenCalledOnce();
  });

  it("returns forbidden when listing without read permission", async () => {
    mocks.checkPermission.mockResolvedValue(false);

    const response = await app.request("/users", {
      headers: authHeaders,
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ message: "Forbidden" });
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it("creates a user", async () => {
    mocks.insertReturning.mockResolvedValue([user]);

    const response = await app.request("/users", {
      method: "POST",
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "test_user",
        password: "secret1",
        status: "ENABLED",
      }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(user);
    expect(mocks.insertValues).toHaveBeenCalledWith({
      username: "test_user",
      password: "secret1",
      status: "ENABLED",
    });
  });

  it("rejects invalid user creation payloads", async () => {
    const response = await app.request("/users", {
      method: "POST",
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "bad name",
        password: "123",
        status: "ENABLED",
      }),
    });

    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error.name).toBe("ZodError");
    expect(mocks.db.insert).not.toHaveBeenCalled();
  });

  it("gets one user", async () => {
    mocks.findFirst.mockResolvedValue(user);

    const response = await app.request(`/users/${userId}`, {
      headers: authHeaders,
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(user);
    expect(mocks.findFirst).toHaveBeenCalledWith({ where: { id: userId } });
  });

  it("returns not found when getting a missing user", async () => {
    mocks.findFirst.mockResolvedValue(undefined);

    const response = await app.request(`/users/${userId}`, {
      headers: authHeaders,
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ message: "Not Found" });
  });

  it("patches a user", async () => {
    const updatedUser = { ...user, status: "DISABLED" };
    mocks.updateReturning.mockResolvedValue([updatedUser]);

    const response = await app.request(`/users/${userId}`, {
      method: "PATCH",
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "DISABLED" }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(updatedUser);
    expect(mocks.updateSet).toHaveBeenCalledWith({ status: "DISABLED" });
    expect(mocks.updateWhere).toHaveBeenCalledOnce();
  });

  it("rejects empty patch payloads", async () => {
    const response = await app.request(`/users/${userId}`, {
      method: "PATCH",
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: {
        name: "ZodError",
        issues: [{ code: "invalid_updates", message: "No updates provided" }],
      },
    });
    expect(mocks.db.update).not.toHaveBeenCalled();
  });

  it("returns not found when patching a missing user", async () => {
    mocks.updateReturning.mockResolvedValue([]);

    const response = await app.request(`/users/${userId}`, {
      method: "PATCH",
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "DISABLED" }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ message: "Not Found" });
  });

  it("deletes a user", async () => {
    mocks.deleteReturning.mockResolvedValue([{ id: userId }]);

    const response = await app.request(`/users/${userId}`, {
      method: "DELETE",
      headers: authHeaders,
    });

    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(mocks.deleteWhere).toHaveBeenCalledOnce();
  });

  it("returns not found when deleting a missing user", async () => {
    mocks.deleteReturning.mockResolvedValue([]);

    const response = await app.request(`/users/${userId}`, {
      method: "DELETE",
      headers: authHeaders,
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ message: "Not Found" });
  });

  it("returns unauthorized without a bearer token", async () => {
    const response = await app.request("/users");

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ message: "Unauthorized" });
    expect(mocks.findMany).not.toHaveBeenCalled();
  });
});
