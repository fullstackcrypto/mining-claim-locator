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

/** Flies to a selected claim and opens its popup. */
function MapController({ selectedClaimId, claims, markerRefs }) {
  const map = useMap();

  useEffect(() => {
    if (!selectedClaimId) return;

    const claim = claims.find(c => c.id === selectedClaimId);
    if (!claim) return;

    const lat = parseFloat(claim.latitude);
    const lng = parseFloat(claim.longitude);
    if (isNaN(lat) || isNaN(lng)) return;

    map.flyTo([lat, lng], 13, { duration: 0.8 });

    // Open the popup after the fly animation completes
    setTimeout(() => {
      const marker = markerRefs.current[selectedClaimId];
      if (marker) marker.openPopup();
    }, 900);
  }, [selectedClaimId, claims, map, markerRefs]);

  return null;
}

const MapView = ({ claims = [], loading, error, selectedClaimId, onViewDetails }) => {
  const arizonaCenter = [34.0489, -111.0937];
  const markerRefs = useRef({});

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unknown';
    try {
      return new Date(dateStr + 'T00:00:00').toLocaleDateString();
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
            <Marker
              key={claim.id}
              position={[lat, lng]}
              ref={(el) => { markerRefs.current[claim.id] = el; }}
            >
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
                  <br />
                  {onViewDetails && (
                    <button
                      className="popup-details-btn"
                      onClick={() => onViewDetails(claim.id)}
                    >
                      View Details ↓
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        <FitBounds claims={claims} />
        <MapController
          selectedClaimId={selectedClaimId}
          claims={claims}
          markerRefs={markerRefs}
        />
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
