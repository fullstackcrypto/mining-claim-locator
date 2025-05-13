// frontend/src/components/SearchPanel.js
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import '../styles/SearchPanel.css';

const SearchPanel = ({ onSearch, loading }) => {
  const [county, setCounty] = useState('');
  const [township, setTownship] = useState('');
  const [range, setRange] = useState('');
  const [section, setSection] = useState('');
  const [timeframe, setTimeframe] = useState('');
  const [counties, setCounties] = useState([]);
  const [advanced, setAdvanced] = useState(false);

  useEffect(() => {
    // Load counties for dropdown
    api.getCounties()
      .then(response => {
        setCounties(response.data || []);
      })
      .catch(err => {
        console.error('Failed to load counties:', err);
      });
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const searchParams = {
      county,
      township: township.toUpperCase(),
      range: range.toUpperCase(),
      section,
      timeframe
    };
    
    onSearch(searchParams);
  };

  const handleReset = () => {
    setCounty('');
    setTownship('');
    setRange('');
    setSection('');
    setTimeframe('');
    
    onSearch({});
  };

  const toggleAdvanced = () => {
    setAdvanced(!advanced);
  };

  return (
    <div className="search-panel">
      <h2>Find Expired Mining Claims</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="county">County:</label>
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
        
        <div className="form-group">
          <label htmlFor="timeframe">Expired After:</label>
          <select 
            id="timeframe" 
            value={timeframe} 
            onChange={(e) => setTimeframe(e.target.value)}
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
          onClick={toggleAdvanced}
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
            
            <div className="form-hint">
              <p>
                Use these fields to search by Township, Range, and Section.
                Format examples: T5N, R3E, 14
              </p>
            </div>
          </div>
        )}
        
        <div className="button-group">
          <button 
            type="submit" 
            className="search-button"
            disabled={loading}
          >
            {loading ? 'Searching...' : 'Search Claims'}
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
            <li>Use the Township/Range/Section search for precise location filtering</li>
            <li>Time filter shows claims that expired after the selected year</li>
            <li>Click on any claim marker to view details</li>
          </ul>
        </details>
      </div>
    </div>
  );
};

export default SearchPanel;
