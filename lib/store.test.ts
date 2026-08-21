import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, describe, test } from "node:test";
import { applyClassroomCsv, applyDonationCsv, applyItemSummaryCsv } from "./csv";
import { readStore, updateStore } from "./store";
import { createEmptyStore } from "./tallies";

const STALE = "2020-01-01T00:00:00.000Z";

let dataDir = "";
let previousDataDir: string | undefined;

before(async () => {
  previousDataDir = process.env.DATA_DIR;
  dataDir = await mkdtemp(path.join(tmpdir(), "ice-cream-store-"));
  process.env.DATA_DIR = dataDir;
  await writeFile(
    path.join(dataDir, "store.json"),
    `${JSON.stringify({ ...createEmptyStore(), lastUpdated: STALE }, null, 2)}\n`,
    "utf8",
  );
});

after(async () => {
  if (previousDataDir === undefined) delete process.env.DATA_DIR;
  else process.env.DATA_DIR = previousDataDir;
  await rm(dataDir, { recursive: true, force: true });
});

async function persistedLastUpdated(): Promise<string> {
  const raw = await readFile(path.join(dataDir, "store.json"), "utf8");
  const parsed = JSON.parse(raw) as { lastUpdated: string };
  return parsed.lastUpdated;
}

function assertFresh(iso: string, previous: string): void {
  assert.notEqual(iso, previous);
  assert.notEqual(iso, STALE);
  const time = new Date(iso).getTime();
  assert.ok(Number.isFinite(time));
  assert.ok(Math.abs(Date.now() - time) < 10_000);
}

async function tick(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 20));
}

describe("lastUpdated", { concurrency: 1 }, () => {
  test("settings and every CSV source refresh lastUpdated", async () => {
    const afterSettings = await updateStore((current) => ({
      ...current,
      pageTitle: "Ice Cream Challenge",
      overallGoal: 20000,
      classroomPercentTarget: 75,
      donationUrl: "https://example.org/donate",
    }));
    assertFresh(afterSettings.lastUpdated, STALE);
    assert.equal(await persistedLastUpdated(), afterSettings.lastUpdated);
    assert.equal((await readStore()).lastUpdated, afterSettings.lastUpdated);

    await tick();
    const afterRoster = await updateStore(
      (current) =>
        applyClassroomCsv(current, "classroom,teacher,students\n12,Ms. Smith,24\n")
          .store,
    );
    assertFresh(afterRoster.lastUpdated, afterSettings.lastUpdated);
    assert.equal(await persistedLastUpdated(), afterRoster.lastUpdated);

    await tick();
    const afterDonations = await updateStore(
      (current) =>
        applyDonationCsv(current, "classroom,student\n12,Jane Doe\n").store,
    );
    assertFresh(afterDonations.lastUpdated, afterRoster.lastUpdated);
    assert.equal(await persistedLastUpdated(), afterDonations.lastUpdated);

    await tick();
    const afterItems = await updateStore(
      (current) =>
        applyItemSummaryCsv(current, "Item Name,Net Amount Sold\nScoop,$10.00\n")
          .store,
    );
    assertFresh(afterItems.lastUpdated, afterDonations.lastUpdated);
    assert.equal(await persistedLastUpdated(), afterItems.lastUpdated);
  });

  test("a failed CSV parse leaves lastUpdated unchanged", async () => {
    const before = await readStore();
    await assert.rejects(
      () =>
        updateStore((current) => applyClassroomCsv(current, "not,a,roster\n").store),
      /No valid classroom rows/,
    );
    assert.equal((await readStore()).lastUpdated, before.lastUpdated);
    assert.equal(await persistedLastUpdated(), before.lastUpdated);
  });
});
