import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PasswordInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label?: string;
  showToggle?: boolean;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, label, showToggle = true, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);

    return (
      <div className="relative">
        {label && <label className="block text-sm font-medium text-foreground mb-1">{label}</label>}
        <input
          type={visible ? "text" : "password"}
          ref={ref}
          className={cn(
            "flex w-full rounded-md border border-input bg-surface-1 text-sm text-foreground shadow-inset transition-[border-color,box-shadow] duration-[var(--dur-fast)] placeholder:text-muted-foreground/80 hover:border-foreground/25 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive/20",
            "h-10 px-3 py-2 pr-10",
            className,
          )}
          {...props}
        />
        {showToggle && (
          <button
            type="button"
            tabIndex={-1}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
          >
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
