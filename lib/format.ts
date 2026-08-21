const PACIFIC = "America/Los_Angeles";

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function formatLastUpdated(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: PACIFIC,
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(date);
}
