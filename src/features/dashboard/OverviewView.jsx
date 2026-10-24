
import Icon from '../../components/common/Icon';
import Card from '../../components/common/Card';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import {
  INITIAL_INCIDENTS,
  RAINFALL_STATIONS,
  ASSISTANCE_POINTS,
} from '../../data/demoData';

/**
 * Situation Overview Dashboard (Features/Dashboard)
 * Displays top KPIs, critical hotspots, rainfall telemetry, and incident feed.
 * All data is strictly labelled as demonstration / simulated data.
 */
export default function OverviewView({
  incidents = INITIAL_INCIDENTS,
  simulatedRainfall = 38.0,
  onNavigate,
}) {
  const severeCount = incidents.filter((i) => i.severity === 'severe').length;
  const highCount = incidents.filter((i) => i.severity === 'high').length;
  const verifiedCount = incidents.filter(
    (i) => i.verification_status === 'demo_reviewed' || i.verification_status === 'demo_community_confirmed'
  ).length;

  return (
    <div className="fw-overview-view">
      {/* Alert Notification Ticker */}
      <div className="fw-alert-ticker" role="region" aria-label="Simulated scenario notice">
        <div className="fw-ticker-icon">
          <Icon name="alert-triangle" size={16} color="#EF4444" />
        </div>
        <div className="fw-ticker-text">
          <strong>SIMULATED SCENARIO ADVISORY:</strong> Demonstration waterlogging scenario active at <em>Edappally Toll Underpass</em> (depth &gt;65cm) and <em>Kaloor Metro Subway</em>. Commuter traffic advisory simulated.
        </div>
        <Button
          variant="outline"
          size="sm"
          icon="map"
          onClick={() => onNavigate('map')}
          className="fw-ticker-btn"
          aria-label="View simulated incident on map"
        >
          View on Map
        </Button>
      </div>

      {/* KPI Stat Cards Grid */}
      <section className="fw-kpi-grid" aria-label="Key demonstration indicators">
        <StatCard
          label="Simulated Incidents"
          value={incidents.length}
          subtext={`${severeCount} severe, ${highCount} high risk`}
          icon="activity"
          trend="+3 in demo session"
          trendDirection="danger"
          variant="cyan"
        />
        <StatCard
          label="Simulated Road Closures"
          value={severeCount}
          subtext="Demo impassable routes"
          icon="shield-alert"
          trend="NH-66 / Edappally Toll"
          trendDirection="danger"
          variant="danger"
        />
        <StatCard
          label="Cross-Checked Reports"
          value={`${verifiedCount}/${incidents.length}`}
          subtext="Simulated community & desk triage"
          icon="check-circle"
          trend="Demo Cross-Check"
          trendDirection="neutral"
          variant="emerald"
        />
        <StatCard
          label="Peak Simulated Rain"
          value={`${simulatedRainfall} mm/h`}
          subtext="Simulated Weather Radar Input"
          icon="cloud-rain"
          trend="Demo Parameter"
          trendDirection={simulatedRainfall >= 40 ? 'danger' : simulatedRainfall >= 20 ? 'warning' : 'neutral'}
          variant="warning"
        />
      </section>

      {/* Main Two-Column Dashboard Content */}
      <div className="fw-dashboard-layout">
        {/* Left Column: Recent Incidents Feed */}
        <div className="fw-dash-col-main">
          <Card
            title="Real-Time Field Telemetry & Citizen Reports"
            subtitle="Demonstration incident queue with geospatial coordinates and road passability notes"
            icon={<Icon name="activity" size={18} color="#06B6D4" />}
            badge={
              <Badge severity="high">
                <span className="fw-pulse-dot fw-dot-amber" /> Live Stream
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
              {incidents.slice(0, 6).map((incident) => (
                <article
                  key={incident.id}
                  className="fw-incident-row fw-incident-clickable"
                  onClick={() => onNavigate('map', incident.id)}
                  tabIndex={0}
                  role="button"
                  aria-label={`Inspect incident: ${incident.title}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onNavigate('map', incident.id);
                    }
                  }}
                >
                  <div className="fw-incident-severity-col">
                    <Badge severity={incident.severity} pulse={incident.severity === 'severe'} />
                    <span className="fw-depth-pill">
                      ~{incident.water_depth_cm || '25'} cm
                    </span>
                  </div>

                  <div className="fw-incident-info-col">
                    <div className="fw-incident-top-meta">
                      <h4 className="fw-incident-title">{incident.title}</h4>
                      <span className="fw-incident-time">
                        {incident.observed_at ? new Date(incident.observed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Demo'}
                      </span>
                    </div>

                    <div className="fw-incident-loc-bar">
                      <Icon name="map-pin" size={13} color="#06B6D4" />
                      <span>{incident.location_label}</span>
                      <span className="fw-bullet-sep">&bull;</span>
                      <span className="fw-passable-tag">{incident.passable_for}</span>
                    </div>

                    <p className="fw-incident-desc-snippet">{incident.description}</p>

                    <div className="fw-incident-bottom-row">
                      <div className="fw-verification-chip">
                        <Badge verification={incident.verification_status} />
                        <span className="fw-confidence-lbl">
                          Confidence: <strong>{incident.confidence_score}%</strong>
                        </span>
                      </div>
                      <span className="fw-inspect-hint">Click to inspect on map &rarr;</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="fw-feed-footer-actions">
              <Button
                variant="secondary"
                icon="map"
                onClick={() => onNavigate('map')}
                className="fw-view-all-btn"
              >
                Inspect All {incidents.length} Incidents on Map
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Column: Weather Telemetry & Hotspots */}
        <div className="fw-dash-col-side">
          {/* Active Hotspots Quick Card */}
          <Card
            title="Critical Waterlogging Hotspots"
            subtitle="Corridors with severe inundation"
            icon={<Icon name="shield-alert" size={18} color="#EF4444" />}
          >
            <div className="fw-hotspot-list">
              <div className="fw-hotspot-item">
                <div className="fw-hotspot-head">
                  <span className="fw-hotspot-name">NH-66 Edappally Toll</span>
                  <Badge severity="severe">Severe (Closed)</Badge>
                </div>
                <p className="fw-hotspot-detail">Underpass submerged &gt;65cm. Diversion active.</p>
                <div className="fw-hotspot-footer">
                  <span>Sensor: Edappally Canal Link</span>
                  <button
                    type="button"
                    className="fw-text-btn"
                    onClick={() => onNavigate('map', 'INC-2026-082')}
                  >
                    Locate &rarr;
                  </button>
                </div>
              </div>

              <div className="fw-hotspot-item">
                <div className="fw-hotspot-head">
                  <span className="fw-hotspot-name">Kaloor Metro Link</span>
                  <Badge severity="high">High Risk</Badge>
                </div>
                <p className="fw-hotspot-detail">Subway inundated ~45cm. Metro traffic slow.</p>
                <div className="fw-hotspot-footer">
                  <span>Sensor: Kaloor Subway</span>
                  <button
                    type="button"
                    className="fw-text-btn"
                    onClick={() => onNavigate('map', 'INC-2026-081')}
                  >
                    Locate &rarr;
                  </button>
                </div>
              </div>

              <div className="fw-hotspot-item">
                <div className="fw-hotspot-head">
                  <span className="fw-hotspot-name">Aluva Manappuram</span>
                  <Badge severity="high">High Risk</Badge>
                </div>
                <p className="fw-hotspot-detail">Periyar swell at temple ghats. Pedestrian curb cut.</p>
                <div className="fw-hotspot-footer">
                  <span>Station: Periyar River Gauge</span>
                  <button
                    type="button"
                    className="fw-text-btn"
                    onClick={() => onNavigate('map', 'INC-2026-084')}
                  >
                    Locate &rarr;
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* Weather Telemetry Card */}
          <Card
            title="Rainfall & River Basin Telemetry"
            subtitle="Simulated Doppler radar and gauge inputs"
            icon={<Icon name="cloud-rain" size={18} color="#38BDF8" />}
          >
            <div className="fw-telemetry-panel">
              <div className="fw-telemetry-banner">
                <div className="fw-tele-left">
                  <span className="fw-tele-val">{simulatedRainfall}</span>
                  <span className="fw-tele-unit">mm/h</span>
                </div>
                <div className="fw-tele-right">
                  <span className="fw-tele-status">Monsoon Precipitation Band</span>
                  <span className="fw-tele-desc">Active over Greater Kochi & Periyar catchment</span>
                </div>
              </div>

              <div className="fw-station-readings">
                <span className="fw-station-head">Simulated Automatic Weather Stations (AWS):</span>
                {RAINFALL_STATIONS.map((station) => (
                  <div key={station.id} className="fw-station-row">
                    <div className="fw-stn-info">
                      <span className="fw-stn-name">{station.name}</span>
                      <span className="fw-stn-basin">{station.river_basin}</span>
                    </div>
                    <div className="fw-stn-data">
                      <span className="fw-stn-val">{station.current_mm_hr} mm/h</span>
                      <span className={`fw-stn-trend ${station.trend === 'rising' ? 'fw-trend-danger' : 'fw-trend-neutral'}`}>
                        {station.trend}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Regional Assistance Capacity Snapshot */}
          <Card
            title="Emergency Support Hubs"
            subtitle="Verified shelters and rescue points"
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
                  <span className="fw-ast-val">{ASSISTANCE_POINTS.length}</span>
                  <span className="fw-ast-lbl">Active Hubs</span>
                </div>
                <div className="fw-ast-stat-box">
                  <span className="fw-ast-val">
                    {ASSISTANCE_POINTS.reduce((acc, p) => acc + (p.capacity_total || 0), 0).toLocaleString()}
                  </span>
                  <span className="fw-ast-lbl">Total Capacity</span>
                </div>
                <div className="fw-ast-stat-box">
                  <span className="fw-ast-val">
                    {ASSISTANCE_POINTS.reduce((acc, p) => acc + (p.capacity_occupied || 0), 0).toLocaleString()}
                  </span>
                  <span className="fw-ast-lbl">Occupied</span>
                </div>
              </div>

              <div className="fw-quick-hub-list">
                {ASSISTANCE_POINTS.slice(0, 3).map((hub) => (
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
                      <span className="fw-cap-num">{hub.capacity_total - hub.capacity_occupied}</span>
                      <span className="fw-cap-lbl">vacant</span>
                    </div>
                  </div>
                ))}
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
              <li>Check live incident map before entering Edappally & Kaloor underpasses.</li>
              <li>Avoid driving through standing water exceeding tyre half-height.</li>
              <li>Report roadblocks or downed power lines immediately to warn fellow residents.</li>
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
