import React, { useState, useCallback, useRef } from 'react';
import SearchPanel from './components/SearchPanel';
import MapView from './components/MapView';
import ClaimsList from './components/ClaimsList';
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

  // Called when user clicks "View on Map" inside a ClaimsList card
  const handleViewOnMap = useCallback((claim) => {
    setSelectedClaimId(claim.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Called when user clicks "View Details" in a map popup
  const handleViewDetails = useCallback((claimId) => {
    setSelectedClaimId(claimId);
    if (claimsListRef.current) {
      claimsListRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Called when a card is expanded in the list (keeps map in sync)
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
        <span className="app-subtitle">Arizona BLM Expired &amp; Abandoned Claims</span>
      </header>

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

      <footer className="app-footer">
        <p>
          Data sourced from BLM LR2000 / MLRS records. For research purposes only.
        </p>
      </footer>
    </div>
  );
}

export default App;
