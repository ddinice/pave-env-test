import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const dependencies = vi.hoisted(() => ({
  currentUser: vi.fn(),
  listDesignVariables: vi.fn(),
}));

vi.mock("../../lib/auth/current-user", () => ({
  currentUser: dependencies.currentUser,
}));
vi.mock("../../lib/design-variables/repository", () => ({
  listDesignVariables: dependencies.listDesignVariables,
}));

import {
  DELETE,
  GET,
  HEAD,
  OPTIONS,
  PATCH,
  POST,
  PUT,
} from "../../app/api/v1/design-variables/route";

function expectPrivateNoStore(response: Response) {
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
}

describe("GET /api/v1/design-variables", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 401 without a valid browser session", async () => {
    dependencies.currentUser.mockResolvedValue(null);

    const response = await GET(
      new Request("http://localhost/api/v1/design-variables"),
    );

    expect(response.status).toBe(401);
    expectPrivateNoStore(response);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(dependencies.listDesignVariables).not.toHaveBeenCalled();
  });

  it("returns a stable JSON collection for a signed-in user", async () => {
    dependencies.currentUser.mockResolvedValue({
      id: "user-1",
      role: "ANALYST",
    });
    dependencies.listDesignVariables.mockResolvedValue([
      {
        externalKey: "battery.capacity",
        name: "Battery capacity",
        value: "120.5",
        unit: "Wh",
        subsystem: "EPS",
        description: "Usable battery capacity.",
        isProtected: false,
        updatedAt: new Date("2026-08-03T10:15:00.000Z"),
        updatedByUserId: "user-1",
      },
    ]);

    const response = await GET(
      new Request(
        "http://localhost/api/v1/design-variables?query=battery&subsystem=EPS",
      ),
    );

    expect(response.status).toBe(200);
    expectPrivateNoStore(response);
    await expect(response.json()).resolves.toEqual({
      data: [
        {
          externalKey: "battery.capacity",
          name: "Battery capacity",
          value: "120.5",
          unit: "Wh",
          subsystem: "EPS",
          description: "Usable battery capacity.",
          isProtected: false,
          updatedAt: "2026-08-03T10:15:00.000Z",
        },
      ],
      meta: { count: 1 },
    });
    expect(dependencies.listDesignVariables).toHaveBeenCalledWith({
      query: "battery",
      subsystem: "EPS",
    });
  });

  it("rejects blank search parameters before reading the repository", async () => {
    dependencies.currentUser.mockResolvedValue({
      id: "user-1",
      role: "ANALYST",
    });

    const response = await GET(
      new Request("http://localhost/api/v1/design-variables?query=%20%20"),
    );

    expect(response.status).toBe(400);
    expectPrivateNoStore(response);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid query parameters",
    });
    expect(dependencies.listDesignVariables).not.toHaveBeenCalled();
  });

  it("returns a stable 500 when session lookup fails", async () => {
    const failure = new Error("database unavailable");
    dependencies.currentUser.mockRejectedValue(failure);
    const logError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const response = await GET(
      new Request("http://localhost/api/v1/design-variables"),
    );

    expect(response.status).toBe(500);
    expectPrivateNoStore(response);
    await expect(response.json()).resolves.toEqual({
      error: "Internal Server Error",
    });
    expect(logError).toHaveBeenCalledWith(
      "GET /api/v1/design-variables failed",
      failure,
    );
    expect(dependencies.listDesignVariables).not.toHaveBeenCalled();
  });

  it("returns a stable 500 when the repository read fails", async () => {
    const failure = new Error("database unavailable");
    dependencies.currentUser.mockResolvedValue({
      id: "user-1",
      role: "ANALYST",
    });
    dependencies.listDesignVariables.mockRejectedValue(failure);
    const logError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const response = await GET(
      new Request("http://localhost/api/v1/design-variables"),
    );

    expect(response.status).toBe(500);
    expectPrivateNoStore(response);
    await expect(response.json()).resolves.toEqual({
      error: "Internal Server Error",
    });
    expect(logError).toHaveBeenCalledWith(
      "GET /api/v1/design-variables failed",
      failure,
    );
  });

  it.each([
    ["POST", POST],
    ["PUT", PUT],
    ["PATCH", PATCH],
    ["DELETE", DELETE],
    ["HEAD", HEAD],
    ["OPTIONS", OPTIONS],
  ] as const)("rejects %s with Allow: GET", async (method, handler) => {
    const response = await handler(
      new Request("http://localhost/api/v1/design-variables", { method }),
    );

    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("GET");
    expectPrivateNoStore(response);
    await expect(response.json()).resolves.toEqual({
      error: "Method Not Allowed",
    });
  });
});
