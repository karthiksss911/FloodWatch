import { useState, useMemo } from 'react';
import Icon from '../../components/common/Icon';
import { CATEGORIES } from '../../config/disasterConfig';

/**
 * Left Information Panel — Flood Incident List
 * Matches the reference screenshot's shipment cards list with tabs,
 * search, filters, compact cards, and an expanded selected card.
 */
export default function LeftIncidentPanel({
  incidents = [],
  selectedIncidentId,
  onSelectIncident,
  onOpenReport,
  isLoading = false,
  error = null,
  onRetry,
}) {
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'investigating' | 'resolved'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedDetailsId, setExpandedDetailsId] = useState(null);

  // Partition counts for tabs directly from live database records
  const counts = useMemo(() => {
    let active = 0;
    let investigating = 0;
    let resolved = 0;

    for (const inc of incidents) {
      if (inc.status === 'investigating') {
        investigating++;
      } else if (inc.status === 'resolved' || inc.status === 'cleared' || inc.status === 'archived') {
        resolved++;
      } else {
        active++;
      }
    }

    return { active, investigating, resolved };
  }, [incidents]);

  // Filter incidents based on active tab, search text, severity, and category
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      // Tab filter
      if (activeTab === 'investigating') {
        if (inc.status !== 'investigating') return false;
      } else if (activeTab === 'resolved') {
        if (inc.status !== 'resolved' && inc.status !== 'cleared' && inc.status !== 'archived') return false;
      } else {
        // 'active'
        if (inc.status === 'investigating' || inc.status === 'resolved' || inc.status === 'cleared' || inc.status === 'archived') {
          return false;
        }
      }

      // Severity filter
      if (selectedSeverity !== 'all' && inc.severity !== selectedSeverity) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && inc.category !== selectedCategory) {
        return false;
      }

      // Search text filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (inc.title || '').toLowerCase().includes(q);
        const matchLoc = (inc.location_label || '').toLowerCase().includes(q);
        const matchId = (inc.id || '').toLowerCase().includes(q);
        const matchDesc = (inc.description || '').toLowerCase().includes(q);
        if (!matchTitle && !matchLoc && !matchId && !matchDesc) {
          return false;
        }
      }

      return true;
    });
  }, [incidents, activeTab, selectedSeverity, selectedCategory, searchQuery]);

  const toggleDetails = (e, id) => {
    e.stopPropagation();
    setExpandedDetailsId((prev) => (prev === id ? null : id));
  };

  const getSeverityPillClass = (sev) => {
    switch (sev) {
      case 'severe':
        return 'fw-pill-severe';
      case 'high':
        return 'fw-pill-high';
      case 'moderate':
        return 'fw-pill-moderate';
      case 'low':
      default:
        return 'fw-pill-low';
    }
  };

  const formatReportTime = (isoString) => {
    if (!isoString) return 'Recent';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
        d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Recent';
    }
  };

  return (
    <aside className="fw-left-panel" aria-label="Incident Management List">
      {/* Panel Top Header */}
      <div className="fw-panel-header">
        <div className="fw-panel-brand-row">
          <div className="fw-brand-tag">
            <h2 className="fw-panel-title">FloodWatch Kerala</h2>
            <span className="fw-panel-sub">Greater Kochi Basin</span>
          </div>
          <button
            type="button"
            className="fw-panel-add-btn"
            onClick={onOpenReport}
            title="Report New Flood Incident"
            aria-label="Report New Flood Incident"
          >
            <Icon name="plus-circle" size={18} />
          </button>
        </div>

        {/* Segmented Tab Control (Matching On the way / Delivered in screenshot) */}
        <div className="fw-segmented-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'active'}
            className={`fw-segment-btn ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Active <span className="fw-segment-count">{counts.active}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'investigating'}
            className={`fw-segment-btn ${activeTab === 'investigating' ? 'active' : ''}`}
            onClick={() => setActiveTab('investigating')}
          >
            Investigating <span className="fw-segment-count">{counts.investigating}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'resolved'}
            className={`fw-segment-btn ${activeTab === 'resolved' ? 'active' : ''}`}
            onClick={() => setActiveTab('resolved')}
          >
            Resolved <span className="fw-segment-count">{counts.resolved}</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="fw-panel-search-box">
          <Icon name="search" size={15} className="fw-search-icon" />
          <input
            type="text"
            className="fw-panel-search-input"
            placeholder="Search incidents or locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search flood incidents"
          />
          {searchQuery && (
            <button
              type="button"
              className="fw-search-clear"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              <Icon name="close" size={12} />
            </button>
          )}
        </div>

        {/* Quick Filters */}
        <div className="fw-panel-filters-row">
          <select
            className="fw-panel-select"
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            aria-label="Filter by severity"
          >
            <option value="all">All Severities</option>
            <option value="severe">Severe</option>
            <option value="high">High</option>
            <option value="moderate">Moderate</option>
            <option value="low">Minor</option>
          </select>

          <select
            className="fw-panel-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Incident Cards Scrollable Container */}
      <div className="fw-panel-card-feed" role="feed" aria-label="Incidents list">
        {isLoading && incidents.length === 0 ? (
          <div className="fw-panel-state-box">
            <span className="fw-panel-spinner" />
            <p>Loading database incident records...</p>
          </div>
        ) : error && incidents.length === 0 ? (
          <div className="fw-panel-state-box fw-panel-error-box">
            <Icon name="alert-triangle" size={20} color="#EF4444" />
            <p className="fw-error-msg">{error}</p>
            {typeof onRetry === 'function' && (
              <button type="button" className="fw-btn-retry" onClick={onRetry}>
                Retry Connection
              </button>
            )}
          </div>
        ) : filteredIncidents.length === 0 ? (
          <div className="fw-panel-empty-state">
            <Icon name="check-circle" size={24} color="#10B981" />
            <h4>No {activeTab} incidents found</h4>
            <p>
              {searchQuery || selectedSeverity !== 'all' || selectedCategory !== 'all'
                ? 'Try adjusting your search query or filter criteria.'
                : `There are currently no ${activeTab} flood reports in this sector.`}
            </p>
            {(searchQuery || selectedSeverity !== 'all' || selectedCategory !== 'all') && (
              <button
                type="button"
                className="fw-btn-clear-filters"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSeverity('all');
                  setSelectedCategory('all');
                }}
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          filteredIncidents.map((incident) => {
            const isSelected = selectedIncidentId === incident.id;
            const depth = incident.water_depth_cm || 25;
            // Calibrate progress bar percentage (0 to 60cm baseline)
            const progressPct = Math.min(100, Math.max(15, Math.round((depth / 60) * 100)));
            const isExpanded = expandedDetailsId === incident.id;

            if (isSelected) {
              // ============================================================
              // SELECTED CARD (Matching Norra Nynäshamn → Stockholm card)
              // ============================================================
              return (
                <article
                  key={incident.id}
                  className="fw-incident-card fw-card-selected"
                  onClick={() => onSelectIncident(incident)}
                  tabIndex={0}
                  role="article"
                  aria-selected="true"
                >
                  {/* Card Header: Route-style title & ID */}
                  <div className="fw-selected-card-top">
                    <div className="fw-card-title-group">
                      <h3 className="fw-card-route-title">
                        {incident.location_label || incident.title}
                      </h3>
                      <span className="fw-card-id-label">Incident ID #{incident.id}</span>
                    </div>

                    <div className="fw-selected-status-badge">
                      <span className={`fw-status-pill ${getSeverityPillClass(incident.severity)}`}>
                        {incident.status === 'investigating'
                          ? 'INVESTIGATING'
                          : incident.severity.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Water Inundation Progress Bar (like the green route progress bar) */}
                  <div className="fw-inundation-meter-box">
                    <div className="fw-inundation-meter-track">
                      <div
                        className="fw-inundation-meter-fill"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* 4-Column Metric Grid (like Sender | Departured | Distance | Weight) */}
                  <div className="fw-card-metrics-grid">
                    <div className="fw-metric-col">
                      <span className="fw-m-lbl">Category</span>
                      <span className="fw-m-val fw-cap-capitalize">
                        {incident.category?.replace(/_/g, ' ') || 'Flood'}
                      </span>
                    </div>
                    <div className="fw-metric-col">
                      <span className="fw-m-lbl">Reported</span>
                      <span className="fw-m-val">{formatReportTime(incident.created_at)}</span>
                    </div>
                    <div className="fw-metric-col">
                      <span className="fw-m-lbl">Passable</span>
                      <span className="fw-m-val">{incident.passable_for || 'Caution'}</span>
                    </div>
                    <div className="fw-metric-col">
                      <span className="fw-m-lbl">Inundation</span>
                      <span className="fw-m-val fw-depth-val">~{depth} cm</span>
                    </div>
                  </div>

                  {/* Verification / Field Scout Row (like Courier info block) */}
                  <div className="fw-courier-row">
                    <div className="fw-courier-left">
                      <div className="fw-courier-avatar">
                        <Icon
                          name={
                            incident.verification_status === 'verified_official'
                              ? 'shield-check'
                              : 'users'
                          }
                          size={15}
                          color="#111827"
                        />
                      </div>
                      <div className="fw-courier-info">
                        <span className="fw-courier-role">Verification Triage</span>
                        <span className="fw-courier-name">
                          {incident.verification_status === 'verified_official'
                            ? 'Official Verified'
                            : incident.verification_status === 'community_confirmed'
                            ? 'Community Confirmed'
                            : 'Citizen Field Scout'}
                        </span>
                      </div>
                    </div>

                    <div className="fw-courier-actions">
                      <a
                        href="tel:1077"
                        className="fw-courier-btn"
                        title="Emergency Helpline (1077)"
                        onClick={(e) => e.stopPropagation()}
                        aria-label="Call emergency control"
                      >
                        <Icon name="phone" size={13} />
                      </a>
                    </div>
                  </div>

                  {/* Expandable History Accordion Link */}
                  <button
                    type="button"
                    className="fw-card-expand-toggle"
                    onClick={(e) => toggleDetails(e, incident.id)}
                    aria-expanded={isExpanded}
                  >
                    <span>Situation history and verification details</span>
                    <Icon
                      name="chevron-down"
                      size={14}
                      className={`fw-expand-chevron ${isExpanded ? 'open' : ''}`}
                    />
                  </button>

                  {/* Expanded Details Body */}
                  {isExpanded && (
                    <div className="fw-card-expanded-body">
                      {incident.description && (
                        <div className="fw-exp-section">
                          <span className="fw-exp-lbl">Field Notes:</span>
                          <p className="fw-exp-text">{incident.description}</p>
                        </div>
                      )}
                      {incident.latitude && incident.longitude && (
                        <div className="fw-exp-section">
                          <span className="fw-exp-lbl">Coordinates:</span>
                          <code className="fw-exp-coords">
                            [{Number(incident.latitude).toFixed(4)}, {Number(incident.longitude).toFixed(4)}]
                          </code>
                        </div>
                      )}
                      {incident.reporter_notes && (
                        <div className="fw-exp-section">
                          <span className="fw-exp-lbl">Audit Notes:</span>
                          <p className="fw-exp-text fw-text-muted">{incident.reporter_notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            }

            // ============================================================
            // UNSELECTED CARD (Matching Florence → Stockholm cards)
            // ============================================================
            return (
              <article
                key={incident.id}
                className="fw-incident-card fw-card-compact"
                onClick={() => onSelectIncident(incident)}
                tabIndex={0}
                role="article"
                aria-selected="false"
              >
                <div className="fw-compact-card-header">
                  <h4 className="fw-compact-route-title">
                    {incident.location_label || incident.title}
                  </h4>
                  <span className={`fw-compact-pill ${getSeverityPillClass(incident.severity)}`}>
                    {incident.status === 'investigating'
                      ? 'INVESTIGATING'
                      : incident.severity.toUpperCase()}
                  </span>
                </div>

                <div className="fw-compact-subrow">
                  <span className="fw-compact-id">Incident ID #{incident.id}</span>
                  <span className="fw-compact-time">{formatReportTime(incident.created_at)}</span>
                </div>

                <div className="fw-compact-meta-row">
                  <span className="fw-compact-cat">
                    <Icon name="droplet" size={12} color="#0284C7" />
                    <span>~{depth} cm &bull; {incident.category?.replace(/_/g, ' ')}</span>
                  </span>
                </div>
              </article>
            );
          })
        )}
      </div>
    </aside>
  );
}
