import { useState, useCallback, useEffect } from 'react';
import { assistanceService } from '../services/assistanceService.js';

/**
 * Custom hook to load and filter assistance points via assistanceService.
 */
export function useAssistancePoints(initialFilters = {}) {
  const [assistancePoints, setAssistancePoints] = useState(() =>
    assistanceService.getAllSync(initialFilters)
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAssistancePointId, setSelectedAssistancePointId] = useState(null);

  const filterKey = JSON.stringify(initialFilters);

  // Sync with API on mount asynchronously
  useEffect(() => {
    let isMounted = true;

    assistanceService
      .getAll(initialFilters)
      .then((data) => {
        if (isMounted) {
          setAssistancePoints(Array.isArray(data) ? data : []);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('[useAssistancePoints] Initial API fetch failed:', err.message);
          setError(err.message || 'Unable to connect to assistance points directory');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  const reloadPoints = useCallback(async (filters = {}) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await assistanceService.getAll(filters);
      setAssistancePoints(data);
    } catch (err) {
      console.error('[useAssistancePoints] Failed to load assistance points:', err);
      setError(err.message || 'Failed to load assistance points');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    assistancePoints,
    isLoading,
    error,
    selectedAssistancePointId,
    setSelectedAssistancePointId,
    reloadPoints,
  };
}

export default useAssistancePoints;
