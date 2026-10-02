import type { ComponentProps } from "react";

export type InputProps = ComponentProps<"input">;
export function Input({ className = "", ...props }: InputProps) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-input-border bg-white p-4 text-sm font-normal text-ink outline-none placeholder:text-placeholder focus:border-input-focus focus:shadow-input disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    />
  );
}
