import { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import Icon from '../common/Icon';
import Badge from '../common/Badge';
import Card from '../common/Card';
import Button from '../common/Button';
import {
  INITIAL_INCIDENTS,
  ASSISTANCE_POINTS,
  CATEGORIES,
  DEMO_AREA,
} from '../../data/demoData';

// Fix Leaflet asset path resolution for bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/**
 * Validates coordinate pair to ensure graceful rendering without Leaflet crashes
 */
function isValidCoord(lat, lng) {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * Retrieves configuration styles for distinct incident marker categories
 */
function getIncidentMarkerConfig(category, severity) {
  if (category === 'waterlogging') {
    return {
      catType: 'waterlogging',
      badgeColor: '#06B6D4',
      iconSvg:
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>',
    };
  }
  if (category === 'road_blockage') {
    return {
      catType: 'roadblock',
      badgeColor: severity === 'severe' ? '#EF4444' : '#F97316',
      iconSvg:
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>',
    };
  }
  if (category === 'river_overflow') {
    return {
      catType: 'hazard',
      badgeColor: '#3B82F6',
      iconSvg:
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>',
    };
  }
  return {
    catType: 'hazard',
    badgeColor: '#A855F7',
    iconSvg:
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  };
}

/**
 * Creates custom SVG DivIcons for distinct incident marker categories
 */
function createIncidentMarkerIcon(category, severity, isSelected) {
  const { catType, badgeColor, iconSvg } = getIncidentMarkerConfig(category, severity);
  const selectedClass = isSelected ? 'fw-marker-selected' : '';
  const severityClass = `fw-marker-sev-${severity || 'moderate'}`;
  const pulseHtml = severity === 'severe' ? '<span class="fw-pin-pulse"></span>' : '';

  return L.divIcon({
    className: 'fw-leaflet-div-wrapper',
    html: `
      <div class="fw-custom-pin ${catType} ${severityClass} ${selectedClass}">
        ${pulseHtml}
        <div class="fw-pin-icon" style="color: ${badgeColor};">
          ${iconSvg}
        </div>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -22],
  });
}

/**
 * Helper returning SVG markup for assistance point categories
 */
function getAssistanceSvg(category) {
  if (category === 'shelter') {
    return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V7l7-4 7 4v14M10 21V12h4v9"/></svg>';
  }
  if (category === 'medical') {
    return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>';
  }
  if (category === 'rescue_hub') {
    return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="4.93" y1="4.93" x2="9.17" y2="9.17"/><line x1="14.83" y1="14.83" x2="19.07" y2="19.07"/><line x1="14.83" y1="9.17" x2="19.07" y2="4.93"/><line x1="14.83" y1="9.17" x2="18.36" y2="5.64"/><line x1="4.93" y1="19.07" x2="9.17" y2="14.83"/></svg>';
  }
  return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>';
}

/**
 * Creates custom SVG DivIcons for Assistance Points (shelters, medical, rescue hubs)
 */
function createAssistanceMarkerIcon(category, isSelected) {
  const iconSvg = getAssistanceSvg(category);
  const selectedClass = isSelected ? 'fw-marker-selected' : '';

  return L.divIcon({
    className: 'fw-leaflet-div-wrapper',
    html: `
      <div class="fw-custom-pin assistance ${selectedClass}">
        <div class="fw-pin-icon" style="color: #10B981;">
          ${iconSvg}
        </div>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -22],
  });
}

/**
 * Helper component inside MapContainer for camera navigation and view resetting
 */
function MapCameraControl({ centerCoords, resetTrigger }) {
  const map = useMap();
  const lastCenterRef = useRef(null);

  // Handle explicit reset view button
  useEffect(() => {
    if (resetTrigger > 0) {
      map.flyTo(DEMO_AREA.center, DEMO_AREA.defaultZoom, {
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
 * FloodWatch Kerala - Interactive Incident Map (Phase 2)
 * Renders Leaflet container with Greater Kochi coordinates, distinct category markers,
 * popup inspectors, side-panel synchronization, and safety disclaimers.
 */
export default function MapView({
  incidents = INITIAL_INCIDENTS,
  assistancePoints = ASSISTANCE_POINTS,
  selectedIncidentId,
  onSelectIncident,
  onNavigateToReport,
}) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [selectedVerification, setSelectedVerification] = useState('all');
  const [showAssistance, setShowAssistance] = useState(true);
  const [basemapStyle, setBasemapStyle] = useState('tactical_dark'); // 'tactical_dark' | 'street_osm'
  const [legendOpen, setLegendOpen] = useState(true);
  const [resetKey, setResetKey] = useState(0);

  // Local selection state for user clicks
  const [userSelectedIncidentId, setUserSelectedIncidentId] = useState(null);
  const [selectedAssistancePoint, setSelectedAssistancePoint] = useState(null);

  // Compute active incident without cascading setState effects
  const activeIncidentId = userSelectedIncidentId || selectedIncidentId || incidents[0]?.id;
  const currentIncident = incidents.find((i) => i.id === activeIncidentId) || incidents[0];

  const handleSelectIncident = (inc) => {
    setUserSelectedIncidentId(inc.id);
    setSelectedAssistancePoint(null);
    if (typeof onSelectIncident === 'function') {
      onSelectIncident(inc.id);
    }
  };

  const handleSelectAssistance = (point) => {
    setSelectedAssistancePoint(point);
    setUserSelectedIncidentId(null);
  };

  const handleResetView = () => {
    setResetKey((prev) => prev + 1);
  };

  // Filtered incidents with coordinate validation
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      if (!isValidCoord(inc.latitude, inc.longitude)) return false;
      if (selectedCategory !== 'all' && inc.category !== selectedCategory) return false;
      if (selectedSeverity !== 'all' && inc.severity !== selectedSeverity) return false;
      if (selectedVerification !== 'all' && inc.verification_status !== selectedVerification) return false;
      return true;
    });
  }, [incidents, selectedCategory, selectedSeverity, selectedVerification]);

  // Filtered assistance points with coordinate validation
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

  return (
    <div className="fw-map-view-container">
      {/* Critical Safety Advisory Notice (Requirement 11) */}
      <div className="fw-map-safety-banner" role="alert">
        <Icon name="shield-alert" size={18} color="#EF4444" />
        <div className="fw-safety-banner-text">
          <strong>CRITICAL SAFETY RULE:</strong> The absence of incident reports does{' '}
          <em>never</em> indicate that a road or area is safe or passable. Water levels can surge
          rapidly without prior citizen or sensor warning.
        </div>
      </div>

      {/* Map Filter and Control Toolbar */}
      <div className="fw-map-toolbar" role="toolbar" aria-label="Incident map filters and controls">
        {/* Category Filter */}
        <div className="fw-filter-group">
          <label className="fw-filter-label" htmlFor="map-cat-filter">
            <Icon name="filter" size={14} /> Category:
          </label>
          <select
            id="map-cat-filter"
            className="fw-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="Filter incidents by category"
          >
            <option value="all">All Categories ({incidents.length})</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Severity Filter */}
        <div className="fw-filter-group">
          <label className="fw-filter-label" htmlFor="map-sev-filter">
            <Icon name="warning" size={14} /> Severity:
          </label>
          <select
            id="map-sev-filter"
            className="fw-select"
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            aria-label="Filter incidents by severity"
          >
            <option value="all">All Severities</option>
            <option value="severe">Severe / Impassable</option>
            <option value="high">High Risk</option>
            <option value="moderate">Moderate</option>
            <option value="low">Minor</option>
          </select>
        </div>

        {/* Verification Status Filter */}
        <div className="fw-filter-group">
          <label className="fw-filter-label" htmlFor="map-verif-filter">
            <Icon name="check-circle" size={14} /> Verification:
          </label>
          <select
            id="map-verif-filter"
            className="fw-select"
            value={selectedVerification}
            onChange={(e) => setSelectedVerification(e.target.value)}
            aria-label="Filter incidents by verification status"
          >
            <option value="all">All Review Statuses</option>
            <option value="demo_reviewed">Demo Desk Reviewed</option>
            <option value="demo_community_confirmed">Demo Community Check</option>
            <option value="demo_unverified">Unverified Citizen (Demo)</option>
          </select>
        </div>

        {/* Assistance Points Toggle */}
        <div className="fw-filter-group fw-assistance-toggle-group">
          <label className="fw-checkbox-label" htmlFor="map-toggle-assistance">
            <input
              id="map-toggle-assistance"
              type="checkbox"
              checked={showAssistance}
              onChange={(e) => setShowAssistance(e.target.checked)}
              className="fw-checkbox-input"
            />
            <span className="fw-assistance-pill-label">
              <span className="fw-assistance-dot" /> Assistance Points ({assistancePoints.length})
            </span>
          </label>
        </div>

        {/* Action Controls */}
        <div className="fw-toolbar-actions">
          <Button
            variant="outline"
            size="sm"
            icon="compass"
            onClick={handleResetView}
            className="fw-reset-btn"
            title="Reset map view to Greater Kochi center"
            aria-label="Reset map view to Greater Kochi center"
          >
            Reset View
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon="plus-circle"
            onClick={onNavigateToReport}
            className="fw-map-report-cta"
            aria-label="Report new incident at location"
          >
            Report Incident
          </Button>
        </div>
      </div>

      {/* Main Map & Incident Split View */}
      <div className="fw-map-split-layout">
        {/* Interactive Leaflet Map Container */}
        <div className="fw-map-canvas-wrapper" role="region" aria-label="Interactive Incident Map Viewport">
          {/* Floating Map Controls & Indicators */}
          <div className="fw-map-floating-bar">
            <div className="fw-map-stats-chip">
              <span className="fw-chip-dot" />
              <span>
                <strong>{filteredIncidents.length}</strong> Incidents &bull;{' '}
                <strong>{validAssistancePoints.length}</strong> Assistance Hubs (Simulated Demo)
              </span>
            </div>

            <div className="fw-map-layer-switch">
              <button
                type="button"
                className={`fw-layer-btn ${basemapStyle === 'tactical_dark' ? 'active' : ''}`}
                onClick={() => setBasemapStyle('tactical_dark')}
                title="Tactical Dark Map Style"
              >
                Dark
              </button>
              <button
                type="button"
                className={`fw-layer-btn ${basemapStyle === 'street_osm' ? 'active' : ''}`}
                onClick={() => setBasemapStyle('street_osm')}
                title="OpenStreetMap Street Style"
              >
                Street
              </button>
            </div>
          </div>

          {/* Leaflet MapContainer */}
          <div className="fw-leaflet-mount-container">
            <MapContainer
              center={DEMO_AREA.center}
              zoom={DEMO_AREA.defaultZoom}
              scrollWheelZoom={true}
              className="fw-leaflet-map"
              zoomControl={true}
              aria-label="Interactive flood incident map"
            >
              {/* Dynamic Camera Controller */}
              <MapCameraControl
                centerCoords={activeTargetCoords}
                resetTrigger={resetKey}
              />

              {/* Base Tile Layer with OpenStreetMap Attribution */}
              {basemapStyle === 'tactical_dark' ? (
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>'
                  maxZoom={19}
                  errorTileUrl="data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256' viewBox='0 0 256 256'%3E%3Crect width='256' height='256' fill='%23080c15'/%3E%3Cpath d='M0 0l256 256M256 0L0 256' stroke='%231e293b' stroke-width='1'/%3E%3C/svg%3E"
                />
              ) : (
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
                  maxZoom={19}
                  errorTileUrl="data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256' viewBox='0 0 256 256'%3E%3Crect width='256' height='256' fill='%23080c15'/%3E%3Cpath d='M0 0l256 256M256 0L0 256' stroke='%231e293b' stroke-width='1'/%3E%3C/svg%3E"
                />
              )}

              {/* Incident Markers */}
              {filteredIncidents.map((inc) => {
                const isSelected = !selectedAssistancePoint && currentIncident?.id === inc.id;
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
                            <strong>~{inc.water_depth_cm || '20'} cm</strong>
                          </div>
                          <div className="fw-popup-meta-row">
                            <span>Passability:</span>
                            <span>{inc.passable_for}</span>
                          </div>
                          <div className="fw-popup-meta-row">
                            <span>Rainfall Context:</span>
                            <span>{inc.rainfall_value} mm/h</span>
                          </div>
                        </div>

                        <p className="fw-popup-desc">{inc.description}</p>

                        <div className="fw-popup-footer">
                          <span className="fw-popup-demo-tag">SIMULATED DEMO REPORT</span>
                          <button
                            type="button"
                            className="fw-popup-action-btn"
                            onClick={() => handleSelectIncident(inc)}
                          >
                            Inspect in Side Panel &rarr;
                          </button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              {/* Assistance Points Markers */}
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
                          <div className="fw-popup-badges">
                            <span className="fw-assistance-badge">
                              <Icon name="heart" size={11} color="#10B981" /> Assistance Point
                            </span>
                          </div>
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
                            <span>
                              {point.capacity_occupied} / {point.capacity_total} persons
                            </span>
                          </div>
                          <div className="fw-popup-meta-row">
                            <span>Emergency Contact:</span>
                            <strong>{point.contact_phone}</strong>
                          </div>
                        </div>

                        <div className="fw-popup-footer">
                          <span className="fw-popup-demo-tag">SIMULATED FACILITY RECORD</span>
                          <button
                            type="button"
                            className="fw-popup-action-btn fw-popup-assistance-btn"
                            onClick={() => handleSelectAssistance(point)}
                          >
                            View Facility Specs &rarr;
                          </button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>

          {/* Interactive Map Legend (Collapsible) */}
          <div className={`fw-map-legend ${legendOpen ? 'open' : 'collapsed'}`}>
            <div className="fw-legend-header" onClick={() => setLegendOpen((prev) => !prev)}>
              <span className="fw-legend-title">
                <Icon name="layers" size={13} color="#06B6D4" /> Map Legend
              </span>
              <button
                type="button"
                className="fw-legend-toggle"
                aria-label={legendOpen ? 'Collapse map legend' : 'Expand map legend'}
              >
                <Icon name={legendOpen ? 'chevron-down' : 'chevron-right'} size={14} />
              </button>
            </div>

            {legendOpen && (
              <div className="fw-legend-body">
                <div className="fw-legend-section">
                  <span className="fw-legend-subtitle">Marker Types</span>
                  <div className="fw-legend-row">
                    <span className="fw-marker-sample waterlogging">💧</span>
                    <span>Waterlogging / Inundation</span>
                  </div>
                  <div className="fw-legend-row">
                    <span className="fw-marker-sample roadblock">⛔</span>
                    <span>Road Submerged / Blocked</span>
                  </div>
                  <div className="fw-legend-row">
                    <span className="fw-marker-sample hazard">⚠️</span>
                    <span>River Overflow / Tree / Hazard</span>
                  </div>
                  <div className="fw-legend-row">
                    <span className="fw-marker-sample assistance">🏥</span>
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
                    <span>High Risk (Sedans stalled)</span>
                  </div>
                  <div className="fw-legend-row">
                    <span className="fw-legend-dot fw-dot-mod" />
                    <span>Moderate (Pass with care)</span>
                  </div>
                  <div className="fw-legend-row">
                    <span className="fw-legend-dot fw-dot-low" />
                    <span>Minor (Water Stagnation)</span>
                  </div>
                </div>

                <div className="fw-legend-safety-notice">
                  <Icon name="alert-triangle" size={12} color="#F59E0B" />
                  <span>Roads without incident pins are unassessed, not guaranteed safe.</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Incident / Assistance Point Detail Inspector Sidebar */}
        <div className="fw-map-inspector-sidebar">
          {selectedAssistancePoint ? (
            <Card
              title={selectedAssistancePoint.name}
              subtitle={selectedAssistancePoint.category_label}
              icon={<Icon name="shield-check" size={18} color="#10B981" />}
              badge={
                <span className="fw-assistance-badge-pill">
                  {selectedAssistancePoint.status === 'open' ? 'Facility Open' : 'Active Ops'}
                </span>
              }
            >
              <div className="fw-inspector-content">
                <div className="fw-inspector-section">
                  <span className="fw-inspector-label">Facility Location</span>
                  <p className="fw-inspector-location">{selectedAssistancePoint.location_label}</p>
                </div>

                <div className="fw-inspector-section">
                  <span className="fw-inspector-label">Emergency Helpline</span>
                  <a
                    href={`tel:${selectedAssistancePoint.contact_phone.replace(/\s+/g, '')}`}
                    className="fw-tel-link"
                  >
                    <Icon name="phone" size={14} /> {selectedAssistancePoint.contact_phone}
                  </a>
                </div>

                <div className="fw-inspector-section">
                  <span className="fw-inspector-label">Capacity & Inflow</span>
                  <div className="fw-capacity-bar-wrapper">
                    <div className="fw-capacity-bar-track">
                      <div
                        className="fw-capacity-bar-fill"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round(
                              (selectedAssistancePoint.capacity_occupied /
                                selectedAssistancePoint.capacity_total) *
                                100
                            )
                          )}%`,
                        }}
                      />
                    </div>
                    <div className="fw-capacity-stats">
                      <span>{selectedAssistancePoint.capacity_occupied} Occupied</span>
                      <span>{selectedAssistancePoint.capacity_total} Total</span>
                    </div>
                  </div>
                </div>

                <div className="fw-inspector-section">
                  <span className="fw-inspector-label">Rations & Medical Standby</span>
                  <p className="fw-inspector-desc">{selectedAssistancePoint.supplies_status}</p>
                  <p className="fw-evidence-note" style={{ marginTop: '6px' }}>
                    {selectedAssistancePoint.medical_support}
                  </p>
                </div>

                <div className="fw-inspector-section">
                  <span className="fw-inspector-label">Operating Authority</span>
                  <p className="fw-inspector-meta-tag">{selectedAssistancePoint.operating_authority}</p>
                </div>

                <div className="fw-inspector-actions">
                  <Button
                    variant="outline"
                    size="sm"
                    icon="crosshair"
                    onClick={() => {
                      setResetKey((k) => k + 1);
                    }}
                  >
                    Center on Facility
                  </Button>
                </div>
              </div>
            </Card>
          ) : currentIncident ? (
            <Card
              title={currentIncident.title}
              subtitle={currentIncident.location_label}
              icon={<Icon name="map-pin" size={18} color="#06B6D4" />}
              badge={<Badge severity={currentIncident.severity} pulse />}
            >
              <div className="fw-inspector-content">
                <div className="fw-inspector-section">
                  <span className="fw-inspector-label">Review Status & Confidence</span>
                  <div className="fw-verification-row">
                    <Badge verification={currentIncident.verification_status} />
                    <span className="fw-conf-score">
                      Confidence: {currentIncident.confidence_score}%
                    </span>
                  </div>
                </div>

                <div className="fw-inspector-section">
                  <span className="fw-inspector-label">Reported Water Inundation</span>
                  <div className="fw-depth-metric">
                    <span className="fw-depth-val">~{currentIncident.water_depth_cm || '25'} cm</span>
                    <span className="fw-passable-val">({currentIncident.passable_for})</span>
                  </div>
                </div>

                <div className="fw-inspector-section">
                  <span className="fw-inspector-label">Situation Description</span>
                  <p className="fw-inspector-desc">{currentIncident.description}</p>
                </div>

                <div className="fw-inspector-section">
                  <span className="fw-inspector-label">Geographic Coordinates</span>
                  <div className="fw-coords-box">
                    <code>
                      Lat: {currentIncident.latitude.toFixed(4)}, Lng:{' '}
                      {currentIncident.longitude.toFixed(4)}
                    </code>
                  </div>
                </div>

                <div className="fw-inspector-section">
                  <span className="fw-inspector-label">Weather Observation Context</span>
                  <div className="fw-weather-context">
                    <Icon name="cloud-rain" size={14} color="#38BDF8" />
                    <span>
                      {currentIncident.rainfall_value} mm/h via {currentIncident.rainfall_source}
                    </span>
                  </div>
                </div>

                {currentIncident.reporter_notes && (
                  <div className="fw-inspector-section">
                    <span className="fw-inspector-label">Evidence Verification Notes</span>
                    <p className="fw-evidence-note">{currentIncident.reporter_notes}</p>
                  </div>
                )}

                <div className="fw-inspector-actions">
                  <Button
                    variant="outline"
                    size="sm"
                    icon="plus-circle"
                    onClick={onNavigateToReport}
                  >
                    Report Follow-up
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <div className="fw-inspector-empty">
              <Icon name="map" size={32} color="#64748B" />
              <p>Select any incident marker on the map to inspect full details and verification audit.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
