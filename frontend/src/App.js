import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from './services/api';
import './styles/App.css';

/**
 * Helper to check if a claim is sample/unverified data.
 * Supports both old (is_sample_data) and new (source_system, is_verified) field names.
 */
function isSampleData(claim) {
  if (claim.is_sample_data === true) return true;
  if (claim.source_system === 'SAMPLE') return true;
  if (claim.is_verified === false && claim.source_system !== 'MLRS' && claim.source_system !== 'LR2000') return true;
  return false;
}

/**
 * SAMPLE DATA — Mock/example data for demonstration.
 * This data is NOT sourced from BLM or any verified record system.
 * When a backend API is configured, real data will replace this.
 */
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
    meridian: 'GILA & SALT RIVER',
    latitude: 33.4484,
    longitude: -112.0740,
    acreage: 20.5,
    commodity: 'GOLD, SILVER',
    maintenance_fee_paid: false,
    notes: 'Sample claim for development purposes',
    reason_closed: 'Failure to pay maintenance fees',
    source_system: 'SAMPLE',
    is_verified: false,
    history: [
      { event_date: '1995-06-12', event_type: 'LOCATED', event_description: 'Claim located and recorded' },
      { event_date: '1996-09-01', event_type: 'FEE_PAID', event_description: 'Annual maintenance fee paid' },
      { event_date: '2010-09-01', event_type: 'CLOSED', event_description: 'Claim closed - fees not paid' }
    ],
    documents: [],
    images: [],
    source_links: [
      { link_type: 'BLM_MLRS', link_name: 'BLM MLRS Record', link_url: 'https://mlrs.blm.gov/', is_verified: false }
    ]
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
    meridian: 'GILA & SALT RIVER',
    latitude: 32.1234,
    longitude: -111.7890,
    acreage: 40.0,
    commodity: 'GOLD',
    maintenance_fee_paid: false,
    notes: 'Sample claim for development purposes',
    reason_closed: 'Abandoned by claimant',
    source_system: 'SAMPLE',
    is_verified: false,
    history: [
      { event_date: '2002-03-22', event_type: 'LOCATED', event_description: 'Claim located' },
      { event_date: '2015-07-15', event_type: 'ABANDONED', event_description: 'Claim abandoned' }
    ],
    documents: [],
    images: [],
    source_links: []
  },
  {
    id: 3,
    blm_case_id: 'AZMC345678',
    claim_name: 'COPPER RIDGE',
    claim_type: 'LODE',
    claimant_name: 'WESTERN COPPER INC',
    case_disposition: 'VOID',
    location_date: '1988-11-05',
    close_date: '1999-12-31',
    county: 'YAVAPAI',
    township: 'T12N',
    range: 'R1W',
    section: '7',
    meridian: 'GILA & SALT RIVER',
    latitude: 34.5678,
    longitude: -112.4567,
    acreage: 20.0,
    commodity: 'COPPER',
    maintenance_fee_paid: false,
    notes: 'Sample claim for development purposes',
    reason_closed: 'Voided due to defective location',
    source_system: 'SAMPLE',
    is_verified: false,
    history: [
      { event_date: '1988-11-05', event_type: 'LOCATED', event_description: 'Claim located' },
      { event_date: '1999-12-31', event_type: 'VOID', event_description: 'Claim voided' }
    ],
    documents: [],
    images: [],
    source_links: [
      { link_type: 'BLM_MLRS', link_name: 'BLM MLRS Record', link_url: 'https://mlrs.blm.gov/', is_verified: false }
    ]
  }
];

