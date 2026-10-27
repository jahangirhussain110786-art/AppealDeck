/**
 * Whether the credits row should be moving, kept as a pure function so the rule is testable without
 * a DOM. Every input is something the component observes: whether the row is on screen, whether the
 * tab is hidden, whether the reader pressed pause, and whether they asked for reduced motion.
 *
 * Motion belongs to attention: the row is still until it is looked at, stops when it leaves the
 * viewport or the tab is in the background, and a manual pause survives all of those changes.
 */
export type CreditsMotionState = {
  visible: boolean;
  documentHidden: boolean;
  paused: boolean;
  reduced: boolean;
};

export function shouldDrift(state: CreditsMotionState): boolean {
  return state.visible && !state.documentHidden && !state.paused && !state.reduced;
}
