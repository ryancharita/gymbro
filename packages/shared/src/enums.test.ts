import { describe, expect, it } from "vitest";
import { SplitDifficulty, SplitVisibility } from "./enums.js";

describe("SplitDifficulty", () => {
  it("includes all difficulty levels", () => {
    expect(Object.values(SplitDifficulty)).toEqual([
      "BEGINNER",
      "INTERMEDIATE",
      "ADVANCED",
    ]);
  });
});

describe("SplitVisibility", () => {
  it("includes all visibility options", () => {
    expect(Object.values(SplitVisibility)).toContain("PUBLIC");
    expect(Object.values(SplitVisibility)).toContain("PRIVATE");
  });
});
