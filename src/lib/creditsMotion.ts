/**
 * Whether the credits row should be moving, kept as a pure function so the rule is testable without
 * a DOM. Every input is something the component observes: whether the row is on screen, whether the
 * tab is hidden, and whether the pointer or keyboard focus is resting on it.
 *
 * Motion belongs to attention: the row is still until it is looked at, stops when it leaves the
 * viewport or the tab is in the background, and holds still while the reader's pointer is on it —
 * hovering is the reader reaching for a name, so the row waits (27 Oct 2026, founder: no pause
 * button; pointer over the row pauses it, moving away continues it).
 *
 * The OS animation setting is deliberately not an input. On the founder's machine Windows reports
 * animations off, which Chrome maps to prefers-reduced-motion — yet the strips he compared us with
 * move anyway, because they never read the preference. So the row moves for every reader; the
 * pointer is the off switch.
 */
export type CreditsMotionState = {
  visible: boolean;
  documentHidden: boolean;
  paused: boolean;
};

export function shouldDrift(state: CreditsMotionState): boolean {
  return state.visible && !state.documentHidden && !state.paused;
}
