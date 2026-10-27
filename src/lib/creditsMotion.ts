/**
 * Whether the credits row should be moving, kept as a pure function so the rule is testable without
 * a DOM. Every input is something the component observes: whether the row is on screen, whether the
 * tab is hidden, and whether the reader pressed pause.
 *
 * Motion belongs to attention: the row is still until it is looked at, stops when it leaves the
 * viewport or the tab is in the background, and a manual pause survives all of those changes.
 *
 * The OS animation setting is deliberately not an input. On the founder's machine Windows reports
 * animations off, which Chrome maps to prefers-reduced-motion — yet the strips he compared us with
 * move anyway, because they never read the preference. So on 27 Oct 2026 he ruled that this row
 * moves for every reader; the pause button, not the OS, is the off switch.
 */
export type CreditsMotionState = {
  visible: boolean;
  documentHidden: boolean;
  paused: boolean;
};

export function shouldDrift(state: CreditsMotionState): boolean {
  return state.visible && !state.documentHidden && !state.paused;
}
