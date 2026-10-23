/**
 * Professional dark surface card component with subtle borders,
 * optional header, and contextual actions.
 */
export default function Card({
  title,
  subtitle,
  icon,
  badge,
  actions,
  children,
  footer,
  variant = 'default',
  className = '',
  onClick,
  ...props
}) {
  const isInteractive = typeof onClick === 'function';

  return (
    <div
      className={`fw-card fw-card-${variant} ${isInteractive ? 'fw-card-interactive' : ''} ${className}`}
      onClick={onClick}
      {...props}
    >
      {(title || subtitle || actions || badge || icon) && (
        <div className="fw-card-header">
          <div className="fw-card-title-group">
            {icon && <div className="fw-card-header-icon">{icon}</div>}
            <div>
              {title && <h3 className="fw-card-title">{title}</h3>}
              {subtitle && <p className="fw-card-subtitle">{subtitle}</p>}
            </div>
          </div>
          <div className="fw-card-header-actions">
            {badge}
            {actions}
          </div>
        </div>
      )}
      <div className="fw-card-body">{children}</div>
      {footer && <div className="fw-card-footer">{footer}</div>}
    </div>
  );
}
