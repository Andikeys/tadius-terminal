import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-lg border bg-white/[0.03] px-3 font-body text-sm text-white placeholder:text-tadius-gray-dim transition-shadow duration-200 focus:outline-none focus:ring-2 focus:ring-tadius-green-500/30",
        error
          ? "border-red-500/50 focus:border-red-500/70"
          : "border-white/[0.08] focus:border-tadius-green-500/60",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
