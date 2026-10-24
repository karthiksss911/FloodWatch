import { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import Icon from '../../components/common/Icon';
import Badge from '../../components/common/Badge';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { CATEGORIES, DEMO_AREA } from '../../data/demoData';
import { initLeafletIcons, isValidCoord } from '../../lib/leaflet/leafletConfig';
import {
  createIncidentMarkerIcon,
  createAssistanceMarkerIcon,
} from '../../lib/leaflet/markerFactory';

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
 * FloodWatch Kerala - Interactive Incident Map (Features/Map)
 * Renders Leaflet container with Greater Kochi coordinates, distinct category markers,
 * popup inspectors, side-panel synchronization, and safety disclaimers.
 */
export default function MapView({
  incidents = [],
  assistancePoints = [],
  selectedIncidentId,
  selectedAssistancePointId,
  onSelectIncident,
  onSelectAssistancePoint,
  onNavigateToReport,
}) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [selectedVerification, setSelectedVerification] = useState('all');
  const [showAssistance, setShowAssistance] = useState(true);
  const [basemapStyle, setBasemapStyle] = useState('tactical_dark'); // 'tactical_dark' | 'street_osm'
  const [legendOpen, setLegendOpen] = useState(true);
  const [resetKey, setResetKey] = useState(0);

  // Local click selection overrides
  const [clickedIncidentId, setClickedIncidentId] = useState(null);
  const [clickedAssistancePointId, setClickedAssistancePointId] = useState(null);

  // Derive active assistance point from clicks or incoming navigation prop
  const activeAssistancePointId = clickedAssistancePointId || selectedAssistancePointId;
  const selectedAssistancePoint = activeAssistancePointId
    ? assistancePoints.find((p) => p.id === activeAssistancePointId) || null
    : null;

  // Derive active incident from clicks or incoming navigation prop
  const activeIncidentId = clickedIncidentId || (!selectedAssistancePoint ? (selectedIncidentId || incidents[0]?.id) : null);
  const currentIncident = incidents.find((i) => i.id === activeIncidentId) || (selectedAssistancePoint ? null : incidents[0]);

  const handleSelectIncident = (inc) => {
    setClickedIncidentId(inc.id);
    setClickedAssistancePointId(null);
    if (typeof onSelectIncident === 'function') {
      onSelectIncident(inc.id);
    }
  };

  const handleSelectAssistance = (point) => {
    setClickedAssistancePointId(point.id);
    setClickedIncidentId(null);
    setShowAssistance(true);
    if (typeof onSelectAssistancePoint === 'function') {
      onSelectAssistancePoint(point.id);
    }
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
      {/* Critical Safety Advisory Notice */}
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
            <option value="rejected">Rejected / Dismissed (Demo)</option>
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

              {/* Base Tile Layer */}
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
