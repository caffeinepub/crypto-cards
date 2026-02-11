/**
 * Promise-based sleep utility for pacing bot actions
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
