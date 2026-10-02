import type { ComponentProps } from "react";

export function Field({ className = "", ...props }: ComponentProps<"label">) {
  return (
    <label
      {...props}
      className={`flex flex-col gap-2 text-xs font-semibold ${className}`}
    />
  );
}
