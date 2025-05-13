import React, { useState } from 'react';

function SearchForm({ onSearch }) {
const [county, setCounty] = useState('');
const [township, setTownship] = useState('');
const [range, setRange] = useState('');
const [section, setSection] = useState('');

const handleSubmit = (e) => {
 e.preventDefault();
 onSearch({ county, township, range, section });
};

return (
 <div style={{ padding: '1rem', backgroundColor: '#f5f7fa' }}>
   <h2>Search Expired Claims</h2>
   <form onSubmit={handleSubmit}>
     <div style={{ marginBottom: '10px' }}>
       <label>County: </label>
       <select value={county} onChange={e => setCounty(e.target.value)}>
         <option value="">All Counties</option>
         <option value="MARICOPA">Maricopa</option>
         <option value="PIMA">Pima</option>
         <option value="MOHAVE">Mohave</option>
       </select>
     </div>
     
     <div style={{ marginBottom: '10px' }}>
       <label>Township: </label>
       <input 
         type="text" 
         value={township} 
         onChange={e => setTownship(e.target.value)} 
         placeholder="e.g. T5N" 
       />
     </div>
     
     <div style={{ marginBottom: '10px' }}>
       <label>Range: </label>
       <input 
         type="text" 
         value={range} 
         onChange={e => setRange(e.target.value)} 
         placeholder="e.g. R3E" 
       />
     </div>
     
     <div style={{ marginBottom: '10px' }}>
       <label>Section: </label>
       <input 
         type="text" 
         value={section} 
         onChange={e => setSection(e.target.value)} 
         placeholder="e.g. 14" 
       />
     </div>
     
     <button type="submit" style={{ 
       backgroundColor: '#e67e22', 
       color: 'white', 
       padding: '8px 16px',
       border: 'none',
       borderRadius: '4px'
     }}>
       Search Claims
     </button>
   </form>
 </div>
);
}

export default SearchForm;
