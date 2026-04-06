import React, { useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import '../styles/MapView.css';

// Fix Leaflet default marker icon path issue with Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

/** Adjusts the map view to fit all visible markers. */
function FitBounds({ claims }) {
  const map = useMap();

  useEffect(() => {
    if (!claims || claims.length === 0) return;

    const coords = claims
      .filter(c => c.latitude && c.longitude)
      .map(c => [parseFloat(c.latitude), parseFloat(c.longitude)]);

    if (coords.length > 0) {
      map.fitBounds(coords, { padding: [40, 40], maxZoom: 10 });
    }
  }, [claims, map]);

  return null;
}

const MapView = ({ claims = [], loading, error }) => {
  const arizonaCenter = [34.0489, -111.0937];

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unknown';
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="map-container">
      {error && (
        <div className="map-error" role="alert">
          {error}
        </div>
      )}
      {loading && (
        <div className="map-loading" aria-live="polite">
          Loading claims…
        </div>
      )}

      <MapContainer
        center={arizonaCenter}
        zoom={7}
        className="map-view"
        aria-label="Map of Arizona mining claims"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {claims.map(claim => {
          const lat = parseFloat(claim.latitude);
          const lng = parseFloat(claim.longitude);
          if (isNaN(lat) || isNaN(lng)) return null;

          return (
            <Marker key={claim.id} position={[lat, lng]}>
              <Popup>
                <div className="map-popup">
                  <strong>{claim.claim_name}</strong>
                  <br />
                  <span>BLM Case: {claim.blm_case_id}</span>
                  <br />
                  <span>Type: {claim.claim_type}</span>
                  <br />
                  <span>Status: {claim.case_disposition}</span>
                  <br />
                  <span>Claimant: {claim.claimant_name}</span>
                  <br />
                  <span>
                    Location: {claim.township} {claim.range} Sec {claim.section}
                  </span>
                  <br />
                  <span>Closed: {formatDate(claim.close_date)}</span>
                </div>
              </Popup>
            </Marker>
          );
        })}

        <FitBounds claims={claims} />
      </MapContainer>

      <div className="map-stats" aria-live="polite">
        {!loading && (
          <span>Showing {claims.length} expired mining claim{claims.length !== 1 ? 's' : ''}</span>
        )}
      </div>
    </div>
  );
};

export default MapView;
