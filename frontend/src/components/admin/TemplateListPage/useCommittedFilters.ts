import { useCallback, useState } from 'react';

function cloneFilters<T extends Record<string, unknown>>(filters: T): T {
  return Object.fromEntries(
    Object.entries(filters).map(([key, value]) => [key, Array.isArray(value) ? [...value] : value])
  ) as T;
}

export function useCommittedFilters<T extends Record<string, unknown>>(defaultFilters: T) {
  const [draftFilters, setDraftFilters] = useState<T>(() => cloneFilters(defaultFilters));
  const [appliedFilters, setAppliedFilters] = useState<T>(() => cloneFilters(defaultFilters));
  const [revision, setRevision] = useState(0);

  const commitFilters = useCallback(() => {
    setAppliedFilters(cloneFilters(draftFilters));
    setRevision((value) => value + 1);
  }, [draftFilters]);

  const resetFilters = useCallback(() => {
    const nextFilters = cloneFilters(defaultFilters);
    setDraftFilters(nextFilters);
    setAppliedFilters(cloneFilters(defaultFilters));
    setRevision((value) => value + 1);
  }, [defaultFilters]);

  return {
    draftFilters,
    appliedFilters,
    revision,
    setDraftFilters,
    commitFilters,
    resetFilters
  };
}
