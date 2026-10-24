import { useState, useMemo } from 'react';
import Icon from '../../components/common/Icon';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import StatCard from '../../components/common/StatCard';
import AiIncidentIntelligenceCard from '../incidents/components/AiIncidentIntelligenceCard';

// Monitored recurring geographic hotspots in Greater Kochi
const RECURRING_HOTSPOTS = [
  { id: 'kaloor', name: 'Kaloor Sub-basin', landmark: 'Kaloor Junction & Metro Subway', coords: [9.9944, 76.2921], riskProfile: 'High' },
  { id: 'edappally', name: 'Edappally Bypass', landmark: 'NH-66 / Edappally Toll Underpass', coords: [10.0248, 76.3079], riskProfile: 'Severe' },
  { id: 'aluva', name: 'Aluva Periyar Bank', landmark: 'Aluva Manappuram Ghats', coords: [10.1076, 76.3533], riskProfile: 'High' },
  { id: 'mg_road', name: 'MG Road Corridor', landmark: 'Shenoys - Padma Jn Canal Drain', coords: [9.9729, 76.2842], riskProfile: 'Moderate' },
  { id: 'kadavanthra', name: 'Kadavanthra South', landmark: 'KP Vallon Rd / Perandoor Feeder', coords: [9.9602, 76.2995], riskProfile: 'Moderate' },
  { id: 'kakkanad', name: 'Kakkanad Corridor', landmark: 'Seaport-Airport Rd & Infopark Link', coords: [10.0135, 76.3448], riskProfile: 'Moderate' },
];

const PRESET_REMARKS = [
  'Confirmed on ground — warning signs & barriers deployed',
  'Field inspection dispatched — submersible pumps staged',
  'Water receded — roadway inspected and reopened',
  'Duplicate submission — merged with active area record',
  'False / unconfirmed report — dismissed after verification',
];

/**
 * FloodWatch Kerala - Authority Review Console (Features/Authority)
 * Triage and verification dashboard for municipal emergency desks and response teams.
 * Synchronizes with shared application state and Leaflet map in real time.
 */
