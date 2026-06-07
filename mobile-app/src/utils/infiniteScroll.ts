import { useRef } from 'react';

export function useInfiniteScrollHandlers(onLoadMore: () => void) {
  const endReachedDuringMomentum = useRef(true);

  return {
    onMomentumScrollBegin: () => {
      endReachedDuringMomentum.current = false;
    },
    onEndReached: () => {
      if (!endReachedDuringMomentum.current) {
        onLoadMore();
        endReachedDuringMomentum.current = true;
      }
    },
  };
}

export const LIST_PERFORMANCE_PROPS = {
  initialNumToRender: 15,
  maxToRenderPerBatch: 12,
  windowSize: 7,
} as const;
