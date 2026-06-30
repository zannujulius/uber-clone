import request from "supertest";
import app from "../src/app";
import { sequelize, Rider, Driver } from "../src/models";

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

afterEach(async () => {
  await Rider.destroy({ where: {} });
  await Driver.destroy({ where: {} });
});

// ─── Health ───────────────────────────────────────────────────────────────────

describe("GET /health", () => {
  it("returns 200", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
  });
});

// ─── Rider Auth ───────────────────────────────────────────────────────────────

const validRider = {
  first_name: "John",
  last_name: "Doe",
  email: "john@example.com",
  phone_number: "+1234567890",
  password: "password123",
  gender: "MALE",
};

describe("Rider registration", () => {
  it("registers a rider and returns tokens", async () => {
    const res = await request(app)
      .post("/api/v1/auth/rider/register")
      .send(validRider);
    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty("token");
    expect(res.body.data).toHaveProperty("refreshToken");
    expect(res.body.data.rider.email).toBe(validRider.email);
    expect(res.body.data.rider.password).toBeUndefined();
  });

  it("rejects duplicate email", async () => {
    await request(app).post("/api/v1/auth/rider/register").send(validRider);
    const res = await request(app)
      .post("/api/v1/auth/rider/register")
      .send(validRider);
    expect(res.status).toBe(409);
  });

  it("rejects missing fields", async () => {
    const res = await request(app)
      .post("/api/v1/auth/rider/register")
      .send({ email: "bad@example.com" });
    expect(res.status).toBe(422);
    expect(res.body.errors).toBeDefined();
  });

  it("rejects short password", async () => {
    const res = await request(app)
      .post("/api/v1/auth/rider/register")
      .send({ ...validRider, password: "short" });
    expect(res.status).toBe(422);
  });
});

describe("Rider login", () => {
  beforeEach(async () => {
    await request(app).post("/api/v1/auth/rider/register").send({
      first_name: "Jane",
      last_name: "Doe",
      email: "jane@example.com",
      phone_number: "+9876543210",
      password: "password123",
    });
  });

  it("logs in with valid credentials", async () => {
    const res = await request(app)
      .post("/api/v1/auth/rider/login")
      .send({ email: "jane@example.com", password: "password123" });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("token");
  });

  it("rejects wrong password", async () => {
    const res = await request(app)
      .post("/api/v1/auth/rider/login")
      .send({ email: "jane@example.com", password: "wrongpass" });
    expect(res.status).toBe(401);
  });

  it("rejects non-existent email", async () => {
    const res = await request(app)
      .post("/api/v1/auth/rider/login")
      .send({ email: "nobody@example.com", password: "password123" });
    expect(res.status).toBe(401);
  });
});

// ─── Driver Auth ──────────────────────────────────────────────────────────────

const validDriver = {
  first_name: "Ali",
  last_name: "Hassan",
  email: "ali@example.com",
  phone_number: "+1112223333",
  password: "driverpass1",
  gender: "MALE",
};

describe("Driver registration", () => {
  it("registers a driver and returns tokens", async () => {
    const res = await request(app)
      .post("/api/v1/auth/driver/register")
      .send(validDriver);
    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty("token");
    expect(res.body.data.driver.email).toBe(validDriver.email);
    expect(res.body.data.driver.password).toBeUndefined();
  });

  it("rejects duplicate driver email", async () => {
    await request(app).post("/api/v1/auth/driver/register").send(validDriver);
    const res = await request(app)
      .post("/api/v1/auth/driver/register")
      .send(validDriver);
    expect(res.status).toBe(409);
  });
});

describe("Driver login", () => {
  beforeEach(async () => {
    await request(app).post("/api/v1/auth/driver/register").send({
      first_name: "Bob",
      last_name: "Smith",
      email: "bob@example.com",
      phone_number: "+4445556666",
      password: "driverpass1",
    });
  });

  it("logs in with valid credentials", async () => {
    const res = await request(app)
      .post("/api/v1/auth/driver/login")
      .send({ email: "bob@example.com", password: "driverpass1" });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("token");
  });

  it("rejects wrong password", async () => {
    const res = await request(app)
      .post("/api/v1/auth/driver/login")
      .send({ email: "bob@example.com", password: "wrongpass" });
    expect(res.status).toBe(401);
  });
});

// ─── Token Refresh ────────────────────────────────────────────────────────────

describe("Token refresh", () => {
  it("returns a new access token with a valid refresh token", async () => {
    const reg = await request(app).post("/api/v1/auth/rider/register").send({
      first_name: "Tok",
      last_name: "En",
      email: "token@example.com",
      phone_number: "+7778889999",
      password: "password123",
    });
    const { refreshToken } = reg.body.data as { refreshToken: string };

    const res = await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("token");
  });

  it("rejects invalid refresh token", async () => {
    const res = await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: "bad.token.here" });
    expect(res.status).toBe(401);
  });

  it("returns 400 when refresh token is missing", async () => {
    const res = await request(app).post("/api/v1/auth/refresh").send({});
    expect(res.status).toBe(400);
  });
});

// ─── GET /me ──────────────────────────────────────────────────────────────────

describe("GET /api/v1/auth/me", () => {
  it("returns the current user with valid token", async () => {
    const reg = await request(app).post("/api/v1/auth/rider/register").send({
      first_name: "Me",
      last_name: "User",
      email: "me@example.com",
      phone_number: "+0001112222",
      password: "password123",
    });
    const { token } = reg.body.data as { token: string };

    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe("rider");
  });

  it("rejects request without token", async () => {
    const res = await request(app).get("/api/v1/auth/me");
    expect(res.status).toBe(401);
  });
});
