import React, { useState, useCallback, useRef } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import SearchPanel from './components/SearchPanel';
import MapView from './components/MapView';
import ClaimsList from './components/ClaimsList';
import PlanScreen from './components/PlanScreen';
import api from './services/api';
import './styles/App.css';

function App() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);
  const [selectedClaimId, setSelectedClaimId] = useState(null);
  const [apiNotice, setApiNotice] = useState(null);

  const claimsListRef = useRef(null);

  const handleSearch = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    setSearched(true);
    setSelectedClaimId(null);
    setApiNotice(null);

    try {
      const response = await api.searchClaims(params);
      setClaims(response.data);
      if (response.notice) setApiNotice(response.notice);
    } catch (err) {
      console.error('Search failed:', err);
      setError('Failed to load claims. Please try again.');
      setClaims([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleViewOnMap = useCallback((claim) => {
    setSelectedClaimId(claim.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleViewDetails = useCallback((claimId) => {
    setSelectedClaimId(claimId);
    if (claimsListRef.current) {
      claimsListRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleSelectClaim = useCallback((claimId) => {
    setSelectedClaimId(claimId);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title">
          <span role="img" aria-label="pickaxe">⛏️</span>
          <h1>Mining Claim Locator</h1>
        </div>
        <span className="app-subtitle">Arizona BLM Expired & Abandoned Claims</span>
        <nav style={{ marginLeft: 'auto', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link to="/" style={{ color: '#fff', textDecoration: 'none' }}>Home</Link>
          <Link 
            to="/plans" 
            style={{
              backgroundColor: '#3b82f6',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: '9999px',
              textDecoration: 'none',
              fontWeight: '600'
            }}
          >
            Choose Plan
          </Link>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={
          <main className="app-content">
            <SearchPanel onSearch={handleSearch} loading={loading} />

            <div className="map-area">
              {!searched && !loading && (
                <div className="empty-state">
                  <p>Use the search panel to find expired mining claims.</p>
                </div>
              )}
              {(searched || loading) && (
                <>
                  {apiNotice && (
                    <div className="api-notice" role="status">
                      {apiNotice}
                    </div>
                  )}
                  <MapView
                    claims={claims}
                    loading={loading}
                    error={error}
                    selectedClaimId={selectedClaimId}
                    onViewDetails={handleViewDetails}
                  />
                  <div ref={claimsListRef}>
                    <ClaimsList
                      claims={claims}
                      loading={loading}
                      selectedClaimId={selectedClaimId}
                      onSelectClaim={handleSelectClaim}
                      onViewOnMap={handleViewOnMap}
                    />
                  </div>
                </>
              )}
            </div>
          </main>
        } />
        <Route path="/plans" element={<PlanScreen />} />
      </Routes>

      <footer className="app-footer">
        <p>
          Data sourced from official BLM NLSDB & MLRS open-data services (U.S. Public Domain).
          Map powered by Mapbox. For research purposes only.
        </p>
        <p className="app-attribution">CREATED BY CHARLEY FOR ANGIE</p>
      </footer>
    </div>
  );
}

export default App;
