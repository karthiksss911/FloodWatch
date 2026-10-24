import L from 'leaflet';

/**
 * Retrieves configuration styling for distinct incident marker categories
 */
export function getIncidentMarkerConfig(category, severity) {
  if (category === 'waterlogging') {
    return {
      catType: 'waterlogging',
      badgeColor: '#06B6D4',
      iconSvg:
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>',
    };
  }
  if (category === 'road_blockage') {
    return {
      catType: 'roadblock',
      badgeColor: severity === 'severe' ? '#EF4444' : '#F97316',
      iconSvg:
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>',
    };
  }
  if (category === 'river_overflow') {
    return {
      catType: 'hazard',
      badgeColor: '#3B82F6',
      iconSvg:
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>',
    };
  }
  return {
    catType: 'hazard',
    badgeColor: '#A855F7',
    iconSvg:
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  };
}

/**
 * Creates custom SVG DivIcon for an incident marker
 */
export function createIncidentMarkerIcon(category, severity, isSelected) {
  const { catType, badgeColor, iconSvg } = getIncidentMarkerConfig(category, severity);
  const selectedClass = isSelected ? 'fw-marker-selected' : '';
  const severityClass = `fw-marker-sev-${severity || 'moderate'}`;
  const pulseHtml = severity === 'severe' ? '<span class="fw-pin-pulse"></span>' : '';

  return L.divIcon({
    className: 'fw-leaflet-div-wrapper',
    html: `
      <div class="fw-custom-pin ${catType} ${severityClass} ${selectedClass}">
        ${pulseHtml}
        <div class="fw-pin-icon" style="color: ${badgeColor};">
          ${iconSvg}
        </div>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -22],
  });
}

/**
 * Helper returning SVG markup for assistance point categories
 */
export function getAssistanceSvg(category) {
  if (category === 'shelter') {
    return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V7l7-4 7 4v14M10 21V12h4v9"/></svg>';
  }
  if (category === 'medical') {
    return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>';
  }
  if (category === 'rescue_hub') {
    return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="4.93" y1="4.93" x2="9.17" y2="9.17"/><line x1="14.83" y1="14.83" x2="19.07" y2="19.07"/><line x1="14.83" y1="9.17" x2="19.07" y2="4.93"/><line x1="14.83" y1="9.17" x2="18.36" y2="5.64"/><line x1="4.93" y1="19.07" x2="9.17" y2="14.83"/></svg>';
  }
  return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>';
}

/**
 * Creates custom SVG DivIcon for Assistance Points (shelters, medical, rescue hubs)
 */
export function createAssistanceMarkerIcon(category, isSelected) {
  const iconSvg = getAssistanceSvg(category);
  const selectedClass = isSelected ? 'fw-marker-selected' : '';

  return L.divIcon({
    className: 'fw-leaflet-div-wrapper',
    html: `
      <div class="fw-custom-pin assistance ${selectedClass}">
        <div class="fw-pin-icon" style="color: #10B981;">
          ${iconSvg}
        </div>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -22],
  });
}

/**
 * Custom map marker pin for report location picker
 */
export function createPickerPin() {
  return L.divIcon({
    className: 'fw-leaflet-div-wrapper',
    html: `
      <div class="fw-custom-pin waterlogging fw-marker-selected">
        <span class="fw-pin-pulse"></span>
        <div class="fw-pin-icon" style="color: #06B6D4;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
        </div>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });
}
