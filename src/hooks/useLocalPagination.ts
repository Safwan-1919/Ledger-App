import { useCallback, useState } from 'react';

/** Simple client-side pagination for an already-filtered in-memory array. */
export function useLocalPagination<T>(data: T[], pageSize = 25) {
  const [count, setCount] = useState(pageSize);

  const loadMore = useCallback(() => {
    setCount((c) => c + pageSize);
  }, [pageSize]);

  const visible = data.slice(0, count);
  const hasMore = count < data.length;

  const reset = useCallback(() => setCount(pageSize), [pageSize]);

  return { visible, hasMore, loadMore, reset, total: data.length };
}
