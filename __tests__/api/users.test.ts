/**
 * @jest-environment node
 */
import { GET as getUsers } from "@/app/api/users/route";
import { callRoute, parseJson } from "../utils/apiClient";
import { createUser } from "../utils/factories";
import {
  disconnectTestDb,
  runMigrations,
  truncateAllTables,
} from "../utils/testDb";

beforeAll(async () => {
  await runMigrations();
});

beforeEach(async () => {
  await truncateAllTables();
});

afterAll(async () => {
  await disconnectTestDb();
});

describe("GET /api/users", () => {
  it("Tüm kullanıcılar listelenir", async () => {
    await createUser();
    await createUser();
    const response = await callRoute(getUsers, "/api/users");
    const body = await parseJson<unknown[]>(response);
    expect(response.status).toBe(200);
    expect(body.length).toBe(2);
  });

  it("Branch'e göre gruplandırılmış", async () => {
    await createUser({ branch: "Radyoloji", name: "Dr. A" });
    await createUser({ branch: "Patoloji", name: "Dr. B" });

    const response = await callRoute(getUsers, "/api/users?grouped=true");
    const body = await parseJson<{ branch: string; users: unknown[] }[]>(
      response,
    );
    expect(body.length).toBeGreaterThanOrEqual(2);
    expect(body[0].branch).toBeTruthy();
    expect(Array.isArray(body[0].users)).toBe(true);
  });

  it("?branch=Radyoloji filtresi", async () => {
    await createUser({ branch: "Radyoloji" });
    await createUser({ branch: "Patoloji" });

    const response = await callRoute(getUsers, "/api/users?branch=Radyoloji");
    const body = await parseJson<{ branch: string }[]>(response);
    expect(body).toHaveLength(1);
    expect(body[0].branch).toBe("Radyoloji");
  });

  it("Şifre alanı response'a dahil değil", async () => {
    await createUser();
    const response = await callRoute(getUsers, "/api/users");
    const body = await parseJson<Record<string, unknown>[]>(response);
    expect(body[0]).not.toHaveProperty("password");
    expect(body[0]).not.toHaveProperty("passwordHash");
  });
});