// Helper to create safe DOM element for InfoWindow
function createInfoContent(claim, onViewDetails) {
  const container = document.createElement('div');
  container.style.cssText = 'min-width: 200px; font-family: inherit;';
  
  const title = document.createElement('strong');
  title.textContent = claim.claim_name;
  container.appendChild(title);
  container.appendChild(document.createElement('br'));
  
  const status = document.createElement('span');
  status.style.cssText = 'display: inline-block; padding: 2px 6px; border-radius: 3px; font-size: 11px; margin: 4px 0;';
  status.style.backgroundColor = claim.case_disposition === 'CLOSED' ? '#e74c3c' : 
                                  claim.case_disposition === 'ABANDONED' ? '#f39c12' : '#9b59b6';
  status.style.color = 'white';
  status.textContent = claim.case_disposition;
  container.appendChild(status);
  container.appendChild(document.createElement('br'));
  
  const blmCase = document.createElement('span');
  blmCase.textContent = `BLM Case: ${claim.blm_case_id}`;
  container.appendChild(blmCase);
  container.appendChild(document.createElement('br'));
  
  const claimType = document.createElement('span');
  claimType.textContent = `Type: ${claim.claim_type}`;
  container.appendChild(claimType);
  container.appendChild(document.createElement('br'));
  
  const claimant = document.createElement('span');
  claimant.textContent = `Claimant: ${claim.claimant_name}`;
  container.appendChild(claimant);
  container.appendChild(document.createElement('br'));
  
  const location = document.createElement('span');
  location.textContent = `Location: ${claim.township} ${claim.range} Sec ${claim.section}`;
  container.appendChild(location);
  container.appendChild(document.createElement('br'));
  
  const closeDate = document.createElement('span');
  closeDate.textContent = `Closed: ${claim.close_date}`;
  container.appendChild(closeDate);
  
  // Action buttons
  const actions = document.createElement('div');
  actions.style.cssText = 'margin-top: 10px; padding-top: 8px; border-top: 1px solid #ddd;';
  
  const viewDetailsBtn = document.createElement('button');
  viewDetailsBtn.textContent = 'View Full Details';
  viewDetailsBtn.style.cssText = 'background: #2c3e50; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; width: 100%;';
  viewDetailsBtn.onclick = () => onViewDetails(claim);
  actions.appendChild(viewDetailsBtn);
  
  const copyBtn = document.createElement('button');
  copyBtn.textContent = 'Copy Claim ID';
  copyBtn.style.cssText = 'background: #95a5a6; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; width: 100%; margin-top: 4px; font-size: 12px;';
  copyBtn.onclick = () => {
    navigator.clipboard.writeText(claim.blm_case_id);
    copyBtn.textContent = 'Copied!';
    setTimeout(() => { copyBtn.textContent = 'Copy Claim ID'; }, 1500);
  };
  actions.appendChild(copyBtn);
  
  container.appendChild(actions);
  
  if (isSampleData(claim)) {
    const sampleNote = document.createElement('div');
    sampleNote.style.cssText = 'font-size: 10px; color: #999; margin-top: 8px; text-align: center;';
    sampleNote.textContent = '⚠ Sample data - not verified';
    container.appendChild(sampleNote);
  }
  
  return container;
}

