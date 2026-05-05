import { signToken, verifyToken } from "../../src/utils/jwt.util";

describe("jwt utils", () => {
  const payload = { sub: "user-123", email: "a@b.com", role: "user" as const };

  it("signs a token and verifies it round-trip", () => {
    const token = signToken(payload);
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);
    expect(verifyToken(token)).toEqual(payload);
  });

  it("rejects a tampered token", () => {
    const token = signToken(payload);
    const bad = token.slice(0, -2) + "xx";
    expect(() => verifyToken(bad)).toThrow();
  });

  it("rejects a token signed with a different secret", () => {
    const jwt = require("jsonwebtoken");
    const foreignToken = jwt.sign(payload, "totally-different-secret-string", { expiresIn: "1h" });
    expect(() => verifyToken(foreignToken)).toThrow();
  });

  it("rejects an expired token", () => {
    const jwt = require("jsonwebtoken");
    const expired = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "-1s" });
    expect(() => verifyToken(expired)).toThrow();
  });

  it("preserves admin role", () => {
    const adminToken = signToken({ ...payload, role: "admin" });
    expect(verifyToken(adminToken).role).toBe("admin");
  });
});
