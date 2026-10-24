import { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import Icon from '../../components/common/Icon';
import Badge from '../../components/common/Badge';
import { KOCHI_GEOGRAPHY } from '../../config/disasterConfig';
import { initLeafletIcons, isValidCoord } from '../../lib/leaflet/leafletConfig';
import {
  createIncidentMarkerIcon,
  createAssistanceMarkerIcon,
} from '../../lib/leaflet/markerFactory';
import { useWeather } from '../../hooks/useWeather';
import WeatherForecastOverlay from './components/WeatherForecastOverlay';
import FloatingIncidentDetailCard from './FloatingIncidentDetailCard';

initLeafletIcons();

/**
 * Camera controller component inside Leaflet MapContainer
 */
function MapCameraControl({ centerCoords, resetTrigger }) {
  const map = useMap();
  const lastCenterRef = useRef(null);

  // Handle explicit reset view button
  useEffect(() => {
    if (resetTrigger > 0) {
      map.flyTo(KOCHI_GEOGRAPHY.center, KOCHI_GEOGRAPHY.defaultZoom, {
        duration: 1.2,
        easeLinearity: 0.25,
      });
    }
  }, [resetTrigger, map]);

  // Center smoothly on selected item coordinates
  useEffect(() => {
    if (centerCoords && centerCoords.length === 2 && isValidCoord(centerCoords[0], centerCoords[1])) {
      const [lat, lng] = centerCoords;
      if (!lastCenterRef.current || lastCenterRef.current[0] !== lat || lastCenterRef.current[1] !== lng) {
        lastCenterRef.current = [lat, lng];
        map.flyTo([lat, lng], 14, {
          duration: 0.9,
          easeLinearity: 0.25,
        });
      }
    }
  }, [centerCoords, map]);

  return null;
}

/**
 * FloodWatch Kerala — Map-Centric Dashboard Viewport
 * Dominant full-screen interactive Leaflet map featuring real OpenStreetMap tiles,
 * live Open-Meteo atmospheric forecast overlay, and floating incident details panel.
 */
export default function MapView({
  incidents = [],
  assistancePoints = [],
  selectedIncidentId,
  selectedAssistancePointId,
  onSelectIncident,
  onSelectAssistancePoint,
  onUpdateIncidentStatus,
  onOpenHotlines,
}) {
  const [showAssistance, setShowAssistance] = useState(true);
  const [basemapStyle, setBasemapStyle] = useState('street_osm'); // 'street_osm' (light) | 'tactical_dark'
  const [legendOpen, setLegendOpen] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [showWeatherOverlay, setShowWeatherOverlay] = useState(false);
  const [dismissedIncidentId, setDismissedIncidentId] = useState(null);

  // Derive active assistance point from props
  const selectedAssistancePoint = selectedAssistancePointId
    ? assistancePoints.find((p) => p.id === selectedAssistancePointId) || null
    : null;

  // Derive active incident from props
  const currentIncident = incidents.find((i) => i.id === selectedIncidentId) ||
    (!selectedAssistancePoint ? incidents[0] : null);

  const handleSelectIncident = (inc) => {
    setDismissedIncidentId(null);
    if (typeof onSelectIncident === 'function') {
      onSelectIncident(inc.id);
    }
  };

  const handleSelectAssistance = (point) => {
    setShowAssistance(true);
    if (typeof onSelectAssistancePoint === 'function') {
      onSelectAssistancePoint(point.id);
    }
  };

  const handleResetView = () => {
    setResetKey((prev) => prev + 1);
  };

  // Valid coordinate incidents
  const validIncidents = useMemo(() => {
    return incidents.filter((inc) => isValidCoord(inc.latitude, inc.longitude));
  }, [incidents]);

  // Valid coordinate assistance points
  const validAssistancePoints = useMemo(() => {
    if (!showAssistance) return [];
    return assistancePoints.filter((point) => isValidCoord(point.latitude, point.longitude));
  }, [assistancePoints, showAssistance]);

  // Target coordinates for camera centering
  const activeTargetCoords = useMemo(() => {
    if (selectedAssistancePoint) {
      return [selectedAssistancePoint.latitude, selectedAssistancePoint.longitude];
    }
    if (currentIncident && isValidCoord(currentIncident.latitude, currentIncident.longitude)) {
      return [currentIncident.latitude, currentIncident.longitude];
    }
    return null;
  }, [selectedAssistancePoint, currentIncident]);

  // Weather coordinates query
  const weatherLat = selectedAssistancePoint?.latitude ?? currentIncident?.latitude ?? KOCHI_GEOGRAPHY.center[0];
  const weatherLng = selectedAssistancePoint?.longitude ?? currentIncident?.longitude ?? KOCHI_GEOGRAPHY.center[1];
  const weatherLocationName = selectedAssistancePoint?.name ?? currentIncident?.location_label ?? 'Greater Kochi Center';

  const {
    weather,
    isLoading: weatherLoading,
    error: weatherError,
    refreshWeather,
  } = useWeather({
    latitude: weatherLat,
    longitude: weatherLng,
  });

  return (
    <div className="fw-map-fullscreen-wrapper" role="region" aria-label="Interactive Map Viewport">
      {/* Floating Top Controls Bar over Map */}
      <div className="fw-map-top-bar">
        {/* Incident & Hub Status Chip */}
        <div className="fw-map-stats-chip">
          <span className="fw-chip-dot" />
          <span>
            <strong>{validIncidents.length}</strong> Incidents &bull;{' '}
            <strong>{validAssistancePoints.length}</strong> Assistance Points
          </span>
        </div>

        {/* Live Weather Toggle Chip */}
        <button
          type="button"
          className={`fw-map-weather-chip ${showWeatherOverlay ? 'active' : ''}`}
          onClick={() => setShowWeatherOverlay((prev) => !prev)}
          title="Toggle Live Weather & Precipitation Forecast (Open-Meteo)"
          aria-label="Toggle live weather forecast"
        >
          <Icon name="cloud-rain" size={14} color="#0284C7" />
          <span>
            {weather?.current?.temperature_c != null
              ? `${weather.current.temperature_c}°C ${weather.current.weather_description}`
              : 'Live Weather'}
          </span>
          <span className="fw-chip-tag">Open-Meteo</span>
        </button>

        {/* Map Actions (Style switch, Reset view, Legend toggle) */}
        <div className="fw-map-actions-group">
          {/* Layer Style Switch */}
          <div className="fw-map-style-toggle">
            <button
              type="button"
              className={`fw-style-btn ${basemapStyle === 'street_osm' ? 'active' : ''}`}
              onClick={() => setBasemapStyle('street_osm')}
              title="Clean Light OpenStreetMap Style"
            >
              Street
            </button>
            <button
              type="button"
              className={`fw-style-btn ${basemapStyle === 'tactical_dark' ? 'active' : ''}`}
              onClick={() => setBasemapStyle('tactical_dark')}
              title="Tactical Dark Map Style"
            >
              Dark
            </button>
          </div>

          {/* Toggle Assistance Centers */}
          <button
            type="button"
            className={`fw-map-btn-pill ${showAssistance ? 'active' : ''}`}
            onClick={() => setShowAssistance((prev) => !prev)}
            title="Toggle Emergency Relief Hubs"
          >
            <Icon name="heart" size={13} color={showAssistance ? '#10B981' : '#64748B'} />
            <span>Shelters</span>
          </button>

          {/* Reset Map View */}
          <button
            type="button"
            className="fw-map-icon-pill"
            onClick={handleResetView}
            title="Reset Map to Greater Kochi Center"
            aria-label="Reset Map"
          >
            <Icon name="compass" size={14} />
          </button>

          {/* Map Legend Toggle */}
          <button
            type="button"
            className={`fw-map-icon-pill ${legendOpen ? 'active' : ''}`}
            onClick={() => setLegendOpen((prev) => !prev)}
            title="Toggle Map Legend"
            aria-label="Toggle Legend"
          >
            <Icon name="layers" size={14} />
          </button>
        </div>
      </div>

      {/* React Leaflet Map Canvas */}
      <div className="fw-map-leaflet-holder">
        <MapContainer
          center={KOCHI_GEOGRAPHY.center}
          zoom={KOCHI_GEOGRAPHY.defaultZoom}
          scrollWheelZoom={true}
          className="fw-leaflet-full-canvas"
          zoomControl={true}
          aria-label="Interactive flood incident map"
        >
          {/* Dynamic Camera Centering */}
          <MapCameraControl
            centerCoords={activeTargetCoords}
            resetTrigger={resetKey}
          />

          {/* Base Tile Layer: Official OpenStreetMap with visible attribution */}
          <TileLayer
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
            maxZoom={19}
            className={basemapStyle === 'tactical_dark' ? 'fw-osm-dark-tiles' : ''}
            errorTileUrl="data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256' viewBox='0 0 256 256'%3E%3Crect width='256' height='256' fill='%23f1f5f9'/%3E%3Cpath d='M0 0l256 256M256 0L0 256' stroke='%23cbd5e1' stroke-width='1'/%3E%3C/svg%3E"
          />

          {/* Incident Markers from Supabase */}
          {validIncidents.map((inc) => {
            const isSelected = currentIncident?.id === inc.id;
            const markerIcon = createIncidentMarkerIcon(inc.category, inc.severity, isSelected);

            return (
              <Marker
                key={inc.id}
                position={[inc.latitude, inc.longitude]}
                icon={markerIcon}
                eventHandlers={{
                  click: () => handleSelectIncident(inc),
                }}
              >
                <Popup className="fw-leaflet-popup">
                  <div className="fw-popup-card">
                    <div className="fw-popup-header">
                      <div className="fw-popup-badges">
                        <Badge severity={inc.severity} />
                        <Badge verification={inc.verification_status} />
                      </div>
                      <h4 className="fw-popup-title">{inc.title}</h4>
                      <div className="fw-popup-loc">
                        <Icon name="map-pin" size={12} color="#06B6D4" />
                        <span>{inc.location_label}</span>
                      </div>
                    </div>

                    <div className="fw-popup-meta">
                      <div className="fw-popup-meta-row">
                        <span>Water Inundation:</span>
                        <strong>~{inc.water_depth_cm || '25'} cm</strong>
                      </div>
                      <div className="fw-popup-meta-row">
                        <span>Passability:</span>
                        <span>{inc.passable_for || 'Caution'}</span>
                      </div>
                    </div>

                    <p className="fw-popup-desc">{inc.description}</p>

                    <div className="fw-popup-footer">
                      <button
                        type="button"
                        className="fw-popup-action-btn"
                        onClick={() => handleSelectIncident(inc)}
                      >
                        Inspect Details &rarr;
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Assistance Point Markers from Supabase */}
          {validAssistancePoints.map((point) => {
            const isSelected = selectedAssistancePoint?.id === point.id;
            const markerIcon = createAssistanceMarkerIcon(point.category, isSelected);

            return (
              <Marker
                key={point.id}
                position={[point.latitude, point.longitude]}
                icon={markerIcon}
                eventHandlers={{
                  click: () => handleSelectAssistance(point),
                }}
              >
                <Popup className="fw-leaflet-popup">
                  <div className="fw-popup-card">
                    <div className="fw-popup-header">
                      <span className="fw-assistance-badge">
                        <Icon name="heart" size={11} color="#10B981" /> Assistance Point
                      </span>
                      <h4 className="fw-popup-title">{point.name}</h4>
                      <div className="fw-popup-loc">
                        <Icon name="map-pin" size={12} color="#10B981" />
                        <span>{point.location_label}</span>
                      </div>
                    </div>

                    <div className="fw-popup-meta">
                      <div className="fw-popup-meta-row">
                        <span>Category:</span>
                        <strong>{point.category_label}</strong>
                      </div>
                      <div className="fw-popup-meta-row">
                        <span>Capacity:</span>
                        <span>{point.capacity_occupied} / {point.capacity_total} persons</span>
                      </div>
                      <div className="fw-popup-meta-row">
                        <span>Contact:</span>
                        <strong>{point.contact_phone}</strong>
                      </div>
                    </div>

                    <div className="fw-popup-footer">
                      <button
                        type="button"
                        className="fw-popup-action-btn fw-popup-assistance-btn"
                        onClick={() => handleSelectAssistance(point)}
                      >
                        Center on Hub
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Floating Weather & Rainfall Forecast Panel */}
      <WeatherForecastOverlay
        weather={weather}
        isLoading={weatherLoading}
        error={weatherError}
        onRetry={refreshWeather}
        locationName={weatherLocationName}
        latitude={weatherLat}
        longitude={weatherLng}
        isOpen={showWeatherOverlay}
        onToggle={() => setShowWeatherOverlay((prev) => !prev)}
      />

      {/* Floating Map Legend (Collapsible) */}
      {legendOpen && (
        <div className="fw-floating-map-legend" role="region" aria-label="Map Legend">
          <div className="fw-legend-header">
            <span className="fw-legend-title">
              <Icon name="layers" size={13} color="#0284C7" /> Map Legend
            </span>
            <button
              type="button"
              className="fw-legend-close"
              onClick={() => setLegendOpen(false)}
              aria-label="Close legend"
            >
              <Icon name="close" size={13} />
            </button>
          </div>

          <div className="fw-legend-body">
            <div className="fw-legend-section">
              <span className="fw-legend-subtitle">Marker Types</span>
              <div className="fw-legend-row">
                <span className="fw-legend-marker-sample waterlogging">💧</span>
                <span>Waterlogging / Inundation</span>
              </div>
              <div className="fw-legend-row">
                <span className="fw-legend-marker-sample roadblock">⛔</span>
                <span>Road Blockage / Submerged</span>
              </div>
              <div className="fw-legend-row">
                <span className="fw-legend-marker-sample assistance">🏥</span>
                <span>Assistance Hub / Relief Camp</span>
              </div>
            </div>

            <div className="fw-legend-section">
              <span className="fw-legend-subtitle">Severity Risk Level</span>
              <div className="fw-legend-row">
                <span className="fw-legend-dot fw-dot-severe" />
                <span>Severe / Impassable (&gt;50cm)</span>
              </div>
              <div className="fw-legend-row">
                <span className="fw-legend-dot fw-dot-high" />
                <span>High Risk (Sedans Stalled)</span>
              </div>
              <div className="fw-legend-row">
                <span className="fw-legend-dot fw-dot-mod" />
                <span>Moderate (Pass with caution)</span>
              </div>
              <div className="fw-legend-row">
                <span className="fw-legend-dot fw-dot-low" />
                <span>Minor (Puddles / Slow traffic)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Incident Detail Panel (Recreating reference screenshot bottom card) */}
      {currentIncident && dismissedIncidentId !== currentIncident.id && (
        <FloatingIncidentDetailCard
          incident={currentIncident}
          weather={weather}
          onClose={() => setDismissedIncidentId(currentIncident.id)}
          onUpdateStatus={onUpdateIncidentStatus}
          onOpenHotlines={onOpenHotlines}
        />
      )}
    </div>
  );
}