// Claim Details Panel Component
function ClaimDetailsPanel({ claim, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');
  
  if (!claim) return null;
  
  const hasDocuments = claim.documents && claim.documents.length > 0;
  const hasImages = claim.images && claim.images.length > 0;
  const hasHistory = claim.history && claim.history.length > 0;
  const hasSourceLinks = claim.source_links && claim.source_links.length > 0;
  
  return (
    <div className="claim-details-panel" style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '400px',
      height: '100vh',
      backgroundColor: 'white',
      boxShadow: '-2px 0 10px rgba(0,0,0,0.2)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        backgroundColor: '#2c3e50',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px' }}>{claim.claim_name}</h2>
          <span style={{ fontSize: '12px', opacity: 0.8 }}>{claim.blm_case_id}</span>
        </div>
        <button 
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '0 8px'
          }}
          aria-label="Close panel"
        >
          ×
        </button>
      </div>
      
      {/* Sample data warning */}
      {isSampleData(claim) && (
        <div style={{
          padding: '8px 16px',
          backgroundColor: '#fff3cd',
          color: '#856404',
          fontSize: '12px',
          textAlign: 'center'
        }}>
          ⚠ This is sample/demonstration data, not from a verified source.
        </div>
      )}
      
      {/* Tab navigation */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #ddd',
        backgroundColor: '#f5f5f5'
      }}>
        <button 
          onClick={() => setActiveTab('overview')}
          style={{
            flex: 1,
            padding: '10px',
            border: 'none',
            background: activeTab === 'overview' ? 'white' : 'transparent',
            cursor: 'pointer',
            fontWeight: activeTab === 'overview' ? 'bold' : 'normal',
            borderBottom: activeTab === 'overview' ? '2px solid #2c3e50' : 'none'
          }}
        >
          Overview
        </button>
        {hasHistory && (
          <button 
            onClick={() => setActiveTab('history')}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              background: activeTab === 'history' ? 'white' : 'transparent',
              cursor: 'pointer',
              fontWeight: activeTab === 'history' ? 'bold' : 'normal',
              borderBottom: activeTab === 'history' ? '2px solid #2c3e50' : 'none'
            }}
          >
            History
          </button>
        )}
        {hasDocuments && (
          <button 
            onClick={() => setActiveTab('documents')}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              background: activeTab === 'documents' ? 'white' : 'transparent',
              cursor: 'pointer',
              fontWeight: activeTab === 'documents' ? 'bold' : 'normal',
              borderBottom: activeTab === 'documents' ? '2px solid #2c3e50' : 'none'
            }}
          >
            Documents
          </button>
        )}
        {hasImages && (
          <button 
            onClick={() => setActiveTab('images')}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              background: activeTab === 'images' ? 'white' : 'transparent',
              cursor: 'pointer',
              fontWeight: activeTab === 'images' ? 'bold' : 'normal',
              borderBottom: activeTab === 'images' ? '2px solid #2c3e50' : 'none'
            }}
          >
            Images
          </button>
        )}
      </div>
      
      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {activeTab === 'overview' && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <span style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: '4px',
                backgroundColor: claim.case_disposition === 'CLOSED' ? '#e74c3c' : 
                                claim.case_disposition === 'ABANDONED' ? '#f39c12' : '#9b59b6',
                color: 'white',
                fontSize: '14px'
              }}>
                {claim.case_disposition}
              </span>
            </div>
            
            <table style={{ width: '100%', fontSize: '14px' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '6px 0', fontWeight: 'bold', width: '40%' }}>Claim Type</td>
                  <td style={{ padding: '6px 0' }}>{claim.claim_type}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 0', fontWeight: 'bold' }}>Claimant</td>
                  <td style={{ padding: '6px 0' }}>{claim.claimant_name}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 0', fontWeight: 'bold' }}>County</td>
                  <td style={{ padding: '6px 0' }}>{claim.county}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 0', fontWeight: 'bold' }}>Location</td>
                  <td style={{ padding: '6px 0' }}>{claim.township} {claim.range} Sec {claim.section}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 0', fontWeight: 'bold' }}>Meridian</td>
                  <td style={{ padding: '6px 0' }}>{claim.meridian || 'N/A'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 0', fontWeight: 'bold' }}>Acreage</td>
                  <td style={{ padding: '6px 0' }}>{claim.acreage ? `${claim.acreage} acres` : 'N/A'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 0', fontWeight: 'bold' }}>Commodity</td>
                  <td style={{ padding: '6px 0' }}>{claim.commodity || 'N/A'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 0', fontWeight: 'bold' }}>Location Date</td>
                  <td style={{ padding: '6px 0' }}>{claim.location_date}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 0', fontWeight: 'bold' }}>Close Date</td>
                  <td style={{ padding: '6px 0' }}>{claim.close_date}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 0', fontWeight: 'bold' }}>Maintenance Fees</td>
                  <td style={{ padding: '6px 0' }}>
                    {claim.maintenance_fee_paid ? '✓ Paid' : '✗ Not Paid'}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 0', fontWeight: 'bold' }}>Coordinates</td>
                  <td style={{ padding: '6px 0' }}>{claim.latitude}, {claim.longitude}</td>
                </tr>
              </tbody>
            </table>
            
            {claim.notes && (
              <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                <strong>Notes:</strong>
                <p style={{ margin: '8px 0 0 0' }}>{claim.notes}</p>
              </div>
            )}
            
            {/* Action buttons */}
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => navigator.clipboard.writeText(claim.blm_case_id)}
                style={{
                  padding: '10px',
                  backgroundColor: '#2c3e50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Copy Claim ID
              </button>
              
              {hasSourceLinks && claim.source_links.map((link, idx) => (
                (link.link_url || link.url) ? (
                  <a
                    key={idx}
                    href={link.link_url || link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '10px',
                      backgroundColor: '#3498db',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      textDecoration: 'none'
                    }}
                  >
                    Open {link.link_name || link.name}
                  </a>
                ) : (
                  <button
                    key={idx}
                    disabled
                    style={{
                      padding: '10px',
                      backgroundColor: '#bdc3c7',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'not-allowed'
                    }}
                  >
                    {link.link_name || link.name} (unavailable)
                  </button>
                )
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'history' && hasHistory && (
          <div>
            <h3 style={{ marginTop: 0 }}>Claim History</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {claim.history.map((event, idx) => (
                <li key={idx} style={{
                  padding: '12px',
                  borderLeft: '3px solid #2c3e50',
                  marginBottom: '8px',
                  backgroundColor: '#f8f9fa'
                }}>
                  <strong>{event.event_date || event.date}</strong>
                  <span style={{ marginLeft: '8px', color: '#666', fontSize: '12px' }}>
                    {event.event_type}
                  </span>
                  <p style={{ margin: '4px 0 0 0' }}>{event.event_description || event.event}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {activeTab === 'documents' && hasDocuments && (
          <div>
            <h3 style={{ marginTop: 0 }}>Documents & Forms</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {claim.documents.map((doc, idx) => (
                <li key={idx} style={{
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  marginBottom: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <strong>{doc.document_name || doc.name}</strong>
                    <span style={{ marginLeft: '8px', fontSize: '12px', color: '#666' }}>{doc.file_type || doc.type}</span>
                  </div>
                  {(doc.document_url || doc.url) ? (
                    <a href={doc.document_url || doc.url} target="_blank" rel="noopener noreferrer" style={{ color: '#3498db' }}>
                      Download
                    </a>
                  ) : (
                    <span style={{ color: '#999', fontSize: '12px' }}>Not available</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {activeTab === 'images' && hasImages && (
          <div>
            <h3 style={{ marginTop: 0 }}>Maps & Images</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {claim.images.map((img, idx) => (
                <div key={idx} style={{
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  padding: '8px',
                  textAlign: 'center'
                }}>
                  {(img.image_url || img.url) ? (
                    <img 
                      src={img.thumbnail_url || img.thumbnail || img.image_url || img.url} 
                      alt={img.image_name || img.name}
                      style={{ maxWidth: '100%', borderRadius: '4px' }}
                    />
                  ) : (
                    <div style={{
                      height: '80px',
                      backgroundColor: '#f0f0f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#999'
                    }}>
                      No preview
                    </div>
                  )}
                  <p style={{ margin: '8px 0 0 0', fontSize: '12px' }}>{img.image_name || img.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Mobile modal wrapper for ClaimDetailsPanel
function ClaimDetailsModal({ claim, onClose }) {
  if (!claim) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', height: '100%' }}>
        <ClaimDetailsPanel claim={claim} onClose={onClose} />
      </div>
    </div>
  );
}

function App() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapsReady, setMapsReady] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  // Handle window resize for responsive layout
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Dynamically load Google Maps script using the API key from environment
  useEffect(() => {
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    
    // If no API key, maps won't be available
    if (!apiKey) {
      return;
    }

    // Check if already loaded
    if (window.google && window.google.maps) {
      setMapsReady(true);
      return;
    }

    // Create callback for when script loads
    window.initGoogleMaps = () => {
      window.googleMapsReady = true;
      setMapsReady(true);
    };

    // Create and append script tag
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      // Cleanup callback
      delete window.initGoogleMaps;
    };
  }, []);

  // Fetch claims from the API, falling back to sample data when unavailable
  useEffect(() => {
    if (!api.isConfigured()) {
      // No API configured, use sample data immediately
      setClaims(SAMPLE_CLAIMS);
      setLoading(false);
      return;
    }
    
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

  // Callback to handle viewing claim details
  const handleViewDetails = useCallback((claim) => {
    setSelectedClaim(claim);
  }, []);

  // Initialize the map once when ready
  useEffect(() => {
    if (!mapsReady || !mapRef.current || mapInstanceRef.current) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 34.0489, lng: -111.0937 },
      zoom: 7,
      mapTypeId: 'terrain'
    });
    mapInstanceRef.current = map;
  }, [mapsReady]);

  // Update markers when claims change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      marker.setMap(null);
    });
    markersRef.current = [];

    // Add new markers
    claims.forEach(claim => {
      const latitude = parseFloat(claim.latitude);
      const longitude = parseFloat(claim.longitude);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

      const marker = new window.google.maps.Marker({
        position: { lat: latitude, lng: longitude },
        map,
        title: claim.claim_name
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: createInfoContent(claim, handleViewDetails)
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      markersRef.current.push(marker);
    });

    // Cleanup on unmount
    return () => {
      markersRef.current.forEach(marker => {
        marker.setMap(null);
      });
      markersRef.current = [];
    };
  }, [claims, handleViewDetails]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title">
          <h1>Mining Claim Locator</h1>
        </div>
      </header>

      <main className="app-content" style={{ flexDirection: 'column', position: 'relative' }}>
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
              {claims.some(c => isSampleData(c)) && (
                <p style={{ 
                  color: '#856404', 
                  backgroundColor: '#fff3cd', 
                  padding: '8px', 
                  borderRadius: '4px',
                  fontSize: '14px'
                }}>
                  ⚠ Displaying sample data for demonstration. Configure the API_URL environment variable to load real BLM data.
                </p>
              )}
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
                      <th style={{ padding: '8px', textAlign: 'left' }}>Actions</th>
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
                        <td style={{ padding: '8px' }}>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '3px',
                            fontSize: '12px',
                            backgroundColor: claim.case_disposition === 'CLOSED' ? '#e74c3c' : 
                                            claim.case_disposition === 'ABANDONED' ? '#f39c12' : '#9b59b6',
                            color: 'white'
                          }}>
                            {claim.case_disposition}
                          </span>
                        </td>
                        <td style={{ padding: '8px' }}>{claim.close_date}</td>
                        <td style={{ padding: '8px' }}>
                          <button
                            onClick={() => setSelectedClaim(claim)}
                            style={{
                              backgroundColor: '#2c3e50',
                              color: 'white',
                              border: 'none',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            View Details
                          </button>
                        </td>
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

      {/* Claim details panel/modal */}
      {selectedClaim && (
        isMobile ? (
          <ClaimDetailsModal claim={selectedClaim} onClose={() => setSelectedClaim(null)} />
        ) : (
          <ClaimDetailsPanel claim={selectedClaim} onClose={() => setSelectedClaim(null)} />
        )
      )}
    </div>
  );
}

export default App;
