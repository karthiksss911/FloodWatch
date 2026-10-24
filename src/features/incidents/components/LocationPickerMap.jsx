import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import Icon from '../../../components/common/Icon';
import { createPickerPin } from '../../../lib/leaflet/markerFactory';
import { isValidCoord } from '../../../lib/leaflet/leafletConfig';

function MapClickInterceptor({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapCameraSync({ centerCoords }) {
  const map = useMap();
  useEffect(() => {
    if (centerCoords && isValidCoord(centerCoords[0], centerCoords[1])) {
      map.flyTo(centerCoords, map.getZoom(), { duration: 0.5 });
    }
  }, [centerCoords, map]);
  return null;
}

/**
 * Embedded Leaflet Location Picker for Community Incident Submissions
 */
export default function LocationPickerMap({
  latitude,
  longitude,
  onLocationSelect,
}) {
  const latNum = parseFloat(latitude);
  const lngNum = parseFloat(longitude);
  const hasValidMapCoord = isValidCoord(latNum, lngNum);
  const mapPosition = hasValidMapCoord ? [latNum, lngNum] : [9.9816, 76.2999];

  return (
    <div className="fw-location-picker-box">
      <div className="fw-location-picker-header">
        <span>
          <Icon name="map-pin" size={13} color="#06B6D4" /> Tap or click anywhere on the map to position marker:
        </span>
        <span className="fw-picker-coords-badge">
          [{hasValidMapCoord ? latNum.toFixed(4) : '--'}, {hasValidMapCoord ? lngNum.toFixed(4) : '--'}]
        </span>
      </div>

      <div className="fw-location-picker-map">
        <MapContainer
          center={mapPosition}
          zoom={13}
          scrollWheelZoom={false}
          className="fw-leaflet-map"
          zoomControl={true}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            maxZoom={19}
          />
          <MapClickInterceptor onLocationSelect={onLocationSelect} />
          <MapCameraSync centerCoords={mapPosition} />

          {hasValidMapCoord && (
            <Marker
              position={mapPosition}
              icon={createPickerPin()}
              draggable={true}
              eventHandlers={{
                dragend: (e) => {
                  const latlng = e.target.getLatLng();
                  onLocationSelect(latlng.lat, latlng.lng);
                },
              }}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
}
