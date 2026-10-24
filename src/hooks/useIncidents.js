import { useState, useCallback, useEffect } from 'react';
import { incidentService } from '../services/incidentService.js';

/**
 * Custom hook to manage incident state via incidentService adapter.
 * Encapsulates synchronous initial state, optimistic updates, and persistent mutations.
 */
export function useIncidents() {
  const [incidents, setIncidents] = useState(() => incidentService.getAllSync());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState(null);

  // Sync with API on mount asynchronously
  useEffect(() => {
    let isMounted = true;

    incidentService
      .getAll()
      .then((data) => {
        if (isMounted) {
          setIncidents(Array.isArray(data) ? data : []);
          if (Array.isArray(data) && data.length > 0) {
            setSelectedIncidentId((prev) => prev || data[0].id);
          }
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('[useIncidents] Initial API fetch failed:', err.message);
          setError(err.message || 'Unable to connect to live incident database');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Reload incidents from service
  const reloadIncidents = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await incidentService.getAll();
      setIncidents(data);
      if (data.length > 0 && !selectedIncidentId) {
        setSelectedIncidentId(data[0].id);
      }
    } catch (err) {
      console.error('[useIncidents] Failed to load incidents:', err);
      setError(err.message || 'Failed to load incidents');
    } finally {
      setIsLoading(false);
    }
  }, [selectedIncidentId]);

  // Create a new incident report
  const addIncident = useCallback(async (newIncidentData) => {
    try {
      const created = await incidentService.create(newIncidentData);
      setIncidents((prev) => [created, ...prev]);
      setSelectedIncidentId(created.id);
      return created;
    } catch (err) {
      console.error('[useIncidents] Failed to create incident:', err);
      throw err;
    }
  }, []);

  // Update status and verification from authority review console
  const updateIncidentStatus = useCallback(
    async (id, newVerification, newStatus, historyEntry) => {
      try {
        const updated = await incidentService.updateStatus(
          id,
          newVerification,
          newStatus,
          historyEntry
        );
        if (updated) {
          setIncidents((prev) =>
            prev.map((item) => (item.id === id ? updated : item))
          );
        }
        return updated;
      } catch (err) {
        console.error('[useIncidents] Failed to update incident status:', err);
        throw err;
      }
    },
    []
  );

  // Reset incidents back to baseline demo dataset
  const resetDemoIncidents = useCallback(async () => {
    try {
      const resetList = await incidentService.resetDemoData();
      setIncidents(resetList);
      if (resetList.length > 0) {
        setSelectedIncidentId(resetList[0].id);
      }
      return resetList;
    } catch (err) {
      console.error('[useIncidents] Failed to reset demo incidents:', err);
      throw err;
    }
  }, []);

  return {
    incidents,
    isLoading,
    error,
    selectedIncidentId,
    setSelectedIncidentId,
    addIncident,
    updateIncidentStatus,
    resetDemoIncidents,
    reloadIncidents,
  };
}

export default useIncidents;
