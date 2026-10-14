export type ZoomState = {
  scale: number;
  x: number;
  y: number;
};

export type Point = {
  x: number;
  y: number;
};

export type Size = {
  width: number;
  height: number;
};

export const noZoom: ZoomState = { scale: 1, x: 0, y: 0 };
export const minScale = 1;
export const maxScale = 6;

export function clampZoom(state: ZoomState, size: Size): ZoomState {
  const scale = Math.min(maxScale, Math.max(minScale, state.scale));
  return {
    scale,
    x: Math.min(0, Math.max(size.width * (1 - scale), state.x)),
    y: Math.min(0, Math.max(size.height * (1 - scale), state.y)),
  };
}

export function zoomAt(state: ZoomState, scale: number, point: Point, size: Size): ZoomState {
  const target = Math.min(maxScale, Math.max(minScale, scale));
  const ratio = target / state.scale;
  return clampZoom(
    {
      scale: target,
      x: point.x - (point.x - state.x) * ratio,
      y: point.y - (point.y - state.y) * ratio,
    },
    size,
  );
}

export function panBy(state: ZoomState, dx: number, dy: number, size: Size): ZoomState {
  return clampZoom({ ...state, x: state.x + dx, y: state.y + dy }, size);
}
