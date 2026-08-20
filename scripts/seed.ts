import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { storeFilePath } from "../lib/store";
import { DEFAULT_STORE } from "../lib/tallies";

const target = storeFilePath();
mkdirSync(path.dirname(target), { recursive: true });
writeFileSync(target, `${JSON.stringify(DEFAULT_STORE, null, 2)}\n`, "utf8");
console.log(`Wrote seeded store to ${target}`);
