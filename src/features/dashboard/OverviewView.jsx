import Icon from '../../components/common/Icon';
import Card from '../../components/common/Card';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { useWeather } from '../../hooks/useWeather';

// Greater Kochi geographic monitoring sectors
const MONITORING_SECTORS = [
  { id: 'aluva', name: 'Aluva - Lower Periyar Basin', catchment: 'Periyar River & Barrage' },
  { id: 'kaloor', name: 'Kaloor - Palarivattom Metro Corridor', catchment: 'Thevara-Perandoor Canal' },
  { id: 'edappally', name: 'Edappally - Kalamassery Industrial Belt', catchment: 'Edappally Canal & NH-66' },
  { id: 'vyttila', name: 'Vyttila - Kadavanthra Lowlands', catchment: 'Champakkara Canal' },
  { id: 'kakkanad', name: 'Kakkanad - Infopark Watershed', catchment: 'Chitrapuzha & Kadamprayar' },
];

/**
 * Situation Overview Dashboard (Features/Dashboard)
 * Displays live KPIs, actual incident reports, and support facilities fetched from Supabase.
 * Fabricated telemetry and fake data have been removed.
 */
export default function OverviewView({
  incidents = [],
  assistancePoints = [],
  isLoading = false,
  error = null,
  onRetry,
  onNavigate,
}) {
  const {
    weather,
    isLoading: weatherLoading,
    error: weatherError,
    refreshWeather,
  } = useWeather({ latitude: 9.9816, longitude: 76.2999 });

  const activeIncidents = incidents.filter((i) => i.status === 'active');
  const severeCount = incidents.filter((i) => i.severity === 'severe').length;
  const highCount = incidents.filter((i) => i.severity === 'high').length;
  const verifiedCount = incidents.filter(
    (i) => i.verification_status === 'verified_official' || i.verification_status === 'community_confirmed'
  ).length;

  // Find the highest severity active incident for the top ticker
  const topCriticalIncident =
    activeIncidents.find((i) => i.severity === 'severe') ||
    activeIncidents.find((i) => i.severity === 'high') ||
    activeIncidents[0] ||
    null;

  return (
    <div className="fw-overview-view">
      {/* Alert Notification Ticker */}
      <div className="fw-alert-ticker" role="region" aria-label="Live situational advisory">
        <div className="fw-ticker-icon">
          <Icon name="alert-triangle" size={16} color={topCriticalIncident ? '#EF4444' : '#10B981'} />
        </div>
        <div className="fw-ticker-text">
          {error ? (
            <span style={{ color: '#DC2626' }}>
              <strong>DATABASE CONNECTION NOTICE:</strong> Unable to synchronize with Supabase. Please ensure your Express backend and network connection are active.
            </span>
          ) : topCriticalIncident ? (
            <span>
              <strong>ACTIVE HAZARD ADVISORY:</strong> {topCriticalIncident.severity.toUpperCase()} waterlogging reported at{' '}
              <em>{topCriticalIncident.location_label}</em>. Passability:{' '}
              {topCriticalIncident.passable_for || 'Exercise caution'}.
            </span>
          ) : (
            <span>
              <strong>MONITORED CORRIDORS CLEAR:</strong> No active hazard reports currently registered in the database for Greater Kochi. Drive with caution during rainfall.
            </span>
          )}
        </div>
        {error && typeof onRetry === 'function' ? (
          <Button
            variant="outline"
            size="sm"
            icon="activity"
            onClick={onRetry}
            className="fw-ticker-btn"
          >
            Retry Connection
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            icon="map"
            onClick={() => onNavigate('map')}
            className="fw-ticker-btn"
            aria-label="View incidents on map"
          >
            View on Map
          </Button>
        )}
      </div>

      {/* KPI Stat Cards Grid */}
      <section className="fw-kpi-grid" aria-label="Key operational indicators">
        <StatCard
          label="Active Hazard Reports"
          value={isLoading ? '...' : activeIncidents.length}
          subtext={isLoading ? 'Loading records...' : `${severeCount} severe, ${highCount} high risk`}
          icon="activity"
          trend="Live Database"
          trendDirection="neutral"
          variant="cyan"
        />
        <StatCard
          label="Impassable Roadways"
          value={isLoading ? '...' : severeCount}
          subtext="Severe inundation points"
          icon="shield-alert"
          trend={severeCount > 0 ? 'Hazard Alert' : 'No Critical Closures'}
          trendDirection={severeCount > 0 ? 'danger' : 'neutral'}
          variant="danger"
        />
        <StatCard
          label="Verified Reports"
          value={isLoading ? '...' : `${verifiedCount}/${incidents.length}`}
          subtext="Official or community-verified"
          icon="check-circle"
          trend="Triage Confirmed"
          trendDirection="neutral"
          variant="emerald"
        />
        <StatCard
          label="Emergency Shelters"
          value={isLoading ? '...' : assistancePoints.length}
          subtext="Registered relief centers"
          icon="shield-check"
          trend="Directory Active"
          trendDirection="neutral"
          variant="warning"
        />
      </section>

      {/* Main Two-Column Dashboard Content */}
      <div className="fw-dashboard-layout">
        {/* Left Column: Recent Incidents Feed */}
        <div className="fw-dash-col-main">
          <Card
            title="Real-Time Field Reports & Surface Inundation"
            subtitle="Geospatial reports fetched directly from Supabase PostgreSQL database"
            icon={<Icon name="activity" size={18} color="#06B6D4" />}
            badge={
              <Badge severity={activeIncidents.length > 0 ? 'high' : 'low'}>
                <span className="fw-pulse-dot fw-dot-amber" /> Live Database Stream
              </Badge>
            }
            actions={
              <Button
                variant="outline"
                size="sm"
                icon="plus-circle"
                onClick={() => onNavigate('report')}
              >
                Report New Incident
              </Button>
            }
          >
            <div className="fw-incident-feed">
              {isLoading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>
                  <Icon name="activity" size={24} color="#38BDF8" />
                  <p style={{ marginTop: '0.5rem' }}>Loading live incident records from Supabase...</p>
                </div>
              ) : error ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#F87171' }}>
                  <Icon name="alert-triangle" size={24} color="#EF4444" />
                  <p style={{ marginTop: '0.5rem', fontWeight: 600 }}>Failed to load incidents from backend</p>
                  <p style={{ fontSize: '0.875rem', color: '#94A3B8', marginTop: '0.25rem' }}>{error}</p>
                  {typeof onRetry === 'function' && (
                    <Button variant="outline" size="sm" onClick={onRetry} style={{ marginTop: '1rem' }}>
                      Retry
                    </Button>
                  )}
                </div>
              ) : incidents.length === 0 ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: '#94A3B8' }}>
                  <Icon name="check-circle" size={28} color="#10B981" />
                  <h4 style={{ color: '#F8FAFC', marginTop: '0.75rem', marginBottom: '0.25rem' }}>
                    No Incident Reports in Database
                  </h4>
                  <p style={{ fontSize: '0.875rem', maxWidth: '380px', margin: '0 auto 1.25rem' }}>
                    There are currently no active flood, road blockage, or waterlogging reports registered in the database.
                  </p>
                  <Button variant="primary" size="sm" icon="plus-circle" onClick={() => onNavigate('report')}>
                    Submit First Citizen Report
                  </Button>
                </div>
              ) : (
                incidents.slice(0, 6).map((incident) => (
                  <article
                    key={incident.id}
                    className="fw-incident-row fw-incident-clickable"
                    onClick={() => onNavigate('map', incident.id)}
                    tabIndex={0}
                    role="button"
                    aria-label={`View ${incident.title} on map`}
                  >
                    <div className="fw-inc-left">
                      <div className="fw-inc-header">
                        <Badge severity={incident.severity}>{incident.severity.toUpperCase()}</Badge>
                        <span className="fw-inc-time">
                          {new Date(incident.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="fw-inc-id">{incident.id}</span>
                      </div>
                      <h4 className="fw-inc-title">{incident.title}</h4>
                      <p className="fw-inc-loc">
                        <Icon name="map-pin" size={12} color="#94A3B8" /> {incident.location_label}
                        {incident.latitude && incident.longitude && (
                          <span style={{ marginLeft: '0.5rem', opacity: 0.6 }}>
                            [{Number(incident.latitude).toFixed(4)}, {Number(incident.longitude).toFixed(4)}]
                          </span>
                        )}
                      </p>
                      {incident.description && <p className="fw-inc-desc">{incident.description}</p>}
                    </div>

                    <div className="fw-inc-right">
                      {incident.water_depth_cm > 0 && (
                        <div className="fw-inc-depth">
                          <span className="fw-depth-val">{incident.water_depth_cm}</span>
                          <span className="fw-depth-unit">cm depth</span>
                        </div>
                      )}
                      <div className="fw-inc-status">
                        <span
                          className={`fw-status-badge ${
                            incident.verification_status === 'verified_official'
                              ? 'fw-st-verified'
                              : incident.verification_status === 'community_confirmed'
                              ? 'fw-st-confirmed'
                              : 'fw-st-unverified'
                          }`}
                        >
                          {incident.verification_status === 'verified_official'
                            ? 'Official Verified'
                            : incident.verification_status === 'community_confirmed'
                            ? 'Community Confirmed'
                            : 'Unverified Citizen Report'}
                        </span>
                      </div>
                      {incident.passable_for && (
                        <div className="fw-inc-passable">
                          <Icon name="navigation" size={12} color="#06B6D4" />
                          <span>{incident.passable_for}</span>
                        </div>
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Telemetry & Assistance Hubs */}
        <div className="fw-dash-col-side">
          {/* Live Open-Meteo Weather & Rainfall Forecast Card */}
          <Card
            title="Live Weather & Rainfall Forecast"
            subtitle="Open-Meteo numerical model • Greater Kochi, Kerala"
            icon={<Icon name="cloud-rain" size={18} color="#38BDF8" />}
            badge={
              <Badge severity={weatherError ? 'danger' : 'info'}>
                <span className={`fw-pulse-dot ${weatherError ? 'fw-dot-amber' : 'fw-dot-cyan'}`} />
                {weatherLoading && !weather ? 'Updating Model...' : weatherError ? 'Model Offline' : 'Live Open-Meteo'}
              </Badge>
            }
            actions={
              <div style={{ display: 'flex', gap: '6px' }}>
                <Button
                  variant="ghost"
                  size="sm"
                  icon="refresh"
                  onClick={refreshWeather}
                  aria-label="Refresh live weather forecast"
                  title="Refresh weather data"
                />
                <Button
                  variant="outline"
                  size="sm"
                  icon="map"
                  onClick={() => onNavigate('map')}
                  title="Open interactive map with weather forecast"
                >
                  Map View
                </Button>
              </div>
            }
          >
            <div className="fw-overview-weather-panel">
              {weatherLoading && !weather ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94A3B8' }}>
                  <Icon name="cloud-rain" size={24} color="#38BDF8" />
                  <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>Loading Open-Meteo meteorological forecast...</p>
                </div>
              ) : weatherError ? (
                <div style={{ padding: '1.25rem', textAlign: 'center', color: '#F87171' }}>
                  <Icon name="alert-triangle" size={22} color="#EF4444" />
                  <p style={{ marginTop: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Weather Service Unavailable</p>
                  <p style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.25rem' }}>{weatherError}</p>
                  <Button variant="outline" size="sm" onClick={refreshWeather} style={{ marginTop: '0.75rem' }}>
                    Retry Forecast Fetch
                  </Button>
                </div>
              ) : weather ? (
                <>
                  {/* Current Atmospheric Readings */}
                  <div className="fw-ow-hero">
                    <div className="fw-ow-hero-left">
                      <div className="fw-ow-temp-block">
                        <span className="fw-ow-temp">
                          {weather.current?.temperature_c ?? weather.current?.temperature ?? '--'}
                        </span>
                        <span className="fw-ow-temp-unit">°C</span>
                      </div>
                      <div className="fw-ow-condition">
                        <span className="fw-ow-cond-title">
                          {weather.current?.weather_description ?? weather.current?.condition ?? 'Weather model active'}
                        </span>
                        {(weather.current?.apparent_temperature_c ?? weather.current?.apparentTemperature) != null && (
                          <span className="fw-ow-feels">
                            Feels like {weather.current?.apparent_temperature_c ?? weather.current?.apparentTemperature}°C
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="fw-ow-hero-right">
                      <div className="fw-ow-precip-badge">
                        <Icon name="droplet" size={14} color="#38BDF8" />
                        <span>
                          Precipitation: <strong>{weather.current?.precipitation_mm ?? weather.current?.precipitation ?? 0} mm</strong>
                        </span>
                      </div>
                      <span className="fw-ow-model-tag">Numerical Model Forecast</span>
                    </div>
                  </div>

                  {/* 24-Hour Summary Metrics */}
                  <div className="fw-ow-metrics-grid">
                    <div className="fw-ow-metric-box">
                      <span className="fw-ow-m-lbl">24h Forecast Total</span>
                      <span className="fw-ow-m-val fw-text-cyan">
                        {weather.forecast_summary?.next_24h_accumulation_mm ?? weather.forecastSummary?.totalPrecipitationMm ?? 0} mm
                      </span>
                    </div>
                    <div className="fw-ow-metric-box">
                      <span className="fw-ow-m-lbl">Peak Rain Probability</span>
                      <span className="fw-ow-m-val">
                        {weather.forecast_summary?.today_precipitation_probability_max_pct ?? weather.forecastSummary?.maxPrecipitationProbabilityPercent ?? '--'}%
                      </span>
                    </div>
                    <div className="fw-ow-metric-box">
                      <span className="fw-ow-m-lbl">Relative Humidity</span>
                      <span className="fw-ow-m-val">
                        {weather.current?.relative_humidity_pct ?? weather.current?.relativeHumidity ?? '--'}%
                      </span>
                    </div>
                    <div className="fw-ow-metric-box">
                      <span className="fw-ow-m-lbl">Wind Speed</span>
                      <span className="fw-ow-m-val">
                        {weather.current?.wind_speed_kmh ?? weather.current?.windSpeed ?? '--'} km/h
                      </span>
                    </div>
                  </div>

                  {/* Next 6 Hours Micro-Strip */}
                  {(weather.hourly_forecast || weather.hourlyForecast)?.length > 0 && (
                    <div className="fw-ow-hourly-strip">
                      <span className="fw-ow-hourly-title">Next 6 Hours Forecast (Probability & Depth):</span>
                      <div className="fw-ow-hourly-row">
                        {(weather.hourly_forecast || weather.hourlyForecast).slice(0, 6).map((hf, idx) => {
                          const dateObj = new Date(hf.time);
                          const hourStr = isNaN(dateObj.getTime())
                            ? `+${idx + 1}h`
                            : dateObj.toLocaleTimeString([], { hour: 'numeric', hour12: true });
                          const prob = hf.precipitation_probability_pct ?? hf.precipitationProbability ?? 0;
                          const mm = hf.precipitation_mm ?? hf.precipitation ?? 0;
                          return (
                            <div key={hf.time || idx} className="fw-ow-hourly-pill">
                              <span className="fw-ow-hp-time">{hourStr}</span>
                              <span
                                className="fw-ow-hp-prob"
                                style={{
                                  color: prob > 40 ? '#38BDF8' : '#94A3B8',
                                  fontWeight: prob > 40 ? 700 : 500,
                                }}
                              >
                                {prob}%
                              </span>
                              <span className="fw-ow-hp-mm">{mm} mm</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Sector Basin Forecast Context */}
                  <div className="fw-station-readings">
                    <span className="fw-station-head">Greater Kochi Catchment Sectors:</span>
                    {MONITORING_SECTORS.map((sector) => (
                      <div key={sector.id} className="fw-station-row">
                        <div className="fw-stn-info">
                          <span className="fw-stn-name">{sector.name}</span>
                          <span className="fw-stn-basin">{sector.catchment}</span>
                        </div>
                        <div className="fw-stn-data">
                          <span className="fw-stn-val" style={{ color: '#38BDF8', fontSize: '0.75rem', fontWeight: 600 }}>
                            Forecast applies
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Source Attribution and Disclaimer */}
                  <div className="fw-ow-disclaimer-box">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <Icon name="info" size={13} color="#38BDF8" />
                      <strong>Source Attribution & Model Disclaimer:</strong>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: '#94A3B8', lineHeight: '1.35' }}>
                      Weather data sourced from the official <strong>Open-Meteo Forecast API</strong> (licensed under <strong>CC BY 4.0</strong>).
                      Values are numerical atmospheric model forecasts, NOT physical ground sensor readings or official flood alerts. For official advisories, consult KSDMA and IMD.
                    </p>
                  </div>
                </>
              ) : null}
            </div>
          </Card>

          {/* Regional Assistance Capacity Snapshot */}
          <Card
            title="Emergency Support Hubs"
            subtitle="Relief centers and medical staging posts from Supabase"
            icon={<Icon name="shield-check" size={18} color="#10B981" />}
            actions={
              <Button
                variant="outline"
                size="sm"
                icon="external-link"
                onClick={() => onNavigate('assistance')}
              >
                Directory
              </Button>
            }
          >
            <div className="fw-assistance-overview-card">
              <div className="fw-ast-stats-row">
                <div className="fw-ast-stat-box">
                  <span className="fw-ast-val">{assistancePoints.length}</span>
                  <span className="fw-ast-lbl">Active Hubs</span>
                </div>
                <div className="fw-ast-stat-box">
                  <span className="fw-ast-val">
                    {assistancePoints.reduce((acc, p) => acc + (p.capacity_total || 0), 0).toLocaleString()}
                  </span>
                  <span className="fw-ast-lbl">Total Capacity</span>
                </div>
                <div className="fw-ast-stat-box">
                  <span className="fw-ast-val">
                    {assistancePoints.reduce((acc, p) => acc + (p.capacity_occupied || 0), 0).toLocaleString()}
                  </span>
                  <span className="fw-ast-lbl">Occupied</span>
                </div>
              </div>

              <div className="fw-quick-hub-list">
                {assistancePoints.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '1rem', color: '#94A3B8', fontSize: '0.85rem' }}>
                    No relief facilities registered in database.
                  </p>
                ) : (
                  assistancePoints.slice(0, 3).map((hub) => (
                    <div
                      key={hub.id}
                      className="fw-quick-hub-item"
                      onClick={() => onNavigate('map', hub.id)}
                      role="button"
                      tabIndex={0}
                    >
                      <div>
                        <strong>{hub.name}</strong>
                        <span className="fw-quick-hub-sub">{hub.category_label} &bull; {hub.location_label}</span>
                      </div>
                      <div className="fw-quick-hub-cap">
                        <span className="fw-cap-num">
                          {Math.max(0, (hub.capacity_total || 0) - (hub.capacity_occupied || 0))}
                        </span>
                        <span className="fw-cap-lbl">vacant</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>

          {/* Citizen Travel Advisory Checklist */}
          <div className="fw-advisory-box">
            <div className="fw-advisory-head">
              <Icon name="navigation" size={16} color="#06B6D4" />
              <span>Greater Kochi Commuter Protocol</span>
            </div>
            <ul className="fw-advisory-checklist">
              <li>Check live incident map before entering low-lying railway underpasses.</li>
              <li>Avoid driving through standing water exceeding tyre half-height.</li>
              <li>Report roadblocks, fallen trees, or downed power lines immediately.</li>
            </ul>
            <Button
              variant="outline"
              size="sm"
              icon="report"
              onClick={() => onNavigate('report')}
              className="fw-advisory-report-btn"
            >
              Dispatch Citizen Incident Report
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
