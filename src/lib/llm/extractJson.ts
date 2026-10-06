/**
 * Pulls the first JSON object out of a model's text. The text is meant to be JSON only, but a model
 * sometimes wraps it in a code fence or adds a closing remark, and slicing from the first "{" to the
 * LAST "}" broke the moment that remark held a brace ("...{see above}"). This walks the text from
 * each "{" with a balanced-brace scan that knows about strings, and returns the first span that
 * parses (6 Oct 2026).
 */
export function extractJsonObject(text: string): unknown | undefined {
  let from = text.indexOf("{");
  while (from >= 0) {
    const end = balancedEnd(text, from);
    if (end > from) {
      try {
        return JSON.parse(text.slice(from, end + 1));
      } catch {
        // Not JSON; try the next opening brace.
      }
    }
    from = text.indexOf("{", from + 1);
  }
  return undefined;
}

/** Index of the "}" that closes the "{" at `start`, or -1. Braces inside strings do not count. */
function balancedEnd(text: string, start: number): number {
  let depth = 0;
  let inString = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i]!;
    if (inString) {
      if (c === "\\") i++;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') inString = true;
    else if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}
