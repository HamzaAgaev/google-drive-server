import { describe, expect, test } from "vitest";
import { formatTimecode, parseTimecode, timecodeParam } from "./timecode";

describe("parseTimecode", () => {
  test("reads hours, minutes and seconds", () => {
    expect(parseTimecode("1h23m45s")).toBe(5025);
    expect(parseTimecode("23m")).toBe(1380);
    expect(parseTimecode("2h5s")).toBe(7205);
  });

  test("reads plain seconds", () => {
    expect(parseTimecode("1800")).toBe(1800);
  });

  test("ignores empty, zero and malformed values", () => {
    expect(parseTimecode(null)).toBeUndefined();
    expect(parseTimecode("")).toBeUndefined();
    expect(parseTimecode("0")).toBeUndefined();
    expect(parseTimecode("abc")).toBeUndefined();
    expect(parseTimecode("5s1m")).toBeUndefined();
  });
});

describe("timecodeParam", () => {
  test("skips zero units", () => {
    expect(timecodeParam(5025)).toBe("1h23m45s");
    expect(timecodeParam(3600)).toBe("1h");
    expect(timecodeParam(65.9)).toBe("1m5s");
    expect(timecodeParam(0)).toBe("0s");
  });

  test("round-trips through parseTimecode", () => {
    for (const seconds of [1, 59, 60, 61, 3599, 3600, 3661, 13029]) {
      expect(parseTimecode(timecodeParam(seconds))).toBe(seconds);
    }
  });
});

describe("formatTimecode", () => {
  test("formats like a video player", () => {
    expect(formatTimecode(5)).toBe("0:05");
    expect(formatTimecode(754)).toBe("12:34");
    expect(formatTimecode(5025)).toBe("1:23:45");
  });
});
