import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { parseDonationUrl } from "@/lib/donation-url";
import { requireAdminApi } from "@/lib/session";
import { updateStore } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const body = (await request.json().catch(() => null)) as {
    overallGoal?: unknown;
    classroomPercentTarget?: unknown;
    donationUrl?: unknown;
  } | null;

  const overallGoal = Number(body?.overallGoal);
  const classroomPercentTarget = Number(body?.classroomPercentTarget);
  const donationUrl = parseDonationUrl(body?.donationUrl);

  if (!Number.isFinite(overallGoal) || overallGoal < 0) {
    return NextResponse.json(
      { error: "Overall goal must be a number that is 0 or greater." },
      { status: 400 },
    );
  }
  if (
    !Number.isFinite(classroomPercentTarget) ||
    classroomPercentTarget < 0 ||
    classroomPercentTarget > 100
  ) {
    return NextResponse.json(
      { error: "Classroom percent target must be between 0 and 100." },
      { status: 400 },
    );
  }
  if (donationUrl === null) {
    return NextResponse.json(
      { error: "Donation site must be a valid http or https link." },
      { status: 400 },
    );
  }

  const store = await updateStore((current) => ({
    ...current,
    overallGoal,
    classroomPercentTarget,
    donationUrl,
  }));

  revalidatePath("/");
  revalidatePath("/admin");
  return NextResponse.json({ ok: true, store });
}
