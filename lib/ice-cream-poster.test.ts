import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  ICE_CREAM_SCOOPS,
  SCOOP_COUNT,
  SCOOP_DOLLAR_STEP,
  SCOOP_FLAVORS,
  filledScoopCount,
} from "./ice-cream-poster";

describe("filledScoopCount", () => {
  test("stays empty until the first $5,000 is reached", () => {
    assert.equal(filledScoopCount(0), 0);
    assert.equal(filledScoopCount(4999.99), 0);
    assert.equal(filledScoopCount(SCOOP_DOLLAR_STEP), 1);
  });

  test("fills one scoop per $5,000 and caps at the cone", () => {
    assert.equal(filledScoopCount(8420), 1);
    assert.equal(filledScoopCount(10_000), 2);
    assert.equal(filledScoopCount(SCOOP_COUNT * SCOOP_DOLLAR_STEP), SCOOP_COUNT);
    assert.equal(
      filledScoopCount(SCOOP_COUNT * SCOOP_DOLLAR_STEP + 50_000),
      SCOOP_COUNT,
    );
  });

  test("treats non-finite values as zero scoops", () => {
    assert.equal(filledScoopCount(Number.NaN), 0);
    assert.equal(filledScoopCount(Number.POSITIVE_INFINITY), 0);
    assert.equal(filledScoopCount(-5000), 0);
  });
});

describe("ice cream poster map", () => {
  test("maps 27 scoops with a color for each", () => {
    assert.equal(ICE_CREAM_SCOOPS.length, 27);
    assert.equal(SCOOP_COUNT, 27);
    assert.equal(SCOOP_FLAVORS.length, SCOOP_COUNT);
  });
});
