import { buildReport, reportToCsv } from "@/lib/report";
import { requireAdminApi } from "@/lib/session";
import { readStore } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const csv = reportToCsv(buildReport(await readStore()));
  // Leading byte-order mark so Excel opens the file as UTF-8.
  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="ice-cream-report.csv"',
      "Cache-Control": "no-store",
    },
  });
}
