import { useState } from 'react';
import Icon from '../common/Icon';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import StatCard from '../common/StatCard';
import { INITIAL_INCIDENTS } from '../../data/demoData';

/**
 * Authority Operations & Verification Console
 * Review queue for municipal and disaster response teams to triage and update incident statuses.
 */
export default function AuthorityView({
  incidents = INITIAL_INCIDENTS,
  onUpdateIncidentStatus,
}) {
  const [selectedIncidentId, setSelectedIncidentId] = useState(incidents[0]?.id);
  const [actionNote, setActionNote] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  const currentIncident = incidents.find((i) => i.id === selectedIncidentId) || incidents[0];

  const unverifiedList = incidents.filter(
    (i) =>
      i.verification_status === 'demo_unverified' ||
      i.verification_status === 'demo_community_confirmed' ||
      i.verification_status === 'unverified'
  );
  const verifiedList = incidents.filter(
    (i) => i.verification_status === 'demo_reviewed' || i.verification_status === 'authority_verified'
  );
  const criticalList = incidents.filter((i) => i.severity === 'severe');

  const handleUpdateStatus = (incidentId, newVerification, newStatus, actionLabel) => {
    const historyEntry = {
      timestamp: new Date().toISOString(),
      reviewer: 'Ernakulam Municipal Disaster Cell (Demo Desk)',
      action: actionLabel,
      notes: actionNote.trim() || 'Status updated via Authority Console demo.',
    };

    if (typeof onUpdateIncidentStatus === 'function') {
      onUpdateIncidentStatus(incidentId, newVerification, newStatus, historyEntry);
    }

    setActionMessage(`Incident ${incidentId} updated: "${actionLabel}".`);
    setActionNote('');
    setTimeout(() => setActionMessage(''), 4000);
  };

  return (
    <div className="fw-authority-view">
      {/* Demo Notice */}
      <div className="fw-auth-banner">
        <Icon name="shield" size={20} color="#F59E0B" />
        <div>
          <h4 className="fw-auth-banner-title">Authorized Incident Triage Console (Simulated Demo)</h4>
          <p className="fw-auth-banner-sub">
            This console simulates authority verification actions by Municipal Ward Teams and Disaster Management Officers. Changes persist in this session's state.
          </p>
        </div>
      </div>

      {/* KPI Indicators */}
      <div className="fw-auth-kpi-grid">
        <StatCard
          label="Triage Queue"
          value={unverifiedList.length}
          subtext="Awaiting official inspection"
          icon="clock"
          trend="Action Required"
          trendDirection="danger"
          variant="warning"
        />
        <StatCard
          label="Official Verified"
          value={verifiedList.length}
          subtext="Confirmed by field officers"
          icon="check-circle"
          trend="Published to public"
          trendDirection="neutral"
          variant="emerald"
        />
        <StatCard
          label="Severe Road Closures"
          value={criticalList.length}
          subtext="Barricades & pumps deployed"
          icon="shield-alert"
          trend="High Priority"
          trendDirection="danger"
          variant="danger"
        />
      </div>

      {/* Action Toast Alert */}
      {actionMessage && (
        <div className="fw-action-toast">
          <Icon name="check-circle" size={16} color="#10B981" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Triage Split Layout */}
      <div className="fw-auth-split-layout">
        {/* Incident Queue List */}
        <div className="fw-auth-queue-col">
          <Card
            title="Incident Review Queue"
            subtitle="Sorted by severity and recency"
            icon={<Icon name="layers" size={18} color="#06B6D4" />}
            badge={
              <Badge variant="warning">{unverifiedList.length} Pending Review</Badge>
            }
          >
            <div className="fw-auth-queue-list">
              {incidents.map((inc) => {
                const isSelected = currentIncident?.id === inc.id;
                return (
                  <div
                    key={inc.id}
                    className={`fw-auth-queue-item ${isSelected ? 'fw-queue-item-active' : ''}`}
                    onClick={() => setSelectedIncidentId(inc.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedIncidentId(inc.id);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Select incident ${inc.id} for review`}
                    aria-pressed={isSelected}
                  >
                    <div className="fw-queue-item-top">
                      <span className="fw-queue-id">{inc.id}</span>
                      <Badge severity={inc.severity} />
                    </div>

                    <h4 className="fw-queue-title">{inc.title}</h4>
                    <span className="fw-queue-loc">
                      <Icon name="map-pin" size={11} /> {inc.location_label}
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
            </div>
          </Card>
        </div>

        {/* Triage Detail & Action Panel */}
        <div className="fw-auth-action-col">
          {currentIncident ? (
            <Card
              title={`Inspect & Triage: ${currentIncident.id}`}
              subtitle={currentIncident.title}
              icon={<Icon name="shield" size={18} color="#F59E0B" />}
              badge={<Badge severity={currentIncident.severity} />}
            >
              <div className="fw-triage-panel">
                <div className="fw-triage-details-grid">
                  <div className="fw-triage-box">
                    <span className="fw-triage-lbl">Location & Coordinates</span>
                    <strong className="fw-triage-val">{currentIncident.location_label}</strong>
                    <code className="fw-triage-coords">
                      [{currentIncident.latitude.toFixed(4)}, {currentIncident.longitude.toFixed(4)}]
                    </code>
                  </div>

                  <div className="fw-triage-box">
                    <span className="fw-triage-lbl">Inundation Depth</span>
                    <strong className="fw-triage-val">~{currentIncident.water_depth_cm} cm</strong>
                    <span className="fw-triage-sub">{currentIncident.passable_for}</span>
                  </div>

                  <div className="fw-triage-box">
                    <span className="fw-triage-lbl">Verification Status</span>
                    <Badge verification={currentIncident.verification_status} />
                  </div>

                  <div className="fw-triage-box">
                    <span className="fw-triage-lbl">Nearby Rainfall</span>
                    <span className="fw-triage-val">
                      {currentIncident.rainfall_value} mm/h ({currentIncident.rainfall_source})
                    </span>
                  </div>
                </div>

                <div className="fw-triage-desc-box">
                  <span className="fw-triage-lbl">Citizen Report Description</span>
                  <p className="fw-triage-text">{currentIncident.description}</p>
                </div>

                {/* Audit and Review History */}
                <div className="fw-triage-history-box">
                  <span className="fw-triage-lbl">Action Audit Log</span>
                  {currentIncident.review_history && currentIncident.review_history.length > 0 ? (
                    <div className="fw-audit-log-items">
                      {currentIncident.review_history.map((log, i) => (
                        <div key={i} className="fw-audit-item">
                          <div className="fw-audit-top">
                            <strong>{log.action}</strong> by <em>{log.reviewer}</em>
                            <span className="fw-audit-time">
                              {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="fw-audit-notes">{log.notes}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="fw-empty-audit">No previous actions recorded on this item.</p>
                  )}
                </div>

                {/* Official Action Controls */}
                <div className="fw-triage-controls">
                  <h4 className="fw-controls-title">Record Simulated Response & Status</h4>

                  <div className="fw-form-group">
                    <label className="fw-form-label" htmlFor="authority-notes">
                      Officer Notes / Action Dispatched (Demo)
                    </label>
                    <input
                      id="authority-notes"
                      type="text"
                      className="fw-form-input"
                      placeholder="e.g. Warning signs verified; submersible pump deployed in simulation"
                      value={actionNote}
                      onChange={(e) => setActionNote(e.target.value)}
                    />
                  </div>

                  <div className="fw-triage-buttons">
                    <Button
                      variant="primary"
                      icon="check-circle"
                      onClick={() =>
                        handleUpdateStatus(
                          currentIncident.id,
                          'demo_reviewed',
                          'active',
                          'Verified in Demo Desk'
                        )
                      }
                    >
                      Mark Verified in Demo
                    </Button>

                    <Button
                      variant="secondary"
                      icon="warning"
                      onClick={() =>
                        handleUpdateStatus(
                          currentIncident.id,
                          currentIncident.verification_status,
                          'investigating',
                          'Dispatched for Demo Inspection'
                        )
                      }
                    >
                      Mark Under Inspection (Demo)
                    </Button>

                    <Button
                      variant="outline"
                      icon="shield"
                      onClick={() =>
                        handleUpdateStatus(
                          currentIncident.id,
                          'demo_reviewed',
                          'cleared',
                          'Road Cleared in Demo Simulation'
                        )
                      }
                    >
                      Mark Cleared in Demo
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <div className="fw-inspector-empty">
              <Icon name="shield" size={32} color="#64748B" />
              <p>Select any incident from the queue to review citizen evidence and record official actions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
