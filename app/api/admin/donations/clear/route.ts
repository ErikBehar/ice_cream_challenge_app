import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/session";
import { updateStore } from "@/lib/store";
import { clearDonations } from "@/lib/tallies";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  await updateStore((current) => clearDonations(current));

  revalidatePath("/");
  revalidatePath("/admin");
  return NextResponse.json({
    ok: true,
    message: "Donations cleared. The school total and classroom scoops are now zero.",
  });
}
