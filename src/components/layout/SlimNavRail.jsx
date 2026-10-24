import Icon from '../common/Icon';

/**
 * Slim Navigation Rail (~68px wide)
 * Matches the reference screenshot's minimalist vertical rail.
 * Clean white background with crisp outline icons and active pill highlight.
 */
export default function SlimNavRail({
  activeNav = 'map',
  onSelectNav,
  onOpenReport,
  onOpenHotlines,
  onOpenSettings,
  activeIncidentCount = 0,
}) {
  const mainNavItems = [
    {
      id: 'dashboard',
      label: 'Overview Dashboard',
      icon: 'home',
      tooltip: 'Situation Overview & Basin KPIs',
    },
    {
      id: 'map',
      label: 'Live Incident Map',
      icon: 'tracker',
      badge: activeIncidentCount > 0 ? activeIncidentCount : null,
      tooltip: 'Live Incident Tracker & Map',
    },
    {
      id: 'report',
      label: 'Report Incident',
      icon: 'plus-circle',
      action: onOpenReport,
      tooltip: 'Submit Community Waterlogging Report',
    },
    {
      id: 'assistance',
      label: 'Assistance Centres',
      icon: 'heart',
      tooltip: 'Relief Shelters, Medical Staging & Rescue Hubs',
    },
    {
      id: 'risk',
      label: 'Risk Intelligence',
      icon: 'activity',
      tooltip: 'Explainable Predictive Risk Engine',
    },
    {
      id: 'authority',
      label: 'Authority Console',
      icon: 'shield',
      tooltip: 'Incident Review & Verification Console',
    },
    {
      id: 'hotlines',
      label: 'Emergency Hotlines',
      icon: 'phone',
      action: onOpenHotlines,
      tooltip: 'Kerala Emergency Contacts (1077 / 112)',
    },
  ];

  return (
    <aside className="fw-slim-rail" aria-label="Global Navigation Rail">
      {/* Brand Logo Mark */}
      <div className="fw-rail-logo-box" title="FloodWatch Kerala — Community Flood Intelligence">
        <button
          type="button"
          className="fw-rail-logo-btn"
          onClick={() => onSelectNav('map')}
          aria-label="FloodWatch Kerala Home"
        >
          <div className="fw-rail-logo-circle">
            <Icon name="waves" size={20} color="#06B6D4" />
          </div>
        </button>
      </div>

      {/* Main Nav Items */}
      <nav className="fw-rail-nav">
        <ul className="fw-rail-nav-list">
          {mainNavItems.map((item) => {
            const isActive = activeNav === item.id;
            return (
              <li key={item.id} className="fw-rail-nav-item">
                <button
                  type="button"
                  className={`fw-rail-btn ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    if (item.action) {
                      item.action();
                    } else {
                      onSelectNav(item.id);
                    }
                  }}
                  title={item.tooltip}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon name={item.icon} size={20} />
                  {item.badge && (
                    <span className="fw-rail-badge">{item.badge}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Auxiliary Actions: Settings & Reset/Logout */}
      <div className="fw-rail-bottom">
        <button
          type="button"
          className={`fw-rail-btn ${activeNav === 'settings' ? 'active' : ''}`}
          onClick={onOpenSettings}
          title="Map & System Settings"
          aria-label="Settings"
        >
          <Icon name="settings" size={20} />
        </button>

        <button
          type="button"
          className="fw-rail-btn"
          onClick={() => onSelectNav('map')}
          title="Reset View / Home"
          aria-label="Reset View"
        >
          <Icon name="logout" size={20} />
        </button>
      </div>
    </aside>
  );
}
