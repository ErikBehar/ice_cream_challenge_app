import { CampaignCard } from "@/components/campaign-card";
import { ClassroomBoard } from "@/components/classroom-board";
import { SiteHeader } from "@/components/site-header";
import { ThankYouBanner } from "@/components/thank-you-banner";
import { isFundingGoalMet } from "@/lib/tallies";
import { readStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const store = await readStore();
  const schoolGoalMet = isFundingGoalMet(store.overallRaised, store.overallGoal);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SiteHeader lastUpdated={store.lastUpdated} donationUrl={store.donationUrl} />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
        {schoolGoalMet ? <ThankYouBanner /> : null}
        <CampaignCard
          overallGoal={store.overallGoal}
          overallRaised={store.overallRaised}
        />
        <ClassroomBoard
          classrooms={store.classrooms}
          percentTarget={store.classroomPercentTarget}
        />
      </main>
    </div>
  );
}
