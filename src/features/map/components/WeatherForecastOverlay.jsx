import { useState } from 'react';
import Icon from '../../../components/common/Icon';
import Button from '../../../components/common/Button';

/**
 * Live Weather & Rainfall Forecast Overlay for Leaflet Map
 * Integrates live Open-Meteo atmospheric forecast data.
 * Explains model limitations honestly: no spatial Doppler radar layer.
 */
export default function WeatherForecastOverlay({
  weather,
  isLoading,
  error,
  onRetry,
  locationName = 'Greater Kochi Basin',
  latitude = 9.9816,
  longitude = 76.2999,
  isOpen = true,
  onToggle,
}) {
  const [tab, setTab] = useState('summary'); // 'summary' | 'hourly' | 'disclaimer'

  if (!isOpen) {
    return (
      <div className="fw-map-weather-minimized">
        <button
          type="button"
          className="fw-map-weather-pill-btn"
          onClick={onToggle}
          title="Open Live Weather & Precipitation Forecast"
          aria-label="Open live weather and precipitation forecast"
        >
          <Icon name="cloud-rain" size={15} color="#38BDF8" />
          <span>
            {weather?.current?.temperature_c != null
              ? `${weather.current.temperature_c}°C • ${weather.current.weather_description}`
              : 'Live Weather Forecast'}
          </span>
          <span className="fw-weather-pill-tag">Open-Meteo</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fw-map-weather-panel" role="region" aria-label="Live Weather & Rainfall Forecast">
      {/* Panel Header */}
      <div className="fw-weather-panel-header">
        <div className="fw-weather-title-group">
          <div className="fw-weather-icon-badge">
            <Icon name="cloud-rain" size={16} color="#38BDF8" />
          </div>
          <div>
            <div className="fw-weather-header-row">
              <h4 className="fw-weather-title">Live Weather & Rainfall</h4>
              <span className="fw-weather-live-chip">Open-Meteo API</span>
            </div>
            <span className="fw-weather-coords">
              {locationName} &bull; [{Number(latitude).toFixed(4)}, {Number(longitude).toFixed(4)}]
            </span>
          </div>
        </div>

        <div className="fw-weather-header-actions">
          {typeof onRetry === 'function' && (
            <button
              type="button"
              className="fw-weather-icon-btn"
              onClick={onRetry}
              disabled={isLoading}
              title="Refresh weather data"
              aria-label="Refresh weather data"
            >
              <Icon name="rotate-ccw" size={13} className={isLoading ? 'fw-spinning' : ''} />
            </button>
          )}
          {typeof onToggle === 'function' && (
            <button
              type="button"
              className="fw-weather-icon-btn"
              onClick={onToggle}
              title="Minimize weather panel"
              aria-label="Minimize weather panel"
            >
              <Icon name="close" size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="fw-weather-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'summary'}
          className={`fw-weather-tab ${tab === 'summary' ? 'active' : ''}`}
          onClick={() => setTab('summary')}
        >
          Conditions & 24h
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'hourly'}
          className={`fw-weather-tab ${tab === 'hourly' ? 'active' : ''}`}
          onClick={() => setTab('hourly')}
        >
          Hourly Forecast
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'disclaimer'}
          className={`fw-weather-tab ${tab === 'disclaimer' ? 'active' : ''}`}
          onClick={() => setTab('disclaimer')}
        >
          Data & Limitations
        </button>
      </div>

      {/* Body Content */}
      <div className="fw-weather-panel-body">
        {/* Loading State */}
        {isLoading && !weather && (
          <div className="fw-weather-loading-box">
            <span className="fw-spinner" />
            <p>Fetching Open-Meteo forecast coordinates...</p>
          </div>
        )}

        {/* Error State */}
        {error && !weather && (
          <div className="fw-weather-error-box" role="alert">
            <Icon name="alert-triangle" size={18} color="#EF4444" />
            <div>
              <strong>Weather Forecast Unavailable</strong>
              <p>{error}</p>
            </div>
            {typeof onRetry === 'function' && (
              <Button variant="outline" size="sm" onClick={onRetry}>
                Retry
              </Button>
            )}
          </div>
        )}

        {/* Active Weather Data */}
        {weather && tab === 'summary' && (
          <div className="fw-weather-summary-view">
            {/* Current Conditions Bar */}
            <div className="fw-weather-current-hero">
              <div className="fw-current-temp-block">
                <span className="fw-current-temp-val">{weather.current?.temperature_c}&deg;C</span>
                <span className="fw-current-desc-val">{weather.current?.weather_description}</span>
              </div>
              <div className="fw-current-submetrics">
                <div className="fw-weather-submetric">
                  <span className="fw-metric-lbl">Feels Like:</span>
                  <span className="fw-metric-val">{weather.current?.apparent_temperature_c}&deg;C</span>
                </div>
                <div className="fw-weather-submetric">
                  <span className="fw-metric-lbl">Precipitation:</span>
                  <span className="fw-metric-val fw-precip-val">
                    {weather.current?.precipitation_mm} mm
                  </span>
                </div>
                <div className="fw-weather-submetric">
                  <span className="fw-metric-lbl">Humidity:</span>
                  <span className="fw-metric-val">{weather.current?.relative_humidity_pct}%</span>
                </div>
                <div className="fw-weather-submetric">
                  <span className="fw-metric-lbl">Wind Speed:</span>
                  <span className="fw-metric-val">{weather.current?.wind_speed_kmh} km/h</span>
                </div>
              </div>
            </div>

            {/* 24-Hour Forecast Summary Highlights */}
            <div className="fw-forecast-kpis">
              <div className="fw-forecast-kpi-item">
                <span className="fw-kpi-label">24h Predicted Rainfall</span>
                <span className="fw-kpi-num">
                  ~{weather.forecast_summary?.next_24h_accumulation_mm || 0} mm
                </span>
                <span className="fw-kpi-sub">Expected accumulation</span>
              </div>
              <div className="fw-forecast-kpi-item">
                <span className="fw-kpi-label">Max Rain Probability</span>
                <span className="fw-kpi-num">
                  {weather.forecast_summary?.today_precipitation_probability_max_pct ?? '--'}%
                </span>
                <span className="fw-kpi-sub">Atmospheric likelihood</span>
              </div>
            </div>

            {/* Radar Limitation Notice */}
            <div className="fw-weather-radar-notice">
              <Icon name="info" size={13} color="#38BDF8" />
              <span>
                <strong>Note:</strong> Doppler spatial radar imagery is unlinked. Values represent numerical atmospheric model forecasts, not ground stream gauge measurements.
              </span>
            </div>
          </div>
        )}

        {/* Hourly Forecast Tab */}
        {weather && tab === 'hourly' && (
          <div className="fw-weather-hourly-view">
            <span className="fw-hourly-heading">Next 24 Hours Precipitation Forecast (Open-Meteo)</span>
            <div className="fw-hourly-list" tabIndex={0} aria-label="Hourly precipitation predictions">
              {(weather.hourly_forecast || []).map((h) => {
                const isRainy = (h.precipitation_mm || 0) > 0;
                return (
                  <div key={h.time} className={`fw-hourly-row ${isRainy ? 'has-rain' : ''}`}>
                    <span className="fw-hourly-time">{h.hour_label}</span>
                    <span className="fw-hourly-desc">{h.weather_description}</span>
                    <div className="fw-hourly-metrics">
                      <span className="fw-hourly-prob">
                        {h.precipitation_probability_pct != null ? `${h.precipitation_probability_pct}%` : '--'}
                      </span>
                      <span className={`fw-hourly-precip ${isRainy ? 'precip-active' : ''}`}>
                        {h.precipitation_mm} mm
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Data & Limitations Tab */}
        {tab === 'disclaimer' && (
          <div className="fw-weather-disclaimer-view">
            <div className="fw-disc-item">
              <strong>Source & Attribution:</strong>
              <p>
                Weather and precipitation forecasts provided by{' '}
                <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer">
                  Open-Meteo.com
                </a>{' '}
                under the{' '}
                <a
                  href="https://creativecommons.org/licenses/by/4.0/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Creative Commons Attribution 4.0 International (CC BY 4.0)
                </a>{' '}
                license.
              </p>
            </div>

            <div className="fw-disc-item">
              <strong>Forecast vs Sensor Data:</strong>
              <p>
                All rainfall and precipitation figures are <em>numerical model forecasts</em>, not physical sensor
                or stream-gauge measurements. Forecast precipitation must never be cited as verified historical rainfall.
              </p>
            </div>

            <div className="fw-disc-item">
              <strong>Official Emergency Alerts:</strong>
              <p>
                This weather feature does NOT replace official weather warnings or alerts issued by the{' '}
                <strong>India Meteorological Department (IMD)</strong> or the{' '}
                <strong>Kerala State Disaster Management Authority (KSDMA)</strong>.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Panel Footer */}
      <div className="fw-weather-panel-footer">
        <span className="fw-weather-attr">
          Data: Open-Meteo (CC BY 4.0) &bull; Model Time:{' '}
          {weather?.current?.time
            ? new Date(weather.current.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '--'}
        </span>
      </div>
    </div>
  );
}
