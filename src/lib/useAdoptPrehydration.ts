import { useCallback, type Dispatch, type SetStateAction } from "react";

/**
 * A box someone filled in before the page was interactive.
 *
 * A pasted notice, an email, a password the browser filled in: on a slow connection a seller can
 * act on the page a second or two before its JavaScript arrives. What happens next depends on the
 * browser. Chromium and Firefox keep the text and let React pick it up. Safari's engine (WebKit)
 * either keeps the text in a box React believes is empty, so the Decode button never enables,
 * or, for a controlled input, wipes it the moment React takes over (found 7 Oct 2026 by running
 * the end-to-end suite in WebKit: 33 tests failed, all one cause).
 *
 * The fix is to adopt what is already in the box. Use this as the element's `ref`: it runs once, when
 * React takes the element over, and hands any text the element already holds to the state. For a
 * text box React controls, keep `value`; for an input a browser may autofill or wipe, drop `value`
 * (use `defaultValue`) so React has nothing to overwrite, and keep `onChange` to follow later edits.
 * Text already in state wins, so a restored draft is never replaced by an empty box.
 */
export function useAdoptPrehydration(setValue: Dispatch<SetStateAction<string>>) {
  return useCallback(
    (el: HTMLInputElement | HTMLTextAreaElement | null) => {
      if (el && el.value) setValue((current) => current || el.value);
    },
    [setValue],
  );
}
