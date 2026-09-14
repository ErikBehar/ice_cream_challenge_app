import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createRateLimiter, requestClientKey } from "./rate-limit";

describe("createRateLimiter", () => {
  test("blocks after the max failed attempts in the window", () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 2 });
    const now = 1_000_000;
    limiter.recordFailure("ip", now);
    limiter.recordFailure("ip", now);
    assert.equal(limiter.isBlocked("ip", now).blocked, true);
    assert.equal(limiter.isBlocked("ip", now).retryAfterSec, 60);
  });

  test("clears after a successful reset or window expiry", () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 1 });
    const now = 1_000_000;
    limiter.recordFailure("ip", now);
    assert.equal(limiter.isBlocked("ip", now).blocked, true);
    limiter.reset("ip");
    assert.equal(limiter.isBlocked("ip", now).blocked, false);

    limiter.recordFailure("ip", now);
    assert.equal(limiter.isBlocked("ip", now + 60_000).blocked, false);
  });
});

describe("requestClientKey", () => {
  test("uses the first x-forwarded-for address", () => {
    const request = new Request("http://localhost/login", {
      headers: { "x-forwarded-for": "203.0.113.10, 10.0.0.1" },
    });
    assert.equal(requestClientKey(request), "203.0.113.10");
  });
});
