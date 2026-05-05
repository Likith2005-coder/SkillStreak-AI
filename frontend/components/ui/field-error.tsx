import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Inline field-level error. Larger and more visible than the previous
 * `text-xs` version — has an icon, slightly more padding, and asserts the
 * `role=alert` so screen readers announce it. Top sites use this same
 * pattern (Stripe, Notion, Linear).
 */
export function FieldError({
  message,
  className,
}: {
  message?: string;
  className?: string;
}) {
  if (!message) return null;
  return (
    <p
      className={cn(
        "mt-1.5 inline-flex items-center gap-1.5 text-[13px] font-medium text-destructive",
        className
      )}
      role="alert"
    >
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      {message}
    </p>
  );
}
