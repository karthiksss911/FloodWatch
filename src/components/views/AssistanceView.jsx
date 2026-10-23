import { useState } from 'react';
import Icon from '../common/Icon';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { ASSISTANCE_POINTS } from '../../data/demoData';

/**
 * Assistance Points Directory View
 * Verified relief camps, rescue hubs, and support centers.
 */
export default function AssistanceView({ onOpenHotlines }) {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredHubs = ASSISTANCE_POINTS.filter((hub) => {
    if (filter !== 'all' && hub.category !== filter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        hub.name.toLowerCase().includes(q) ||
        hub.location_label.toLowerCase().includes(q) ||
        hub.category_label.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="fw-assistance-view">
      {/* Top Banner */}
      <div className="fw-assistance-banner">
        <div className="fw-ass-banner-info">
          <div className="fw-ass-icon-wrap">
            <Icon name="lifebuoy" size={24} color="#10B981" />
          </div>
          <div>
            <h3 className="fw-ass-title">Assistance & Relief Points Directory (Demo Records)</h3>
            <p className="fw-ass-desc">
              Demonstration directory of relief shelters, rescue boat launching points, and material depots in Greater Kochi.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" icon="phone" onClick={onOpenHotlines} aria-label="Open emergency helpline directory">
          Emergency Helplines (1077)
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className="fw-assistance-toolbar">
        <div className="fw-ass-search">
          <Icon name="search" size={16} />
          <input
            type="text"
            className="fw-search-input"
            placeholder="Search by facility name, landmark, or taluk..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="fw-ass-filter-tabs">
          {[
            { id: 'all', label: 'All Points' },
            { id: 'shelter', label: 'Relief Camps' },
            { id: 'rescue_hub', label: 'Boat Rescue Hubs' },
            { id: 'medical', label: 'Medical Bases' },
            { id: 'logistics', label: 'Sandbag Depots' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`fw-ass-tab ${filter === tab.id ? 'fw-ass-tab-active' : ''}`}
              onClick={() => setFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Hubs Grid */}
      <div className="fw-hubs-grid">
        {filteredHubs.map((hub) => {
          const occupancyPct = Math.min(
            100,
            Math.round((hub.capacity_occupied / hub.capacity_total) * 100)
          );

          return (
            <Card
              key={hub.id}
              title={hub.name}
              subtitle={hub.location_label}
              icon={
                <Icon
                  name={hub.category === 'rescue_hub' ? 'waves' : 'lifebuoy'}
                  size={18}
                  color="#06B6D4"
                />
              }
              badge={<Badge verification={hub.verification_status} />}
              footer={
                <div className="fw-hub-footer">
                  <span className="fw-hub-authority">
                    Operating Body: <strong>{hub.operating_authority}</strong>
                  </span>
                  <span className="fw-hub-time">
                    Demo Log: {new Date(hub.last_verified_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              }
            >
              <div className="fw-hub-body">
                {/* Category & Accessibility */}
                <div className="fw-hub-tags">
                  <span className="fw-hub-type-tag">{hub.category_label}</span>
                  {hub.wheelchair_accessible && (
                    <span className="fw-accessible-tag">
                      <Icon name="check-circle" size={12} color="#10B981" /> Wheelchair Accessible
                    </span>
                  )}
                  <Badge status={hub.status} />
                </div>

                {/* Capacity Bar */}
                <div className="fw-hub-capacity-box">
                  <div className="fw-capacity-header">
                    <span className="fw-cap-title">Facility Capacity Status</span>
                    <span className="fw-cap-numbers">
                      <strong>{hub.capacity_occupied}</strong> / {hub.capacity_total} ({occupancyPct}%)
                    </span>
                  </div>
                  <div className="fw-capacity-bar-track">
                    <div
                      className="fw-capacity-bar-fill"
                      style={{
                        width: `${occupancyPct}%`,
                        backgroundColor:
                          occupancyPct > 80 ? '#EF4444' : occupancyPct > 50 ? '#F59E0B' : '#10B981',
                      }}
                    />
                  </div>
                </div>

                {/* Supplies & Medical Notes */}
                <div className="fw-hub-detail-lines">
                  <div className="fw-hub-line">
                    <Icon name="info" size={13} color="#94A3B8" />
                    <span>{hub.supplies_status}</span>
                  </div>
                  <div className="fw-hub-line">
                    <Icon name="shield" size={13} color="#94A3B8" />
                    <span>{hub.medical_support}</span>
                  </div>
                </div>

                {/* Contact CTA */}
                <div className="fw-hub-contact-cta">
                  <a
                    href={`tel:${hub.contact_phone.replace(/\D/g, '')}`}
                    className="fw-hub-call-link"
                  >
                    <Icon name="phone" size={14} />
                    <span>Call Desk: {hub.contact_phone}</span>
                  </a>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredHubs.length === 0 && (
        <div className="fw-empty-state">
          <Icon name="lifebuoy" size={40} color="#64748B" />
          <h4>No assistance points found</h4>
          <p>Try clearing your search query or selecting a different category tab.</p>
        </div>
      )}
    </div>
  );
}
