import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-electric/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric/30",
        className,
      )}
      {...props}
    />
  );
}
