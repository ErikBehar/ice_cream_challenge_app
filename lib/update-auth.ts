import { createHash } from "node:crypto";

export function updateSecret(): string {
  return process.env.UPDATE_SECRET || process.env.ADMIN_PASSWORD || "";
}

function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function timingSafeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export function verifyUpdateSecret(provided: string): boolean {
  const expected = updateSecret();
  if (!expected || !provided) return false;
  return timingSafeEqual(sha256Hex(provided), sha256Hex(expected));
}

export function providedUpdateSecret(request: Request, body: unknown): string {
  const header =
    request.headers.get("x-update-secret")?.trim() ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ||
    "";
  if (header) return header;

  const url = new URL(request.url);
  const query = (url.searchParams.get("secret") || url.searchParams.get("key") || "").trim();
  if (query) return query;

  if (body && typeof body === "object" && !Array.isArray(body)) {
    const record = body as Record<string, unknown>;
    for (const key of ["secret", "update_secret", "updateSecret"]) {
      const value = record[key];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
  }
  return "";
}
