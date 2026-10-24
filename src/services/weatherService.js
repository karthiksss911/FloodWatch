/**
 * Weather Service connecting to Express backend (/api/v1/weather)
 * Powered by Open-Meteo Weather Forecast API.
 * Provides live atmospheric variables and 24h precipitation forecasts.
 */

const API_BASE = 'http://localhost:5000/api/v1';

class WeatherService {
  constructor(baseUrl = API_BASE) {
    this.baseUrl = baseUrl;
  }

  /**
   * Fetches weather data for coordinates
   * @param {number} latitude
   * @param {number} longitude
   * @returns {Promise<Object>} Weather payload
   */
  async getWeather(latitude, longitude) {
    const params = new URLSearchParams();
    if (latitude != null) params.set('latitude', latitude);
    if (longitude != null) params.set('longitude', longitude);

    const url = `${this.baseUrl}/weather?${params.toString()}`;

    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      const msg = errorBody.error?.message || `Weather service responded with status ${res.status}`;
      throw new Error(msg);
    }

    const data = await res.json();
    return data.data;
  }
}

export const weatherService = new WeatherService();
export default weatherService;
