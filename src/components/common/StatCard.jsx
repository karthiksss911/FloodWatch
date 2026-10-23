import Icon from './Icon';

/**
 * Metric StatCard for intelligence indicators.
 */
export default function StatCard({
  label,
  value,
  subtext,
  icon,
  trend,
  trendDirection = 'neutral',
  variant = 'cyan',
  className = '',
}) {
  return (
    <div className={`fw-stat-card fw-stat-${variant} ${className}`}>
      <div className="fw-stat-top">
        <span className="fw-stat-label">{label}</span>
        {icon && (
          <div className="fw-stat-icon-wrap">
            <Icon name={icon} size={18} />
          </div>
        )}
      </div>

      <div className="fw-stat-main">
        <span className="fw-stat-value">{value}</span>
        {trend && (
          <div className={`fw-stat-trend fw-trend-${trendDirection}`}>
            {trendDirection === 'up' && <Icon name="trending-up" size={13} />}
            {trendDirection === 'down' && <Icon name="trending-down" size={13} />}
            <span>{trend}</span>
          </div>
        )}
      </div>

      {subtext && <p className="fw-stat-subtext">{subtext}</p>}
    </div>
  );
}