export default function AuthorityView({
  incidents = [],
  isLoading = false,
  error = null,
  onRetry,
  onUpdateIncidentStatus,
  onNavigateToMap,
}) {
  const [selectedIncidentId, setSelectedIncidentId] = useState(incidents[0]?.id || null);
  const [queueTab, setQueueTab] = useState('pending'); // 'pending' | 'all' | 'verified' | 'investigating' | 'cleared' | 'rejected'
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [actionNote, setActionNote] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [validationError, setValidationError] = useState('');

  // Selected Incident Object
  const currentIncident = incidents.find((i) => i.id === selectedIncidentId) || incidents[0] || null;

  // KPI Calculations
  const metrics = useMemo(() => {
    const total = incidents.length;
    const pending = incidents.filter(
      (i) =>
        i.verification_status === 'unverified' ||
        i.verification_status === 'demo_unverified' ||
        i.verification_status === 'demo_community_confirmed'
    ).length;
    const verified = incidents.filter(
      (i) =>
        i.verification_status === 'official_verified' ||
        i.verification_status === 'demo_reviewed' ||
        i.verification_status === 'authority_verified'
    ).length;
    const investigating = incidents.filter((i) => i.status === 'investigating').length;
    const cleared = incidents.filter((i) => i.status === 'cleared' || i.status === 'resolved').length;
    const rejected = incidents.filter(
      (i) => i.verification_status === 'rejected' || i.status === 'dismissed'
    ).length;

    // Severity breakdown
    const severeCount = incidents.filter((i) => i.severity === 'severe').length;
    const highCount = incidents.filter((i) => i.severity === 'high').length;
    const modCount = incidents.filter((i) => i.severity === 'moderate').length;
    const lowCount = incidents.filter((i) => i.severity === 'low').length;

    return {
      total,
      pending,
      verified,
      investigating,
      cleared,
      rejected,
      severeCount,
      highCount,
      modCount,
      lowCount,
    };
  }, [incidents]);

  // Hotspot analysis correlating incidents to monitored zones
  const hotspotStats = useMemo(() => {
    return RECURRING_HOTSPOTS.map((spot) => {
      const matchIncidents = incidents.filter((inc) => {
        const text = `${inc.title} ${inc.location_label} ${inc.description}`.toLowerCase();
        const spotName = spot.name.toLowerCase();
        const spotLandmark = spot.landmark.toLowerCase();
        return text.includes(spot.id) || text.includes(spotName.split(' ')[0]) || text.includes(spotLandmark.split(' ')[0]);
      });

      const severe = matchIncidents.some((i) => i.severity === 'severe');
      const high = matchIncidents.some((i) => i.severity === 'high');
      const peakSev = severe ? 'severe' : high ? 'high' : matchIncidents.length > 0 ? 'moderate' : 'low';

      return {
        ...spot,
        incidentCount: matchIncidents.length,
        peakSeverity: peakSev,
        hasActive: matchIncidents.some((i) => i.status === 'active' || i.status === 'investigating'),
      };
    });
  }, [incidents]);

  // Filtered Queue
  const filteredQueue = useMemo(() => {
    return incidents.filter((inc) => {
      // Tab filter
      if (queueTab === 'pending') {
        const isPending =
          inc.verification_status === 'unverified' ||
          inc.verification_status === 'demo_unverified' ||
          inc.verification_status === 'demo_community_confirmed';
        if (!isPending) return false;
      } else if (queueTab === 'verified') {
        const isVerified =
          inc.verification_status === 'official_verified' ||
          inc.verification_status === 'demo_reviewed' ||
          inc.verification_status === 'authority_verified';
        if (!isVerified) return false;
      } else if (queueTab === 'investigating') {
        if (inc.status !== 'investigating') return false;
      } else if (queueTab === 'cleared') {
        if (inc.status !== 'cleared' && inc.status !== 'resolved') return false;
      } else if (queueTab === 'rejected') {
        if (inc.verification_status !== 'rejected' && inc.status !== 'dismissed') return false;
      }

      // Severity filter
      if (severityFilter !== 'all' && inc.severity !== severityFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchId = inc.id.toLowerCase().includes(q);
        const matchTitle = inc.title.toLowerCase().includes(q);
        const matchLoc = inc.location_label.toLowerCase().includes(q);
        const matchCat = inc.category.toLowerCase().includes(q);
        if (!matchId && !matchTitle && !matchLoc && !matchCat) return false;
      }

      return true;
    });
  }, [incidents, queueTab, severityFilter, searchQuery]);

  // Handle Triage Actions
  const handleExecuteAction = (newVerification, newStatus, actionTitle) => {
    if (!currentIncident) return;

    const note = actionNote.trim();
    if (!note && (newVerification === 'rejected' || newStatus === 'cleared')) {
      setValidationError('Please enter officer remarks or select a preset justification note before proceeding.');
      return;
    }
    setValidationError('');

    const historyEntry = {
      timestamp: new Date().toISOString(),
      reviewer: 'Ernakulam Municipal Disaster Cell (Authority Console)',
      action: actionTitle,
      previous_verification: currentIncident.verification_status,
      new_verification: newVerification,
      previous_status: currentIncident.status,
      new_status: newStatus,
      notes: note || `${actionTitle} recorded via Authority Operations Console.`,
    };

    if (typeof onUpdateIncidentStatus === 'function') {
      onUpdateIncidentStatus(currentIncident.id, newVerification, newStatus, historyEntry);
    }

    setActionMessage(`Incident ${currentIncident.id} updated: "${actionTitle}". State updated immediately across app.`);
    setActionNote('');
    setTimeout(() => setActionMessage(''), 4500);
  };

  return (
    <div className="fw-authority-view">
      {/* Demonstration Notice Banner */}
      <div className="fw-auth-banner" role="alert">
        <div className="fw-auth-banner-left">
          <div className="fw-auth-icon-wrap">
            <Icon name="shield" size={24} color="#F59E0B" />
          </div>
          <div>
            <div className="fw-auth-badge-row">
              <span className="fw-auth-role-pill">LIVE AUTHORITY CONSOLE</span>
              <span className="fw-auth-privacy-pill">
                <Icon name="check-circle" size={11} color="#10B981" /> Citizen Privacy Protected (PII Redacted)
              </span>
            </div>
            <h3 className="fw-auth-banner-title">
              Authorized Incident Triage & Verification Console
            </h3>
            <p className="fw-auth-banner-sub">
              Live review console connected to Supabase PostgreSQL. Actions taken update incident verification status
              and append audit entries to <code>public.incident_reviews</code> in real time.
            </p>
          </div>
        </div>

        {typeof onRetry === 'function' && (
          <Button
            variant="outline"
            size="sm"
            icon="rotate-ccw"
            onClick={onRetry}
            title="Refresh triage queue from database"
          >
            Refresh Database
          </Button>
        )}
      </div>

      {/* Database Connection Error Notice */}
      {error && (
        <div className="fw-error-banner" role="alert" style={{ marginBottom: '16px' }}>
          <div className="fw-error-lead">
            <Icon name="alert-triangle" size={18} color="#EF4444" />
            <div>
              <strong>Failed to sync triage queue from database</strong>
              <p>{error}</p>
            </div>
          </div>
          {typeof onRetry === 'function' && (
            <Button variant="outline" size="sm" icon="rotate-ccw" onClick={onRetry}>
              Retry Connection
            </Button>
          )}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="fw-loading-banner" role="status" style={{ textAlign: 'center', padding: '12px 0', color: '#94A3B8' }}>
          <span className="fw-spinner" style={{ display: 'inline-block', marginRight: '8px' }} />
          <span>Synchronizing triage queue from database...</span>
        </div>
      )}

      {/* KPI Indicators */}
      <div className="fw-auth-kpi-grid">
        <StatCard
          label="Total Reports"
          value={metrics.total}
          subtext="Logged in this session"
          icon="layers"
          variant="cyan"
        />
        <StatCard
          label="Pending Triage"
          value={metrics.pending}
          subtext="Needs official inspection"
          icon="clock"
          trend={metrics.pending > 0 ? 'Action Required' : 'Queue Cleared'}
          trendDirection={metrics.pending > 0 ? 'danger' : 'neutral'}
          variant="warning"
        />
        <StatCard
          label="Verified & Published"
          value={metrics.verified}
          subtext="Confirmed by field desk"
          icon="check-circle"
          trend="Active on public map"
          trendDirection="neutral"
          variant="emerald"
        />
        <StatCard
          label="Under Inspection"
          value={metrics.investigating}
          subtext="Field crew dispatched"
          icon="activity"
          variant="warning"
        />
        <StatCard
          label="Cleared / Resolved"
          value={metrics.cleared}
          subtext="Roads reopened / drained"
          icon="shield-check"
          variant="cyan"
        />
        <StatCard
          label="Rejected / Dismissed"
          value={metrics.rejected}
          subtext="False or duplicate logs"
          icon="x-circle"
          variant="default"
        />
      </div>

      {/* Recurring Hotspots & Status Distribution */}
      <div className="fw-auth-analytics-grid">
        {/* Recurring Hotspots Panel */}
        <div className="fw-hotspots-card">
          <div className="fw-hotspots-header">
            <div className="fw-hotspots-title-wrap">
              <Icon name="alert-triangle" size={17} color="#F97316" />
              <h4>Monitored Recurring Hazard Hotspots</h4>
            </div>
            <span className="fw-hotspots-sub">Greater Kochi Chronic Inundation Zones</span>
          </div>

          <div className="fw-hotspots-list">
            {hotspotStats.map((spot) => (
              <div key={spot.id} className="fw-hotspot-item">
                <div className="fw-hotspot-info">
                  <div className="fw-hotspot-name-row">
                    <strong className="fw-hotspot-name">{spot.name}</strong>
                    <Badge severity={spot.peakSeverity} />
                    {spot.hasActive && (
                      <span className="fw-hotspot-active-tag">Active Hazard</span>
                    )}
                  </div>
                  <span className="fw-hotspot-landmark">
                    <Icon name="map-pin" size={11} /> {spot.landmark}
                  </span>
                </div>

                <div className="fw-hotspot-actions">
                  <span className="fw-hotspot-count-pill">
                    <strong>{spot.incidentCount}</strong> reports
                  </span>
                  <button
                    type="button"
                    className="fw-hotspot-filter-btn"
                    onClick={() => {
                      setQueueTab('all');
                      setSearchQuery(spot.id);
                    }}
                    title={`Filter triage queue to ${spot.name}`}
                  >
                    Filter Queue
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Incident Status & Severity Distribution Panel */}
        <div className="fw-distribution-card">
          <div className="fw-distribution-header">
            <div className="fw-dist-title-wrap">
              <Icon name="activity" size={17} color="#06B6D4" />
              <h4>Incident Status & Severity Distribution</h4>
            </div>
            <span className="fw-dist-sub">Real-Time Operational Portfolio</span>
          </div>

          <div className="fw-dist-body">
            {/* Status Breakdown Bar */}
            <div className="fw-dist-section">
              <span className="fw-dist-label">Operational Status Split</span>
              <div className="fw-stacked-bar-track">
                <div
                  className="fw-bar-segment fw-seg-verified"
                  style={{ width: `${metrics.total ? (metrics.verified / metrics.total) * 100 : 0}%` }}
                  title={`Verified: ${metrics.verified}`}
                />
                <div
                  className="fw-bar-segment fw-seg-pending"
                  style={{ width: `${metrics.total ? (metrics.pending / metrics.total) * 100 : 0}%` }}
                  title={`Pending: ${metrics.pending}`}
                />
                <div
                  className="fw-bar-segment fw-seg-cleared"
                  style={{ width: `${metrics.total ? (metrics.cleared / metrics.total) * 100 : 0}%` }}
                  title={`Cleared: ${metrics.cleared}`}
                />
                <div
                  className="fw-bar-segment fw-seg-rejected"
                  style={{ width: `${metrics.total ? (metrics.rejected / metrics.total) * 100 : 0}%` }}
                  title={`Rejected: ${metrics.rejected}`}
                />
              </div>

              <div className="fw-dist-legend-row">
                <span className="fw-dist-legend-item">
                  <span className="fw-dist-dot fw-dot-verified" /> Verified ({metrics.verified})
                </span>
                <span className="fw-dist-legend-item">
                  <span className="fw-dist-dot fw-dot-pending" /> Pending ({metrics.pending})
                </span>
                <span className="fw-dist-legend-item">
                  <span className="fw-dist-dot fw-dot-cleared" /> Cleared ({metrics.cleared})
                </span>
                <span className="fw-dist-legend-item">
                  <span className="fw-dist-dot fw-dot-rejected" /> Rejected ({metrics.rejected})
                </span>
              </div>
            </div>

            {/* Severity Distribution */}
            <div className="fw-dist-section">
              <span className="fw-dist-label">Severity Profile</span>
              <div className="fw-severity-meters">
                <div className="fw-sev-meter-row">
                  <span className="fw-meter-label">Severe / Impassable:</span>
                  <div className="fw-meter-bar-track">
                    <div
                      className="fw-meter-fill fw-fill-severe"
                      style={{ width: `${metrics.total ? (metrics.severeCount / metrics.total) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="fw-meter-val">{metrics.severeCount}</span>
                </div>

                <div className="fw-sev-meter-row">
                  <span className="fw-meter-label">High Risk:</span>
                  <div className="fw-meter-bar-track">
                    <div
                      className="fw-meter-fill fw-fill-high"
                      style={{ width: `${metrics.total ? (metrics.highCount / metrics.total) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="fw-meter-val">{metrics.highCount}</span>
                </div>

                <div className="fw-sev-meter-row">
                  <span className="fw-meter-label">Moderate:</span>
                  <div className="fw-meter-bar-track">
                    <div
                      className="fw-meter-fill fw-fill-mod"
                      style={{ width: `${metrics.total ? (metrics.modCount / metrics.total) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="fw-meter-val">{metrics.modCount}</span>
                </div>

                <div className="fw-sev-meter-row">
                  <span className="fw-meter-label">Minor:</span>
                  <div className="fw-meter-bar-track">
                    <div
                      className="fw-meter-fill fw-fill-low"
                      style={{ width: `${metrics.total ? (metrics.lowCount / metrics.total) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="fw-meter-val">{metrics.lowCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Toast Alert */}
      {actionMessage && (
        <div className="fw-action-toast" role="status">
          <Icon name="check-circle" size={17} color="#10B981" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Triage Split Layout */}
      <div className="fw-auth-split-layout">
        {/* Incident Queue Column */}
        <div className="fw-auth-queue-col">
          <Card
            title="Incident Review Queue"
            subtitle={`${filteredQueue.length} incidents matching criteria`}
            icon={<Icon name="layers" size={18} color="#06B6D4" />}
            badge={
              <Badge variant={queueTab === 'pending' ? 'warning' : 'default'}>
                {filteredQueue.length} In Queue
              </Badge>
            }
          >
            {/* Queue Filters and Search */}
            <div className="fw-queue-toolbar">
              <div className="fw-queue-search">
                <Icon name="search" size={15} color="#94A3B8" />
                <input
                  type="text"
                  className="fw-search-input"
                  placeholder="Search ID, location, or title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search incident queue"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="fw-search-clear-btn"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear queue search"
                  >
                    <Icon name="x" size={13} />
                  </button>
                )}
              </div>

              {/* Queue Status Tabs */}
              <div className="fw-queue-tabs" role="tablist" aria-label="Filter queue by status">
                {[
                  { id: 'pending', label: `Pending (${metrics.pending})` },
                  { id: 'all', label: `All (${metrics.total})` },
                  { id: 'verified', label: `Verified (${metrics.verified})` },
                  { id: 'investigating', label: `Inspection (${metrics.investigating})` },
                  { id: 'cleared', label: `Cleared (${metrics.cleared})` },
                  { id: 'rejected', label: `Rejected (${metrics.rejected})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={queueTab === tab.id}
                    className={`fw-queue-tab ${queueTab === tab.id ? 'active' : ''}`}
                    onClick={() => setQueueTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Severity Dropdown */}
              <div className="fw-queue-sub-filter">
                <label className="fw-filter-label" htmlFor="queue-sev-filter">
                  Severity:
                </label>
                <select
                  id="queue-sev-filter"
                  className="fw-select"
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  aria-label="Filter queue by severity"
                >
                  <option value="all">All Severities</option>
                  <option value="severe">Severe Only</option>
                  <option value="high">High Risk</option>
                  <option value="moderate">Moderate</option>
                  <option value="low">Minor</option>
                </select>
              </div>
            </div>

            {/* Queue Item List */}
            <div className="fw-auth-queue-list" role="listbox" aria-label="Select incident to review">
              {filteredQueue.map((inc) => {
                const isSelected = currentIncident?.id === inc.id;
                const isSevere = inc.severity === 'severe';

                return (
                  <div
                    key={inc.id}
                    className={`fw-auth-queue-item ${isSelected ? 'fw-queue-item-active' : ''} ${
                      isSevere ? 'fw-queue-severe-border' : ''
                    }`}
                    onClick={() => {
                      setSelectedIncidentId(inc.id);
                      setValidationError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedIncidentId(inc.id);
                        setValidationError('');
                      }
                    }}
                    tabIndex={0}
                    role="option"
                    aria-selected={isSelected}
                    aria-label={`Select incident ${inc.id}: ${inc.title}`}
                  >
                    <div className="fw-queue-item-top">
                      <span className="fw-queue-id">{inc.id}</span>
                      <div className="fw-queue-badges">
                        <Badge severity={inc.severity} />
                        <Badge status={inc.status} />
                      </div>
                    </div>

                    <h4 className="fw-queue-title">{inc.title}</h4>
                    <span className="fw-queue-loc">
                      <Icon name="map-pin" size={11} color="#06B6D4" /> {inc.location_label}
                    </span>

                    <div className="fw-queue-item-meta">
                      <Badge verification={inc.verification_status} />
                      <span className="fw-queue-time">
                        {new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}

              {filteredQueue.length === 0 && (
                <div className="fw-queue-empty">
                  <Icon name="check-circle" size={32} color="#10B981" />
                  <h5>No incidents found</h5>
                  <p>No reports match your current filter criteria.</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Triage Detail & Action Inspector Column */}
        <div className="fw-auth-action-col">
          {currentIncident ? (
            <Card
              title={`Inspect & Triage: ${currentIncident.id}`}
              subtitle={currentIncident.title}
              icon={<Icon name="shield" size={18} color="#F59E0B" />}
              badge={<Badge severity={currentIncident.severity} />}
            >
              <div className="fw-triage-panel">
                {/* Top Action Ribbon */}
                <div className="fw-triage-top-bar">
                  <div className="fw-triage-status-cluster">
                    <Badge verification={currentIncident.verification_status} />
                    <Badge status={currentIncident.status} />
                  </div>

                  {typeof onNavigateToMap === 'function' && (
                    <Button
                      variant="outline"
                      size="sm"
                      icon="map-pin"
                      onClick={() => onNavigateToMap(currentIncident.id)}
                      title="Inspect coordinates and area context on interactive Leaflet map"
                    >
                      Inspect on Map
                    </Button>
                  )}
                </div>

                {/* Evidence Metrics Grid */}
                <div className="fw-triage-details-grid">
                  <div className="fw-triage-box">
                    <span className="fw-triage-lbl">Location Landmark</span>
                    <strong className="fw-triage-val">{currentIncident.location_label}</strong>
                    <code className="fw-triage-coords">
                      [{currentIncident.latitude.toFixed(4)}, {currentIncident.longitude.toFixed(4)}]
                    </code>
                  </div>

                  <div className="fw-triage-box">
                    <span className="fw-triage-lbl">Reported Water Depth</span>
                    <strong className="fw-triage-val">~{currentIncident.water_depth_cm || 25} cm</strong>
                    <span className="fw-triage-sub">{currentIncident.passable_for}</span>
                  </div>

                  <div className="fw-triage-box">
                    <span className="fw-triage-lbl">Nearby Rainfall Context</span>
                    <span className="fw-triage-val">
                      {currentIncident.rainfall_value ? `${currentIncident.rainfall_value} mm/h` : 'Telemetry unavailable'}
                    </span>
                    <span className="fw-triage-sub">{currentIncident.rainfall_source || 'Sensor Offline'}</span>
                  </div>

                  <div className="fw-triage-box">
                    <span className="fw-triage-lbl">Reporter Identity</span>
                    <strong className="fw-triage-val">Community Contributor</strong>
                    <span className="fw-triage-privacy-tag">
                      <Icon name="shield-check" size={11} color="#10B981" /> Redacted for Privacy
                    </span>
                  </div>
                </div>

                {/* Citizen Report Description */}
                <div className="fw-triage-desc-box">
                  <div className="fw-desc-box-header">
                    <span className="fw-triage-lbl">Citizen Report Evidence & Description</span>
                    <span className="fw-desc-observed-at">
                      Observed: {new Date(currentIncident.observed_at || currentIncident.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="fw-triage-text">{currentIncident.description}</p>
                  {currentIncident.reporter_notes && (
                    <div className="fw-reporter-notes">
                      <strong>Observation Notes:</strong> {currentIncident.reporter_notes}
                    </div>
                  )}
                </div>

                {/* AI Incident Intelligence & Risk Assessment Panel */}
                <AiIncidentIntelligenceCard
                  incidentId={currentIncident.id}
                  isAuthority={true}
                />

                {/* Review Audit History Timeline */}
                <div className="fw-triage-history-box">
                  <div className="fw-history-header">
                    <Icon name="clock" size={14} color="#06B6D4" />
                    <span className="fw-triage-lbl">Official Review History & Audit Log</span>
                  </div>

                  {currentIncident.review_history && currentIncident.review_history.length > 0 ? (
                    <div className="fw-audit-log-items">
                      {currentIncident.review_history.map((log, i) => (
                        <div key={i} className="fw-audit-item">
                          <div className="fw-audit-top">
                            <strong className="fw-audit-action">{log.action}</strong>
                            <span className="fw-audit-by">by {log.reviewer}</span>
                            <span className="fw-audit-time">
                              {new Date(log.timestamp).toLocaleString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="fw-audit-notes">{log.notes}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="fw-empty-audit">
                      No official review actions recorded yet. Report is currently pending desk review.
                    </p>
                  )}
                </div>

                {/* Verification & Response Action Controls */}
                <div className="fw-triage-controls">
                  <h4 className="fw-controls-title">Record Official Triage Action (Simulated Desk)</h4>
                  <p className="fw-controls-sub">
                    Select an official action to immediately update this incident's status and verification in local state.
                  </p>

                  {/* Preset Remarks Chips */}
                  <div className="fw-preset-remarks-wrap">
                    <span className="fw-preset-label">Quick Preset Remarks:</span>
                    <div className="fw-preset-chips">
                      {PRESET_REMARKS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="fw-preset-chip"
                          onClick={() => {
                            setActionNote(preset);
                            setValidationError('');
                          }}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Officer Remarks Input */}
                  <div className="fw-form-group">
                    <label className="fw-form-label" htmlFor="authority-notes">
                      Officer Audit Remarks / Dispatched Instructions (Required for Dismissal or Resolution):
                    </label>
                    <input
                      id="authority-notes"
                      type="text"
                      className={`fw-form-input ${validationError ? 'fw-input-error' : ''}`}
                      placeholder="e.g. Warning signs verified on ground; submersible pump units deployed in simulation"
                      value={actionNote}
                      onChange={(e) => {
                        setActionNote(e.target.value);
                        if (validationError) setValidationError('');
                      }}
                    />
                    {validationError && (
                      <span className="fw-field-error-msg">{validationError}</span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="fw-triage-buttons">
                    <Button
                      variant="primary"
                      icon="check-circle"
                      onClick={() =>
                        handleExecuteAction(
                          'official_verified',
                          'active',
                          'Officially Verified & Published'
                        )
                      }
                      title="Mark as officially verified and published"
                    >
                      Mark Official Verified
                    </Button>

                    <Button
                      variant="secondary"
                      icon="activity"
                      onClick={() =>
                        handleExecuteAction(
                          currentIncident.verification_status,
                          'investigating',
                          'Dispatched Field Inspection'
                        )
                      }
                      title="Set status to under active investigation"
                    >
                      Mark Under Inspection
                    </Button>

                    <Button
                      variant="outline"
                      icon="shield-check"
                      onClick={() =>
                        handleExecuteAction(
                          'official_verified',
                          'cleared',
                          'Hazard Cleared / Route Reopened'
                        )
                      }
                      title="Mark as resolved / cleared"
                    >
                      Mark Cleared / Resolved
                    </Button>

                    <Button
                      variant="danger"
                      icon="x-circle"
                      onClick={() =>
                        handleExecuteAction(
                          'rejected',
                          'dismissed',
                          'Rejected / Duplicate Report Dismissed'
                        )
                      }
                      title="Dismiss false or duplicate report"
                    >
                      Reject & Dismiss
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <div className="fw-inspector-empty">
              <Icon name="shield" size={36} color="#64748B" />
              <h4>Select an Incident from Queue</h4>
              <p>Choose any report on the left to inspect evidence metrics, audit review history, and record triage actions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
