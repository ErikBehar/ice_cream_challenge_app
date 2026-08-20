import { cookies } from "next/headers";
import { ADMIN_COOKIE, isValidSessionToken } from "./auth";

export async function isLoggedIn(): Promise<boolean> {
  const jar = await cookies();
  return isValidSessionToken(jar.get(ADMIN_COOKIE)?.value);
}

export async function requireAdminApi(): Promise<Response | null> {
  if (await isLoggedIn()) return null;
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
