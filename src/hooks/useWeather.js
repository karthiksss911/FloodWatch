import { useState, useEffect, useCallback } from 'react';
import { weatherService } from '../services/weatherService.js';

/**
 * Custom React hook for live Open-Meteo weather and precipitation forecast.
 * Automatically fetches from the backend weather service and maintains loading/error states.
 */
export function useWeather({ latitude, longitude, autoRefreshMinutes = 15 } = {}) {
  const [weather, setWeather] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const latKey = latitude != null ? Number(latitude).toFixed(3) : 'default';
  const lngKey = longitude != null ? Number(longitude).toFixed(3) : 'default';

  const fetchWeather = useCallback(async () => {
    try {
      setError(null);
      const data = await weatherService.getWeather(latitude, longitude);
      setWeather(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.warn('[useWeather] Failed to fetch weather forecast:', err.message);
      setError(err.message || 'Unable to retrieve weather forecast.');
    } finally {
      setIsLoading(false);
    }
  }, [latitude, longitude]);

  useEffect(() => {
    let isMounted = true;

    weatherService
      .getWeather(latitude, longitude)
      .then((data) => {
        if (isMounted) {
          setWeather(data);
          setLastUpdated(new Date());
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn('[useWeather] Initial fetch error:', err.message);
          setError(err.message || 'Unable to connect to weather forecast service.');
          setIsLoading(false);
        }
      });

    // Auto-refresh interval
    const intervalMs = autoRefreshMinutes * 60 * 1000;
    const timer = setInterval(() => {
      fetchWeather();
    }, intervalMs);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latKey, lngKey, autoRefreshMinutes]);

  return {
    weather,
    isLoading,
    error,
    refreshWeather: fetchWeather,
    lastUpdated,
  };
}

export default useWeather;
