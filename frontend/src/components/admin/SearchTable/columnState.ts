export type ColumnStateEntry = {
  show?: boolean;
  order?: number;
  fixed?: 'left' | 'right';
  disable?: boolean | { checkbox: boolean };
};

export type FixedColumn = {
  key: string;
  fixed?: 'left' | 'right' | boolean;
};

export function enforceFixedColumnState(
  columns: FixedColumn[],
  state: Record<string, ColumnStateEntry>
) {
  const next = Object.fromEntries(Object.entries(state).map(([key, entry]) => {
    const { fixed: _discardedFixed, ...rest } = entry;
    return [key, rest];
  })) as Record<string, ColumnStateEntry>;
  for (const column of columns) {
    if (column.fixed !== 'left' && column.fixed !== 'right') continue;
    next[column.key] = { ...next[column.key], fixed: column.fixed };
  }
  return next;
}
