import { useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./Menu.module.css";

export type MenuItem = {
  value: string;
  label: string;
};

type Props = {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  items: MenuItem[];
  value: string;
  onSelect: (value: string) => void;
  placement?: "top" | "bottom";
  onOpenChange?: (open: boolean) => void;
};

export function Menu({
  trigger,
  items,
  value,
  onSelect,
  placement = "bottom",
  onOpenChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onOpenChange?.(open);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = (event: Event) => {
      if (event instanceof KeyboardEvent && event.key !== "Escape") return;
      if (event.target instanceof Node && rootRef.current?.contains(event.target)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={styles.root}>
      {trigger({ open, toggle: () => setOpen((current) => !current) })}
      {open && (
        <ul className={`${styles.menu} ${styles[placement]}`} role="menu">
          {items.map((item) => (
            <li key={item.value}>
              <button
                type="button"
                role="menuitemradio"
                aria-checked={item.value === value}
                className={styles.item}
                onClick={() => {
                  onSelect(item.value);
                  setOpen(false);
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
