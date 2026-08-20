"use client";

import { PAGE_TITLE_MAX_LENGTH } from "@/lib/page-title";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminSettingsForm({
  pageTitle,
  overallGoal,
  classroomPercentTarget,
  donationUrl,
}: {
  pageTitle: string;
  overallGoal: number;
  classroomPercentTarget: number;
  donationUrl: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(pageTitle);
  const [goal, setGoal] = useState(String(overallGoal));
  const [percent, setPercent] = useState(String(classroomPercentTarget));
  const [donateLink, setDonateLink] = useState(donationUrl);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageTitle: title,
          overallGoal: Number(goal),
          classroomPercentTarget: Number(percent),
          donationUrl: donateLink,
        }),
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(body.error || "Could not save settings.");
        return;
      }
      setMessage("Saved. The public page is updated.");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="text-sm font-semibold text-chocolate">Page title</span>
        <input
          type="text"
          maxLength={PAGE_TITLE_MAX_LENGTH}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="mt-1 w-full rounded-xl border border-cream-dark bg-white px-3 py-2.5 text-chocolate outline-none ring-strawberry/30 focus:ring-2"
          required
        />
        <span className="mt-1 block text-xs text-chocolate/60">
          Shown as the heading on the public board and in the browser tab.
        </span>
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-chocolate">
          Overall monetary funding goal (USD)
        </span>
        <input
          type="number"
          min={0}
          step="1"
          value={goal}
          onChange={(event) => setGoal(event.target.value)}
          className="mt-1 w-full rounded-xl border border-cream-dark bg-white px-3 py-2.5 text-chocolate outline-none ring-strawberry/30 focus:ring-2"
          required
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-chocolate">
          Classroom donation target (%)
        </span>
        <input
          type="number"
          min={0}
          max={100}
          step="1"
          value={percent}
          onChange={(event) => setPercent(event.target.value)}
          className="mt-1 w-full rounded-xl border border-cream-dark bg-white px-3 py-2.5 text-chocolate outline-none ring-strawberry/30 focus:ring-2"
          required
        />
        <span className="mt-1 block text-xs text-chocolate/60">
          A classroom meets the scoop challenge when family donations reach this
          share of students.
        </span>
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-chocolate">
          Donation site link
        </span>
        <input
          type="url"
          inputMode="url"
          placeholder="https://"
          value={donateLink}
          onChange={(event) => setDonateLink(event.target.value)}
          className="mt-1 w-full rounded-xl border border-cream-dark bg-white px-3 py-2.5 text-chocolate outline-none ring-strawberry/30 focus:ring-2"
        />
        <span className="mt-1 block text-xs text-chocolate/60">
          Shown as the “Click here to Donate!” sticker in the public header.
          Leave blank to hide the sticker.
        </span>
      </label>
      {error ? <p className="text-sm font-medium text-strawberry-dark">{error}</p> : null}
      {message ? <p className="text-sm font-medium text-mint-dark">{message}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-chocolate px-5 py-2.5 font-semibold text-cream hover:bg-chocolate/90 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
