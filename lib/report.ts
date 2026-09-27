import { formatLastUpdated, formatMoney, formatPercent } from "./format";
import {
  compareRoomNumber,
  fundingPercent,
  isClassroomGoalMet,
  scoopPercent,
} from "./tallies";
import type { Classroom, Store } from "./types";

export type ReportClassroom = Classroom & {
  percent: number;
  metGoal: boolean;
};

export type Report = {
  pageTitle: string;
  lastUpdated: string;
  overallRaised: number;
  overallGoal: number;
  fundingPercent: number;
  classroomPercentTarget: number;
  classrooms: ReportClassroom[];
  studentCount: number;
  scoops: number;
  scoopPercent: number;
  classroomsMetGoal: number;
};

export function buildReport(store: Store): Report {
  const classrooms = [...store.classrooms]
    .sort((a, b) => compareRoomNumber(a.roomNumber, b.roomNumber))
    .map((classroom) => ({
      ...classroom,
      percent: scoopPercent(classroom),
      metGoal: isClassroomGoalMet(classroom, store.classroomPercentTarget),
    }));
  const studentCount = classrooms.reduce((sum, row) => sum + row.studentCount, 0);
  const scoops = classrooms.reduce((sum, row) => sum + row.scoops, 0);

  return {
    pageTitle: store.pageTitle,
    lastUpdated: store.lastUpdated,
    overallRaised: store.overallRaised,
    overallGoal: store.overallGoal,
    fundingPercent: fundingPercent(store.overallRaised, store.overallGoal),
    classroomPercentTarget: store.classroomPercentTarget,
    classrooms,
    studentCount,
    scoops,
    scoopPercent: scoopPercent({ scoops, studentCount }),
    classroomsMetGoal: classrooms.filter((row) => row.metGoal).length,
  };
}

function csvCell(value: string | number): string {
  if (typeof value === "number") return String(value);
  // Spreadsheet apps run cells that start with these characters as formulas.
  const text = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function reportToCsv(report: Report): string {
  const rows: (string | number)[][] = [
    [report.pageTitle],
    ["Last updated", formatLastUpdated(report.lastUpdated)],
    ["Raised", formatMoney(report.overallRaised)],
    ["Goal", formatMoney(report.overallGoal)],
    ["Percent of goal", formatPercent(report.fundingPercent)],
    ["Classroom goal", `${report.classroomPercentTarget}%`],
    [],
    ["Room", "Teacher", "Students", "Scoops", "Percent", "Goal met"],
    ...report.classrooms.map((classroom) => [
      classroom.roomNumber,
      classroom.teacherName,
      classroom.studentCount,
      classroom.scoops,
      formatPercent(classroom.percent),
      classroom.metGoal ? "Yes" : "No",
    ]),
    [
      "Total",
      "",
      report.studentCount,
      report.scoops,
      formatPercent(report.scoopPercent),
      `${report.classroomsMetGoal} of ${report.classrooms.length}`,
    ],
  ];
  return `${rows.map((cells) => cells.map(csvCell).join(",")).join("\r\n")}\r\n`;
}
