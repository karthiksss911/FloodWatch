import { useMemo } from 'react';
import Icon from '../common/Icon';
import Card from '../common/Card';
import StatCard from '../common/StatCard';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { calculateAggregateRisk } from '../../utils/riskEngine';
import {
  INITIAL_INCIDENTS,
  RAINFALL_STATIONS,
  ASSISTANCE_POINTS,
  DEMO_AREA,
} from '../../data/demoData';

/**
 * Situation Overview Dashboard
 * Displays top KPIs, critical hotspots, rainfall telemetry, and incident feed.
 * All data is strictly labelled as demonstration / simulated data.
 */
export default function OverviewView({
  incidents = INITIAL_INCIDENTS,
  simulatedRainfall = 38.0,
  rainfallMultiplier = 1.2,
  onNavigate,
}) {
  const severeCount = incidents.filter((i) => i.severity === 'severe').length;
  const highCount = incidents.filter((i) => i.severity === 'high').length;
  const verifiedCount = incidents.filter(
    (i) => i.verification_status === 'demo_reviewed' || i.verification_status === 'demo_community_confirmed'
  ).length;

  // Dynamically compute aggregate regional risk from shared incidents and weather input
  const aggregateRisk = useMemo(() => {
    return calculateAggregateRisk(incidents, simulatedRainfall, rainfallMultiplier);
  }, [incidents, simulatedRainfall, rainfallMultiplier]);

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
        {/* Left Column: Live Incident Feed & Weather Telemetry */}
        <div className="fw-dash-col-main">
          {/* Recent Community Incidents Card */}
          <Card
            title="Simulated Incident Stream"
            subtitle={`Demonstration reports within ${DEMO_AREA.name}`}
            icon={<Icon name="map-pin" size={18} color="#06B6D4" />}
            badge={
              <Badge variant="cyan" pulse>
                {incidents.length} Demo Reports
              </Badge>
            }
            actions={
              <Button
                variant="ghost"
                size="sm"
                icon="arrow-right"
                iconPosition="right"
                onClick={() => onNavigate('map')}
                aria-label="Open full map view"
              >
                Open Map
              </Button>
            }
          >
            <div className="fw-incident-feed">
              {incidents.slice(0, 4).map((inc) => (
                <article
                  key={inc.id}
                  className="fw-incident-row fw-incident-clickable"
                  onClick={() => onNavigate('map', inc.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onNavigate('map', inc.id);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Inspect ${inc.title} on map`}
                >
                  <div className="fw-incident-severity-col">
                    <Badge severity={inc.severity} pulse={inc.severity === 'severe'} />
                    {inc.water_depth_cm && (
                      <span className="fw-depth-pill" title="Simulated flood depth">
                        ~{inc.water_depth_cm} cm depth
                      </span>
                    )}
                  </div>

                  <div className="fw-incident-info-col">
                    <div className="fw-incident-topline">
                      <h4 className="fw-incident-title">{inc.title}</h4>
                      <Badge verification={inc.verification_status} />
                    </div>
                    <p className="fw-incident-desc">{inc.description}</p>
                    <div className="fw-incident-meta">
                      <span className="fw-meta-item">
                        <Icon name="map-pin" size={12} />
                        {inc.location_label}
                      </span>
                      <span className="fw-meta-item">
                        <Icon name="clock" size={12} />
                        {new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="fw-meta-item fw-meta-source">
                        Source: {inc.rainfall_source || 'Citizen Demo'}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="fw-feed-footer">
              <span className="fw-feed-counter">Showing {Math.min(4, incidents.length)} of {incidents.length} simulated reports</span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onNavigate('map')}
                aria-label="Inspect all incidents on geospatial map"
              >
                Inspect All on Geospatial Map
              </Button>
            </div>
          </Card>

          {/* Rainfall Telemetry Grid */}
          <Card
            title="Simulated Rainfall Observation Stations"
            subtitle="Demonstration sensor measurements across Greater Kochi sub-basins"
            icon={<Icon name="cloud-rain" size={18} color="#38BDF8" />}
            badge={<Badge variant="default">Simulated Telemetry</Badge>}
          >
            <div className="fw-weather-grid">
              {RAINFALL_STATIONS.map((st) => (
                <div key={st.id} className="fw-weather-card">
                  <div className="fw-weather-head">
                    <span className="fw-station-name">{st.station_name}</span>
                    <span className={`fw-weather-status fw-status-${st.status_level}`}>
                      {st.status}
                    </span>
                  </div>
                  <div className="fw-weather-metric">
                    <span className="fw-rain-val">{st.current_mm_hr}</span>
                    <span className="fw-rain-unit">mm/hr</span>
                  </div>
                  <div className="fw-weather-sub">
                    <span>3h Total: {st.last_3h_total_mm} mm</span>
                    <span className="fw-weather-time">{st.last_updated}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Risk Intelligence & Emergency Action */}
        <div className="fw-dash-col-side">
          {/* Explainable Risk Overview Card (Dynamic Phase 4) */}
          <Card
            title="Experimental Area Risk Index"
            subtitle="Deterministic Composite Model for Greater Kochi (Demonstration Only)"
            icon={<Icon name="activity" size={18} color="#F59E0B" />}
            badge={
              <Badge severity={aggregateRisk.category.categoryKey}>
                {aggregateRisk.category.label}
              </Badge>
            }
            variant="highlighted"
          >
            <div className="fw-risk-summary-box">
              <div className="fw-risk-dial">
                <span className="fw-risk-score-num" style={{ color: aggregateRisk.category.color }}>
                  {aggregateRisk.score}
                </span>
                <span className="fw-risk-score-max">/100</span>
                <span className="fw-risk-score-label">Regional Index</span>
              </div>
              <div className="fw-risk-dial-text">
                <p>
                  <strong>{aggregateRisk.category.label}</strong>
                </p>
                <p className="fw-risk-note">
                  Primary pressure in <strong>{aggregateRisk.topZone?.zoneName || 'Greater Kochi'}</strong>. {aggregateRisk.topZone?.drainageNotes || 'Active runoff accumulation.'}
                </p>
              </div>
            </div>

            <div className="fw-risk-factors-list">
              <h4 className="fw-factors-title">Contributing Evidence Factors:</h4>
              <div className="fw-factor-item">
                <span className="fw-factor-name">Incident Severity Weight</span>
                <div className="fw-factor-bar-wrap">
                  <div
                    className="fw-factor-bar"
                    style={{
                      width: `${Math.min(100, (aggregateRisk.topZone?.contributingFactors.severityPts || 20) * 2.5)}%`,
                      backgroundColor: '#EF4444',
                    }}
                  />
                </div>
                <span className="fw-factor-weight">+{aggregateRisk.topZone?.contributingFactors.severityPts || 0} pts</span>
              </div>

              <div className="fw-factor-item">
                <span className="fw-factor-name">Rainfall Runoff Pressure</span>
                <div className="fw-factor-bar-wrap">
                  <div
                    className="fw-factor-bar"
                    style={{
                      width: `${Math.min(100, (aggregateRisk.topZone?.contributingFactors.rainfallPts || 15) * 3)}%`,
                      backgroundColor: '#F97316',
                    }}
                  />
                </div>
                <span className="fw-factor-weight">+{aggregateRisk.topZone?.contributingFactors.rainfallPts || 0} pts</span>
              </div>

              <div className="fw-factor-item">
                <span className="fw-factor-name">Evidence Confidence Level</span>
                <div className="fw-factor-bar-wrap">
                  <div
                    className="fw-factor-bar"
                    style={{
                      width: `${aggregateRisk.confidence}%`,
                      backgroundColor: '#06B6D4',
                    }}
                  />
                </div>
                <span className="fw-factor-weight">{aggregateRisk.confidence}% Conf</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              icon="risk"
              onClick={() => onNavigate('risk')}
              className="fw-risk-action-btn"
            >
              Explore Risk Engine & Weights
            </Button>
          </Card>

          {/* Quick Shelter & Assistance Directory */}
          <Card
            title="Nearby Assistance Hubs"
            subtitle="Verified emergency shelters & rescue bases"
            icon={<Icon name="lifebuoy" size={18} color="#10B981" />}
            actions={
              <Button variant="ghost" size="sm" onClick={() => onNavigate('assistance')}>
                All Hubs
              </Button>
            }
          >
            <div className="fw-mini-shelters-list">
              {ASSISTANCE_POINTS.slice(0, 3).map((hub) => (
                <div key={hub.id} className="fw-mini-shelter-row">
                  <div className="fw-mini-shelter-info">
                    <span className="fw-mini-shelter-name">{hub.name}</span>
                    <span className="fw-mini-shelter-meta">
                      {hub.category_label} • {hub.location_label.split(',')[0]}
                    </span>
                  </div>
                  <div className="fw-mini-shelter-cap">
                    <span className="fw-cap-badge">
                      {hub.capacity_occupied}/{hub.capacity_total}
                    </span>
                    <span className="fw-cap-lbl">Occupied</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Safety Action Directive */}
          <div className="fw-advisory-box">
            <div className="fw-advisory-head">
              <Icon name="shield" size={16} color="#06B6D4" />
              <span>Resident Guidance for Waterlogging</span>
            </div>
            <ul className="fw-advisory-checklist">
              <li>Do not attempt to cross submerged railway subways or NH underpasses.</li>
              <li>Avoid driving two-wheelers through standing water exceeding 6 inches.</li>
              <li>Keep distance from electric poles and transformers during water stagnation.</li>
              <li>Report newly spotted waterlogging to help fellow commuters.</li>
            </ul>
            <Button
              variant="primary"
              size="md"
              icon="report"
              onClick={() => onNavigate('report')}
              className="fw-advisory-report-btn"
            >
              Submit Citizen Incident Report
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
