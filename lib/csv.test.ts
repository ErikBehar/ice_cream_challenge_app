import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  applyClassroomCsv,
  applyDonationCsv,
  applyDonationJson,
  jsonBodyToRecords,
} from "./csv";
import { createEmptyStore } from "./tallies";
import type { Store } from "./types";

function rosterStore(): Store {
  const { store } = applyClassroomCsv(
    createEmptyStore(),
    "classroom,teacher,students\n12,Ms. Smith,24\n15,Mtro. Gonzalez,22\n",
  );
  return store;
}

function scoops(store: Store, room: string): number {
  return store.classrooms.find((classroom) => classroom.roomNumber === room)?.scoops ?? -1;
}

describe("jsonBodyToRecords", () => {
  test("reads a simple classroom/student object", () => {
    const [row] = jsonBodyToRecords({ classroom: 12, student: "Jane Doe" });
    assert.equal(row.classroom, "12");
    assert.equal(row.student, "Jane Doe");
  });

  test("reads CheddarUp form headers, including extra spaces", () => {
    const [row] = jsonBodyToRecords({
      Respondent: "Bartleby St Clair",
      "Student #1:  First Name": "Ramona",
      "Student #1:  Last Name": "St Clair",
      "Student #1: Classroom": "15 - Mtro. Gonzalez (3-SI)",
    });
    assert.equal(row.respondent, "Bartleby St Clair");
    assert.equal(row["student #1: first name"], "Ramona");
    assert.equal(row["student #1: classroom"], "15 - Mtro. Gonzalez (3-SI)");
  });

  test("flattens nested responses without losing student classroom keys", () => {
    const [row] = jsonBodyToRecords({
      payer: { name: "Zolzaya Badral" },
      responses: {
        "Student #1: Classroom": "02 - Ms. Kuwada (K)",
        "Student #1: First Name": "Iveel",
      },
    });
    assert.equal(row["payer name"], "Zolzaya Badral");
    assert.equal(row["student #1: classroom"], "02 - Ms. Kuwada (K)");
  });

  test("reads an array of purchase rows", () => {
    const rows = jsonBodyToRecords({
      rows: [
        { classroom: "12", student: "Jane Doe" },
        { classroom: "15", student: "Ramona St Clair" },
      ],
    });
    assert.equal(rows.length, 2);
    assert.equal(rows[1].classroom, "15");
  });
});

describe("applyDonationJson", () => {
  test("adds a scoop without resetting other classrooms", () => {
    let store = applyDonationCsv(rosterStore(), "classroom,student\n12,Jane Doe\n").store;
    assert.equal(scoops(store, "12"), 1);
    assert.equal(scoops(store, "15"), 0);

    store = applyDonationJson(store, {
      Respondent: "Zolzaya Badral",
      "Student #1: First Name": "Iveel",
      "Student #1: Last Name": "Enkhbayasgalan",
      "Student #1: Classroom": "15 - Mtro. Gonzalez (3-SI)",
    }).store;

    assert.equal(scoops(store, "12"), 1);
    assert.equal(scoops(store, "15"), 1);
    assert.ok(store.seenDonors.every((hash) => !/jane|zolzaya|iveel/i.test(hash)));
  });

  test("skips the same family in the same classroom", () => {
    const first = applyDonationJson(rosterStore(), {
      classroom: "12",
      student: "Jane Doe",
    });
    const second = applyDonationJson(first.store, {
      classroom: "12",
      student: "jane   doe",
    });
    assert.equal(scoops(second.store, "12"), 1);
    assert.equal(second.result.uniqueFamilies, 0);
    assert.equal(second.result.duplicatesSkipped, 1);
  });

  test("does not double-count a family already in the donations CSV", () => {
    const afterCsv = applyDonationCsv(
      rosterStore(),
      "classroom,student\n12,Jane Doe\n",
    ).store;
    const afterJson = applyDonationJson(afterCsv, {
      classroom: "12",
      student: "Jane Doe",
    });
    assert.equal(scoops(afterJson.store, "12"), 1);
    assert.equal(afterJson.result.duplicatesSkipped, 1);
  });

  test("a later donations CSV replaces scoops from the full export", () => {
    let store = applyDonationJson(rosterStore(), {
      classroom: "12",
      student: "Live Zapier Family",
    }).store;
    assert.equal(scoops(store, "12"), 1);

    store = applyDonationCsv(store, "classroom,student\n15,Ramona St Clair\n").store;
    assert.equal(scoops(store, "12"), 0);
    assert.equal(scoops(store, "15"), 1);
  });
});
