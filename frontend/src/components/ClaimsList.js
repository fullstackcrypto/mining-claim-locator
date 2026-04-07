import React, { useState, useEffect, useRef } from 'react';
import '../styles/ClaimsList.css';

const PAGE_SIZE = 50;

const ClaimsList = ({ claims = [], loading, selectedClaimId, onSelectClaim, onViewOnMap }) => {
  const [expandedId, setExpandedId] = useState(null);
  const [page, setPage] = useState(1);
  const itemRefs = useRef({});

  // When a claim is selected from the map, auto-expand it and scroll to it
  useEffect(() => {
    if (!selectedClaimId) return;

    setExpandedId(selectedClaimId);

    const idx = claims.findIndex(c => c.id === selectedClaimId);
    if (idx !== -1) {
      const targetPage = Math.floor(idx / PAGE_SIZE) + 1;
      setPage(targetPage);
      setTimeout(() => {
        const el = itemRefs.current[selectedClaimId];
        if (el && typeof el.scrollIntoView === 'function') {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
    }
  }, [selectedClaimId, claims]);

  // Reset to page 1 when claims list changes (new search)
  useEffect(() => {
    setPage(1);
    setExpandedId(null);
  }, [claims]);

  if (!loading && claims.length === 0) return null;

  const totalPages = Math.ceil(claims.length / PAGE_SIZE);
  const pageClaims = claims.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleExpand = (id) => {
    const nextId = expandedId === id ? null : id;
    setExpandedId(nextId);
    if (nextId && onSelectClaim) onSelectClaim(nextId);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr + 'T00:00:00').toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  const Pagination = () =>
    totalPages > 1 ? (
      <div className="claims-pagination">
        <button
          className="page-btn"
          disabled={page === 1}
          onClick={() => setPage(p => p - 1)}
          aria-label="Previous page"
        >
          ← Prev
        </button>
        <span className="page-info">
          Page {page} of {totalPages}
        </span>
        <button
          className="page-btn"
          disabled={page === totalPages}
          onClick={() => setPage(p => p + 1)}
          aria-label="Next page"
        >
          Next →
        </button>
      </div>
    ) : null;

  return (
    <section className="claims-list" aria-label="Search results">
      <div className="claims-list-header">
        <h2>
          {loading
            ? 'Loading claims…'
            : `${claims.length} expired mining claim${claims.length !== 1 ? 's' : ''} found`}
        </h2>
        {totalPages > 1 && (
          <span className="page-label">
            Showing {(page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, claims.length)} of {claims.length}
          </span>
        )}
      </div>

      <Pagination />

      <div className="claims-cards">
        {pageClaims.map(claim => {
          const isExpanded = expandedId === claim.id;
          const statusClass = `status-${(claim.case_disposition || '').toLowerCase()}`;

          return (
            <div
              key={claim.id}
              ref={el => { itemRefs.current[claim.id] = el; }}
              className={`claim-card${isExpanded ? ' expanded' : ''}`}
            >
              {/* Clickable header row */}
              <button
                className="claim-card-header"
                onClick={() => toggleExpand(claim.id)}
                aria-expanded={isExpanded}
              >
                <span className="claim-name">{claim.claim_name}</span>
                <span className="claim-badges">
                  <span className={`status-badge ${statusClass}`}>
                    {claim.case_disposition}
                  </span>
                  <span className="type-badge">{claim.claim_type}</span>
                </span>
                <span className="expand-icon" aria-hidden="true">
                  {isExpanded ? '▲' : '▼'}
                </span>
              </button>

              {/* Always-visible summary */}
              <div className="claim-card-summary">
                <div className="claim-field">
                  <span className="field-label">BLM Case</span>
                  <span>{claim.blm_case_id}</span>
                </div>
                <div className="claim-field">
                  <span className="field-label">County</span>
                  <span>{claim.county}</span>
                </div>
                <div className="claim-field">
                  <span className="field-label">Location</span>
                  <span>
                    {[claim.township, claim.range, claim.section && `Sec ${claim.section}`]
                      .filter(Boolean)
                      .join(' ')}
                  </span>
                </div>
                <div className="claim-field">
                  <span className="field-label">Claimant</span>
                  <span>{claim.claimant_name || '—'}</span>
                </div>
                <div className="claim-field">
                  <span className="field-label">Closed</span>
                  <span>{formatDate(claim.close_date)}</span>
                </div>
                <div className="claim-field">
                  <span className="field-label">Commodity</span>
                  <span>{claim.commodity || '—'}</span>
                </div>
                <div className="claim-field">
                  <span className="field-label">Acreage</span>
                  <span>{claim.acreage != null ? `${claim.acreage} ac` : '—'}</span>
                </div>
              </div>

              {/* Expanded detail section */}
              {isExpanded && (
                <div className="claim-card-details">
                  <hr className="details-divider" />
                  <div className="claim-details-grid">
                    <div className="claim-field">
                      <span className="field-label">Latitude</span>
                      <span>{claim.latitude != null ? claim.latitude : '—'}</span>
                    </div>
                    <div className="claim-field">
                      <span className="field-label">Longitude</span>
                      <span>{claim.longitude != null ? claim.longitude : '—'}</span>
                    </div>
                    <div className="claim-field">
                      <span className="field-label">Meridian</span>
                      <span>{claim.meridian || '—'}</span>
                    </div>
                    <div className="claim-field">
                      <span className="field-label">Location Date</span>
                      <span>{formatDate(claim.location_date)}</span>
                    </div>
                    <div className="claim-field">
                      <span className="field-label">Maintenance Fee</span>
                      <span>{claim.maintenance_fee_paid ? 'Paid' : 'Not Paid'}</span>
                    </div>
                    {claim.notes && (
                      <div className="claim-field claim-notes">
                        <span className="field-label">Notes</span>
                        <span>{claim.notes}</span>
                      </div>
                    )}
                  </div>
                  <button
                    className="view-on-map-btn"
                    onClick={() => onViewOnMap && onViewOnMap(claim)}
                  >
                    📍 View on Map
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Pagination />
    </section>
  );
};

export default ClaimsList;
