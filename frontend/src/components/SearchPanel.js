import React, { useState, useEffect } from 'react';
import api from '../services/api';
import '../styles/SearchPanel.css';

const SearchPanel = ({ onSearch, loading }) => {
  const [county, setCounty] = useState('');
  const [township, setTownship] = useState('');
  const [range, setRange] = useState('');
  const [section, setSection] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [claimType, setClaimType] = useState('');
  const [caseDisposition, setCaseDisposition] = useState('');
  const [claimant, setClaimant] = useState('');
  const [counties, setCounties] = useState([]);
  const [countiesError, setCountiesError] = useState(null);
  const [advanced, setAdvanced] = useState(false);

  useEffect(() => {
    api.getCounties()
      .then(response => {
        setCounties(response.data || []);
        setCountiesError(null);
      })
      .catch(() => {
        setCountiesError('Could not load county list. You may type a county name manually.');
      });
  }, []);

  const buildSearchParams = () => {
    const params = {
      county: county || undefined,
      township: township ? township.toUpperCase() : undefined,
      range: range ? range.toUpperCase() : undefined,
      section: section || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      claim_type: claimType || undefined,
      case_disposition: caseDisposition || undefined,
      claimant: claimant || undefined
    };

    return Object.fromEntries(
      Object.entries(params).filter(([, value]) => value !== undefined && value !== '')
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(buildSearchParams());
  };

  const handleReset = () => {
    setCounty('');
    setTownship('');
    setRange('');
    setSection('');
    setDateFrom('');
    setDateTo('');
    setClaimType('');
    setCaseDisposition('');
    setClaimant('');
    onSearch({});
  };

  return (
    <div className="search-panel">
      <h2>Find Expired Mining Claims</h2>

      <form onSubmit={handleSubmit}>
        {/* County */}
        <div className="form-group">
          <label htmlFor="county">County:</label>
          {countiesError ? (
            <p className="counties-error" role="alert">{countiesError}</p>
          ) : null}
          <select
            id="county"
            value={county}
            onChange={(e) => setCounty(e.target.value)}
          >
            <option value="">All Counties</option>
            {counties.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Closed After */}
        <div className="form-group">
          <label htmlFor="date_from">Closed After:</label>
          <select
            id="date_from"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          >
            <option value="">Any Time</option>
            <option value="1900-01-01">1900</option>
            <option value="1950-01-01">1950</option>
            <option value="1980-01-01">1980</option>
            <option value="2000-01-01">2000</option>
            <option value="2010-01-01">2010</option>
            <option value="2020-01-01">2020</option>
          </select>
        </div>

        <button
          type="button"
          className="toggle-advanced"
          onClick={() => setAdvanced(!advanced)}
        >
          {advanced ? 'Hide Advanced' : 'Show Advanced'}
        </button>

        {advanced && (
          <div className="advanced-options">
            <div className="form-group">
              <label htmlFor="township">Township:</label>
              <input
                type="text"
                id="township"
                value={township}
                onChange={(e) => setTownship(e.target.value)}
                placeholder="e.g. T5N"
              />
            </div>

            <div className="form-group">
              <label htmlFor="range">Range:</label>
              <input
                type="text"
                id="range"
                value={range}
                onChange={(e) => setRange(e.target.value)}
                placeholder="e.g. R3E"
              />
            </div>

            <div className="form-group">
              <label htmlFor="section">Section:</label>
              <input
                type="text"
                id="section"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="e.g. 14"
              />
            </div>

            <div className="form-group">
              <label htmlFor="date_to">Closed Before:</label>
              <select
                id="date_to"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              >
                <option value="">Any Time</option>
                <option value="2000-12-31">2000</option>
                <option value="2005-12-31">2005</option>
                <option value="2010-12-31">2010</option>
                <option value="2015-12-31">2015</option>
                <option value="2020-12-31">2020</option>
                <option value="2025-12-31">2025</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="claim_type">Claim Type:</label>
              <select
                id="claim_type"
                value={claimType}
                onChange={(e) => setClaimType(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="LODE">Lode</option>
                <option value="PLACER">Placer</option>
                <option value="MILLSITE">Millsite</option>
                <option value="TUNNEL SITE">Tunnel Site</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="case_disposition">Status:</label>
              <select
                id="case_disposition"
                value={caseDisposition}
                onChange={(e) => setCaseDisposition(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="CLOSED">Closed</option>
                <option value="ABANDONED">Abandoned</option>
                <option value="VOID">Void</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="claimant">Claimant Name:</label>
              <input
                type="text"
                id="claimant"
                value={claimant}
                onChange={(e) => setClaimant(e.target.value)}
                placeholder="e.g. SMITH MINING"
              />
            </div>

            <div className="form-hint">
              <p>Township/Range/Section format: T5N, R3E, 14</p>
            </div>
          </div>
        )}

        <div className="button-group">
          <button
            type="submit"
            className="search-button"
            disabled={loading}
          >
            {loading ? 'Searching…' : 'Search Claims'}
          </button>

          <button
            type="button"
            className="reset-button"
            onClick={handleReset}
            disabled={loading}
          >
            Reset
          </button>
        </div>
      </form>

      <div className="search-help">
        <details>
          <summary>Search Tips</summary>
          <ul>
            <li>Search by county for a broader view of claims</li>
            <li>Use Township/Range/Section for precise location filtering</li>
            <li>Combine Closed After/Before to narrow a date window</li>
            <li>Click a map marker to see full claim details</li>
          </ul>
        </details>
      </div>
    </div>
  );
};

export default SearchPanel;
