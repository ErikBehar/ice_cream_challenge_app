"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ZeroTotalButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function onClick() {
    const confirmed = window.confirm(
      "Zero the school total? Classroom scoops will stay as they are.",
    );
    if (!confirmed) return;

    setPending(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/item-summary/clear", {
        method: "POST",
      });
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };
      if (!response.ok) {
        setError(body.error || "Could not zero the total.");
        return;
      }
      setMessage(body.message || "School total set to zero.");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      {error ? <p className="text-sm font-medium text-strawberry-dark">{error}</p> : null}
      {message ? <p className="text-sm font-medium text-mint-dark">{message}</p> : null}
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="rounded-full bg-strawberry px-5 py-2.5 font-semibold text-white hover:bg-strawberry-dark disabled:opacity-60"
      >
        {pending ? "Zeroing…" : "Zero total"}
      </button>
    </div>
  );
}
