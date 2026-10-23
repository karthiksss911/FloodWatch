import { useState, useEffect } from 'react';
import Icon from '../common/Icon';
import Button from '../common/Button';

/**
 * Top App Header with breadcrumb, live Kerala time ticker (IST),
 * live telemetry status, and quick incident reporting CTA.
 */
export default function Header({
  activeTab,
  isMobileNavOpen = false,
  onOpenMobileNav,
  onNavigateToReport,
  onOpenHotlines,
}) {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateIST = () => {
      const now = new Date();
      // Format to Indian Standard Time (IST)
      const options = {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        day: 'numeric',
        month: 'short',
      };
      setCurrentTime(new Intl.DateTimeFormat('en-IN', options).format(now));
    };

    updateIST();
    const interval = setInterval(updateIST, 1000);
    return () => clearInterval(interval);
  }, []);

  const getTabTitle = (tab) => {
    switch (tab) {
      case 'map':
        return { title: 'Incident Map', breadcrumb: 'Geospatial Intelligence' };
      case 'report':
        return { title: 'Community Incident Reporting', breadcrumb: 'Citizen Dispatch' };
      case 'risk':
        return { title: 'Explainable Risk Intelligence', breadcrumb: 'Predictive Analytics' };
      case 'assistance':
        return { title: 'Assistance Points & Relief Centers', breadcrumb: 'Community Support' };
      case 'authority':
        return { title: 'Authority Operations Console', breadcrumb: 'Incident Verification' };
      case 'overview':
      default:
        return { title: 'Situation Overview', breadcrumb: 'Greater Kochi Dashboard' };
    }
  };

  const { title, breadcrumb } = getTabTitle(activeTab);

  return (
    <header className="fw-header">
      <div className="fw-header-left">
        <button
          type="button"
          className="fw-mobile-menu-trigger"
          onClick={onOpenMobileNav}
          aria-label="Open navigation menu"
          aria-expanded={isMobileNavOpen}
          aria-controls="sidebar-navigation"
        >
          <Icon name="menu" size={22} />
        </button>

        <div className="fw-breadcrumbs">
          <span className="fw-crumb-root">FloodWatch Kerala</span>
          <span className="fw-crumb-separator">/</span>
          <span className="fw-crumb-category">{breadcrumb}</span>
          <span className="fw-crumb-separator">/</span>
          <h2 className="fw-crumb-current">{title}</h2>
        </div>
      </div>

      <div className="fw-header-right">
        {/* Clock & Demo Mode Indicator */}
        <div className="fw-header-telemetry" title="Kerala Standard Time (IST) • Simulated Demo Environment">
          <div className="fw-time-indicator">
            <Icon name="clock" size={14} />
            <span className="fw-time-text">{currentTime || 'Loading IST...'} IST</span>
          </div>
          <div className="fw-telemetry-badge" title="Demonstration feed with simulated sensor data">
            <span className="fw-pulse-dot fw-dot-amber" />
            <span className="fw-telemetry-label fw-label-demo">Demo Mode Feed</span>
          </div>
        </div>

        {/* Emergency contact button */}
        <button
          type="button"
          className="fw-header-sos-btn"
          onClick={onOpenHotlines}
          title="Kerala Emergency Hotlines"
        >
          <Icon name="phone" size={14} />
          <span className="fw-sos-text">Helplines</span>
        </button>

        {/* Quick Report CTA */}
        {activeTab !== 'report' && (
          <Button
            variant="primary"
            size="sm"
            icon="plus-circle"
            onClick={onNavigateToReport}
            className="fw-header-report-btn"
          >
            Report Incident
          </Button>
        )}
      </div>
    </header>
  );
}
