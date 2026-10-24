import { AppError } from '../middleware/errorHandler.js';

/**
 * Open-Meteo Weather Service
 * Connects to the official Open-Meteo Forecast API (https://api.open-meteo.com/v1/forecast)
 * Retrieves real-time atmospheric variables, hourly precipitation forecasts, and probabilities.
 * Includes in-memory caching to avoid rate-limiting and redundant external queries.
 */

// In-memory cache for weather responses (10 minutes TTL)
const weatherCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;

export function getWmoWeatherDescription(code) {
  switch (code) {
    case 0:
      return 'Clear Sky';
    case 1:
      return 'Mainly Clear';
    case 2:
      return 'Partly Cloudy';
    case 3:
      return 'Overcast';
    case 45:
    case 48:
      return 'Fog / Low Visibility';
    case 51:
      return 'Light Drizzle';
    case 53:
      return 'Moderate Drizzle';
    case 55:
      return 'Heavy Dense Drizzle';
    case 61:
      return 'Slight Rain';
    case 63:
      return 'Moderate Rain';
    case 65:
      return 'Heavy Rain Downpour';
    case 80:
      return 'Light Rain Showers';
    case 81:
      return 'Moderate Rain Showers';
    case 82:
      return 'Violent Rain Showers';
    case 95:
      return 'Thunderstorm';
    case 96:
    case 99:
      return 'Severe Thunderstorm with Hail';
    default:
      return 'Cloudy / Precipitation';
  }
}

class BackendWeatherService {
  /**
   * Fetches weather forecast from Open-Meteo for given coordinates
   * @param {Object} coords - { latitude, longitude }
   * @returns {Promise<Object>} Formatted weather payload
   */
  async getWeather({ latitude, longitude }) {
    const lat = Number(latitude);
    const lng = Number(longitude);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      throw new AppError('Invalid latitude. Must be a number between -90 and 90.', 400, 'INVALID_COORDINATES');
    }

    if (isNaN(lng) || lng < -180 || lng > 180) {
      throw new AppError('Invalid longitude. Must be a number between -180 and 180.', 400, 'INVALID_COORDINATES');
    }

    // Cache key rounded to ~110m resolution (3 decimals)
    const cacheKey = `${lat.toFixed(3)}_${lng.toFixed(3)}`;
    const now = Date.now();
    const cached = weatherCache.get(cacheKey);

