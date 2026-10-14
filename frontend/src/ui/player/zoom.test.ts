import { describe, expect, test } from "vitest";
import { clampZoom, maxScale, noZoom, panBy, zoomAt } from "./zoom";

const size = { width: 800, height: 450 };

describe("zoomAt", () => {
  test("keeps the point under the cursor in place", () => {
    const point = { x: 200, y: 100 };
    const zoomed = zoomAt(noZoom, 2, point, size);
    const contentBefore = {
      x: (point.x - noZoom.x) / noZoom.scale,
      y: (point.y - noZoom.y) / noZoom.scale,
    };
    const contentAfter = {
      x: (point.x - zoomed.x) / zoomed.scale,
      y: (point.y - zoomed.y) / zoomed.scale,
    };
    expect(zoomed.scale).toBe(2);
    expect(contentAfter).toEqual(contentBefore);
  });

  test("limits the scale", () => {
    expect(zoomAt(noZoom, 100, { x: 0, y: 0 }, size).scale).toBe(maxScale);
    expect(zoomAt(noZoom, 0.1, { x: 0, y: 0 }, size)).toEqual(noZoom);
  });

  test("zooming back out resets the offset", () => {
    const zoomed = zoomAt(noZoom, 3, { x: 700, y: 400 }, size);
    expect(zoomAt(zoomed, 1, { x: 100, y: 100 }, size)).toEqual(noZoom);
  });
});

describe("panBy", () => {
  test("moves within the zoomed frame", () => {
    const zoomed = { scale: 2, x: -400, y: -225 };
    expect(panBy(zoomed, 100, -50, size)).toEqual({ scale: 2, x: -300, y: -275 });
  });

  test("does not reveal empty space beyond the frame edges", () => {
    const zoomed = { scale: 2, x: -400, y: -225 };
    expect(panBy(zoomed, 1000, 1000, size)).toEqual({ scale: 2, x: 0, y: 0 });
    expect(panBy(zoomed, -1000, -1000, size)).toEqual({ scale: 2, x: -800, y: -450 });
  });

  test("cannot pan without zoom", () => {
    expect(panBy(noZoom, 50, 50, size)).toEqual(noZoom);
  });
});

describe("clampZoom", () => {
  test("fits offsets into a smaller frame after resize", () => {
    expect(clampZoom({ scale: 2, x: -1000, y: -1000 }, size)).toEqual({
      scale: 2,
      x: -800,
      y: -450,
    });
  });
});
