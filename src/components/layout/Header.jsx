import { useState, useEffect } from 'react';
import Icon from '../common/Icon';
import Button from '../common/Button';
import { useWeather } from '../../hooks/useWeather';

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
  const { weather } = useWeather();

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
        {/* Clock, Live Weather & Live Supabase Status */}
        <div className="fw-header-telemetry" title="Kerala Standard Time (IST) • Live Supabase PostgreSQL Feed • Open-Meteo Weather">
          <div className="fw-time-indicator">
            <Icon name="clock" size={14} />
            <span className="fw-time-text">{currentTime || 'Loading IST...'} IST</span>
          </div>
          {weather?.current && (
            <div
              className="fw-weather-header-badge"
              title={`Kochi Weather: ${weather.current.temperature_c ?? weather.current.temperature}°C, ${weather.current.weather_description ?? weather.current.condition} • Open-Meteo model`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 8px',
                borderRadius: '9999px',
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                fontSize: '11.5px',
                color: '#E0F2FE',
              }}
            >
              <Icon name="cloud-rain" size={13} color="#38BDF8" />
              <span>{weather.current.temperature_c ?? weather.current.temperature}°C</span>
            </div>
          )}
          <div className="fw-telemetry-badge" title="Live Supabase Database Connection">
            <span className="fw-pulse-dot" style={{ backgroundColor: '#10B981', boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)' }} />
            <span className="fw-telemetry-label" style={{ color: '#10B981' }}>Live Supabase</span>
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
