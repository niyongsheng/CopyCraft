export const NARROW_BREAKPOINT = 900;

/** True when the window is too narrow to show both side panels at once. */
export function isNarrowViewport(): boolean {
  return window.innerWidth < NARROW_BREAKPOINT;
}
