import { useEffect, useRef } from 'react';

interface UsePollingRefetchOptions {
  enabled: boolean;
  interval?: number;
  onRefetch: () => void | Promise<void>;
}

/**
 * Hook that runs periodic polling (setInterval) for a provided refetch callback.
 * Pauses when the tab is not visible and cleans up on unmount.
 */
export function usePollingRefetch({ enabled, interval = 3000, onRefetch }: UsePollingRefetchOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isVisibleRef = useRef(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      if (isVisibleRef.current) {
        onRefetch();
      }
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, interval, onRefetch]);
}
