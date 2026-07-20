import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-electric/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric/30",
        className,
      )}
      {...props}
    />
  );
}
