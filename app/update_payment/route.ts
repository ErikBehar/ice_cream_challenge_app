import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { applyPaymentJson } from "@/lib/csv";
import { formatMoney } from "@/lib/format";
import { updateStore } from "@/lib/store";
import { readAuthorizedJson } from "@/lib/update-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    message:
      'POST a JSON body with a "total" field to this URL to add to the school fundraising amount.',
  });
}

export async function POST(request: Request) {
  const authorized = await readAuthorizedJson(
    request,
    'Send JSON with a "total" field for the payment amount.',
  );
  if (!authorized.ok) return authorized.response;

  try {
    let overallRaised = 0;
    let amountAdded = 0;
    let duplicate = false;

    await updateStore((current) => {
      const { store, result } = applyPaymentJson(current, authorized.body);
      overallRaised = result.overallRaised;
      amountAdded = result.amountAdded;
      duplicate = result.duplicate;
      return store;
    });

    revalidatePath("/");
    revalidatePath("/admin");

    if (duplicate) {
      return NextResponse.json({
        ok: true,
        message: "Already counted this payment toward the school total.",
        overallRaised,
      });
    }

    return NextResponse.json({
      ok: true,
      message: `Added ${formatMoney(amountAdded)} to the school total (${formatMoney(overallRaised)}).`,
      overallRaised,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not apply this payment.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
