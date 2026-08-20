"use client";

import { useMemo, useState } from "react";
import { formatPercent } from "@/lib/format";
import { compareRoomNumber, scoopPercent } from "@/lib/tallies";
import type { Classroom } from "@/lib/types";
import { GoalCelebration } from "./goal-celebration";
import { IceCreamMark, StarMark } from "./icons";

type SortMode = "room" | "percent";

export function ClassroomBoard({
  classrooms,
  percentTarget,
}: {
  classrooms: Classroom[];
  percentTarget: number;
}) {
  const [sort, setSort] = useState<SortMode>("room");

  const sorted = useMemo(() => {
    const copy = [...classrooms];
    if (sort === "percent") {
      copy.sort((a, b) => {
        const delta = scoopPercent(b) - scoopPercent(a);
        if (delta !== 0) return delta;
        return compareRoomNumber(a.roomNumber, b.roomNumber);
      });
    } else {
      copy.sort((a, b) => compareRoomNumber(a.roomNumber, b.roomNumber));
    }
    return copy;
  }, [classrooms, sort]);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl text-chocolate">
            Classroom scoop challenge
          </h2>
          <p className="mt-1 text-sm text-chocolate/70">
            Each scoop is one student family donation. Goal: {percentTarget}% of
            families in the class.
          </p>
        </div>
        <div className="inline-flex rounded-full bg-white p-1 shadow-sm ring-1 ring-cream-dark">
          <SortButton
            active={sort === "room"}
            onClick={() => setSort("room")}
          >
            Classroom number
          </SortButton>
          <SortButton
            active={sort === "percent"}
            onClick={() => setSort("percent")}
          >
            Highest percent
          </SortButton>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sorted.map((classroom) => (
          <ClassroomCard
            key={classroom.roomNumber}
            classroom={classroom}
            percentTarget={percentTarget}
          />
        ))}
      </div>
    </section>
  );
}

function SortButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        active
          ? "bg-chocolate text-cream shadow"
          : "text-chocolate/70 hover:text-chocolate"
      }`}
    >
      {children}
    </button>
  );
}

function ClassroomCard({
  classroom,
  percentTarget,
}: {
  classroom: Classroom;
  percentTarget: number;
}) {
  const percent = scoopPercent(classroom);
  const metGoal = percent + 1e-9 >= percentTarget;
  const fill = Math.min(100, percent);

  return (
    <article
      className={`relative overflow-hidden rounded-2xl bg-white p-5 shadow-md shadow-chocolate/8 ring-1 ${
        metGoal
          ? "bg-gradient-to-br from-white via-cream to-mint/15 ring-2 ring-mint"
          : "ring-cream-dark"
      }`}
    >
      {metGoal ? <GoalCelebration seed={classroom.roomNumber} /> : null}
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-strawberry">
            Room {classroom.roomNumber}
          </p>
          <h3 className="font-display mt-1 text-xl text-chocolate">
            {classroom.teacherName}
          </h3>
        </div>
        {metGoal ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-mint/25 px-2.5 py-1 text-xs font-bold text-mint-dark shadow-sm">
            <StarMark className="h-3.5 w-3.5" />
            Goal met
            <IceCreamMark className="h-4 w-4" />
          </span>
        ) : null}
      </div>
      <p className="relative z-10 mt-4 text-2xl font-bold text-chocolate">
        {classroom.scoops}
        <span className="text-base font-semibold text-chocolate/55">
          {" "}
          / {classroom.studentCount}
        </span>
      </p>
      <p className="relative z-10 text-sm text-chocolate/65">
        family donations · {formatPercent(percent)}
      </p>
      <div
        className="relative z-10 mt-4 h-3 overflow-hidden rounded-full bg-cream-dark"
        role="meter"
        aria-label={`Room ${classroom.roomNumber} scoop progress`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
      >
        <div
          className={`h-full rounded-full ${
            metGoal
              ? "bg-gradient-to-r from-mint to-mint-dark"
              : "bg-gradient-to-r from-cone to-strawberry"
          }`}
          style={{ width: `${fill}%` }}
        />
      </div>
    </article>
  );
}
