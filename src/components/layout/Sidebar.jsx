import Icon from '../common/Icon';

/**
 * Sidebar navigation component with branding, section switches,
 * live incident counters, and emergency contact drawer trigger.
 */
export default function Sidebar({
  activeTab,
  onSelectTab,
  isOpen,
  onCloseMobile,
  incidentCount = 7,
  shelterCount = 5,
  onOpenHotlines,
}) {
  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: 'dashboard',
      description: 'System intelligence & key metrics',
    },
    {
      id: 'map',
      label: 'Incident Map',
      icon: 'map',
      badge: `${incidentCount} Active`,
      badgeType: 'active',
      description: 'Geospatial Kerala incident tracker',
    },
    {
      id: 'report',
      label: 'Report Incident',
      icon: 'report',
      highlight: true,
      description: 'Submit waterlogging or blocked road',
    },
    {
      id: 'risk',
      label: 'Risk Intelligence',
      icon: 'risk',
      description: 'Explainable risk estimation engine',
    },
    {
      id: 'assistance',
      label: 'Assistance Points',
      icon: 'assistance',
      badge: `${shelterCount} Hubs`,
      badgeType: 'info',
      description: 'Shelters, boat rescue & depots',
    },
    {
      id: 'authority',
      label: 'Authority Console',
      icon: 'authority',
      badge: 'Demo Review',
      badgeType: 'warning',
      description: 'Review queue & verification triage',
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fw-sidebar-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        id="sidebar-navigation"
        className={`fw-sidebar ${isOpen ? 'fw-sidebar-open' : ''}`}
        aria-label="Main application sidebar"
      >
        {/* Brand Header */}
        <div className="fw-sidebar-brand">
          <div className="fw-brand-logo">
            <div className="fw-logo-icon">
              <Icon name="waves" size={20} color="#06B6D4" />
            </div>
            <div className="fw-brand-text">
              <h1 className="fw-brand-title">
                FloodWatch <span>Kerala</span>
              </h1>
              <span className="fw-brand-tagline">Know the risk before you take the road</span>
            </div>
          </div>

          <button
            type="button"
            className="fw-mobile-close"
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* Region Monitor Pill */}
        <div className="fw-region-pill">
          <div className="fw-region-indicator">
            <span className="fw-pulse-dot fw-dot-amber" />
            <div>
              <span className="fw-region-label">SIMULATED REGION</span>
              <span className="fw-region-name">Greater Kochi Demo Area</span>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="fw-nav-container" aria-label="Main application sections">
          <ul className="fw-nav-list">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <li key={item.id} className="fw-nav-item">
                  <button
                    type="button"
                    className={`fw-nav-link ${isActive ? 'fw-nav-active' : ''} ${
                      item.highlight ? 'fw-nav-highlight' : ''
                    }`}
                    onClick={() => {
                      onSelectTab(item.id);
                      if (onCloseMobile) onCloseMobile();
                    }}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <div className="fw-nav-icon-wrap">
                      <Icon name={item.icon} size={18} />
                    </div>
                    <div className="fw-nav-text">
                      <span className="fw-nav-title">{item.label}</span>
                      <span className="fw-nav-desc">{item.description}</span>
                    </div>
                    {item.badge && (
                      <span className={`fw-nav-badge fw-nav-badge-${item.badgeType || 'default'}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar Footer: Emergency contacts */}
        <div className="fw-sidebar-footer">
          <div className="fw-emergency-quickcard">
            <div className="fw-eq-head">
              <div className="fw-eq-title">
                <Icon name="phone" size={14} color="#EF4444" />
                <span>Kerala Emergency 24x7</span>
              </div>
            </div>
            <div className="fw-eq-numbers">
              <div className="fw-eq-item">
                <span className="fw-eq-num">1077</span>
                <span className="fw-eq-lbl">Disaster Control</span>
              </div>
              <div className="fw-eq-item">
                <span className="fw-eq-num">112</span>
                <span className="fw-eq-lbl">Police / SOS</span>
              </div>
              <div className="fw-eq-item">
                <span className="fw-eq-num">101</span>
                <span className="fw-eq-lbl">Fire & Rescue</span>
              </div>
            </div>
            <button
              type="button"
              className="fw-eq-view-all"
              onClick={onOpenHotlines}
            >
              All Emergency Helplines →
            </button>
          </div>

          <div className="fw-version-info">
            <span>FloodWatch v0.1.0 • Hackathon Prototype</span>
          </div>
        </div>
      </aside>
    </>
  );
}
