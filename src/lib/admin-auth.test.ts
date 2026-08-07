// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

const { cookieStore } = vi.hoisted(() => ({
  cookieStore: { get: vi.fn(), set: vi.fn(), delete: vi.fn() },
}));

vi.mock("next/headers", () => ({ cookies: vi.fn(async () => cookieStore) }));

import { isAdminConfigured, isSignedIn, tokenForPassword } from "./admin-auth";

afterEach(() => {
  delete process.env.ADMIN_PASSWORD;
  vi.clearAllMocks();
});

describe("admin auth", () => {
  it("reports itself unconfigured with no password set", () => {
    expect(isAdminConfigured()).toBe(false);
  });

  it("fails closed: nobody is signed in when no password is configured", async () => {
    cookieStore.get.mockReturnValue({ value: "anything" });
    await expect(isSignedIn()).resolves.toBe(false);
  });

  it("refuses to mint a token when no password is configured", () => {
    expect(tokenForPassword("hunter2")).toBeNull();
  });

  it("issues a token for the right password and rejects the wrong one", () => {
    process.env.ADMIN_PASSWORD = "correct horse";
    expect(tokenForPassword("correct horse")).toMatch(/^[a-f0-9]{64}$/);
    expect(tokenForPassword("wrong horse")).toBeNull();
    expect(tokenForPassword("")).toBeNull();
  });

  it("never puts the password itself in the cookie", () => {
    process.env.ADMIN_PASSWORD = "correct horse";
    expect(tokenForPassword("correct horse")).not.toContain("correct");
  });

  it("accepts a cookie holding a valid token", async () => {
    process.env.ADMIN_PASSWORD = "correct horse";
    cookieStore.get.mockReturnValue({ value: tokenForPassword("correct horse")! });
    await expect(isSignedIn()).resolves.toBe(true);
  });

  it("rejects a missing, forged or truncated cookie", async () => {
    process.env.ADMIN_PASSWORD = "correct horse";
    const valid = tokenForPassword("correct horse")!;

    cookieStore.get.mockReturnValue(undefined);
    await expect(isSignedIn()).resolves.toBe(false);

    cookieStore.get.mockReturnValue({ value: "f".repeat(64) });
    await expect(isSignedIn()).resolves.toBe(false);

    cookieStore.get.mockReturnValue({ value: valid.slice(0, 32) });
    await expect(isSignedIn()).resolves.toBe(false);
  });

  it("invalidates existing cookies when the password changes", async () => {
    process.env.ADMIN_PASSWORD = "old password";
    const oldToken = tokenForPassword("old password")!;

    process.env.ADMIN_PASSWORD = "new password";
    cookieStore.get.mockReturnValue({ value: oldToken });
    await expect(isSignedIn()).resolves.toBe(false);
  });
});
