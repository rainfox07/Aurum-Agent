import React from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
  iconOnly?: boolean;
  children: ReactNode;
};

export function Button({ variant = "secondary", iconOnly = false, className = "", children, ...props }: ButtonProps) {
  return (
    <button
      className={`button ${variant === "primary" ? "primary" : ""} ${iconOnly ? "icon-button" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
