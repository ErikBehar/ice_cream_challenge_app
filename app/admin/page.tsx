import { AdminSettingsForm } from "@/components/admin-settings-form";
import { ClearDonationsButton } from "@/components/clear-donations-button";
import { CsvUploadForm } from "@/components/csv-upload-form";
import { LogoutButton } from "@/components/logout-button";
import { ZeroTotalButton } from "@/components/zero-total-button";
import { formatLastUpdated } from "@/lib/format";
import { readStore } from "@/lib/store";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const store = await readStore();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-strawberry">Admin</p>
          <h1 className="font-display text-3xl text-chocolate">
            Ice Cream Challenge
          </h1>
          <p className="mt-1 text-sm text-chocolate/70">
            Last updated {formatLastUpdated(store.lastUpdated)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-chocolate ring-1 ring-cream-dark hover:bg-cream"
          >
            View board
          </Link>
          <LogoutButton />
        </div>
      </div>

      <div className="space-y-6">
        <section className="rounded-3xl bg-white p-6 shadow-md ring-1 ring-cream-dark">
          <h2 className="font-display text-xl text-chocolate">Campaign</h2>
          <p className="mt-1 mb-4 text-sm text-chocolate/70">
            These values update the public page as soon as you save.
          </p>
          <AdminSettingsForm
            pageTitle={store.pageTitle}
            overallGoal={store.overallGoal}
            classroomPercentTarget={store.classroomPercentTarget}
            donationUrl={store.donationUrl}
          />
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-md ring-1 ring-cream-dark">
          <h2 className="font-display text-xl text-chocolate">Classroom roster CSV</h2>
          <p className="mt-1 mb-3 text-sm text-chocolate/70">
            Replaces the classroom list. Keep classroom number, teacher name, and
            student count. An optional student list is counted, then discarded.
            Matching room numbers keep their current scoop tallies.
          </p>
          <p className="mb-4 rounded-xl bg-cream px-3 py-2 font-mono text-xs text-chocolate/80">
            classroom,teacher,students
            <br />
            12,Ms. Smith,24
          </p>
          <CsvUploadForm kind="classrooms" />
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-md ring-1 ring-cream-dark">
          <h2 className="font-display text-xl text-chocolate">Donations CSV</h2>
          <p className="mt-1 mb-3 text-sm text-chocolate/70">
            Accepts a simple donation list or last year’s PTA form export
            (Respondent, Student #1/#2/#3 names and classrooms). Classroom labels
            like “15 - Mtro. Gonzalez (3-SI)” match roster room 15. The same
            family in the same classroom is still one scoop. Dollar amounts in
            this file are ignored — use the item summary CSV below for the
            school-wide total. Row-level names are discarded after the tallies
            are saved.
          </p>
          <p className="mb-4 rounded-xl bg-cream px-3 py-2 font-mono text-xs text-chocolate/80">
            classroom,student
            <br />
            12,Jane Doe
            <br />
            <br />
            or Respondent + Student #1: Classroom, Student #1: First Name, …
          </p>
          <CsvUploadForm kind="donations" />
          <div className="mt-6 border-t border-cream-dark pt-5">
            <p className="mb-3 text-sm text-chocolate/70">
              Reset every classroom scoop to zero. The school fundraising total,
              roster, and campaign settings stay in place.
            </p>
            <ClearDonationsButton />
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-md ring-1 ring-cream-dark">
          <h2 className="font-display text-xl text-chocolate">Item summary CSV</h2>
          <p className="mt-1 mb-3 text-sm text-chocolate/70">
            Replaces the school-wide fundraising total with the sum of the
            Net Amount Sold column from a Square item summary export. Line items
            are not saved.
          </p>
          <p className="mb-4 rounded-xl bg-cream px-3 py-2 font-mono text-xs text-chocolate/80">
            Item Name,…,Net Amount Sold
            <br />
            Single Scoop,…,&quot;$47,600.00&quot;
          </p>
          <CsvUploadForm kind="item-summary" />
          <div className="mt-6 border-t border-cream-dark pt-5">
            <p className="mb-3 text-sm text-chocolate/70">
              Set the school-wide fundraising total to zero. Classroom scoops stay
              as they are.
            </p>
            <ZeroTotalButton />
          </div>
        </section>
      </div>
    </div>
  );
}
