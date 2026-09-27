import { formatLastUpdated, formatMoney, formatPercent } from "@/lib/format";
import { buildReport } from "@/lib/report";
import { readStore } from "@/lib/store";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminReportPage() {
  const report = buildReport(await readStore());
  const classroomCount = report.classrooms.length;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-strawberry">Report</p>
          <h1 className="font-display text-3xl text-chocolate">{report.pageTitle}</h1>
          <p className="mt-1 text-sm text-chocolate/70">
            Last updated {formatLastUpdated(report.lastUpdated)}
          </p>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <a
            href="/api/admin/report/csv"
            className="rounded-full bg-mint-dark px-4 py-2 text-sm font-semibold text-white hover:bg-mint-dark/90"
          >
            Download CSV
          </a>
          <Link
            href="/admin"
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-chocolate ring-1 ring-cream-dark hover:bg-cream"
          >
            Back to admin
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        <section className="rounded-3xl bg-white p-6 shadow-md ring-1 ring-cream-dark">
          <h2 className="font-display text-xl text-chocolate">Totals</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            <Stat
              label="Raised"
              value={formatMoney(report.overallRaised)}
              detail={`${formatPercent(report.fundingPercent)} of the ${formatMoney(report.overallGoal)} goal`}
            />
            <Stat
              label="Scoops"
              value={String(report.scoops)}
              detail={`${formatPercent(report.scoopPercent)} of ${report.studentCount} students`}
            />
            <Stat
              label="Classrooms at goal"
              value={`${report.classroomsMetGoal} of ${classroomCount}`}
              detail={`Goal: ${report.classroomPercentTarget}% of families`}
            />
          </dl>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-md ring-1 ring-cream-dark">
          <h2 className="font-display text-xl text-chocolate">By classroom</h2>
          <p className="mt-1 text-sm text-chocolate/70">
            Each scoop is one family donation. Dollars are only tracked for the
            whole school.
          </p>
          {classroomCount === 0 ? (
            <p className="mt-4 rounded-xl bg-cream px-3 py-2 text-sm text-chocolate/80">
              No classrooms yet. Upload a classroom roster on the admin page.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm text-chocolate">
                <thead className="border-b-2 border-cream-dark text-xs uppercase tracking-wide text-chocolate/60">
                  <tr>
                    <th scope="col" className="py-2 pr-3 font-semibold">Room</th>
                    <th scope="col" className="py-2 pr-3 font-semibold">Teacher</th>
                    <th scope="col" className="py-2 pr-3 text-right font-semibold">Students</th>
                    <th scope="col" className="py-2 pr-3 text-right font-semibold">Scoops</th>
                    <th scope="col" className="py-2 pr-3 text-right font-semibold">Percent</th>
                    <th scope="col" className="py-2 text-right font-semibold">Goal met</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-dark">
                  {report.classrooms.map((classroom) => (
                    <tr key={classroom.roomNumber}>
                      <td className="py-2 pr-3 font-semibold">{classroom.roomNumber}</td>
                      <td className="py-2 pr-3">{classroom.teacherName}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">
                        {classroom.studentCount}
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums">{classroom.scoops}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">
                        {formatPercent(classroom.percent)}
                      </td>
                      <td
                        className={`py-2 text-right font-semibold ${
                          classroom.metGoal ? "text-mint-dark" : "text-chocolate/45"
                        }`}
                      >
                        {classroom.metGoal ? "Yes" : "No"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-cream-dark font-bold">
                  <tr>
                    <th scope="row" colSpan={2} className="py-2 pr-3">
                      Total
                    </th>
                    <td className="py-2 pr-3 text-right tabular-nums">{report.studentCount}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{report.scoops}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">
                      {formatPercent(report.scoopPercent)}
                    </td>
                    <td className="py-2 text-right">
                      {report.classroomsMetGoal} of {classroomCount}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl bg-cream px-4 py-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-strawberry">{label}</dt>
      <dd className="mt-1 text-2xl font-bold text-chocolate">{value}</dd>
      <dd className="text-sm text-chocolate/65">{detail}</dd>
    </div>
  );
}
