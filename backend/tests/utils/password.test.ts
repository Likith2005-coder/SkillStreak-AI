import { hashPassword, verifyPassword } from "../../src/utils/password.util";

describe("password utils", () => {
  it("hashes a password and verifies it round-trip", async () => {
    const plain = "correct horse battery staple";
    const hash = await hashPassword(plain);
    expect(hash).not.toEqual(plain);
    expect(hash.length).toBeGreaterThan(20);
    await expect(verifyPassword(plain, hash)).resolves.toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("supersecret");
    await expect(verifyPassword("wrong", hash)).resolves.toBe(false);
  });

  it("uses a bcrypt-format hash (cost embedded in prefix)", async () => {
    const hash = await hashPassword("anything");
    expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/);
  });

  it("produces different hashes for the same input (random salt)", async () => {
    const a = await hashPassword("samepass");
    const b = await hashPassword("samepass");
    expect(a).not.toEqual(b);
  });
});
