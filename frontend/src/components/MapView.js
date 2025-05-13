import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/MapView.css';

const MapView = ({ claims, loading, error }) => {
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const navigate = useNavigate();
  const [map, setMap] = useState(null);

  // Initialize Google Maps
  useEffect(() => {
    if (!map && mapRef.current) {
      const googleMap = new window.google.maps.Map(mapRef.current, {
        center: { lat: 34.0489, lng: -111.0937 }, // Arizona
        zoom: 7,
        mapTypeId: 'terrain',
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: window.google.maps.MapTypeControlStyle.DROPDOWN_MENU,
          mapTypeIds: ['roadmap', 'terrain', 'satellite', 'hybrid']
        }
      });
      
      setMap(googleMap);
    }
  }, [map]);

  // Update markers when claims change
  useEffect(() => {
    if (map && claims && claims.length > 0) {
      updateMarkers();
    }
  }, [map, claims]);

  const updateMarkers = () => {
    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
    
    if (!map || !claims) return;
    
    // Add markers for each claim
    claims.forEach(claim => {
      try {
        // Extract coordinates from geometry
        let coords;
        if (claim.geometry && typeof claim.geometry === 'object') {
          coords = {
            lat: claim.geometry.coordinates[1],
            lng: claim.geometry.coordinates[0]
          };
        } else if (claim.latitude && claim.longitude) {
          coords = {
            lat: parseFloat(claim.latitude),
            lng: parseFloat(claim.longitude)
          };
        }
        
        if (coords) {
          const marker = new window.google.maps.Marker({
            position: coords,
            map,
            title: claim.claim_name || `Claim ${claim.claim_id}`,
            icon: {
              url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
            }
          });
          
          // Add info window
          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div>
                <strong>Claim ID:</strong> ${claim.claim_id}<br>
                <strong>Type:</strong> ${claim.claim_type || 'Unknown'}<br>
                <strong>Claimant:</strong> ${claim.claimant || 'Unknown'}<br>
                <strong>Expired:</strong> ${new Date(claim.expiration_date).toLocaleDateString() || 'Unknown'}<br>
                <strong>Location:</strong> ${claim.township || ''} ${claim.range || ''} Sec ${claim.section || ''}<br>
                <a href="#/claim/${claim.claim_id}">View Details</a>
              </div>
            `
          });
          
          marker.addListener('click', () => {
            infoWindow.open(map, marker);
          });
          
          markersRef.current.push(marker);
        }
      } catch (err) {
        console.error('Error creating marker for claim:', claim.claim_id, err);
      }
    });
  };

  return (
    <div className="map-container">
      {error && <div className="map-error">{error}</div>}
      {loading && <div className="map-loading">Loading claims...</div>}
      
      <div 
        ref={mapRef} 
        className="map-view"
        style={{ width: '100%', height: '600px' }}
      ></div>
      
      <div className="map-stats">
        {claims && (
          <div className="claims-count">
            Showing {claims.length} expired mining claims
          </div>
        )}
      </div>
    </div>
  );
};

export default MapView;
