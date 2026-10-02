import type { ComponentProps } from "react";

export function Alert({ className = "", ...props }: ComponentProps<"p">) {
  return (
    <p
      role="alert"
      {...props}
      className={`rounded-lg bg-danger-surface p-3 text-xs leading-relaxed text-danger ${className}`}
    />
  );
}
