import { useState } from 'react';
import Icon from '../../components/common/Icon';

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
