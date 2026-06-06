import React, { useRef, useEffect, useState, useCallback } from 'react';
import '../styles/MapView.css';

/**
 * MapView — Mapbox GL JS powered map with BLM overlay layers.
 *
 * Uses Mapbox GL JS directly (no React wrapper) for maximum control.
 * Includes BLM Mining Claims and PLSS grid as optional overlay layers
 * sourced from official BLM ArcGIS REST services.
 */

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || '';
const ARIZONA_CENTER = [-111.0937, 34.0489]; // [lng, lat]
const DEFAULT_ZOOM = 6.5;

// BLM ArcGIS REST endpoints (open, no key required)
const BLM_MINING_CLAIMS_CLOSED =
  'https://gis.blm.gov/nlsdb/rest/services/Mining_Claims/MiningClaims/MapServer';
const BLM_PLSS_SERVICE =
  'https://gis.blm.gov/arcgis/rest/services/Cadastral/BLM_Natl_PLSS_CadNSDI/MapServer';
const BLM_SMA_SERVICE =
  'https://gis.blm.gov/arcgis/rest/services/admin_boundaries/BLM_Natl_SMA_LimitedScale/MapServer';

const MapView = ({ claims = [], loading, error, selectedClaimId, onViewDetails }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const popupRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [layerVisibility, setLayerVisibility] = useState({
    blmClaims: true,
    plssGrid: false,
    blmLands: false
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unknown';
    try {
      return new Date(dateStr + 'T00:00:00').toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  // Initialize Mapbox map
  useEffect(() => {
    if (!window.mapboxgl || !mapContainerRef.current) return;
    if (mapRef.current) return; // already initialized

    window.mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new window.mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAPBOX_TOKEN
        ? 'mapbox://styles/mapbox/outdoors-v12'
        : {
            version: 8,
            name: 'Open Terrain',
            sources: {
              'osm-tiles': {
                type: 'raster',
                tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                tileSize: 256,
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              }
            },
            layers: [
              {
                id: 'osm-tiles-layer',
                type: 'raster',
                source: 'osm-tiles',
                minzoom: 0,
                maxzoom: 19
              }
            ]
          },
      center: ARIZONA_CENTER,
      zoom: DEFAULT_ZOOM,
      maxZoom: 18,
      minZoom: 4
    });

    // Navigation controls
    map.addControl(new window.mapboxgl.NavigationControl(), 'top-right');
    map.addControl(new window.mapboxgl.ScaleControl({ unit: 'imperial' }), 'bottom-left');
    map.addControl(
      new window.mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: false
      }),
      'top-right'
    );

    map.on('load', () => {
      setMapLoaded(true);

      // Add BLM Mining Claims layer (Closed - Layer 2) as ArcGIS tile source
      map.addSource('blm-mining-claims', {
        type: 'raster',
        tiles: [
          `${BLM_MINING_CLAIMS_CLOSED}/export?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=512,512&format=png32&transparent=true&layers=show:1,2&f=image`
        ],
        tileSize: 512
      });
      map.addLayer({
        id: 'blm-mining-claims-layer',
        type: 'raster',
        source: 'blm-mining-claims',
        paint: { 'raster-opacity': 0.6 },
        layout: { visibility: 'visible' },
        minzoom: 8
      });

      // Add BLM PLSS Grid layer (Township/Section boundaries)
      map.addSource('blm-plss', {
        type: 'raster',
        tiles: [
          `${BLM_PLSS_SERVICE}/export?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=512,512&format=png32&transparent=true&layers=show:1,2&f=image`
        ],
        tileSize: 512
      });
      map.addLayer({
        id: 'blm-plss-layer',
        type: 'raster',
        source: 'blm-plss',
        paint: { 'raster-opacity': 0.5 },
        layout: { visibility: 'none' },
        minzoom: 8
      });

      // Add BLM Surface Management Agency (Federal land boundaries)
      map.addSource('blm-sma', {
        type: 'raster',
        tiles: [
          `${BLM_SMA_SERVICE}/export?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=512,512&format=png32&transparent=true&f=image`
        ],
        tileSize: 512
      });
      map.addLayer({
        id: 'blm-sma-layer',
        type: 'raster',
        source: 'blm-sma',
        paint: { 'raster-opacity': 0.35 },
        layout: { visibility: 'none' },
        minzoom: 6
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []); // map init - run once

  // Toggle layer visibility
  const toggleLayer = useCallback((layerKey, mapLayerId) => {
    setLayerVisibility(prev => {
      const newState = { ...prev, [layerKey]: !prev[layerKey] };
      if (mapRef.current && mapRef.current.getLayer(mapLayerId)) {
        mapRef.current.setLayoutProperty(
          mapLayerId,
          'visibility',
          newState[layerKey] ? 'visible' : 'none'
        );
      }
      return newState;
    });
  }, []);

  // Update markers when claims change
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const validClaims = claims.filter(
      c => c.latitude && c.longitude && !isNaN(parseFloat(c.latitude)) && !isNaN(parseFloat(c.longitude))
    );

    if (validClaims.length === 0) return;

    // Add markers for each claim
    validClaims.forEach(claim => {
      const lat = parseFloat(claim.latitude);
      const lng = parseFloat(claim.longitude);

      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'mapbox-marker';
      el.setAttribute('data-claim-id', claim.id);
      el.style.cssText = `
        width: 28px;
        height: 28px;
        background-color: ${getMarkerColor(claim.case_disposition)};
        border: 2px solid #fff;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        transition: transform 0.2s;
      `;
      el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.3)'; });
      el.addEventListener('mouseleave', () => { el.style.transform = 'scale(1)'; });

      const marker = new window.mapboxgl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(mapRef.current);

      // Click handler for popup
      el.addEventListener('click', () => {
        showPopup(claim, [lng, lat]);
      });

      marker._claimId = claim.id;
      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers
    if (validClaims.length > 1) {
      const bounds = new window.mapboxgl.LngLatBounds();
      validClaims.forEach(c => {
        bounds.extend([parseFloat(c.longitude), parseFloat(c.latitude)]);
      });
      mapRef.current.fitBounds(bounds, { padding: 60, maxZoom: 12 });
    } else if (validClaims.length === 1) {
      mapRef.current.flyTo({
        center: [parseFloat(validClaims[0].longitude), parseFloat(validClaims[0].latitude)],
        zoom: 12
      });
    }
  }, [claims, mapLoaded]); // markers update

  // Fly to selected claim
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !selectedClaimId) return;

    const claim = claims.find(c => c.id === selectedClaimId);
    if (!claim) return;

    const lat = parseFloat(claim.latitude);
    const lng = parseFloat(claim.longitude);
    if (isNaN(lat) || isNaN(lng)) return;

    mapRef.current.flyTo({ center: [lng, lat], zoom: 13, duration: 800 });

    setTimeout(() => {
      showPopup(claim, [lng, lat]);
    }, 900);
  }, [selectedClaimId, claims, mapLoaded]); // fly to selected

  const showPopup = (claim, lngLat) => {
    if (popupRef.current) popupRef.current.remove();

    const popup = new window.mapboxgl.Popup({ offset: 15, maxWidth: '320px' })
      .setLngLat(lngLat)
      .setHTML(`
        <div class="map-popup">
          <strong>${claim.claim_name}</strong>
          <span>BLM Case: ${claim.blm_case_id}</span>
          <span>Type: ${claim.claim_type}</span>
          <span class="status-badge status-${(claim.case_disposition || '').toLowerCase()}">${claim.case_disposition}</span>
          <span>Claimant: ${claim.claimant_name}</span>
          <span>Location: ${claim.township} ${claim.range} Sec ${claim.section}</span>
          <span>Closed: ${formatDate(claim.close_date)}</span>
          ${claim.commodity ? `<span>Commodity: ${claim.commodity}</span>` : ''}
          ${claim.acreage ? `<span>Acreage: ${claim.acreage}</span>` : ''}
          <button class="popup-details-btn" data-claim-id="${claim.id}">View Details ↓</button>
        </div>
      `)
      .addTo(mapRef.current);

    // Attach click handler to the button inside popup
    setTimeout(() => {
      const btn = document.querySelector(`.popup-details-btn[data-claim-id="${claim.id}"]`);
      if (btn && onViewDetails) {
        btn.addEventListener('click', () => onViewDetails(claim.id));
      }
    }, 50);

    popupRef.current = popup;
  };

  const getMarkerColor = (disposition) => {
    switch ((disposition || '').toUpperCase()) {
      case 'CLOSED': return '#e74c3c';
      case 'ABANDONED': return '#f39c12';
      case 'VOID': return '#9b59b6';
      default: return '#3498db';
    }
  };

  return (
    <div className="map-container">
      {error && (
        <div className="map-error" role="alert">
          {error}
        </div>
      )}
      {loading && (
        <div className="map-loading" aria-live="polite">
          Loading claims…
        </div>
      )}

      {/* Layer Controls */}
      <div className="map-layer-controls">
        <span className="layer-controls-title">BLM Layers</span>
        <label className="layer-toggle" title="Show official BLM mining claim boundaries (zoom in to see)">
          <input
            type="checkbox"
            checked={layerVisibility.blmClaims}
            onChange={() => toggleLayer('blmClaims', 'blm-mining-claims-layer')}
          />
          <span>Mining Claims</span>
        </label>
        <label className="layer-toggle" title="Show PLSS Township/Range/Section grid (zoom in to see)">
          <input
            type="checkbox"
            checked={layerVisibility.plssGrid}
            onChange={() => toggleLayer('plssGrid', 'blm-plss-layer')}
          />
          <span>PLSS Grid</span>
        </label>
        <label className="layer-toggle" title="Show BLM Surface Management Agency boundaries">
          <input
            type="checkbox"
            checked={layerVisibility.blmLands}
            onChange={() => toggleLayer('blmLands', 'blm-sma-layer')}
          />
          <span>Federal Lands</span>
        </label>
      </div>

      {/* Map Legend */}
      <div className="map-legend">
        <span className="legend-title">Status</span>
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: '#e74c3c' }}></span>
          Closed
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: '#f39c12' }}></span>
          Abandoned
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: '#9b59b6' }}></span>
          Void
        </div>
      </div>

      <div
        ref={mapContainerRef}
        className="map-view"
        aria-label="Map of Arizona mining claims"
      />

      <div className="map-stats" aria-live="polite">
        {!loading && (
          <span>Showing {claims.length} expired mining claim{claims.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {/* Data source attribution */}
      <div className="map-data-source">
        Data: U.S. Bureau of Land Management (BLM) MLRS &amp; NLSDB | Open Public Domain
      </div>
    </div>
  );
};

export default MapView;
