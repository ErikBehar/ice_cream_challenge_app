import { createHash } from "node:crypto";
import type {
  Classroom,
  ClassroomCsvResult,
  DonationCsvResult,
  ItemSummaryCsvResult,
  Store,
} from "./types";

const CLASSROOM_KEYS = ["classroom", "room", "room_number", "room number", "class"];
const TEACHER_KEYS = ["teacher", "teacher_name", "teacher name"];
const STUDENT_COUNT_KEYS = [
  "students",
  "student_count",
  "student count",
  "number of students",
  "count",
];
const STUDENT_LIST_KEYS = ["student_list", "students_list", "names", "student names"];
const FAMILY_KEYS = ["student", "family", "student_name", "student name", "name", "donor"];
const RESPONDENT_KEYS = [
  "respondent",
  "parent",
  "guardian",
  "payer",
  "payer_name",
  "payer name",
  "customer",
  "customer_name",
  "customer name",
  "buyer",
  "buyer_name",
  "buyer name",
];
const NET_AMOUNT_KEYS = ["net amount sold"];
const JSON_ROW_ARRAY_KEYS = ["rows", "purchases", "records"];

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const input = text.replace(/^\uFEFF/, "");

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      field = "";
      if (row.some((cell) => cell.trim() !== "")) rows.push(row);
      row = [];
    } else if (char !== "\r") {
      field += char;
    }
  }

  row.push(field);
  if (row.some((cell) => cell.trim() !== "")) rows.push(row);
  return rows;
}

function rowsToObjects(text: string): Record<string, string>[] {
  const rows = parseCsvRows(text);
  if (rows.length === 0) return [];
  const headers = rows[0].map((header) => normalizeHeader(header));
  return rows.slice(1).map((row) => {
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      if (!header) return;
      record[header] = (row[index] ?? "").trim();
    });
    return record;
  });
}

function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/\s+/g, " ").trim();
}

function pick(record: Record<string, string>, keys: string[]): string {
  for (const key of keys) {
    if (record[key]) return record[key];
  }
  return "";
}

function parseMoney(value: string): number | null {
  const cleaned = value.replace(/[$,]/g, "").trim();
  if (!cleaned) return null;
  const amount = Number.parseFloat(cleaned);
  return Number.isFinite(amount) ? amount : null;
}

function parseCount(value: string): number | null {
  const cleaned = value.replace(/,/g, "").trim();
  if (!cleaned) return null;
  const count = Number.parseInt(cleaned, 10);
  return Number.isFinite(count) && count >= 0 ? count : null;
}

function splitNames(value: string): string[] {
  if (!value) return [];
  return value
    .split(/[;|]/)
    .map((name) => name.trim())
    .filter(Boolean);
}

function normalizeRoom(value: string): string {
  return value.trim();
}

function normalizeDonorName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function canonicalRoomNumber(value: string): string | null {
  const match = value.trim().match(/^(\d+)/);
  if (!match) return null;
  return String(Number.parseInt(match[1], 10));
}

function roomMatchKey(value: string): string {
  return canonicalRoomNumber(value) ?? normalizeRoom(value).toLowerCase();
}

function teacherFromClassroomLabel(value: string): string {
  return value
    .replace(/^\d+\s*-\s*/, "")
    .replace(/\s*\([^)]*\)\s*$/, "")
    .trim();
}

type StudentSlot = {
  first: string;
  last: string;
  classroom: string;
};

