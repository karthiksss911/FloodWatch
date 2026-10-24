import { useState, useMemo } from 'react';
import Icon from '../../components/common/Icon';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import StatCard from '../../components/common/StatCard';

/**
 * FloodWatch Kerala - Assistance Points Directory (Features/Assistance)
 * Displays verified relief camps, rescue hubs, medical response stations, and sandbag depots.
 * Directly fetched from connected Supabase PostgreSQL database.
 */
export default function AssistanceView({
  assistancePoints = [],
  isLoading = false,
  error = null,
  onRetry,
  onOpenHotlines,
  onNavigateToMap,
}) {
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [accessibleOnly, setAccessibleOnly] = useState(false);
  const [sortBy, setSortBy] = useState('capacity_available');

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = assistancePoints.length;
    const shelters = assistancePoints.filter((p) => p.category === 'shelter').length;
    const medical = assistancePoints.filter((p) => p.category === 'medical').length;
    const rescueHubs = assistancePoints.filter((p) => p.category === 'rescue_hub').length;
    const logistics = assistancePoints.filter((p) => p.category === 'logistics').length;

    const totalCapacity = assistancePoints.reduce((acc, p) => acc + (p.capacity_total || 0), 0);
    const totalOccupied = assistancePoints.reduce((acc, p) => acc + (p.capacity_occupied || 0), 0);
    const overallOccupancyPct = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

    return {
      total,
      shelters,
      medical,
      rescueHubs,
      logistics,
      totalCapacity,
      totalOccupied,
      overallOccupancyPct,
    };
  }, [assistancePoints]);

  // Filtered and Sorted Directory List
  const filteredPoints = useMemo(() => {
    return assistancePoints
      .filter((hub) => {
        if (categoryFilter !== 'all' && hub.category !== categoryFilter) return false;
        if (statusFilter !== 'all' && hub.status !== statusFilter) return false;
        if (accessibleOnly && !hub.wheelchair_accessible) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = hub.name.toLowerCase().includes(q);
          const matchLoc = hub.location_label.toLowerCase().includes(q);
          const matchCat = hub.category_label.toLowerCase().includes(q);
          const matchAuth = (hub.operating_authority || '').toLowerCase().includes(q);
          if (!matchName && !matchLoc && !matchCat && !matchAuth) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'capacity_available') {
          const availA = (a.capacity_total || 0) - (a.capacity_occupied || 0);
          const availB = (b.capacity_total || 0) - (b.capacity_occupied || 0);
          return availB - availA;
        }
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'recent') {
          return new Date(b.last_verified_at).getTime() - new Date(a.last_verified_at).getTime();
        }
        return 0;
      });
  }, [assistancePoints, categoryFilter, statusFilter, accessibleOnly, searchQuery, sortBy]);

  const handleResetFilters = () => {
    setCategoryFilter('all');
    setStatusFilter('all');
    setSearchQuery('');
    setAccessibleOnly(false);
    setSortBy('capacity_available');
  };

  return (
    <div className="fw-assistance-view">
      {/* Top Hackathon Demo Disclaimer Banner */}
      <div className="fw-assistance-banner" role="alert">
        <div className="fw-ass-banner-info">
          <div className="fw-ass-icon-wrap">
            <Icon name="lifebuoy" size={26} color="#10B981" />
          </div>
          <div>
            <div className="fw-ass-banner-tag-row">
              <span className="fw-ass-banner-pill">LIVE DIRECTORY</span>
              <span className="fw-ass-banner-pill fw-pill-sec">GREATER KOCHI BASIN</span>
            </div>
            <h3 className="fw-ass-title">Assistance & Emergency Relief Directory</h3>
            <p className="fw-ass-desc">
              Database-backed directory of relief camps, rescue units, medical centres, and sandbag depots.
              For immediate life safety or emergency evacuation, dial official 24x7 Kerala Emergency Helplines.
            </p>
          </div>
        </div>
        <div className="fw-ass-banner-actions">
          <Button
            variant="outline"
            size="sm"
            icon="phone"
            onClick={onOpenHotlines}
            aria-label="Open official emergency helpline directory"
          >
            Official Helplines (1077 / 112)
          </Button>
        </div>
      </div>

      {/* Database Connection Error Notice */}
      {error && (
        <div className="fw-error-banner" role="alert" style={{ marginBottom: '16px' }}>
          <div className="fw-error-lead">
            <Icon name="alert-triangle" size={18} color="#EF4444" />
            <div>
              <strong>Failed to load assistance points from database</strong>
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

      {/* Directory Summary KPIs */}
      <div className="fw-assistance-kpis">
        <StatCard
          label="Total Facilities"
          value={metrics.total}
          subtext="Monitored in demo area"
          icon="lifebuoy"
          variant="cyan"
        />
        <StatCard
          label="Relief Shelters"
          value={metrics.shelters}
          subtext="Transit & evacuation camps"
          icon="shield"
          variant="emerald"
        />
        <StatCard
          label="Medical Bases"
          value={metrics.medical}
          subtext="First response & triage desks"
          icon="activity"
          variant="warning"
        />
        <StatCard
          label="Rescue Boat Hubs"
          value={metrics.rescueHubs}
          subtext="Inundated area dispatch points"
          icon="waves"
          variant="cyan"
        />
        <StatCard
          label="Bed Occupancy"
          value={`${metrics.overallOccupancyPct}%`}
          subtext={`${metrics.totalOccupied} / ${metrics.totalCapacity} capacity`}
          icon="users"
          variant={metrics.overallOccupancyPct > 80 ? 'danger' : 'emerald'}
        />
      </div>

      {/* Search and Filter Toolbar */}
      <div className="fw-assistance-toolbar">
        <div className="fw-ass-search-box">
          <Icon name="search" size={16} color="#94A3B8" />
          <input
            type="text"
            className="fw-search-input"
            placeholder="Search by facility name, landmark, road, or taluk..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search assistance points"
          />
          {searchQuery && (
            <button
              type="button"
              className="fw-search-clear-btn"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search query"
            >
              <Icon name="x" size={14} />
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <div className="fw-ass-filter-tabs" role="tablist" aria-label="Filter assistance points by category">
          {[
            { id: 'all', label: `All Facilities (${metrics.total})` },
            { id: 'shelter', label: `Relief Camps (${metrics.shelters})` },
            { id: 'medical', label: `Medical Bases (${metrics.medical})` },
            { id: 'rescue_hub', label: `Boat Hubs (${metrics.rescueHubs})` },
            { id: 'logistics', label: `Sandbag Depots (${metrics.logistics})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={categoryFilter === tab.id}
              className={`fw-ass-tab ${categoryFilter === tab.id ? 'fw-ass-tab-active' : ''}`}
              onClick={() => setCategoryFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Secondary Filters */}
        <div className="fw-ass-secondary-controls">
          <div className="fw-filter-group">
            <label className="fw-filter-label" htmlFor="ass-status-filter">
              Status:
            </label>
            <select
              id="ass-status-filter"
              className="fw-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter assistance points by operational status"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open / Accepting People</option>
              <option value="active_operations">Active Field Ops</option>
            </select>
          </div>

          <div className="fw-filter-group">
            <label className="fw-filter-label" htmlFor="ass-sort-filter">
              Sort By:
            </label>
            <select
              id="ass-sort-filter"
              className="fw-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort assistance points"
            >
              <option value="capacity_available">Most Capacity Available</option>
              <option value="name">Name (A-Z)</option>
              <option value="recent">Recently Logged</option>
            </select>
          </div>

          <label className="fw-checkbox-label" htmlFor="accessible-toggle">
            <input
              id="accessible-toggle"
              type="checkbox"
              checked={accessibleOnly}
              onChange={(e) => setAccessibleOnly(e.target.checked)}
              className="fw-checkbox-input"
            />
            <span className="fw-accessible-text">Wheelchair Accessible Only</span>
          </label>
        </div>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="fw-loading-banner" role="status" style={{ textAlign: 'center', padding: '16px 0', color: '#94A3B8' }}>
          <span className="fw-spinner" style={{ display: 'inline-block', marginRight: '8px' }} />
          <span>Synchronizing assistance facilities from Supabase database...</span>
        </div>
      )}

      {/* Facility Grid */}
      <div className="fw-hubs-grid">
        {filteredPoints.map((hub) => {
          const capacityTotal = hub.capacity_total || 1;
          const capacityOccupied = hub.capacity_occupied || 0;
          const occupancyPct = Math.min(100, Math.round((capacityOccupied / capacityTotal) * 100));
          const availableUnits = Math.max(0, capacityTotal - capacityOccupied);

          return (
            <Card
              key={hub.id}
              title={hub.name}
              subtitle={hub.location_label}
              icon={
                <Icon
                  name={hub.category === 'rescue_hub' ? 'waves' : hub.category === 'medical' ? 'activity' : 'lifebuoy'}
                  size={18}
                  color={hub.category === 'rescue_hub' ? '#06B6D4' : hub.category === 'medical' ? '#F59E0B' : '#10B981'}
                />
              }
              badge={<Badge verification={hub.verification_status} />}
              footer={
                <div className="fw-hub-footer">
                  <div className="fw-hub-footer-meta">
                    <span className="fw-hub-authority">
                      Operating Body: <strong>{hub.operating_authority}</strong>
                    </span>
                    <span className="fw-hub-time">
                      Verified: {hub.last_verified_at ? new Date(hub.last_verified_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Logged in DB'}
                    </span>
                  </div>

                  <div className="fw-hub-card-actions">
                    <Button
                      variant="primary"
                      size="sm"
                      icon="map-pin"
                      onClick={() => {
                        if (typeof onNavigateToMap === 'function') {
                          onNavigateToMap(hub.id);
                        }
                      }}
                      aria-label={`Open ${hub.name} on Interactive Map`}
                    >
                      View on Map
                    </Button>
                  </div>
                </div>
              }
            >
              <div className="fw-hub-body">
                {/* Category, Coordinates, and Accessibility */}
                <div className="fw-hub-tags">
                  <span className="fw-hub-type-tag">{hub.category_label}</span>
                  <code className="fw-hub-coords">
                    [{hub.latitude.toFixed(4)}, {hub.longitude.toFixed(4)}]
                  </code>
                  {hub.wheelchair_accessible && (
                    <span className="fw-accessible-tag" title="Ground-floor ramp or wheelchair accessible facility">
                      <Icon name="check-circle" size={12} color="#10B981" /> Wheelchair Accessible
                    </span>
                  )}
                  <Badge status={hub.status} />
                </div>

                {/* Capacity & Occupancy Bar */}
                <div className="fw-hub-capacity-box">
                  <div className="fw-capacity-header">
                    <span className="fw-cap-title">
                      {hub.category === 'rescue_hub'
                        ? 'Rescue Fleet Standby'
                        : hub.category === 'logistics'
                        ? 'Sandbag Depot Inventory'
                        : 'Shelter Bed Occupancy'}
                    </span>
                    <span className="fw-cap-numbers">
                      <strong>{capacityOccupied}</strong> / {capacityTotal}{' '}
                      <span className="fw-cap-pct">({occupancyPct}%)</span>
                    </span>
                  </div>
                  <div className="fw-capacity-bar-track" role="progressbar" aria-valuenow={occupancyPct} aria-valuemin={0} aria-valuemax={100}>
                    <div
                      className="fw-capacity-bar-fill"
                      style={{
                        width: `${occupancyPct}%`,
                        backgroundColor:
                          occupancyPct > 80 ? '#EF4444' : occupancyPct > 50 ? '#F59E0B' : '#10B981',
                      }}
                    />
                  </div>
                  <div className="fw-capacity-sub-meta">
                    <span className="fw-cap-avail-badge">
                      {hub.category === 'rescue_hub'
                        ? `${availableUnits} craft ready for launch`
                        : hub.category === 'logistics'
                        ? `${availableUnits} bags available`
                        : `${availableUnits} places available`}
                    </span>
                  </div>
                </div>

                {/* Provision Details & Medical Response */}
                <div className="fw-hub-detail-lines">
                  <div className="fw-hub-line">
                    <Icon name="info" size={14} color="#06B6D4" />
                    <span><strong>Provisions:</strong> {hub.supplies_status}</span>
                  </div>
                  <div className="fw-hub-line">
                    <Icon name="shield-check" size={14} color="#10B981" />
                    <span><strong>Medical:</strong> {hub.medical_support}</span>
                  </div>
                </div>

                {/* Contact and Official Advisory Notice */}
                <div className="fw-hub-contact-card">
                  <div className="fw-contact-split">
                    <div className="fw-contact-demo-col">
                      <span className="fw-contact-label">Facility Contact:</span>
                      <span className="fw-contact-phone-text">
                        <Icon name="phone" size={13} color="#94A3B8" /> {hub.contact_phone}
                      </span>
                      <span className="fw-contact-subnote">Registered facility desk phone</span>
                    </div>

                    <div className="fw-contact-official-col">
                      <span className="fw-contact-label">Official Kerala Emergency:</span>
                      <button
                        type="button"
                        className="fw-official-hotline-btn"
                        onClick={onOpenHotlines}
                        title="Click to view all official 24x7 District Hotlines"
                      >
                        <Icon name="phone-call" size={13} color="#38BDF8" /> {hub.official_helpline || '1077 (Collectorate)'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredPoints.length === 0 && (
        <div className="fw-empty-state">
          <div className="fw-empty-icon-box">
            <Icon name="lifebuoy" size={44} color="#64748B" />
          </div>
          <h4>No assistance points match your filters</h4>
          <p>Try clearing your search query, choosing a different category, or toggling wheelchair requirements.</p>
          <Button variant="outline" size="sm" icon="rotate-ccw" onClick={handleResetFilters}>
            Reset Directory Filters
          </Button>
        </div>
      )}
    </div>
  );
}
