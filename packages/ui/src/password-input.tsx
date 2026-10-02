"use client";
import { useState } from "react";
import { Button } from "./button";
import { Input, type InputProps } from "./input";

export function PasswordInput({
  className = "",
  ...props
}: Omit<InputProps, "type">) {
  const [visible, setVisible] = useState(false);
  return (
    <span className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        className={`pr-16 ${className}`}
      />
      <Button
        variant="ghost"
        className="absolute top-0 right-3 h-full"
        onClick={() => setVisible(!visible)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        disabled={props.disabled}
      >
        {visible ? "Hide" : "Show"}
      </Button>
    </span>
  );
}
