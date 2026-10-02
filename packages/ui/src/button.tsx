import type { ComponentProps } from "react";

export type ButtonVariant = "primary" | "outline" | "ghost";
const variants = {
  primary:
    "justify-between border-transparent bg-brand px-4.5 py-4 text-sm font-semibold text-white hover:bg-brand-hover",
  outline:
    "justify-center border-outline bg-transparent px-4 py-2.5 text-link hover:bg-success",
  ghost:
    "justify-center border-transparent bg-transparent p-0 text-xs text-toggle",
};

export function buttonStyles({
  variant = "primary",
  fullWidth = false,
  className = "",
}: { variant?: ButtonVariant; fullWidth?: boolean; className?: string } = {}) {
  return `inline-flex cursor-pointer items-center gap-3 rounded-lg border disabled:cursor-wait disabled:opacity-60 ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`;
}

export type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  loading?: boolean;
};

export function Button({
  variant,
  fullWidth,
  loading = false,
  disabled,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonStyles({ variant, fullWidth, className })}
    />
  );
}
