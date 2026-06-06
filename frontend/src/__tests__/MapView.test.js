import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MapView from '../components/MapView';

// Mock Mapbox GL JS global
// Note: jest.fn(() => obj) does NOT work with 'new' in this jest version.
// When called with 'new', jest ignores the return value. We must use
// class-style constructors that assign properties to 'this'.
const mockMapProps = {
  addControl: jest.fn(),
  addSource: jest.fn(),
  addLayer: jest.fn(),
  getLayer: jest.fn(() => true),
  setLayoutProperty: jest.fn(),
  fitBounds: jest.fn(),
  flyTo: jest.fn(),
  on: jest.fn((event, cb) => {
    if (event === 'load') setTimeout(cb, 0);
  }),
  remove: jest.fn()
};

const mockMarkerProps = {
  setLngLat: jest.fn(function() { return this; }),
  addTo: jest.fn(function() { return this; }),
  remove: jest.fn()
};

const mockPopupProps = {
  setLngLat: jest.fn(function() { return this; }),
  setHTML: jest.fn(function() { return this; }),
  addTo: jest.fn(function() { return this; }),
  remove: jest.fn()
};

function MockMap() { Object.assign(this, mockMapProps); }
function MockMarker() { Object.assign(this, mockMarkerProps); }
function MockPopup() { Object.assign(this, mockPopupProps); }
function MockLngLatBounds() { this.extend = jest.fn(); }

beforeAll(() => {
  window.mapboxgl = {
    accessToken: '',
    Map: MockMap,
    Marker: MockMarker,
    Popup: MockPopup,
    NavigationControl: jest.fn(),
    ScaleControl: jest.fn(),
    GeolocateControl: jest.fn(),
    LngLatBounds: MockLngLatBounds
  };
});

afterAll(() => {
  delete window.mapboxgl;
});

const sampleClaims = [
  {
    id: 1,
    blm_case_id: 'AZMC123456',
    claim_name: 'DESERT GOLD',
    claim_type: 'LODE',
    claimant_name: 'ARIZONA MINERALS LLC',
    case_disposition: 'CLOSED',
    close_date: '2010-09-01',
    county: 'MARICOPA',
    township: 'T5N',
    range: 'R3E',
    section: '14',
    latitude: 33.4484,
    longitude: -112.074,
    commodity: 'GOLD, SILVER'
  },
  {
    id: 2,
    blm_case_id: 'AZMC789012',
    claim_name: 'GOLDEN HORIZON',
    claim_type: 'PLACER',
    claimant_name: 'SMITH MINING CO',
    case_disposition: 'ABANDONED',
    close_date: '2015-07-15',
    county: 'PIMA',
    township: 'T15S',
    range: 'R12E',
    section: '28',
    latitude: 32.1234,
    longitude: -111.789,
    commodity: 'GOLD'
  }
];

describe('MapView Component', () => {
  it('renders the map container', () => {
    render(<MapView claims={[]} loading={false} error={null} />);
    expect(screen.getByLabelText('Map of Arizona mining claims')).toBeInTheDocument();
  });

  it('shows loading indicator when loading', () => {
    render(<MapView claims={[]} loading={true} error={null} />);
    expect(screen.getByText('Loading claims…')).toBeInTheDocument();
  });

  it('shows error message when there is an error', () => {
    render(<MapView claims={[]} loading={false} error="Network error" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Network error');
  });

  it('shows claim count in stats', () => {
    render(<MapView claims={sampleClaims} loading={false} error={null} />);
    expect(screen.getByText('Showing 2 expired mining claims')).toBeInTheDocument();
  });

  it('shows singular claim count', () => {
    render(<MapView claims={[sampleClaims[0]]} loading={false} error={null} />);
    expect(screen.getByText('Showing 1 expired mining claim')).toBeInTheDocument();
  });

  it('renders BLM layer controls', () => {
    render(<MapView claims={[]} loading={false} error={null} />);
    expect(screen.getByText('BLM Layers')).toBeInTheDocument();
    expect(screen.getByText('Mining Claims')).toBeInTheDocument();
    expect(screen.getByText('PLSS Grid')).toBeInTheDocument();
    expect(screen.getByText('Federal Lands')).toBeInTheDocument();
  });

  it('renders the map legend', () => {
    render(<MapView claims={[]} loading={false} error={null} />);
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Closed')).toBeInTheDocument();
    expect(screen.getByText('Abandoned')).toBeInTheDocument();
    expect(screen.getByText('Void')).toBeInTheDocument();
  });

  it('renders data source attribution', () => {
    render(<MapView claims={[]} loading={false} error={null} />);
    expect(screen.getByText(/Bureau of Land Management/)).toBeInTheDocument();
  });
});
