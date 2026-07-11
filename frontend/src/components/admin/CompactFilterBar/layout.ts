export function getCollapsedVisibleCount(itemCount: number, configuredVisibleCount: number, columnsPerRow: number) {
  return Math.min(itemCount, configuredVisibleCount, Math.max(1, columnsPerRow));
}
