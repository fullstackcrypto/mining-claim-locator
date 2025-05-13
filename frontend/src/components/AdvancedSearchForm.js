import React, { useState } from 'react';

function AdvancedSearchForm({ onSearch }) {
  const [filters, setFilters] = useState({
    county: '',
    township: '',
    range: '',
    section: '',
    claim_type: '',
    case_disposition: '',
    date_from: '',
    date_to: '',
    claimant: ''
  });
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(filters);
  };
  
  return (
    <div style={{ padding: '1rem', backgroundColor: '#f5f7fa' }}>
      <h2>Search Mining Claims</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ marginBottom: '10px', minWidth: '200px' }}>
            <label>County</label>
            <select 
              name="county" 
              value={filters.county} 
              onChange={handleChange}
              style={{ display: 'block', width: '100%', padding: '5px' }}
            >
              <option value="">All Counties</option>
              <option value="APACHE">Apache</option>
              <option value="COCHISE">Cochise</option>
              <option value="COCONINO">Coconino</option>
              <option value="GILA">Gila</option>
              <option value="GRAHAM">Graham</option>
              <option value="GREENLEE">Greenlee</option>
              <option value="LA PAZ">La Paz</option>
              <option value="MARICOPA">Maricopa</option>
              <option value="MOHAVE">Mohave</option>
              <option value="NAVAJO">Navajo</option>
              <option value="PIMA">Pima</option>
              <option value="PINAL">Pinal</option>
              <option value="SANTA CRUZ">Santa Cruz</option>
              <option value="YAVAPAI">Yavapai</option>
              <option value="YUMA">Yuma</option>
            </select>
          </div>
          
          <div style={{ marginBottom: '10px', minWidth: '150px' }}>
            <label>Township</label>
            <input 
              type="text" 
              name="township" 
              value={filters.township} 
              onChange={handleChange} 
              placeholder="e.g. T5N"
              style={{ display: 'block', width: '100%', padding: '5px' }}
            />
          </div>
          
          <div style={{ marginBottom: '10px', minWidth: '150px' }}>
            <label>Range</label>
            <input 
              type="text" 
              name="range" 
              value={filters.range} 
              onChange={handleChange} 
              placeholder="e.g. R3E"
              style={{ display: 'block', width: '100%', padding: '5px' }}
            />
          </div>
          
          <div style={{ marginBottom: '10px', minWidth: '150px' }}>
            <label>Section</label>
            <input 
              type="text" 
              name="section" 
              value={filters.section} 
              onChange={handleChange} 
              placeholder="e.g. 14"
              style={{ display: 'block', width: '100%', padding: '5px' }}
            />
          </div>
        </div>
        
        <button 
          type="button" 
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{ 
            backgroundColor: '#2c3e50', 
            color: 'white', 
            padding: '5px 10px',
            border: 'none',
            borderRadius: '4px',
            marginBottom: '10px'
          }}
        >
          {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
        </button>
        
        {showAdvanced && (
          <div style={{ padding: '10px', backgroundColor: '#e9ecef', borderRadius: '4px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ marginBottom: '10px', minWidth: '200px' }}>
                <label>Claim Type</label>
                <select 
                  name="claim_type" 
                  value={filters.claim_type} 
                  onChange={handleChange}
                  style={{ display: 'block', width: '100%', padding: '5px' }}
                >
                  <option value="">All Types</option>
                  <option value="LODE">Lode</option>
                  <option value="PLACER">Placer</option>
                  <option value="MILLSITE">Millsite</option>
                  <option value="TUNNEL SITE">Tunnel Site</option>
                </select>
              </div>
              
              <div style={{ marginBottom: '10px', minWidth: '200px' }}>
                <label>Status</label>
                <select 
                  name="case_disposition" 
                  value={filters.case_disposition} 
                  onChange={handleChange}
                  style={{ display: 'block', width: '100%', padding: '5px' }}
                >
                  <option value="">All Statuses</option>
                  <option value="CLOSED">Closed</option>
                  <option value="ABANDONED">Abandoned</option>
                  <option value="VOID">Void</option>
                </select>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ marginBottom: '10px', minWidth: '200px' }}>
                <label>Closed After</label>
                <input 
                  type="date" 
                  name="date_from" 
                  value={filters.date_from} 
                  onChange={handleChange}
                  style={{ display: 'block', width: '100%', padding: '5px' }}
                />
              </div>
              
              <div style={{ marginBottom: '10px', minWidth: '200px' }}>
                <label>Closed Before</label>
                <input 
                  type="date" 
                  name="date_to" 
                  value={filters.date_to} 
                  onChange={handleChange}
                  style={{ display: 'block', width: '100%', padding: '5px' }}
                />
              </div>
            </div>
            
            <div style={{ marginBottom: '10px' }}>
              <label>Claimant Name</label>
              <input 
                type="text" 
                name="claimant" 
                value={filters.claimant} 
                onChange={handleChange} 
                placeholder="Claimant name"
                style={{ display: 'block', width: '100%', padding: '5px' }}
              />
            </div>
          </div>
        )}
        
        <button 
          type="submit" 
          style={{ 
            backgroundColor: '#e67e22', 
            color: 'white', 
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Search Claims
        </button>
      </form>
    </div>
  );
}

export default AdvancedSearchForm;
