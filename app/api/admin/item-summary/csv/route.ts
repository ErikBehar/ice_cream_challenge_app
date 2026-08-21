import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { applyItemSummaryCsv } from "@/lib/csv";
import { formatMoney } from "@/lib/format";
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
    let overallRaised = 0;
    let itemsCounted = 0;
    let warnings: string[] = [];

    await updateStore((current) => {
      const { store, result } = applyItemSummaryCsv(current, csvText);
      overallRaised = result.overallRaised;
      itemsCounted = result.itemsCounted;
      warnings = result.warnings;
      return store;
    });

    revalidatePath("/");
    revalidatePath("/admin");
    return NextResponse.json({
      ok: true,
      message: `Updated the school total to ${formatMoney(overallRaised)} from ${itemsCounted} item ${itemsCounted === 1 ? "row" : "rows"}. Line items were not saved.`,
      warnings,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not parse item summary CSV.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
