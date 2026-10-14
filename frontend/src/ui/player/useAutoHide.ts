import { useEffect, useRef, useState } from "react";

const hideDelay = 2500;

export function useAutoHide(canHide: boolean) {
  const [active, setActive] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = () => {
    setActive(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setActive(false), hideDelay);
  };

  const hide = () => {
    clearTimeout(timer.current);
    setActive(false);
  };

  useEffect(() => () => clearTimeout(timer.current), []);

  return { visible: active || !canHide, show, hide };
}
