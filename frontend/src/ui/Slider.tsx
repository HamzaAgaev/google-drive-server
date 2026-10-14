import type { CSSProperties } from "react";
import styles from "./Slider.module.css";

type Props = {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  label: string;
  onChange: (value: number) => void;
};

export function Slider({ value, min = 0, max = 1, step = 0.01, label, onChange }: Props) {
  const percent = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return (
    <input
      className={styles.slider}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      aria-label={label}
      style={{ "--fill": `${percent}%` } as CSSProperties}
      onChange={(event) => onChange(Number(event.target.value))}
    />
  );
}
