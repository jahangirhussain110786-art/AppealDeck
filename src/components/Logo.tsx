import Link from "next/link";
import { cn } from "@/lib/utils";
import { SHARED } from "@/content/shared";

// Same drawing as src/app/icon.svg, no plate: fill-foreground follows the theme in scope, so the
// navy sidebar and the light header share one mark. The iOS tile and OG image keep their plate.
export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      <rect
        x="13.05"
        y="1.42"
        width="16.56"
        height="20.7"
        rx="3.6"
        className="fill-foreground opacity-[0.34]"
      />
      <rect
        x="8.22"
        y="4.87"
        width="17.25"
        height="21.39"
        rx="3.6"
        className="fill-foreground opacity-[0.62]"
      />
      <rect x="2.7" y="8.31" width="18.63" height="22.77" rx="3.9" className="fill-foreground" />
      <path
        d="M7.39 20.6l3.86 3.86 7.31-8"
        fill="none"
        className="stroke-primary"
        strokeWidth="3.45"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ href = "/", size = "md" }: { href?: string; size?: "sm" | "md" | "lg" }) {
  // The mark's cards are one narrow shape against a bold ten-letter name, so matching them on ink
  // height still reads as a small icon (24 was visibly short beside the name). Set so the mark
  // measures about 1.5x the wordmark's ink, the usual lockup proportion: 28 beside 17px, 34 beside 20px.
  const px = size === "lg" ? 34 : size === "sm" ? 26 : 28;
  return (
    <Link
      href={href}
      aria-label={SHARED.brand.name}
      className="inline-flex items-center gap-1.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
