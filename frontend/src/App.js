import React, { useState, useCallback } from 'react';
import SearchPanel from './components/SearchPanel';
import MapView from './components/MapView';
import api from './services/api';
import './styles/App.css';

function App() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const response = await api.searchClaims(params);
      setClaims(response.data);
    } catch (err) {
      console.error('Search failed:', err);
      setError('Failed to load claims. Please try again.');
      setClaims([]);
    } finally {
      setLoading(false);
    }
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
            <MapView claims={claims} loading={loading} error={error} />
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
