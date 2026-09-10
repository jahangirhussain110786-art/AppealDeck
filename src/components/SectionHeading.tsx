import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div className={cn(align === "center" && "text-center", className)}>
      {eyebrow && <p className="text-eyebrow uppercase text-primary">{eyebrow}</p>}
      <h2 className="mt-3 text-balance text-h2 text-foreground">{title}</h2>
      {description && (
        <p className="mt-3 max-w-prose text-base text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
