import Icon from './Icon';

/**
 * Reusable Badge component for severity, verification, and status tags.
 */
export default function Badge({
  variant = 'default',
  severity,
  verification,
  status,
  children,
  className = '',
  icon,
  pulse = false,
}) {
  let styleClass = 'fw-badge-default';
  let displayIcon = icon;
  let text = children;

  if (severity) {
    switch (severity) {
      case 'severe':
        styleClass = 'fw-badge-severe';
        displayIcon = displayIcon || 'alert-triangle';
        text = text || 'Severe Risk';
        break;
      case 'high':
        styleClass = 'fw-badge-high';
        displayIcon = displayIcon || 'warning';
        text = text || 'High Risk';
        break;
      case 'moderate':
        styleClass = 'fw-badge-moderate';
        displayIcon = displayIcon || 'warning';
        text = text || 'Moderate';
        break;
      case 'low':
      default:
        styleClass = 'fw-badge-low';
        displayIcon = displayIcon || 'droplet';
        text = text || 'Minor';
        break;
    }
  } else if (verification) {
    switch (verification) {
      case 'demo_reviewed':
      case 'authority_verified':
      case 'verified_official':
        styleClass = 'fw-badge-verified';
        displayIcon = displayIcon || 'check-circle';
        text = text || 'Demo Desk Reviewed';
        break;
      case 'demo_community_confirmed':
      case 'community_confirmed':
        styleClass = 'fw-badge-community';
        displayIcon = displayIcon || 'shield';
        text = text || 'Demo Community Check';
        break;
      case 'demo_unverified':
      case 'unverified':
        styleClass = 'fw-badge-unverified';
        displayIcon = displayIcon || 'clock';
        text = text || 'Unverified Citizen Report (Demo)';
        break;
      case 'demo_facility_record':
      case 'demo_record':
      default:
        styleClass = 'fw-badge-demo';
        displayIcon = displayIcon || 'info';
        text = text || 'Simulated Demo Record';
        break;
    }
  } else if (status) {
    switch (status) {
      case 'open':
      case 'active':
        styleClass = 'fw-badge-active';
        text = text || 'Active';
        break;
      case 'investigating':
      case 'monitoring':
        styleClass = 'fw-badge-warning';
        text = text || 'Monitoring';
        break;
      case 'cleared':
      case 'resolved':
        styleClass = 'fw-badge-resolved';
        text = text || 'Cleared';
        break;
      default:
        styleClass = 'fw-badge-default';
        break;
    }
  } else if (variant) {
    styleClass = `fw-badge-${variant}`;
  }

  return (
    <span className={`fw-badge ${styleClass} ${pulse ? 'fw-badge-pulse' : ''} ${className}`}>
      {pulse && <span className="fw-pulse-dot" aria-hidden="true" />}
      {displayIcon && <Icon name={displayIcon} size={12} className="fw-badge-icon" />}
      <span>{text}</span>
    </span>
  );
}
