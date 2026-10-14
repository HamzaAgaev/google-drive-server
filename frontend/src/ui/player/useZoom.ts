import { useEffect, useRef, useState, type PointerEvent, type RefObject } from "react";
import { noZoom, panBy, zoomAt, type Point, type ZoomState } from "./zoom";

const zoomStep = 1.25;
const dragThreshold = 4;

export function useZoom(
  surfaceRef: RefObject<HTMLDivElement | null>,
  onTap: (event: PointerEvent<HTMLDivElement>) => void,
) {
  const [zoom, setZoom] = useState<ZoomState>(noZoom);
  const pointers = useRef(new Map<number, Point>());
  const pinchDistance = useRef<number>(undefined);
  const gestureMoved = useRef(false);

  const surfaceRect = () => surfaceRef.current!.getBoundingClientRect();
  const relative = (point: Point, rect: DOMRect): Point => ({
    x: point.x - rect.left,
    y: point.y - rect.top,
  });

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      const rect = surface.getBoundingClientRect();
      const point = relative({ x: event.clientX, y: event.clientY }, rect);
      setZoom((state) => zoomAt(state, state.scale * Math.exp(-event.deltaY * 0.01), point, rect));
    };
    surface.addEventListener("wheel", onWheel, { passive: false });
    return () => surface.removeEventListener("wheel", onWheel);
  }, [surfaceRef]);

  const zoomBy = (factor: number) => {
    const rect = surfaceRect();
    const center = { x: rect.width / 2, y: rect.height / 2 };
    setZoom((state) => zoomAt(state, state.scale * factor, center, rect));
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (pointers.current.size === 0) gestureMoved.current = false;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (event.pointerType !== "touch") event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const previous = pointers.current.get(event.pointerId);
    if (!previous) return;
    const current = { x: event.clientX, y: event.clientY };
    pointers.current.set(event.pointerId, current);
    const rect = surfaceRect();

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const middle = relative({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, rect);
      if (pinchDistance.current) {
        const factor = distance / pinchDistance.current;
        setZoom((state) => zoomAt(state, state.scale * factor, middle, rect));
      }
      pinchDistance.current = distance;
      gestureMoved.current = true;
    } else if (pointers.current.size === 1 && zoom.scale > 1) {
      const dx = current.x - previous.x;
      const dy = current.y - previous.y;
      setZoom((state) => panBy(state, dx, dy, rect));
      if (Math.abs(dx) + Math.abs(dy) > dragThreshold) gestureMoved.current = true;
    }
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.delete(event.pointerId)) return;
    if (pointers.current.size < 2) pinchDistance.current = undefined;
    if (pointers.current.size === 0 && !gestureMoved.current) onTap(event);
  };

  const onPointerCancel = (event: PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId);
    pinchDistance.current = undefined;
    gestureMoved.current = true;
  };

  return {
    zoom,
    zoomIn: () => zoomBy(zoomStep),
    zoomOut: () => zoomBy(1 / zoomStep),
    resetZoom: () => setZoom(noZoom),
    pointerHandlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel },
  };
}
