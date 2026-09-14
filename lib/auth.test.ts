import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import {
  createSessionToken,
  isValidSessionToken,
  SESSION_MAX_AGE_SEC,
  verifyPassword,
} from "./auth";

const previousPassword = process.env.ADMIN_PASSWORD;
const previousSecret = process.env.SESSION_SECRET;

before(() => {
  process.env.ADMIN_PASSWORD = "test-admin-password";
  process.env.SESSION_SECRET = "test-session-secret-value";
});

after(() => {
  if (previousPassword === undefined) delete process.env.ADMIN_PASSWORD;
  else process.env.ADMIN_PASSWORD = previousPassword;
  if (previousSecret === undefined) delete process.env.SESSION_SECRET;
  else process.env.SESSION_SECRET = previousSecret;
});

describe("createSessionToken", () => {
  test("issues unique expiring tokens", async () => {
    const first = await createSessionToken();
    const second = await createSessionToken();
    assert.notEqual(first, second);
    assert.match(first, /^\d+\.[0-9a-f]{32}\.[0-9a-f]{64}$/);
    assert.equal(await isValidSessionToken(first), true);
    assert.equal(await isValidSessionToken(second), true);
  });

  test("rejects expired tokens", async () => {
    const issuedAt = Date.now() - (SESSION_MAX_AGE_SEC + 60) * 1000;
    const token = await createSessionToken(issuedAt);
    assert.equal(await isValidSessionToken(token), false);
  });

  test("rejects a static leftover HMAC cookie", async () => {
    assert.equal(await isValidSessionToken("a".repeat(64)), false);
  });

  test("changing the password invalidates existing tokens", async () => {
    const token = await createSessionToken();
    process.env.ADMIN_PASSWORD = "rotated-password";
    assert.equal(await isValidSessionToken(token), false);
    process.env.ADMIN_PASSWORD = "test-admin-password";
  });
});

describe("verifyPassword", () => {
  test("accepts the configured password", async () => {
    assert.equal(await verifyPassword("test-admin-password"), true);
    assert.equal(await verifyPassword("wrong-password"), false);
  });
});
