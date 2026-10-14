import type { ReactNode } from "react";
import { Link } from "react-router";
import styles from "./Button.module.css";

type Variant = "primary" | "secondary" | "ghost" | "overlay";
type Size = "sm" | "md";

type CommonProps = {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  children?: ReactNode;
  label?: string;
};

function className({ variant = "secondary", size = "md", icon, children }: CommonProps) {
  return [styles.button, styles[variant], styles[size], icon && !children ? styles.iconOnly : ""]
    .filter(Boolean)
    .join(" ");
}

type ButtonProps = CommonProps & {
  onClick?: () => void;
  pressed?: boolean;
};

export function Button(props: ButtonProps) {
  return (
    <button
      type="button"
      className={className(props)}
      onClick={props.onClick}
      aria-label={props.label}
      aria-pressed={props.pressed}
    >
      {props.icon}
      {props.children}
    </button>
  );
}

type ButtonLinkProps = CommonProps & {
  to: string;
};

export function ButtonLink(props: ButtonLinkProps) {
  return (
    <Link to={props.to} className={className(props)} aria-label={props.label}>
      {props.icon}
      {props.children}
    </Link>
  );
}
