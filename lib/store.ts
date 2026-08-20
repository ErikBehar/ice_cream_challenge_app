import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { DEFAULT_PAGE_TITLE } from "./page-title";
import { createEmptyStore, DEFAULT_STORE } from "./tallies";
import type { Store } from "./types";

function dataDir(): string {
  return (
    process.env.DATA_DIR ||
    process.env.RAILWAY_VOLUME_MOUNT_PATH ||
    path.join(process.cwd(), "data")
  );
}

export function storeFilePath(): string {
  return path.join(dataDir(), "store.json");
}

function isClassroom(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.roomNumber === "string" &&
    typeof row.teacherName === "string" &&
    typeof row.studentCount === "number" &&
    typeof row.scoops === "number"
  );
}

function isStore(value: unknown): value is Store {
  if (!value || typeof value !== "object") return false;
  const store = value as Record<string, unknown>;
  return (
    typeof store.lastUpdated === "string" &&
    typeof store.overallGoal === "number" &&
    typeof store.overallRaised === "number" &&
    typeof store.classroomPercentTarget === "number" &&
    (store.pageTitle === undefined || typeof store.pageTitle === "string") &&
    (store.donationUrl === undefined || typeof store.donationUrl === "string") &&
    Array.isArray(store.classrooms) &&
    store.classrooms.every(isClassroom)
  );
}

function withDefaults(store: Store): Store {
  const pageTitle = store.pageTitle?.trim() || DEFAULT_PAGE_TITLE;
  return {
    ...store,
    pageTitle,
    donationUrl: store.donationUrl ?? "",
  };
}

let writeChain: Promise<unknown> = Promise.resolve();

export async function readStore(): Promise<Store> {
  try {
    const raw = await readFile(storeFilePath(), "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (isStore(parsed)) return withDefaults(parsed);
    return process.env.NODE_ENV === "production"
      ? createEmptyStore()
      : structuredClone(DEFAULT_STORE);
  } catch {
    const initial =
      process.env.NODE_ENV === "production"
        ? createEmptyStore()
        : structuredClone(DEFAULT_STORE);
    await persistStore(initial);
    return initial;
  }
}

async function persistStore(store: Store): Promise<void> {
  await mkdir(dataDir(), { recursive: true });
  await writeFile(storeFilePath(), `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

export async function writeStore(store: Store): Promise<Store> {
  const next: Store = {
    ...store,
    lastUpdated: new Date().toISOString(),
  };
  const run = writeChain.then(async () => {
    await persistStore(next);
    return next;
  });
  writeChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export async function updateStore(
  updater: (current: Store) => Store | Promise<Store>,
): Promise<Store> {
  const run = writeChain.then(async () => {
    const current = await readStore();
    const updated = await updater(current);
    const next: Store = {
      ...updated,
      lastUpdated: new Date().toISOString(),
    };
    await persistStore(next);
    return next;
  });
  writeChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}
