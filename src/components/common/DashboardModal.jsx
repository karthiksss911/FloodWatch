import { useEffect } from 'react';
import Icon from './Icon';

/**
 * Universal Dashboard Modal / Slide-Over Window
 * Allows views like Report Incident, Assistance Hubs, Risk Intelligence,
 * or Authority Console to be accessed smoothly without losing map context.
 */
export default function DashboardModal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon = 'activity',
  maxWidth = '880px',
  children,
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
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
      aria-label={title}
    >
      <div
        className="fw-dash-modal-window"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="fw-dash-modal-header">
          <div className="fw-dash-modal-title-box">
            <div className="fw-dash-modal-icon">
              <Icon name={icon} size={18} color="#0284C7" />
            </div>
            <div>
              <h2 className="fw-dash-modal-title">{title}</h2>
              {subtitle && <p className="fw-dash-modal-subtitle">{subtitle}</p>}
            </div>
          </div>
          <button
            type="button"
            className="fw-dash-modal-close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="fw-dash-modal-body">{children}</div>
      </div>
    </div>
  );
}
