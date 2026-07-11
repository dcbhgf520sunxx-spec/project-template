export type PageResponse<T> = {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  viewCounts?: Record<string, number>;
};

export function mapPageResult<T, R>(response: PageResponse<T>, mapRecord: (record: T) => R) {
  return {
    list: response.list.map(mapRecord),
    total: response.total,
    page: response.page,
    pageSize: response.pageSize,
    viewCounts: response.viewCounts
  };
}
