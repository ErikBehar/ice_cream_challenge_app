import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { applyClassroomCsv } from "@/lib/csv";
import { requireAdminApi } from "@/lib/session";
import { updateStore } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Upload a CSV file." }, { status: 400 });
  }

  const csvText = await file.text();
  try {
    let resultCount = 0;
    let warnings: string[] = [];
    await updateStore((current) => {
      const { store, result } = applyClassroomCsv(current, csvText);
      resultCount = result.classrooms;
      warnings = result.warnings;
      return store;
    });

    revalidatePath("/");
    revalidatePath("/admin");
    return NextResponse.json({
      ok: true,
      message: `Roster updated for ${resultCount} classrooms. Student names were not saved.`,
      warnings,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not parse classroom CSV.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
