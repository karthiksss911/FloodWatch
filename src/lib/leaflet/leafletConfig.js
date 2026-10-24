import L from 'leaflet';

/**
 * Configure default Leaflet icon paths for Vite and modern bundlers.
 * Leaflet's default image resolution fails in bundled environments
 * unless explicit CDN or asset URLs are configured.
 */
let isLeafletConfigured = false;

export function initLeafletIcons() {
  if (isLeafletConfigured) return;

  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });

  isLeafletConfigured = true;
}

/**
 * Validates coordinate pair to ensure graceful rendering without Leaflet crashes
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean} True if coordinates are valid numbers within global bounds
 */
export function isValidCoord(lat, lng) {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * Greater Kochi default geographical bounds and camera settings
 */
export const KOCHI_GEOGRAPHY = {
  center: [9.9816, 76.2999], // Ernakulam Center
  defaultZoom: 12,
  bounds: [
    [9.85, 76.15],
    [10.18, 76.45],
  ],
  maxBounds: [
    [9.7, 76.0],
    [10.35, 76.65],
  ],
};
