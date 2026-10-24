import { useState, useEffect } from 'react';
import Icon from './Icon';

/**
 * Settings and Preferences Modal
 */
export default function SettingsModal({ isOpen, onClose }) {
  const [autoCenter, setAutoCenter] = useState(true);
  const [weatherUnits, setWeatherUnits] = useState('metric');
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fw-dash-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Application Settings"
    >
      <div
        className="fw-dash-modal-window"
        style={{ maxWidth: '480px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="fw-dash-modal-header">
          <div className="fw-dash-modal-title-box">
            <div className="fw-dash-modal-icon">
              <Icon name="settings" size={18} color="#0284C7" />
            </div>
            <div>
              <h2 className="fw-dash-modal-title">System Settings</h2>
              <p className="fw-dash-modal-subtitle">Configure map and telemetry display preferences</p>
            </div>
          </div>
          <button
            type="button"
            className="fw-dash-modal-close"
            onClick={onClose}
            aria-label="Close settings"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="fw-dash-modal-body">
          <div className="fw-settings-list">
            <div className="fw-settings-item">
              <div>
                <strong>Auto-Center on Selection</strong>
                <p>Smoothly animate the map camera to selected incident coordinates.</p>
              </div>
              <input
                type="checkbox"
                checked={autoCenter}
                onChange={(e) => setAutoCenter(e.target.checked)}
                className="fw-checkbox-toggle"
              />
            </div>

            <div className="fw-settings-item">
              <div>
                <strong>Weather Units</strong>
                <p>Format for precipitation and temperature data.</p>
              </div>
              <select
                value={weatherUnits}
                onChange={(e) => setWeatherUnits(e.target.value)}
                className="fw-panel-select"
                style={{ width: '130px' }}
              >
                <option value="metric">Metric (°C, mm)</option>
                <option value="imperial">Imperial (°F, in)</option>
              </select>
            </div>

            <div className="fw-settings-item">
              <div>
                <strong>High Contrast Mode</strong>
                <p>Boost border definitions for outdoor emergency response.</p>
              </div>
              <input
                type="checkbox"
                checked={highContrast}
                onChange={(e) => setHighContrast(e.target.checked)}
                className="fw-checkbox-toggle"
              />
            </div>

            <div className="fw-settings-meta-box">
              <Icon name="info" size={14} color="#0284C7" />
              <span>
                Connected to Supabase PostgreSQL &amp; Open-Meteo High-Resolution Forecast API.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
