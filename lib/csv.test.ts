import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  applyClassroomCsv,
  applyDonationCsv,
  applyDonationJson,
  applyItemSummaryCsv,
  applyPaymentJson,
  jsonBodyToRecords,
} from "./csv";
import { createEmptyStore } from "./tallies";
import type { Store } from "./types";

function rosterStore(): Store {
  const { store } = applyClassroomCsv(
    createEmptyStore(),
    "classroom,teacher,students\n12,Ms. Smith,24\n15,Mtro. Gonzalez,22\n22,Ms. Jessica Pineda,24\n",
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

  test("reads a CheddarUp item purchase payload", () => {
    const [row] = jsonBodyToRecords({
      id: 34799675,
      payment_id: 16907482,
      tab_object_id: 8710250,
      date: "2026-08-23T16:19:41.143Z",
      status: "available",
      name: "Just a Scoop",
      "Student #1:  First Name": "Pia",
      "Student #1: Classroom": "22 - Ms. Jessica Pineda (4)",
      "Student #1:  Last Name": "Rivas",
    });
    assert.equal(row["student #1: classroom"], "22 - Ms. Jessica Pineda (4)");
    assert.equal(row["student #1: first name"], "Pia");
  });

  test("reads Zapier keys after # is dropped or nested under Student", () => {
    const [flat] = jsonBodyToRecords({
      name: "Just a Scoop",
      "Student 1: Classroom": "22 - Ms. Jessica Pineda (4)",
      "Student 1: First Name": "Pia",
      "Student 1: Last Name": "Rivas",
    });
    assert.equal(flat["student 1: classroom"], "22 - Ms. Jessica Pineda (4)");

    const [nested] = jsonBodyToRecords({
      name: "Just a Scoop",
      Student: {
        "1: Classroom": "22 - Ms. Jessica Pineda (4)",
        "1: First Name": "Pia",
        "1: Last Name": "Rivas",
      },
    });
    assert.equal(nested["1: classroom"], "22 - Ms. Jessica Pineda (4)");
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

  test("counts a CheddarUp item purchase for classroom 22", () => {
    const { store, result } = applyDonationJson(rosterStore(), {
      id: 34799675,
      payment_id: 16907482,
      tab_object_id: 8710250,
      date: "2026-08-23T16:19:41.143Z",
      status: "available",
      name: "Just a Scoop",
      "Student #1:  First Name": "Pia",
      "Student #1: Classroom": "22 - Ms. Jessica Pineda (4)",
      "Student #1:  Last Name": "Rivas",
    });
    assert.equal(result.warnings.join("\n"), "");
    assert.equal(result.uniqueFamilies, 1);
    assert.equal(scoops(store, "22"), 1);
  });

  test("counts Zapier nested Student 1 classroom keys", () => {
    const { store, result } = applyDonationJson(rosterStore(), {
      name: "Just a Scoop",
      Student: {
        "1: Classroom": "22 - Ms. Jessica Pineda (4)",
        "1: First Name": "Pia",
        "1: Last Name": "Rivas",
      },
    });
    assert.equal(result.warnings.join("\n"), "");
    assert.equal(scoops(store, "22"), 1);
  });
});

describe("applyDonationCsv", () => {
  test("still reads the simple classroom,student CSV", () => {
    const { store } = applyClassroomCsv(
      createEmptyStore(),
      "classroom,teacher,students\n1,Ms. Patel,22\n2,Mr. Chen,24\n8,Mr. Nguyen,25\n12,Ms. Okafor,22\n",
    );
    const { store: next, result } = applyDonationCsv(
      store,
      "classroom,student\n1,Patel Family\n1,Rivera Family\n2,Chen Family\n8,Nguyen Family\n12,Okafor Family\n",
    );
    assert.equal(result.uniqueFamilies, 5);
    assert.equal(scoops(next, "1"), 2);
    assert.equal(scoops(next, "2"), 1);
    assert.equal(scoops(next, "8"), 1);
    assert.equal(scoops(next, "12"), 1);
  });

  test("still reads a CheddarUp form export CSV with Student #1 headers", () => {
    const { store } = applyClassroomCsv(
      createEmptyStore(),
      "classroom,teacher,students\n2,Ms. Kuwada,22\n15,Mtro. Gonzalez,22\n16,Ms. Martin,24\n",
    );
    const csv = [
      "Respondent,Email,Date,Student #1:  First Name,Student #1:  Last Name,Student #1: Classroom,Student #2:  First Name,Student #2:  Last Name,Student #2: Classroom,Student #3 First Name,Student #3 Last Name,Student #3: Classroom,Document Number",
      "Bartleby St Clair,,08/22/2025,Ramona,St Clair,15 - Mtro. Gonzalez (3-SI),,,,,,,FT5QR",
      "Bartleby St Clair,,10/04/2025,Ramona,St Clair,15 - Mtro. Gonzalez (3-SI),,,,,,,GLRSO",
      "Zolzaya Badral,,10/01/2025,Iveel,Enkhbayasgalan,02 - Ms. Kuwada (K),,,,,,,GJISK",
      "Luke Xu,,10/01/2025,Luke,Xy,16 - Ms. Martin (3),,,,,,,GJFN0",
    ].join("\n");
    const { store: next, result } = applyDonationCsv(store, csv);
    assert.equal(result.duplicatesSkipped, 1);
    assert.equal(result.uniqueFamilies, 3);
    assert.equal(scoops(next, "15"), 1);
    assert.equal(scoops(next, "2"), 1);
    assert.equal(scoops(next, "16"), 1);
  });
});

describe("applyPaymentJson", () => {
  test("adds total to the school fundraising amount", () => {
    const store = { ...createEmptyStore(), overallRaised: 100 };
    const { store: next, result } = applyPaymentJson(store, { total: 25.5 });
    assert.equal(result.amountAdded, 25.5);
    assert.equal(result.duplicate, false);
    assert.equal(next.overallRaised, 125.5);
    assert.equal(next.classrooms.length, store.classrooms.length);
  });

  test("reads a dollar-string total", () => {
    const { result } = applyPaymentJson(createEmptyStore(), {
      total: "$1,250.00",
    });
    assert.equal(result.amountAdded, 1250);
    assert.equal(result.overallRaised, 1250);
  });

  test("skips a repeat payment id", () => {
    const first = applyPaymentJson(createEmptyStore(), {
      id: 16907482,
      total: 40,
    });
    const second = applyPaymentJson(first.store, {
      payment_id: 16907482,
      total: 40,
    });
    assert.equal(second.result.duplicate, true);
    assert.equal(second.result.amountAdded, 0);
    assert.equal(second.store.overallRaised, 40);
  });

  test("a later item summary CSV replaces the live total", () => {
    let store = applyPaymentJson(createEmptyStore(), { total: 40 }).store;
    assert.equal(store.overallRaised, 40);
    store = applyItemSummaryCsv(
      store,
      "Item Name,Net Amount Sold\nScoop,$10.00\n",
    ).store;
    assert.equal(store.overallRaised, 10);
    assert.deepEqual(store.seenPayments, []);
  });
});
