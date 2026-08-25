import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { applyDonationJson } from "@/lib/csv";
import { updateStore } from "@/lib/store";
import {
  providedUpdateSecret,
  updateSecret,
  verifyUpdateSecret,
} from "@/lib/update-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    message:
      "POST a CheddarUp purchase JSON body to this URL to add classroom scoops.",
  });
}

export async function POST(request: Request) {
  if (!updateSecret()) {
    return NextResponse.json(
      {
        error:
          "Live updates are not configured. Set UPDATE_SECRET (or ADMIN_PASSWORD) on the server.",
      },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null);
  if (body == null) {
    return NextResponse.json(
      { error: "Send a JSON purchase row, similar to the donations CSV." },
      { status: 400 },
    );
  }

  if (!verifyUpdateSecret(providedUpdateSecret(request, body))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let uniqueFamilies = 0;
    let duplicatesSkipped = 0;
    let warnings: string[] = [];

    await updateStore((current) => {
      const { store, result } = applyDonationJson(current, body);
      uniqueFamilies = result.uniqueFamilies;
      duplicatesSkipped = result.duplicatesSkipped;
      warnings = result.warnings;
      return store;
    });

    if (uniqueFamilies === 0 && duplicatesSkipped === 0) {
      return NextResponse.json(
        {
          error:
            warnings[0] ||
            "Could not match this purchase to a classroom on the roster.",
          warnings,
        },
        { status: 400 },
      );
    }

    revalidatePath("/");
    revalidatePath("/admin");

    const addedNote =
      uniqueFamilies === 1
        ? "Added 1 family donation scoop."
        : uniqueFamilies > 1
          ? `Added ${uniqueFamilies} family donation scoops.`
          : "";
    const duplicateNote =
      duplicatesSkipped === 0
        ? ""
        : uniqueFamilies === 0
          ? "Already counted this family donation for that classroom."
          : ` Skipped ${duplicatesSkipped} repeat ${duplicatesSkipped === 1 ? "gift" : "gifts"} by the same family in the same classroom.`;

    return NextResponse.json({
      ok: true,
      message: `${addedNote}${duplicateNote} Individual names were discarded.`.trim(),
      warnings,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not apply this purchase.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
