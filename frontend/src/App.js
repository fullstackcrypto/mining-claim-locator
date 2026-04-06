import React, { useState, useEffect, useRef } from 'react';
import api from './services/api';
import './styles/App.css';

const SAMPLE_CLAIMS = [
  {
    id: 1,
    blm_case_id: 'AZMC123456',
    claim_name: 'DESERT GOLD',
    claim_type: 'LODE',
    claimant_name: 'ARIZONA MINERALS LLC',
    case_disposition: 'CLOSED',
    location_date: '1995-06-12',
    close_date: '2010-09-01',
    county: 'MARICOPA',
    township: 'T5N',
    range: 'R3E',
    section: '14',
    latitude: 33.4484,
    longitude: -112.0740
  },
  {
    id: 2,
    blm_case_id: 'AZMC789012',
    claim_name: 'GOLDEN HORIZON',
    claim_type: 'PLACER',
    claimant_name: 'SMITH MINING CO',
    case_disposition: 'ABANDONED',
    location_date: '2002-03-22',
    close_date: '2015-07-15',
    county: 'PIMA',
    township: 'T15S',
    range: 'R12E',
    section: '28',
    latitude: 32.1234,
    longitude: -111.7890
  }
];

function App() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapsReady, setMapsReady] = useState(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // Wait for Google Maps to signal it is ready via the initGoogleMaps callback (async loading)
  useEffect(() => {
    const handleMapsReady = () => setMapsReady(true);
    if (window.googleMapsReady) {
      handleMapsReady();
    } else {
      window.onGoogleMapsReady = handleMapsReady;
    }
    return () => {
      window.onGoogleMapsReady = null;
    };
  }, []);

  // Fetch claims from the API, falling back to sample data when unavailable
  useEffect(() => {
    api.searchClaims()
      .then(response => {
        setClaims(response.data);
        setLoading(false);
      })
      .catch(() => {
        setClaims(SAMPLE_CLAIMS);
        setLoading(false);
      });
  }, []);

  // Initialize the map and place markers once both Maps and claims are ready
  useEffect(() => {
    if (!mapsReady || claims.length === 0 || !mapRef.current) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 34.0489, lng: -111.0937 },
      zoom: 7,
      mapTypeId: 'terrain'
    });
    mapInstanceRef.current = map;

    claims.forEach(claim => {
      if (!claim.latitude || !claim.longitude) return;
      const marker = new window.google.maps.Marker({
        position: { lat: parseFloat(claim.latitude), lng: parseFloat(claim.longitude) },
        map,
        title: claim.claim_name
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div>
            <strong>${claim.claim_name}</strong><br>
            BLM Case: ${claim.blm_case_id}<br>
            Type: ${claim.claim_type}<br>
            Location: ${claim.township} ${claim.range} Sec ${claim.section}<br>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });
    });
  }, [mapsReady, claims]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title">
          <h1>Mining Claim Locator</h1>
        </div>
      </header>

      <main className="app-content" style={{ flexDirection: 'column' }}>
        {loading ? (
          <p style={{ padding: '1rem' }}>Loading claims…</p>
        ) : (
          <>
            {mapsReady ? (
              <div
                ref={mapRef}
                style={{ height: '500px', width: '100%' }}
                aria-label="Interactive map of mining claims"
              />
            ) : (
              <div
                role="alert"
                style={{
                  padding: '1rem',
                  backgroundColor: '#fff3cd',
                  borderRadius: '4px',
                  margin: '1rem'
                }}
              >
                <strong>Map unavailable.</strong> Add a <code>GOOGLE_MAPS_API_KEY</code> repository
                secret in GitHub Settings → Secrets → Actions to enable the interactive map.
              </div>
            )}

            <div style={{ padding: '1rem' }}>
              <h2>Claims Found: {claims.length}</h2>
              <div style={{ overflowX: 'auto' }}>
                <table
                  style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}
                  aria-label="Mining claims table"
                >
                  <thead>
                    <tr style={{ backgroundColor: '#2c3e50', color: 'white' }}>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Claim Name</th>
                      <th style={{ padding: '8px', textAlign: 'left' }}>BLM Case ID</th>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Type</th>
                      <th style={{ padding: '8px', textAlign: 'left' }}>County</th>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Status</th>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Close Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {claims.map(claim => (
                      <tr
                        key={claim.id}
                        style={{ borderBottom: '1px solid #ddd' }}
                      >
                        <td style={{ padding: '8px' }}>{claim.claim_name}</td>
                        <td style={{ padding: '8px' }}>{claim.blm_case_id}</td>
                        <td style={{ padding: '8px' }}>{claim.claim_type}</td>
                        <td style={{ padding: '8px' }}>{claim.county}</td>
                        <td style={{ padding: '8px' }}>{claim.case_disposition}</td>
                        <td style={{ padding: '8px' }}>{claim.close_date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>
          Mining Claim Locator &copy; {new Date().getFullYear()} | Data sourced from BLM MLRS/LR2000
        </p>
      </footer>
    </div>
  );
}

export default App;
