import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/session";
import { updateStore } from "@/lib/store";
import { zeroOverallRaised } from "@/lib/tallies";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  await updateStore((current) => zeroOverallRaised(current));

  revalidatePath("/");
  revalidatePath("/admin");
  return NextResponse.json({
    ok: true,
    message: "School total set to zero. Classroom scoops were left unchanged.",
  });
}
