import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { applyDonationCsv } from "@/lib/csv";
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
    let uniqueFamilies = 0;
    let duplicatesSkipped = 0;
    let amountsApplied = false;
    let warnings: string[] = [];

    await updateStore((current) => {
      const { store, result } = applyDonationCsv(current, csvText);
      overallRaised = result.overallRaised;
      uniqueFamilies = result.uniqueFamilies;
      duplicatesSkipped = result.duplicatesSkipped;
      amountsApplied = result.amountsApplied;
      warnings = result.warnings;
      return store;
    });

    revalidatePath("/");
    revalidatePath("/admin");
    const duplicateNote =
      duplicatesSkipped > 0
        ? ` Counted extra dollar amounts from ${duplicatesSkipped} repeat ${duplicatesSkipped === 1 ? "gift" : "gifts"} by the same family in the same classroom, without extra scoops.`
        : "";
    const tallyNote = amountsApplied
      ? `Tallied ${formatMoney(overallRaised)} from ${uniqueFamilies} family donations.`
      : `Updated scoops from ${uniqueFamilies} family donations. No dollar amounts were in the file, so the fundraising total was left unchanged.`;
    return NextResponse.json({
      ok: true,
      message: `${tallyNote}${duplicateNote} Individual amounts and names were discarded.`,
      warnings,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not parse donations CSV.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