function extractStudentSlots(record: Record<string, string>): StudentSlot[] {
  const byIndex = new Map<number, StudentSlot>();

  function slot(index: number): StudentSlot {
    const current = byIndex.get(index) ?? { first: "", last: "", classroom: "" };
    byIndex.set(index, current);
    return current;
  }

  for (const [header, value] of Object.entries(record)) {
    const first = header.match(/student\s*#\s*(\d+)\s*:?\s*first\s*name/);
    const last = header.match(/student\s*#\s*(\d+)\s*:?\s*last\s*name/);
    const room = header.match(/student\s*#\s*(\d+)\s*:?\s*classroom/);
    if (first) slot(Number(first[1])).first = value;
    else if (last) slot(Number(last[1])).last = value;
    else if (room) slot(Number(room[1])).classroom = value;
  }

  return [...byIndex.entries()]
    .sort((left, right) => left[0] - right[0])
    .map(([, student]) => student);
}

type DonationEvent = {
  classroomField: string;
  donor: string;
  rowNumber: number;
};

function donorHash(roomNumber: string, donorKey: string): string {
  return createHash("sha256").update(`${roomNumber}\0${donorKey}`).digest("hex");
}

function donationEventsFromRow(
  record: Record<string, string>,
  rowNumber: number,
): DonationEvent[] {
  const respondent = pick(record, RESPONDENT_KEYS);
  const slots = extractStudentSlots(record).filter((student) => student.classroom);

  if (slots.length > 0) {
    return slots.map((student) => ({
      classroomField: student.classroom,
      donor:
        respondent ||
        [student.first, student.last].filter(Boolean).join(" "),
      rowNumber,
    }));
  }

  return [
    {
      classroomField: pick(record, CLASSROOM_KEYS),
      donor: respondent || pick(record, FAMILY_KEYS),
      rowNumber,
    },
  ];
}

export function applyClassroomCsv(store: Store, csvText: string): {
  store: Store;
  result: ClassroomCsvResult;
} {
  const rows = rowsToObjects(csvText);
  const warnings: string[] = [];
  const nextClassrooms: Classroom[] = [];
  const seen = new Set<string>();
  const previous = new Map(
    store.classrooms.map((classroom) => [roomMatchKey(classroom.roomNumber), classroom]),
  );

  rows.forEach((row, index) => {
    const rawRoom = pick(row, CLASSROOM_KEYS);
    const roomNumber = canonicalRoomNumber(rawRoom) ?? normalizeRoom(rawRoom);
    const teacherName =
      pick(row, TEACHER_KEYS) || teacherFromClassroomLabel(rawRoom);
    if (!roomNumber || !teacherName) {
      warnings.push(`Row ${index + 2}: skipped (need classroom and teacher).`);
      return;
    }
    if (seen.has(roomNumber)) {
      warnings.push(`Row ${index + 2}: duplicate classroom ${roomNumber} skipped.`);
      return;
    }

    const listedNames = splitNames(pick(row, STUDENT_LIST_KEYS));
    const parsedCount = parseCount(pick(row, STUDENT_COUNT_KEYS));
    const studentCount = parsedCount ?? (listedNames.length || 0);
    if (studentCount <= 0) {
      warnings.push(`Row ${index + 2}: classroom ${roomNumber} has no student count.`);
    }

    seen.add(roomNumber);
    nextClassrooms.push({
      roomNumber,
      teacherName,
      studentCount,
      scoops: previous.get(roomMatchKey(roomNumber))?.scoops ?? 0,
    });
  });

  if (nextClassrooms.length === 0) {
    throw new Error("No valid classroom rows found. Need classroom, teacher, and students columns.");
  }

  return {
    store: {
      ...store,
      classrooms: nextClassrooms,
    },
    result: {
      classrooms: nextClassrooms.length,
      warnings,
    },
  };
}

export function applyDonationCsv(store: Store, csvText: string): {
  store: Store;
  result: DonationCsvResult;
} {
  return applyDonationRecords(store, rowsToObjects(csvText), { replace: true });
}

export function applyDonationJson(store: Store, body: unknown): {
  store: Store;
  result: DonationCsvResult;
} {
  const records = jsonBodyToRecords(body);
  if (records.length === 0) {
    throw new Error(
      "No purchase rows found in JSON. Send a CheddarUp row with classroom and respondent or student name.",
    );
  }
  return applyDonationRecords(store, records, { replace: false });
}

export function applyDonationRecords(
  store: Store,
  rows: Record<string, string>[],
  options: { replace: boolean },
): {
  store: Store;
  result: DonationCsvResult;
} {
  if (store.classrooms.length === 0) {
    throw new Error("Upload a classroom roster first.");
  }

  const warnings: string[] = [];
  const rosterByKey = new Map(
    store.classrooms.map((classroom) => [roomMatchKey(classroom.roomNumber), classroom]),
  );
  const familiesByRoom = new Map<string, Set<string>>();
  const seenHashes = new Set(options.replace ? [] : (store.seenDonors ?? []));
  const batchIdentities = new Set<string>();
  let uniqueFamilies = 0;
  let duplicatesSkipped = 0;

  rows.forEach((row, index) => {
    donationEventsFromRow(row, index + (options.replace ? 2 : 1)).forEach((event) => {
      const donorKey = normalizeDonorName(event.donor);
      const roomKey = event.classroomField ? roomMatchKey(event.classroomField) : "";
      const classroom = roomKey ? rosterByKey.get(roomKey) : undefined;

      if (!event.classroomField) {
        warnings.push(`Row ${event.rowNumber}: skipped (missing classroom).`);
        return;
      }
      if (!classroom) {
        warnings.push(
          `Row ${event.rowNumber}: classroom "${event.classroomField}" is not on the roster.`,
        );
        return;
      }
      if (!donorKey) {
        warnings.push(
          `Row ${event.rowNumber}: skipped (missing respondent or student name).`,
        );
        return;
      }

      const identity = `${classroom.roomNumber}\0${donorKey}`;
      const hash = donorHash(classroom.roomNumber, donorKey);
      const alreadyScooped =
        batchIdentities.has(identity) || (!options.replace && seenHashes.has(hash));
      if (alreadyScooped) {
        duplicatesSkipped += 1;
        return;
      }

      batchIdentities.add(identity);
      seenHashes.add(hash);
      const families = familiesByRoom.get(classroom.roomNumber) ?? new Set<string>();
      families.add(donorKey);
      familiesByRoom.set(classroom.roomNumber, families);
    });
  });

  const classrooms = store.classrooms.map((classroom) => {
    const families = familiesByRoom.get(classroom.roomNumber);
    if (options.replace) {
      const scoops = families ? families.size : 0;
      if (families) uniqueFamilies += families.size;
      return { ...classroom, scoops };
    }
    if (!families) return classroom;
    uniqueFamilies += families.size;
    return { ...classroom, scoops: classroom.scoops + families.size };
  });

  return {
    store: {
      ...store,
      classrooms,
      seenDonors: [...seenHashes],
    },
    result: {
      classroomsUpdated: familiesByRoom.size,
      uniqueFamilies,
      duplicatesSkipped,
      warnings,
    },
  };
}

function isPrimitive(value: unknown): value is string | number | boolean {
  return (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

function questionLabel(record: Record<string, unknown>): string {
  for (const key of ["question", "name", "label", "key", "title"]) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return "";
}

function questionAnswer(record: Record<string, unknown>): unknown {
  for (const key of ["answer", "value", "text", "response", "val"]) {
    if (key in record) return record[key];
  }
  return undefined;
}

function flattenToRecord(
  value: unknown,
  into: Record<string, string> = {},
  prefix = "",
  depth = 0,
): Record<string, string> {
  if (value == null || depth > 4) return into;

  if (isPrimitive(value)) {
    if (prefix) into[normalizeHeader(prefix)] = String(value).trim();
    return into;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      if (item && typeof item === "object" && !Array.isArray(item)) {
        const record = item as Record<string, unknown>;
        const label = questionLabel(record);
        const answer = questionAnswer(record);
        if (label && isPrimitive(answer)) {
          into[normalizeHeader(label)] = String(answer).trim();
          continue;
        }
      }
      flattenToRecord(item, into, prefix, depth + 1);
    }
    return into;
  }

  if (typeof value !== "object") return into;

  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const nextPrefix = prefix ? `${prefix} ${key}` : key;
    if (isPrimitive(nested)) {
      const header = normalizeHeader(key);
      if (!(header in into)) into[header] = String(nested).trim();
      if (prefix) into[normalizeHeader(nextPrefix)] = String(nested).trim();
      continue;
    }
    flattenToRecord(nested, into, nextPrefix, depth + 1);
  }
  return into;
}

export function jsonBodyToRecords(body: unknown): Record<string, string>[] {
  if (body == null) return [];
  if (typeof body === "string") {
    const trimmed = body.trim();
    if (!trimmed) return [];
    try {
      return jsonBodyToRecords(JSON.parse(trimmed));
    } catch {
      return [];
    }
  }
  if (Array.isArray(body)) {
    return body.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const record = flattenToRecord(item);
      return Object.keys(record).length > 0 ? [record] : [];
    });
  }
  if (typeof body !== "object") return [];

  const obj = body as Record<string, unknown>;
  for (const key of JSON_ROW_ARRAY_KEYS) {
    if (Array.isArray(obj[key])) return jsonBodyToRecords(obj[key]);
  }
  const record = flattenToRecord(obj);
  return Object.keys(record).length > 0 ? [record] : [];
}

export function applyItemSummaryCsv(store: Store, csvText: string): {
  store: Store;
  result: ItemSummaryCsvResult;
} {
  const rows = rowsToObjects(csvText);
  if (rows.length === 0) {
    throw new Error(
      'No item rows found. Need a Square item summary CSV with a "Net Amount Sold" column.',
    );
  }

  const hasNetAmountColumn = NET_AMOUNT_KEYS.some((key) => key in rows[0]);
  if (!hasNetAmountColumn) {
    throw new Error(
      'Need a "Net Amount Sold" column. Export the Square item summary CSV.',
    );
  }

  const warnings: string[] = [];
  let overallRaised = 0;
  let itemsCounted = 0;

  rows.forEach((row, index) => {
    const raw = pick(row, NET_AMOUNT_KEYS);
    if (!raw) {
      warnings.push(`Row ${index + 2}: skipped (missing Net Amount Sold).`);
      return;
    }
    const amount = parseMoney(raw);
    if (amount === null || amount < 0) {
      warnings.push(`Row ${index + 2}: skipped (invalid Net Amount Sold).`);
      return;
    }
    overallRaised += amount;
    itemsCounted += 1;
  });

  if (itemsCounted === 0) {
    throw new Error("No valid Net Amount Sold values found.");
  }

  const raised = Math.round(overallRaised * 100) / 100;
  return {
    store: {
      ...store,
      overallRaised: raised,
    },
    result: {
      overallRaised: raised,
      itemsCounted,
      warnings,
    },
  };
}
