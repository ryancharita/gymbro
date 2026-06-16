import { describe, expect, it } from "vitest";
import {
  defaultDayLabels,
  validateDayLabels,
  validateDaysPerWeek,
} from "../lib/splits.js";

describe("split validation", () => {
  it("accepts valid days per week", () => {
    expect(() => validateDaysPerWeek(4)).not.toThrow();
  });

  it("rejects invalid days per week", () => {
    expect(() => validateDaysPerWeek(0)).toThrow(
      "Days per week must be between 1 and 7",
    );
    expect(() => validateDaysPerWeek(8)).toThrow(
      "Days per week must be between 1 and 7",
    );
  });

  it("requires matching day labels", () => {
    expect(() =>
      validateDayLabels(3, [{ label: "Day 1" }, { label: "Day 2" }]),
    ).toThrow("Number of day labels must match days per week");
  });

  it("creates default day labels", () => {
    expect(defaultDayLabels(3)).toEqual([
      { label: "Day 1" },
      { label: "Day 2" },
      { label: "Day 3" },
    ]);
  });
});
