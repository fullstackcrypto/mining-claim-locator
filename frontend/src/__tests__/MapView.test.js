// Mock react-leaflet since jsdom doesn't support canvas/WebGL
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => null,
  Marker: ({ children }) => <div data-testid="map-marker">{children}</div>,
  Popup: ({ children }) => <div data-testid="map-popup">{children}</div>,
  useMap: () => ({ fitBounds: jest.fn() })
}));

// Mock leaflet
jest.mock('leaflet', () => ({
  Icon: {
    Default: {
      prototype: { _getIconUrl: jest.fn() },
      mergeOptions: jest.fn()
    }
  }
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MapView from '../components/MapView';

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
    longitude: -112.0740
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
    longitude: -111.7890
  }
];

describe('MapView', () => {
  it('renders the map container', () => {
    render(<MapView claims={[]} />);
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });

  it('shows loading indicator when loading is true', () => {
    render(<MapView claims={[]} loading={true} />);
    expect(screen.getByText(/loading claims/i)).toBeInTheDocument();
  });

  it('shows error message when error is provided', () => {
    render(<MapView claims={[]} error="Network error" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Network error');
  });

  it('renders a marker for each claim with valid coordinates', () => {
    render(<MapView claims={sampleClaims} />);
    const markers = screen.getAllByTestId('map-marker');
    expect(markers).toHaveLength(sampleClaims.length);
  });

  it('displays claim count in stats bar', () => {
    render(<MapView claims={sampleClaims} />);
    expect(screen.getByText(/2 expired mining claims/i)).toBeInTheDocument();
  });

  it('shows singular label for exactly one claim', () => {
    render(<MapView claims={[sampleClaims[0]]} />);
    expect(screen.getByText(/1 expired mining claim$/i)).toBeInTheDocument();
  });

  it('renders popup with claim details', () => {
    render(<MapView claims={[sampleClaims[0]]} />);
    expect(screen.getByText('DESERT GOLD')).toBeInTheDocument();
    expect(screen.getByText(/AZMC123456/)).toBeInTheDocument();
    expect(screen.getByText(/ARIZONA MINERALS LLC/)).toBeInTheDocument();
  });

  it('skips markers for claims with invalid coordinates', () => {
    const badClaims = [
      { id: 99, claim_name: 'BAD', latitude: null, longitude: null }
    ];
    render(<MapView claims={badClaims} />);
    expect(screen.queryByTestId('map-marker')).not.toBeInTheDocument();
  });
});
