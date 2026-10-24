import { useState, useEffect } from 'react';
import Icon from '../../components/common/Icon';
import incidentService from '../../services/incidentService';

/**
 * Floating Incident Detail Panel (over the bottom of the map)
 * Direct adaptation of the reference screenshot's bottom floating card.
 *
 * Displays:
 * - Incident ID and Status Pill
 * - Location, Coordinates, Inundation Depth
 * - Live Open-Meteo Weather & Rainfall context
 * - Reported time & Verification Source
 * - Authorized Triage actions (Investigate, Verify, Resolve)
 * - AI Incident Intelligence Assessment
 */
export default function FloatingIncidentDetailCard({
  incident,
  weather,
  onClose,
  onUpdateStatus,
  onOpenHotlines,
}) {
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiExpanded, setAiExpanded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!incident?.id) return;
    incidentService
      .getAiAnalysis(incident.id)
      .then((data) => {
        if (isMounted) setAiAnalysis(data);
      })
      .catch(() => {
        if (isMounted) setAiAnalysis(null);
      });
    return () => {
      isMounted = false;
    };
  }, [incident?.id]);

  if (!incident) return null;

  const handleStatusChange = async (newVerification, newStatus, actionName) => {
    if (typeof onUpdateStatus !== 'function') return;
    try {
      setIsUpdating(true);
      setActionMenuOpen(false);
      await onUpdateStatus(incident.id, newVerification, newStatus, {
        reviewer: 'Operations Console',
        notes: `Status updated to ${newStatus} (${newVerification}) from map card`,
      });
      setFeedbackMsg(`Successfully marked as ${actionName}`);
      setTimeout(() => setFeedbackMsg(null), 3500);
    } catch (err) {
      console.error('[FloatingIncidentDetailCard] Update failed:', err);
      setFeedbackMsg(`Update failed: ${err.message}`);
      setTimeout(() => setFeedbackMsg(null), 4000);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatTimestamp = (isoString) => {
    if (!isoString) return 'Unavailable';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ', ' +
        d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Unavailable';
    }
  };

  const getStatusBadge = () => {
    if (incident.status === 'investigating') {
      return <span className="fw-fl-status-pill fw-fl-investigating">INVESTIGATING</span>;
    }
    if (incident.status === 'resolved' || incident.status === 'cleared') {
      return <span className="fw-fl-status-pill fw-fl-resolved">RESOLVED</span>;
    }
    return <span className="fw-fl-status-pill fw-fl-active">ACTIVE HAZARD</span>;
  };

  return (
    <div
      className="fw-floating-bottom-card"
      role="region"
      aria-label={`Selected Incident Detail: ${incident.title}`}
    >
      {/* Top Header Row */}
      <div className="fw-fl-header-row">
        <div className="fw-fl-title-cluster">
          <h3 className="fw-fl-id-title">Incident ID #{incident.id}</h3>
          {getStatusBadge()}
          {feedbackMsg && (
            <span className="fw-fl-feedback-tag">{feedbackMsg}</span>
          )}
        </div>

        <div className="fw-fl-actions-cluster">
          {/* Authority Actions Triage Menu */}
          <div className="fw-fl-dropdown-wrapper">
            <button
              type="button"
              className="fw-fl-action-btn fw-fl-btn-authority"
              onClick={() => setActionMenuOpen((prev) => !prev)}
              disabled={isUpdating}
              aria-expanded={actionMenuOpen}
              aria-haspopup="true"
              title="Official Authority Review Actions"
            >
              <Icon name="shield-check" size={14} />
              <span>{isUpdating ? 'Updating...' : 'Authority Actions'}</span>
              <Icon name="chevron-down" size={13} />
            </button>

            {actionMenuOpen && (
              <div className="fw-fl-dropdown-menu" role="menu">
                <button
                  type="button"
                  className="fw-fl-menu-item"
                  onClick={() =>
                    handleStatusChange(
                      'verified_official',
                      'active',
                      'Official Verified'
                    )
                  }
                  role="menuitem"
                >
                  <Icon name="check-circle" size={14} color="#10B981" />
                  <span>Verify Report (Official)</span>
                </button>
                <button
                  type="button"
                  className="fw-fl-menu-item"
                  onClick={() =>
                    handleStatusChange(
                      'community_confirmed',
                      'investigating',
                      'Under Investigation'
                    )
                  }
                  role="menuitem"
                >
                  <Icon name="activity" size={14} color="#F59E0B" />
                  <span>Mark Investigating</span>
                </button>
                <button
                  type="button"
                  className="fw-fl-menu-item"
                  onClick={() =>
                    handleStatusChange(
                      'verified_official',
                      'resolved',
                      'Resolved'
                    )
                  }
                  role="menuitem"
                >
                  <Icon name="check" size={14} color="#3B82F6" />
                  <span>Resolve & Clear Inundation</span>
                </button>
              </div>
            )}
          </div>

          {/* AI Intelligence Toggle Pill */}
          {aiAnalysis && aiAnalysis.analysis_status === 'completed' && (
            <button
              type="button"
              className="fw-fl-action-btn"
              onClick={() => setAiExpanded((prev) => !prev)}
              style={{
                background: aiExpanded ? 'rgba(56, 189, 248, 0.2)' : 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                color: '#38BDF8',
              }}
              title="Toggle AI Incident Intelligence Assessment"
            >
              <Icon name="sparkles" size={13} color="#38BDF8" />
              <span>AI Intel</span>
              {aiAnalysis.road_status && aiAnalysis.road_status !== 'unknown' && (
                <span
                  style={{
                    fontSize: '10px',
                    padding: '1px 5px',
                    borderRadius: '3px',
                    background:
                      aiAnalysis.road_status === 'blocked'
                        ? 'rgba(239, 68, 68, 0.25)'
                        : aiAnalysis.road_status === 'partially_blocked'
                        ? 'rgba(245, 158, 11, 0.25)'
                        : 'rgba(16, 185, 129, 0.25)',
                    color:
                      aiAnalysis.road_status === 'blocked'
                        ? '#FCA5A5'
                        : aiAnalysis.road_status === 'partially_blocked'
                        ? '#FDE047'
                        : '#6EE7B7',
                  }}
                >
                  {aiAnalysis.road_status === 'blocked'
                    ? 'Blocked'
                    : aiAnalysis.road_status === 'partially_blocked'
                    ? 'Caution'
                    : 'Open'}
                </span>
              )}
            </button>
          )}

          {/* Emergency Helpline Button (Matching Contact Courier in reference) */}
          <button
            type="button"
            className="fw-fl-action-btn fw-fl-btn-contact"
            onClick={onOpenHotlines}
            title="Kerala Disaster Control (1077) / Police (112)"
          >
            <Icon name="phone" size={14} />
            <span>Emergency Helplines</span>
          </button>

          {/* Close Card */}
          <button
            type="button"
            className="fw-fl-close-btn"
            onClick={onClose}
            aria-label="Close details panel"
            title="Minimize detail panel"
          >
            <Icon name="close" size={15} />
          </button>
        </div>
      </div>

      {/* Expanded AI Intelligence Brief Drawer */}
      {aiExpanded && aiAnalysis && (
        <div
          style={{
            padding: '12px 14px',
            margin: '0 0 12px 0',
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="sparkles" size={14} color="#38BDF8" />
              <strong style={{ fontSize: '12px', color: '#38BDF8' }}>
                OpenAI Assessment ({aiAnalysis.model_name || 'gpt-4.1-mini'})
              </strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                Confidence: <strong>{Math.round((aiAnalysis.confidence ?? 0.5) * 100)}%</strong>
              </span>
              {aiAnalysis.urgency && (
                <span
                  style={{
                    fontSize: '10.5px',
                    textTransform: 'uppercase',
                    padding: '1px 6px',
                    borderRadius: '3px',
                    background: 'rgba(245, 158, 11, 0.15)',
                    color: '#FBBF24',
                  }}
                >
                  {aiAnalysis.urgency} urgency
                </span>
              )}
            </div>
          </div>
          <p style={{ fontSize: '12px', color: '#F1F5F9', margin: 0, lineHeight: 1.5 }}>
            {aiAnalysis.summary}
          </p>
          {aiAnalysis.recommended_action && (
            <div
              style={{
                fontSize: '11.5px',
                color: '#A7F3D0',
                background: 'rgba(16, 185, 129, 0.08)',
                padding: '6px 10px',
                borderRadius: '4px',
                border: '1px solid rgba(16, 185, 129, 0.2)',
              }}
            >
              <strong>Action:</strong> {aiAnalysis.recommended_action}
            </div>
          )}
        </div>
      )}

      {/* Bottom Information Columns Row (Matching From | To | Current Location | Distance | Last Stop) */}
      <div className="fw-fl-cols-grid">
        {/* Column 1: Sector / Location */}
        <div className="fw-fl-col">
          <span className="fw-fl-col-label">Location / Sector</span>
          <span className="fw-fl-col-val fw-fl-bold">
            {incident.location_label || 'Greater Kochi'}
          </span>
          <span className="fw-fl-col-sub">{incident.title}</span>
        </div>

        {/* Column 2: Geographic Coordinates */}
        <div className="fw-fl-col">
          <span className="fw-fl-col-label">Coordinates</span>
          <span className="fw-fl-col-val">
            {incident.latitude && incident.longitude
              ? `${Number(incident.latitude).toFixed(4)}° N, ${Number(incident.longitude).toFixed(4)}° E`
              : 'Unavailable'}
          </span>
          <span className="fw-fl-col-sub">
            Passable: {incident.passable_for || 'Exercise Caution'}
          </span>
        </div>

        {/* Column 3: Water Inundation Level */}
        <div className="fw-fl-col">
          <span className="fw-fl-col-label">Reported Water Depth</span>
          <span className="fw-fl-col-val fw-fl-depth">
            ~{incident.water_depth_cm || 25} cm
          </span>
          <span className="fw-fl-col-sub">
            Severity: {incident.severity ? incident.severity.toUpperCase() : 'MODERATE'}
          </span>
        </div>

        {/* Column 4: Live Weather (Genuine Open-Meteo Integration) */}
        <div className="fw-fl-col">
          <span className="fw-fl-col-label">Weather (Open-Meteo)</span>
          <span className="fw-fl-col-val">
            {weather?.current?.temperature_c != null
              ? `${weather.current.temperature_c}°C • ${weather.current.weather_description}`
              : 'Live Model Active'}
          </span>
          <span className="fw-fl-col-sub">
            {weather?.forecast_summary?.next_24h_accumulation_mm != null
              ? `~${weather.forecast_summary.next_24h_accumulation_mm} mm 24h rain`
              : 'CC BY 4.0 Model Forecast'}
          </span>
        </div>

        {/* Column 5: Verification & Reported Time */}
        <div className="fw-fl-col">
          <span className="fw-fl-col-label">Reported & Verification</span>
          <span className="fw-fl-col-val">
            {incident.verification_status === 'verified_official'
              ? 'Official Verified'
              : incident.verification_status === 'community_confirmed'
              ? 'Community Confirmed'
              : 'Citizen Submitted'}
          </span>
          <span className="fw-fl-col-sub">
            {formatTimestamp(incident.created_at)}
          </span>
        </div>
      </div>
    </div>
  );
}
