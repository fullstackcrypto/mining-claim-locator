import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdvancedSearchForm from './components/AdvancedSearchForm';

function App() {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [claims, setClaims] = useState([]);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Init map
    const googleMap = new window.google.maps.Map(document.getElementById('map'), {
      center: { lat: 34.0489, lng: -111.0937 }, // Arizona
      zoom: 7,
      mapTypeId: 'terrain'
    });
    
    setMap(googleMap);
    setMapLoaded(true);
  }, []);

  const handleSearch = async (searchParams) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('http://localhost:3000/api/claims/search', { 
        params: searchParams 
      });
      
      setClaims(response.data);
      
      // Clear previous markers
      markers.forEach(marker => marker.setMap(null));
      
      // Add new markers
      const newMarkers = response.data.map(claim => {
        const marker = new window.google.maps.Marker({
          position: { lat: claim.latitude, lng: claim.longitude },
          map,
          title: claim.claim_name,
          icon: {
            url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
          }
        });
        
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div>
              <strong>${claim.claim_name}</strong><br>
              <strong>BLM Case:</strong> ${claim.blm_case_id}<br>
              <strong>Type:</strong> ${claim.claim_type}<br>
              <strong>Claimant:</strong> ${claim.claimant_name}<br>
              <strong>Status:</strong> ${claim.case_disposition}<br>
              <strong>Location:</strong> ${claim.township} ${claim.range} Sec ${claim.section}<br>
              <strong>County:</strong> ${claim.county}<br>
              <strong>Closed:</strong> ${new Date(claim.close_date).toLocaleDateString()}<br>
              <strong>Acreage:</strong> ${claim.acreage} acres<br>
            </div>
          `
        });
        
        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });
        
        return marker;
      });
      
      setMarkers(newMarkers);
      
      // Zoom to fit all markers if multiple
      if (newMarkers.length > 1) {
        const bounds = new window.google.maps.LatLngBounds();
        newMarkers.forEach(marker => {
          bounds.extend(marker.getPosition());
        });
        map.fitBounds(bounds);
      } else if (newMarkers.length === 1) {
        map.setCenter(newMarkers[0].getPosition());
        map.setZoom(12);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error searching claims:', error);
      setError('Failed to search claims. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header style={{ backgroundColor: '#2c3e50', color: 'white', padding: '1rem' }}>
        <h1>Mining Claim Locator</h1>
        <p>Find expired mining claims in Arizona</p>
      </header>
      <main style={{ display: 'flex', flexDirection: 'row', height: 'calc(100vh - 100px)' }}>
        <div style={{ width: '350px', overflowY: 'auto', borderRight: '1px solid #ddd' }}>
          <AdvancedSearchForm onSearch={handleSearch} />
          <div style={{ padding: '1rem' }}>
            <h3>Claims Found: {claims.length}</h3>
            {loading && <p>Searching...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {claims.map(claim => (
              <div key={claim.id} style={{ 
                marginBottom: '10px', 
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}>
                <strong>{claim.claim_name}</strong><br />
                BLM Case: {claim.blm_case_id}<br />
                Type: {claim.claim_type}<br />
                Status: {claim.case_disposition}<br />
                County: {claim.county}<br />
                Closed: {new Date(claim.close_date).toLocaleDateString()}<br />
                <button 
                  onClick={() => {
                    map.setCenter({ lat: claim.latitude, lng: claim.longitude });
                    map.setZoom(14);
                  }}
                  style={{ 
                    backgroundColor: '#2c3e50', 
                    color: 'white', 
                    padding: '3px 8px',
                    border: 'none',
                    borderRadius: '4px',
                    marginTop: '5px',
                    cursor: 'pointer'
                  }}
                >
                  View on Map
                </button>
              </div>
            ))}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div id="map" style={{ height: '100%', width: '100%' }}></div>
          {!mapLoaded && <p>Loading map...</p>}
        </div>
      </main>
    </div>
  );
}

export default App;
