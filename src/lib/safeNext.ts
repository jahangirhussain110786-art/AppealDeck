export function safeNext(explicitNext: string | null, origin: string): string {
  if (!explicitNext) return "/dashboard";
  if (
    !explicitNext.startsWith("/") ||
    explicitNext.startsWith("//") ||
    explicitNext.startsWith("/\\")
  ) {
    return "/dashboard";
  }
  try {
    if (new URL(explicitNext, origin).origin !== origin) {
      return "/dashboard";
    }
  } catch {
    return "/dashboard";
  }
  return explicitNext;
}
