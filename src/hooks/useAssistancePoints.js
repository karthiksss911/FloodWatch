import { useState, useCallback, useEffect } from 'react';
import { assistanceService } from '../services/assistanceService.js';

/**
 * Custom hook to load and filter assistance points via assistanceService.
 */
export function useAssistancePoints(initialFilters = {}) {
  const [assistancePoints, setAssistancePoints] = useState(() =>
    assistanceService.getAllSync(initialFilters)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedAssistancePointId, setSelectedAssistancePointId] = useState(null);

  // Sync with API on mount asynchronously
  useEffect(() => {
    let isMounted = true;
    assistanceService.getAll().then((data) => {
      if (isMounted && Array.isArray(data) && data.length > 0) {
        setAssistancePoints(data);
      }
    }).catch((err) => {
      if (isMounted) console.warn('[useAssistancePoints] Initial API fetch warning:', err.message);
    });

    return () => {
      isMounted = false;
    };
  }, []);

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
