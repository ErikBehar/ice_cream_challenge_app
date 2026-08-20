import { DEFAULT_PAGE_TITLE } from "./page-title";
import type { Classroom, Store } from "./types";

export const DEFAULT_STORE: Store = {
  lastUpdated: "2026-08-20T18:41:00.000Z",
  pageTitle: DEFAULT_PAGE_TITLE,
  overallGoal: 15000,
  overallRaised: 8420,
  classroomPercentTarget: 80,
  donationUrl: "",
  classrooms: [
    { roomNumber: "1", teacherName: "Ms. Patel", studentCount: 22, scoops: 18 },
    { roomNumber: "2", teacherName: "Mr. Chen", studentCount: 24, scoops: 20 },
    { roomNumber: "3", teacherName: "Mrs. Alvarez", studentCount: 21, scoops: 12 },
    { roomNumber: "5", teacherName: "Ms. Brooks", studentCount: 23, scoops: 19 },
    { roomNumber: "8", teacherName: "Mr. Nguyen", studentCount: 25, scoops: 25 },
    { roomNumber: "12", teacherName: "Ms. Okafor", studentCount: 22, scoops: 9 },
    { roomNumber: "14", teacherName: "Mrs. Garcia", studentCount: 20, scoops: 16 },
    { roomNumber: "18", teacherName: "Mr. Klein", studentCount: 24, scoops: 11 },
  ],
};

export function createEmptyStore(): Store {
  return {
    lastUpdated: new Date().toISOString(),
    pageTitle: DEFAULT_PAGE_TITLE,
    overallGoal: 15000,
    overallRaised: 0,
    classroomPercentTarget: 80,
    donationUrl: "",
    classrooms: [],
  };
}

export function scoopPercent(classroom: Classroom): number {
  if (classroom.studentCount <= 0) return 0;
  return (classroom.scoops / classroom.studentCount) * 100;
}

export function compareRoomNumber(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

/** Uncapped share of the dollar goal. Can be over 100% when donations exceed the target. */
export function fundingPercent(raised: number, goal: number): number {
  if (!Number.isFinite(raised) || raised <= 0) return 0;
  if (goal <= 0) return 100;
  return (raised / goal) * 100;
}

export function meterFillPercent(percent: number): number {
  return clampPercent(percent);
}

export function isFundingGoalMet(raised: number, goal: number): boolean {
  if (!Number.isFinite(raised) || raised <= 0) return false;
  if (goal <= 0) return true;
  return raised + 1e-9 >= goal;
}

export function amountOverGoal(raised: number, goal: number): number {
  if (!Number.isFinite(raised) || !Number.isFinite(goal) || goal < 0) return 0;
  return Math.max(0, raised - goal);
}

export function progressPercent(raised: number, goal: number): number {
  return meterFillPercent(fundingPercent(raised, goal));
}
