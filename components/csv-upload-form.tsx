"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type UploadKind = "classrooms" | "donations";

export function CsvUploadForm({ kind }: { kind: UploadKind }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);

  const isClassrooms = kind === "classrooms";
  const endpoint = isClassrooms
    ? "/api/admin/classrooms/csv"
    : "/api/admin/donations/csv";

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!file) {
      setError("Choose a CSV file first.");
      return;
    }
    setPending(true);
    setError("");
    setMessage("");
    setWarnings([]);
    try {
      const data = new FormData();
      data.set("file", file);
      const response = await fetch(endpoint, { method: "POST", body: data });
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
        warnings?: string[];
      };
      if (!response.ok) {
        setError(body.error || "Upload failed.");
        return;
      }
      setMessage(body.message || "Updated. Row-level details were discarded.");
      setWarnings(body.warnings ?? []);
      setFile(null);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input
        type="file"
        accept=".csv,text/csv"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        className="block w-full text-sm text-chocolate file:mr-3 file:rounded-full file:border-0 file:bg-mint/20 file:px-4 file:py-2 file:font-semibold file:text-mint-dark"
      />
      {error ? <p className="text-sm font-medium text-strawberry-dark">{error}</p> : null}
      {message ? <p className="text-sm font-medium text-mint-dark">{message}</p> : null}
      {warnings.length > 0 ? (
        <ul className="list-disc space-y-1 pl-5 text-xs text-chocolate/70">
          {warnings.slice(0, 8).map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
          {warnings.length > 8 ? <li>…and {warnings.length - 8} more</li> : null}
        </ul>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-mint-dark px-5 py-2.5 font-semibold text-white hover:bg-mint-dark/90 disabled:opacity-60"
      >
        {pending ? "Updating…" : "Upload and update tallies"}
      </button>
    </form>
  );
}
