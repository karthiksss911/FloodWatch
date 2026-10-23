import { useState } from 'react';
import Icon from '../common/Icon';

/**
 * Top Safety and Demonstration Disclaimer Banner.
 * Critical Hackathon Requirement: Never claim simulated data is official emergency guidance.
 */
export default function EmergencyBanner({ onOpenHotlines }) {
  const [minimized, setMinimized] = useState(false);

  if (minimized) {
    return (
      <div className="fw-disclaimer-minimized">
        <div className="fw-disclaimer-content">
          <span className="fw-status-pill">
            <span className="fw-status-dot fw-dot-amber" />
            Hackathon Demonstration Mode — Simulated Data
          </span>
          <button
            type="button"
            className="fw-disclaimer-btn"
            onClick={() => setMinimized(false)}
            aria-label="Expand advisory banner"
          >
            Show Advisory
          </button>
        </div>
      </div>
    );
  }

  return (
    <aside className="fw-emergency-banner" aria-label="Experimental demo advisory">
      <div className="fw-banner-inner">
        <div className="fw-banner-lead">
          <span className="fw-banner-badge">
            <Icon name="info" size={14} />
            DEMO MODE
          </span>
          <p className="fw-banner-text">
            <strong>FloodWatch Kerala is an experimental community intelligence MVP.</strong> Incidents shown are simulated around Greater Kochi & the Periyar basin for demonstration. This does not replace official guidance from the Kerala State Disaster Management Authority (KSDMA).
          </p>
        </div>

        <div className="fw-banner-actions">
          <button
            type="button"
            className="fw-banner-hotline-btn"
            onClick={onOpenHotlines}
            title="View Official Kerala Helplines"
          >
            <Icon name="phone" size={13} />
            Emergency Contacts (1077 / 112)
          </button>

          <button
            type="button"
            className="fw-banner-close"
            onClick={() => setMinimized(true)}
            aria-label="Minimize advisory banner"
            title="Minimize advisory banner"
          >
            <Icon name="close" size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
