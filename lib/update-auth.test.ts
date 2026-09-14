import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { readAuthorizedJson } from "./update-auth";

const previousUpdateSecret = process.env.UPDATE_SECRET;
const previousAdminPassword = process.env.ADMIN_PASSWORD;

before(() => {
  process.env.UPDATE_SECRET = "live-update-secret";
  process.env.ADMIN_PASSWORD = "admin-password-should-not-work";
});

after(() => {
  if (previousUpdateSecret === undefined) delete process.env.UPDATE_SECRET;
  else process.env.UPDATE_SECRET = previousUpdateSecret;
  if (previousAdminPassword === undefined) delete process.env.ADMIN_PASSWORD;
  else process.env.ADMIN_PASSWORD = previousAdminPassword;
});

function jsonRequest(
  url: string,
  body: unknown,
  headers: HeadersInit = {},
): Request {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

describe("readAuthorizedJson", () => {
  test("accepts the X-Update-Secret header", async () => {
    const authorized = await readAuthorizedJson(
      jsonRequest(
        "http://localhost/update",
        { classroom: "12", student: "Jane Doe" },
        { "x-update-secret": "live-update-secret" },
      ),
      "empty",
    );
    assert.equal(authorized.ok, true);
  });

  test("accepts a Bearer token", async () => {
    const authorized = await readAuthorizedJson(
      jsonRequest(
        "http://localhost/update",
        { classroom: "12", student: "Jane Doe" },
        { authorization: "Bearer live-update-secret" },
      ),
      "empty",
    );
    assert.equal(authorized.ok, true);
  });

  test("accepts a secret in the JSON body", async () => {
    const authorized = await readAuthorizedJson(
      jsonRequest("http://localhost/update", {
        classroom: "12",
        student: "Jane Doe",
        secret: "live-update-secret",
      }),
      "empty",
    );
    assert.equal(authorized.ok, true);
  });

  test("rejects a secret in the query string", async () => {
    const authorized = await readAuthorizedJson(
      jsonRequest(
        "http://localhost/update?secret=live-update-secret",
        { classroom: "12", student: "Jane Doe" },
      ),
      "empty",
    );
    assert.equal(authorized.ok, false);
    if (!authorized.ok) assert.equal(authorized.response.status, 401);
  });

  test("does not accept ADMIN_PASSWORD in place of UPDATE_SECRET", async () => {
    const authorized = await readAuthorizedJson(
      jsonRequest(
        "http://localhost/update",
        { classroom: "12", student: "Jane Doe" },
        { "x-update-secret": "admin-password-should-not-work" },
      ),
      "empty",
    );
    assert.equal(authorized.ok, false);
    if (!authorized.ok) assert.equal(authorized.response.status, 401);
  });

  test("returns 503 when UPDATE_SECRET is unset", async () => {
    delete process.env.UPDATE_SECRET;
    const authorized = await readAuthorizedJson(
      jsonRequest(
        "http://localhost/update",
        { classroom: "12", student: "Jane Doe" },
        { "x-update-secret": "admin-password-should-not-work" },
      ),
      "empty",
    );
    process.env.UPDATE_SECRET = "live-update-secret";
    assert.equal(authorized.ok, false);
    if (!authorized.ok) assert.equal(authorized.response.status, 503);
  });
});
