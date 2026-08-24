/** Pixel size of `public/ice-cream-poster.png`. */
export const ICE_CREAM_POSTER = { width: 581, height: 748 } as const;

/** Dollars needed to fill one scoop on the school cone. */
export const SCOOP_DOLLAR_STEP = 5000;

/**
 * Scoop centers in poster pixel space, bottom-to-top then left-to-right.
 * Each circle is slightly inset so the printed black outline stays visible.
 */
export const ICE_CREAM_SCOOPS = [
  { x: 182.5, y: 415.4, r: 23.6 },
  { x: 240.8, y: 411.6, r: 24.1 },
  { x: 296.5, y: 410.5, r: 23.6 },
  { x: 351.0, y: 412.6, r: 22.9 },
  { x: 152.0, y: 367.0, r: 25.2 },
  { x: 208.5, y: 371.1, r: 23.4 },
  { x: 267.5, y: 367.7, r: 23.5 },
  { x: 326.8, y: 370.4, r: 23.3 },
  { x: 380.8, y: 373.8, r: 23.1 },
  { x: 120.5, y: 322.0, r: 24.4 },
  { x: 176.1, y: 320.1, r: 24.5 },
  { x: 235.4, y: 324.3, r: 26.2 },
  { x: 299.6, y: 326.9, r: 25.6 },
  { x: 361.3, y: 329.8, r: 24.5 },
  { x: 418.5, y: 330.0, r: 25.3 },
  { x: 121.6, y: 267.2, r: 26.0 },
  { x: 175.5, y: 270.1, r: 24.4 },
  { x: 233.9, y: 271.8, r: 26.1 },
  { x: 300.0, y: 275.2, r: 26.2 },
  { x: 362.0, y: 275.1, r: 27.1 },
  { x: 422.1, y: 274.0, r: 26.1 },
  { x: 175.7, y: 218.2, r: 27.0 },
  { x: 240.9, y: 219.5, r: 26.6 },
  { x: 302.4, y: 221.7, r: 26.3 },
  { x: 362.0, y: 216.7, r: 27.2 },
  { x: 237.9, y: 161.6, r: 28.1 },
  { x: 300.3, y: 162.6, r: 27.8 },
] as const;

export const SCOOP_COUNT = ICE_CREAM_SCOOPS.length;

/** One distinct ice-cream flavor color per scoop. */
export const SCOOP_FLAVORS = [
  "#F7D9A8",
  "#E85D75",
  "#5EC8B8",
  "#6B3F24",
  "#F4A261",
  "#C77DFF",
  "#7B4B94",
  "#F4D35E",
  "#E07A5F",
  "#90BE6D",
  "#48CAE4",
  "#D4A373",
  "#FF8FAB",
  "#B08968",
  "#80ED99",
  "#F28482",
  "#9D4EDD",
  "#E9C46A",
  "#2A9D8F",
  "#E76F51",
  "#ADB5BD",
  "#FF6B6B",
  "#4C6EF5",
  "#FAA307",
  "#D81159",
  "#8AC926",
  "#FF85A1",
] as const;

export function filledScoopCount(
  raised: number,
  step: number = SCOOP_DOLLAR_STEP,
  count: number = SCOOP_COUNT,
): number {
  if (!Number.isFinite(raised) || raised <= 0 || step <= 0 || count <= 0) {
    return 0;
  }
  return Math.min(count, Math.floor((raised + 1e-9) / step));
}