    if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
      return {
        ...cached.data,
        cached: true,
        cacheAgeSeconds: Math.round((now - cached.timestamp) / 1000),
      };
    }

    const apiUrl = new URL('https://api.open-meteo.com/v1/forecast');
    apiUrl.searchParams.set('latitude', lat.toFixed(4));
    apiUrl.searchParams.set('longitude', lng.toFixed(4));
    apiUrl.searchParams.set('current', 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m');
    apiUrl.searchParams.set('hourly', 'precipitation_probability,precipitation,weather_code');
    apiUrl.searchParams.set('daily', 'precipitation_sum,precipitation_probability_max');
    apiUrl.searchParams.set('forecast_days', '2');
    apiUrl.searchParams.set('timezone', 'Asia/Kolkata');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    let response;
    try {
      response = await fetch(apiUrl.toString(), {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'FloodWatchKerala/1.0 (Hackathon Disaster Response Platform)',
        },
      });
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new AppError('Weather service timeout: Open-Meteo API took too long to respond.', 504, 'WEATHER_GATEWAY_TIMEOUT');
      }
      throw new AppError(`Weather provider network failure: ${err.message}`, 502, 'WEATHER_PROVIDER_ERROR');
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new AppError(
        `Open-Meteo returned error (${response.status}): ${errText || response.statusText}`,
        response.status >= 500 ? 502 : response.status,
        'WEATHER_API_ERROR'
      );
    }

    const raw = await response.json();

    // Parse hourly forecast starting from current time
    const hourlyTimes = raw.hourly?.time || [];
    const hourlyPrecip = raw.hourly?.precipitation || [];
    const hourlyProb = raw.hourly?.precipitation_probability || [];
    const hourlyCodes = raw.hourly?.weather_code || [];

    const currentTimeIso = raw.current?.time;
    let startIndex = 0;
    if (currentTimeIso) {
      const currentHourPrefix = currentTimeIso.slice(0, 13); // 'YYYY-MM-DDTHH'
      const matchIndex = hourlyTimes.findIndex((t) => t.startsWith(currentHourPrefix));
      if (matchIndex >= 0) {
        startIndex = matchIndex;
      }
    }

    // Extract next 24 hours
    const next24Hours = [];
    let accumulation24h = 0;

    for (let i = startIndex; i < Math.min(hourlyTimes.length, startIndex + 24); i++) {
      const p = Number(hourlyPrecip[i] || 0);
      accumulation24h += p;

      const dateObj = new Date(hourlyTimes[i]);
      const hourLabel = dateObj.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      next24Hours.push({
        time: hourlyTimes[i],
        hour_label: hourLabel,
        precipitation_mm: Math.round(p * 10) / 10,
        precipitation_probability_pct: hourlyProb[i] != null ? hourlyProb[i] : null,
        weather_code: hourlyCodes[i] != null ? hourlyCodes[i] : 0,
        weather_description: getWmoWeatherDescription(hourlyCodes[i]),
      });
    }

    const currentWeatherCode = raw.current?.weather_code ?? 0;

    const formatted = {
      coordinates: {
        latitude: lat,
        longitude: lng,
        elevation: raw.elevation || null,
      },
      current: {
        time: raw.current?.time || new Date().toISOString(),
        temperature_c: raw.current?.temperature_2m != null ? Math.round(raw.current.temperature_2m * 10) / 10 : null,
        apparent_temperature_c: raw.current?.apparent_temperature != null ? Math.round(raw.current.apparent_temperature * 10) / 10 : null,
        relative_humidity_pct: raw.current?.relative_humidity_2m ?? null,
        precipitation_mm: raw.current?.precipitation != null ? Math.round(raw.current.precipitation * 10) / 10 : 0,
        weather_code: currentWeatherCode,
        weather_description: getWmoWeatherDescription(currentWeatherCode),
        wind_speed_kmh: raw.current?.wind_speed_10m != null ? Math.round(raw.current.wind_speed_10m * 10) / 10 : null,
      },
      forecast_summary: {
        today_precipitation_sum_mm: raw.daily?.precipitation_sum?.[0] != null ? Math.round(raw.daily.precipitation_sum[0] * 10) / 10 : null,
        today_precipitation_probability_max_pct: raw.daily?.precipitation_probability_max?.[0] ?? null,
        tomorrow_precipitation_sum_mm: raw.daily?.precipitation_sum?.[1] != null ? Math.round(raw.daily.precipitation_sum[1] * 10) / 10 : null,
        next_24h_accumulation_mm: Math.round(accumulation24h * 10) / 10,
      },
      hourly_forecast: next24Hours,
      metadata: {
        provider: 'Open-Meteo Forecast API',
        model: 'Open-Meteo High-Resolution Atmospheric Numerical Weather Prediction',
        attribution: 'Weather forecast data by Open-Meteo.com under CC BY 4.0',
        license_url: 'https://open-meteo.com/en/features#terms',
        generation_time_ms: raw.generationtime_ms || null,
        timezone: raw.timezone || 'Asia/Kolkata',
        utc_offset_seconds: raw.utc_offset_seconds || 19800,
        fetched_at: new Date().toISOString(),
        disclaimer: 'Numerical weather prediction forecast. This is not in-situ stream sensor data or an official flood warning from KSDMA/IMD.',
      },
    };

    // Store in cache
    weatherCache.set(cacheKey, {
      timestamp: now,
      data: formatted,
    });

    // Limit cache size to prevent memory bloat
    if (weatherCache.size > 200) {
      const oldestKey = weatherCache.keys().next().value;
      weatherCache.delete(oldestKey);
    }

    return formatted;
  }
}

export const weatherService = new BackendWeatherService();
export default weatherService;
