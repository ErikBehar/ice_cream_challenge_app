import type { Classroom, ClassroomCsvResult, DonationCsvResult, Store } from "./types";

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
const DONATION_KEYS = ["donation", "amount", "dollars"];
const FAMILY_KEYS = ["student", "family", "student_name", "student name", "name", "donor"];

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
  amount: number | null;
  rowNumber: number;
};

function donationEventsFromRow(
  record: Record<string, string>,
  rowNumber: number,
): DonationEvent[] {
  const respondent = pick(record, ["respondent", "parent", "guardian"]);
  const amount = parseMoney(pick(record, DONATION_KEYS));
  const slots = extractStudentSlots(record).filter((student) => student.classroom);

  if (slots.length > 0) {
    return slots.map((student, index) => ({
      classroomField: student.classroom,
      donor:
        respondent ||
        [student.first, student.last].filter(Boolean).join(" "),
      amount: index === 0 ? amount : null,
      rowNumber,
    }));
  }

  return [
    {
      classroomField: pick(record, CLASSROOM_KEYS),
      donor: respondent || pick(record, FAMILY_KEYS),
      amount,
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
  if (store.classrooms.length === 0) {
    throw new Error("Upload a classroom roster first.");
  }

  const rows = rowsToObjects(csvText);
  const warnings: string[] = [];
  const rosterByKey = new Map(
    store.classrooms.map((classroom) => [roomMatchKey(classroom.roomNumber), classroom]),
  );
  const familiesByRoom = new Map<string, Set<string>>();
  const seenDonorInRoom = new Set<string>();
  let overallRaised = 0;
  let uniqueFamilies = 0;
  let duplicatesSkipped = 0;
  let amountsApplied = false;

  rows.forEach((row, index) => {
    donationEventsFromRow(row, index + 2).forEach((event) => {
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
      if (event.amount !== null && event.amount < 0) {
        warnings.push(`Row ${event.rowNumber}: skipped (invalid donation amount).`);
        return;
      }
      if (!donorKey) {
        warnings.push(
          `Row ${event.rowNumber}: skipped (missing respondent or student name).`,
        );
        return;
      }

      const identity = `${classroom.roomNumber}\0${donorKey}`;
      const alreadyScooped = seenDonorInRoom.has(identity);
      if (alreadyScooped) {
        duplicatesSkipped += 1;
      } else {
        seenDonorInRoom.add(identity);
        const families = familiesByRoom.get(classroom.roomNumber) ?? new Set<string>();
        families.add(donorKey);
        familiesByRoom.set(classroom.roomNumber, families);
      }

      if (event.amount !== null) {
        amountsApplied = true;
        overallRaised += event.amount;
      }
    });
  });

  const classrooms = store.classrooms.map((classroom) => {
    const families = familiesByRoom.get(classroom.roomNumber);
    const scoops = families ? families.size : 0;
    if (families) uniqueFamilies += families.size;
    return { ...classroom, scoops };
  });

  const raised = amountsApplied
    ? Math.round(overallRaised * 100) / 100
    : store.overallRaised;

  return {
    store: {
      ...store,
      overallRaised: raised,
      classrooms,
    },
    result: {
      overallRaised: raised,
      classroomsUpdated: familiesByRoom.size,
      uniqueFamilies,
      duplicatesSkipped,
      amountsApplied,
      warnings,
    },
  };
}
