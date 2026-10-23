import { useEffect } from 'react';
import Icon from './Icon';
import Button from './Button';
import { EMERGENCY_HOTLINES } from '../../data/demoData';

/**
 * Accessible modal displaying verified Kerala Emergency Contacts & Disaster Helplines.
 */
export default function HotlineModal({ isOpen, onClose }) {
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
      className="fw-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="hotline-title"
    >
      <div className="fw-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="fw-modal-header">
          <div className="fw-modal-title-group">
            <div className="fw-modal-icon-badge">
              <Icon name="phone" size={18} color="#EF4444" />
            </div>
            <div>
              <h2 id="hotline-title" className="fw-modal-title">
                Official Kerala Emergency Helplines
              </h2>
              <p className="fw-modal-subtitle">
                Direct government emergency contact numbers for immediate flood, rescue, and life-safety response.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="fw-modal-close"
            onClick={onClose}
            aria-label="Close hotline directory"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="fw-modal-body">
          <div className="fw-hotlines-list">
            {EMERGENCY_HOTLINES.map((hotline) => (
              <div key={hotline.number} className="fw-hotline-item">
                <div className="fw-hotline-info">
                  <div className="fw-hotline-header">
                    <span className="fw-hotline-name">{hotline.name}</span>
                    <span className="fw-hotline-badge">{hotline.badge}</span>
                  </div>
                  <span className="fw-hotline-desc">
                    Authorized 24x7 control room for Ernakulam / Kerala State emergency coordination.
                  </span>
                </div>
                <a
                  href={`tel:${hotline.number.replace(/\D/g, '')}`}
                  className="fw-hotline-call-btn"
                  title={`Call ${hotline.name}`}
                >
                  <Icon name="phone" size={15} />
                  <span>{hotline.number}</span>
                </a>
              </div>
            ))}
          </div>

          <div className="fw-modal-notice">
            <Icon name="info" size={15} />
            <p>
              In extreme life-threatening circumstances, call <strong>112 (National Unified Emergency)</strong> or <strong>101 (Fire & Rescue)</strong> immediately. Do not rely exclusively on community apps during flash floods or evacuations.
            </p>
          </div>
        </div>

        <div className="fw-modal-footer">
          <Button variant="secondary" onClick={onClose}>
            Close Helpline Directory
          </Button>
        </div>
      </div>
    </div>
  );
}
