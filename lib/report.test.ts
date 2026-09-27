import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { formatLastUpdated } from "./format";
import { buildReport, reportToCsv } from "./report";
import { createEmptyStore } from "./tallies";
import type { Store } from "./types";

function sampleStore(): Store {
  return {
    ...createEmptyStore(),
    pageTitle: "Ice Cream Challenge",
    lastUpdated: "2026-08-24T22:49:12.104Z",
    overallGoal: 10000,
    overallRaised: 12500,
    classroomPercentTarget: 80,
    classrooms: [
      { roomNumber: "12", teacherName: "Ms. Okafor", studentCount: 20, scoops: 0 },
      { roomNumber: "2", teacherName: "Chen, Wei", studentCount: 20, scoops: 15 },
      { roomNumber: "10", teacherName: "Mx. Rivera", studentCount: 20, scoops: 16 },
      { roomNumber: "1", teacherName: "Ms. Patel", studentCount: 20, scoops: 21 },
    ],
  };
}

describe("buildReport", () => {
  test("lists classrooms by room number with percent and goal status", () => {
    const report = buildReport(sampleStore());
    assert.deepEqual(
      report.classrooms.map(({ roomNumber, percent, metGoal }) => ({
        roomNumber,
        percent,
        metGoal,
      })),
      [
        { roomNumber: "1", percent: 105, metGoal: true },
        { roomNumber: "2", percent: 75, metGoal: false },
        { roomNumber: "10", percent: 80, metGoal: true },
        { roomNumber: "12", percent: 0, metGoal: false },
      ],
    );
  });

  test("totals students, scoops, and classrooms at goal", () => {
    const report = buildReport(sampleStore());
    assert.equal(report.studentCount, 80);
    assert.equal(report.scoops, 52);
    assert.equal(report.scoopPercent, 65);
    assert.equal(report.classroomsMetGoal, 2);
    assert.equal(report.fundingPercent, 125);
  });

  test("an empty store reports zeros instead of NaN", () => {
    const report = buildReport(createEmptyStore());
    assert.equal(report.classrooms.length, 0);
    assert.equal(report.studentCount, 0);
    assert.equal(report.scoops, 0);
    assert.equal(report.scoopPercent, 0);
    assert.equal(report.fundingPercent, 0);
  });
});

describe("reportToCsv", () => {
  test("writes the school total, one row per classroom, and a total row", () => {
    const store = sampleStore();
    assert.deepEqual(reportToCsv(buildReport(store)).split("\r\n"), [
      "Ice Cream Challenge",
      `Last updated,"${formatLastUpdated(store.lastUpdated)}"`,
      'Raised,"$12,500"',
      'Goal,"$10,000"',
      "Percent of goal,125%",
      "Classroom goal,80%",
      "",
      "Room,Teacher,Students,Scoops,Percent,Goal met",
      "1,Ms. Patel,20,21,105%,Yes",
      '2,"Chen, Wei",20,15,75%,No',
      "10,Mx. Rivera,20,16,80%,Yes",
      "12,Ms. Okafor,20,0,0%,No",
      "Total,,80,52,65%,2 of 4",
      "",
    ]);
  });

  test("keeps a teacher name from running as a spreadsheet formula", () => {
    const store: Store = {
      ...sampleStore(),
      classrooms: [
        { roomNumber: "1", teacherName: '=HYPERLINK("x")', studentCount: 20, scoops: 5 },
      ],
    };
    const csv = reportToCsv(buildReport(store));
    assert.ok(csv.includes(`1,"'=HYPERLINK(""x"")",20,5,25%,No\r\n`));
  });
});
