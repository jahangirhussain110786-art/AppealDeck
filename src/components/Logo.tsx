import Link from "next/link";
import { cn } from "@/lib/utils";
import { SHARED } from "@/content/shared";

export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      <rect width="32" height="32" rx="8" className="fill-brand" />
      <rect x="14" y="5.5" width="12" height="15" rx="2.6" className="fill-white opacity-[0.38]" />
      <rect
        x="10.5"
        y="8"
        width="12.5"
        height="15.5"
        rx="2.6"
        className="fill-white opacity-[0.66]"
      />
      <rect x="6.5" y="10.5" width="13.5" height="16.5" rx="2.8" className="fill-white" />
      <path
        d="M9.9 19.4l2.8 2.8 5.3-5.8"
        fill="none"
        className="stroke-brand"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ href = "/", size = "md" }: { href?: string; size?: "sm" | "md" | "lg" }) {
  const px = size === "lg" ? 36 : size === "sm" ? 24 : 28;
  return (
    <Link
      href={href}
      aria-label={SHARED.brand.name}
      className="inline-flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <LogoMark size={px} />
      <span
        className={cn(
          "font-semibold tracking-tight text-foreground",
          size === "lg" ? "text-xl" : "text-[1.0625rem]",
        )}
      >
        Appeal<span className="text-primary">Deck</span>
      </span>
    </Link>
  );
}
