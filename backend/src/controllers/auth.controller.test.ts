import request from "supertest";
import app from "../app";
import User from "../models/User.model";
import RefreshToken from "../models/RefreshToken.model";

jest.mock("../models/User.model");
jest.mock("../models/RefreshToken.model");

const MockedUser = User as jest.Mocked<typeof User>;
const MockedRefreshToken = RefreshToken as jest.Mocked<typeof RefreshToken>;

describe("Auth Controller Tests", () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeAll(() => {
        process.env.JWT_SECRET = "testjwtsecrettokenrotation123";
        process.env.ACCESS_TOKEN_SECRET = "testjwtsecrettokenrotation123";
        process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS = "7";
        consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterAll(() => {
        consoleErrorSpy.mockRestore();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("POST /api/auth/register", () => {
        it("should register a new user successfully with valid details", async () => {
            MockedUser.findOne.mockResolvedValue(null);
            const mockUserInstance = {
                _id: "mockuserid123",
                name: "John Doe",
                email: "john@example.com",
            };
            MockedUser.create.mockResolvedValue(mockUserInstance as any);
            MockedRefreshToken.create.mockResolvedValue({} as any);

            const res = await request(app)
                .post("/api/auth/register")
                .send({
                    name: "John Doe",
                    email: "john@example.com",
                    password: "password123",
                });

            expect(res.status).toBe(201);
            expect(res.body).toEqual({
                success: true,
                user: {
                    _id: "mockuserid123",
                    name: "John Doe",
                    email: "john@example.com",
                },
                accessToken: expect.any(String),
            });
            expect(res.headers["set-cookie"]).toBeDefined();
            expect(MockedUser.findOne).toHaveBeenCalledWith({ email: "john@example.com" });
            expect(MockedUser.create).toHaveBeenCalledWith({
                name: "John Doe",
                email: "john@example.com",
                password: "password123",
            });
        });

        it("should fail to register if user already exists", async () => {
            MockedUser.findOne.mockResolvedValue({ email: "john@example.com" } as any);

            const res = await request(app)
                .post("/api/auth/register")
                .send({
                    name: "John Doe",
                    email: "john@example.com",
                    password: "password123",
                });

            expect(res.status).toBe(409);
            expect(res.body.message).toContain("User already exists");
        });

        it("should fail to register if name is too short", async () => {
            const res = await request(app)
                .post("/api/auth/register")
                .send({
                    name: "J",
                    email: "john@example.com",
                    password: "password123",
                });

            expect(res.status).toBe(500);
        });

        it("should fail to register if password is too short", async () => {
            const res = await request(app)
                .post("/api/auth/register")
                .send({
                    name: "John Doe",
                    email: "john@example.com",
                    password: "123",
                });

            expect(res.status).toBe(500);
        });

        it("should fail to register if email is invalid", async () => {
            const res = await request(app)
                .post("/api/auth/register")
                .send({
                    name: "John Doe",
                    email: "invalid-email",
                    password: "password123",
                });

            expect(res.status).toBe(500);
        });
    });

    describe("POST /api/auth/login", () => {
        it("should login successfully with correct credentials", async () => {
            const mockComparePassword = jest.fn().mockResolvedValue(true);
            const mockUserInstance = {
                _id: "mockuserid123",
                name: "John Doe",
                email: "john@example.com",
                comparePassword: mockComparePassword,
            };
            MockedUser.findOne.mockResolvedValue(mockUserInstance as any);
            MockedRefreshToken.create.mockResolvedValue({} as any);

            const res = await request(app)
                .post("/api/auth/login")
                .send({
                    email: "john@example.com",
                    password: "password123",
                });

            expect(res.status).toBe(200);
            expect(res.body).toEqual({
                success: true,
                user: {
                    _id: "mockuserid123",
                    name: "John Doe",
                    email: "john@example.com",
                },
                accessToken: expect.any(String),
            });
            expect(res.headers["set-cookie"]).toBeDefined();
            expect(mockComparePassword).toHaveBeenCalledWith("password123");
        });

        it("should fail to login if user is not found", async () => {
            MockedUser.findOne.mockResolvedValue(null);

            const res = await request(app)
                .post("/api/auth/login")
                .send({
                    email: "nonexistent@example.com",
                    password: "password123",
                });

            expect(res.status).toBe(401);
            expect(res.body.message).toContain("Invalid credentials");
        });

        it("should fail to login if password compare returns false", async () => {
            const mockComparePassword = jest.fn().mockResolvedValue(false);
            const mockUserInstance = {
                _id: "mockuserid123",
                name: "John Doe",
                email: "john@example.com",
                comparePassword: mockComparePassword,
            };
            MockedUser.findOne.mockResolvedValue(mockUserInstance as any);

            const res = await request(app)
                .post("/api/auth/login")
                .send({
                    email: "john@example.com",
                    password: "wrongpassword",
                });

            expect(res.status).toBe(401);
            expect(res.body.message).toContain("Invalid credentials");
        });
    });

    describe("POST /api/auth/logout", () => {
        it("should logout successfully and clear cookie", async () => {
            MockedRefreshToken.findOneAndDelete.mockResolvedValue({} as any);

            const res = await request(app)
                .post("/api/auth/logout")
                .set("Cookie", ["refreshToken=mockedrefreshcookie123"])
                .send();

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.headers["set-cookie"][0]).toContain("refreshToken=;");
        });
    });

    describe("POST /api/auth/refresh", () => {
        it("should fail to refresh if no cookie is provided", async () => {
            const res = await request(app)
                .post("/api/auth/refresh")
                .send();

            expect(res.status).toBe(401);
            expect(res.body.message).toContain("No refresh token provided");
        });

        it("should refresh access token successfully when valid refresh token is sent", async () => {
            const mockTokenDoc = {
                _id: "tokendoc123",
                userId: "mockuserid123",
                familyId: "family123",
                expiresAt: new Date(Date.now() + 1000 * 60 * 60), // valid future date
                isRevoked: false,
            };
            MockedRefreshToken.findOneAndUpdate.mockResolvedValue(mockTokenDoc as any);
            MockedRefreshToken.create.mockResolvedValue({} as any);

            const res = await request(app)
                .post("/api/auth/refresh")
                .set("Cookie", ["refreshToken=mockedtoken123"])
                .send();

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.accessToken).toBeDefined();
            expect(res.headers["set-cookie"]).toBeDefined();
        });

        it("should detect reuse and revoke entire family if refresh token is already revoked", async () => {
            MockedRefreshToken.findOneAndUpdate.mockResolvedValue(null);
            const mockRevokedToken = {
                userId: "mockuserid123",
                familyId: "family123",
                isRevoked: true,
            };
            MockedRefreshToken.findOne.mockResolvedValue(mockRevokedToken as any);
            MockedRefreshToken.updateMany.mockResolvedValue({} as any);

            const res = await request(app)
                .post("/api/auth/refresh")
                .set("Cookie", ["refreshToken=mockedtoken123"])
                .send();

            expect(res.status).toBe(401);
            expect(res.body.message).toContain("Compromised token detected");
            expect(MockedRefreshToken.updateMany).toHaveBeenCalledWith(
                { familyId: "family123" },
                { $set: { isRevoked: true } }
            );
        });
    });
});
