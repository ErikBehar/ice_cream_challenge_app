export const ADMIN_COOKIE = "admin_session";
export const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;

const SESSION_PAYLOAD = "escondido-pta-admin";
const TOKEN_PATTERN = /^(\d+)\.([0-9a-f]{32})\.([0-9a-f]{64})$/;

async function hmacHex(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  const a = new TextEncoder().encode(left);
  const b = new TextEncoder().encode(right);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

function randomHex(bytes: number): string {
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);
  return Array.from(buffer)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function sessionSecret(): string {
  return process.env.SESSION_SECRET ?? "";
}

function adminPassword(): string {
  return process.env.ADMIN_PASSWORD ?? "";
}

export function authConfigured(): boolean {
  return Boolean(adminPassword() && sessionSecret());
}

export async function createSessionToken(now = Date.now()): Promise<string> {
  const password = adminPassword();
  const secret = sessionSecret();
  if (!password || !secret) {
    throw new Error("ADMIN_PASSWORD and SESSION_SECRET must be set");
  }
  const exp = Math.floor(now / 1000) + SESSION_MAX_AGE_SEC;
  const nonce = randomHex(16);
  const signature = await hmacHex(
    `${SESSION_PAYLOAD}:${exp}:${nonce}:${password}`,
    secret,
  );
  return `${exp}.${nonce}.${signature}`;
}

export async function isValidSessionToken(
  token: string | undefined,
  now = Date.now(),
): Promise<boolean> {
  if (!token) return false;
  const match = TOKEN_PATTERN.exec(token);
  if (!match) return false;

  const exp = Number(match[1]);
  const nonce = match[2];
  const signature = match[3];
  if (!Number.isFinite(exp) || exp * 1000 <= now) return false;

  const password = adminPassword();
  const secret = sessionSecret();
  if (!password || !secret) return false;

  try {
    const expected = await hmacHex(
      `${SESSION_PAYLOAD}:${exp}:${nonce}:${password}`,
      secret,
    );
    return timingSafeEqual(signature, expected);
  } catch {
    return false;
  }
}

export async function verifyPassword(password: string): Promise<boolean> {
  const expected = adminPassword();
  const secret = sessionSecret();
  if (!expected || !secret) return false;
  const left = await hmacHex(password, secret);
  const right = await hmacHex(expected, secret);
  return timingSafeEqual(left, right);
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  };
}
