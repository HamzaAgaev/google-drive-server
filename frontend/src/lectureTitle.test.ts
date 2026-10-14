import { describe, expect, test } from "vitest";
import { lectureTitle } from "./lectureTitle";

describe("lectureTitle", () => {
  test("turns Zoom recording name into a readable date", () => {
    expect(lectureTitle("2026-10-13 18_28 С++ hard, осень 2026")).toBe(
      "вт, 13 октября 2026 г., 18:28",
    );
  });

  test("keeps the copy number of duplicate recordings", () => {
    expect(lectureTitle("2026-10-01 18_27 Программная инженерия, осень 2026 (2)")).toBe(
      "чт, 1 октября 2026 г., 18:27 (2)",
    );
  });

  test("leaves other titles as they are", () => {
    expect(lectureTitle("Вводная лекция")).toBe("Вводная лекция");
  });
});
