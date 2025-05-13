import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize map
    const map = new window.google.maps.Map(document.getElementById('map'), {
      center: { lat: 34.0489, lng: -111.0937 }, // Arizona
      zoom: 7,
      mapTypeId: 'terrain'
    });
    
    // Load sample data
    axios.get('http://localhost:3000/api/claims/search')
      .then(response => {
        setClaims(response.data);
        setLoading(false);
        
        // Add markers
        response.data.forEach(claim => {
          const marker = new window.google.maps.Marker({
            position: { lat: claim.latitude, lng: claim.longitude },
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
      })
      .catch(error => {
        console.error('Error fetching claims:', error);
        setLoading(false);
      });
  }, []);

  return (
    <div className="App">
      <header style={{ backgroundColor: '#2c3e50', color: 'white', padding: '1rem' }}>
        <h1>Mining Claim Locator</h1>
      </header>
      <main>
        <div id="map" style={{ height: '600px', width: '100%' }}></div>
        {loading ? (
          <p>Loading claims...</p>
        ) : (
          <div style={{ padding: '1rem' }}>
            <h2>Claims Found: {claims.length}</h2>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
