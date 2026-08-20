import { formatMoney, formatPercent } from "@/lib/format";
import {
  amountOverGoal,
  fundingPercent,
  isFundingGoalMet,
  meterFillPercent,
} from "@/lib/tallies";
import { GoalCelebration } from "./goal-celebration";
import { IceCreamMark, StarMark } from "./icons";

export function CampaignCard({
  overallGoal,
  overallRaised,
}: {
  overallGoal: number;
  overallRaised: number;
}) {
  const percent = fundingPercent(overallRaised, overallGoal);
  const fill = meterFillPercent(percent);
  const metGoal = isFundingGoalMet(overallRaised, overallGoal);
  const overBy = amountOverGoal(overallRaised, overallGoal);
  const exceeded = overBy > 0;

  return (
    <section
      className={`relative overflow-hidden rounded-3xl bg-white shadow-lg shadow-chocolate/10 ring-1 ${
        metGoal
          ? "bg-gradient-to-br from-white via-cream to-mint/20 ring-2 ring-mint"
          : "ring-cream-dark"
      }`}
    >
      {metGoal ? (
        <GoalCelebration
          seed="schoolwide"
          density="festive"
          className="rounded-3xl"
        />
      ) : null}
      <div
        className={`relative z-10 bg-gradient-to-r px-6 py-5 sm:px-8 ${
          metGoal
            ? "from-mint/35 via-cream to-strawberry/25"
            : "from-cone/40 via-cream to-mint/30"
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-strawberry-dark">
              School-wide sundae
            </p>
            <h2 className="font-display mt-1 text-2xl text-chocolate sm:text-3xl">
              Fundraising goal
            </h2>
          </div>
          {metGoal ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-mint/30 px-3 py-1.5 text-sm font-bold text-mint-dark shadow-sm">
              <StarMark className="h-4 w-4" />
              {exceeded ? "Goal exceeded" : "Goal met"}
              <IceCreamMark className="h-5 w-5" />
            </span>
          ) : null}
        </div>
      </div>
      <div className="relative z-10 space-y-5 px-6 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <p className="text-4xl font-bold tracking-tight text-chocolate sm:text-5xl">
            {formatMoney(overallRaised)}
          </p>
          <p className="text-lg text-chocolate/70">
            of {formatMoney(overallGoal)} · {formatPercent(percent)}
          </p>
        </div>
        <div
          className="relative h-10 overflow-hidden rounded-full bg-cream-dark ring-1 ring-cone/50"
          role="meter"
          aria-label="Fundraising progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(fill)}
          aria-valuetext={`${formatMoney(overallRaised)} of ${formatMoney(overallGoal)} (${formatPercent(percent)})`}
        >
          <div
            className={`h-full rounded-full shadow-inner transition-[width] duration-700 ${
              exceeded
                ? "bg-gradient-to-r from-mint via-strawberry to-[#F4D35E]"
                : "bg-gradient-to-r from-mint via-[#f4b8c4] to-strawberry"
            }`}
            style={{ width: `${fill}%` }}
          />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_40%,rgba(255,255,255,0.45),transparent_45%)]" />
        </div>
        <p className="text-sm text-chocolate/65">
          {exceeded
            ? `The sundae overflowed — ${formatMoney(overBy)} past the goal. Extra scoops welcome!`
            : metGoal
              ? "The school sundae is full. Every extra family donation still counts."
              : "Every family donation helps fill the school sundae. Classroom scoop challenges are tracked on the cards below."}
        </p>
      </div>
    </section>
  );
}
