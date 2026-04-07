import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ClaimsList from '../components/ClaimsList';

const sampleClaims = [
  {
    id: 1,
    blm_case_id: 'AZMC123456',
    claim_name: 'DESERT GOLD',
    claim_type: 'LODE',
    claimant_name: 'ARIZONA MINERALS LLC',
    case_disposition: 'CLOSED',
    location_date: '1995-06-12',
    close_date: '2010-09-01',
    county: 'MARICOPA',
    township: 'T5N',
    range: 'R3E',
    section: '14',
    meridian: 'GILA & SALT RIVER',
    latitude: 33.4484,
    longitude: -112.074,
    acreage: 20.5,
    commodity: 'GOLD, SILVER',
    maintenance_fee_paid: false,
    notes: 'Abandoned due to failure to pay maintenance fees'
  },
  {
    id: 2,
    blm_case_id: 'AZMC789012',
    claim_name: 'GOLDEN HORIZON',
    claim_type: 'PLACER',
    claimant_name: 'SMITH MINING CO',
    case_disposition: 'ABANDONED',
    location_date: '2002-03-22',
    close_date: '2015-07-15',
    county: 'PIMA',
    township: 'T15S',
    range: 'R12E',
    section: '28',
    meridian: 'GILA & SALT RIVER',
    latitude: 32.1234,
    longitude: -111.789,
    acreage: 40.0,
    commodity: 'GOLD',
    maintenance_fee_paid: false,
    notes: null
  }
];

describe('ClaimsList', () => {
  it('renders nothing when there are no claims and not loading', () => {
    const { container } = render(<ClaimsList claims={[]} loading={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('displays the count of claims found', () => {
    render(<ClaimsList claims={sampleClaims} />);
    expect(screen.getByText(/2 expired mining claims found/i)).toBeInTheDocument();
  });

  it('uses singular when exactly one claim', () => {
    render(<ClaimsList claims={[sampleClaims[0]]} />);
    expect(screen.getByText(/1 expired mining claim found/i)).toBeInTheDocument();
  });

  it('renders a card header for each claim', () => {
    render(<ClaimsList claims={sampleClaims} />);
    expect(screen.getByText('DESERT GOLD')).toBeInTheDocument();
    expect(screen.getByText('GOLDEN HORIZON')).toBeInTheDocument();
  });

  it('shows summary fields for each claim', () => {
    render(<ClaimsList claims={[sampleClaims[0]]} />);
    expect(screen.getByText('AZMC123456')).toBeInTheDocument();
    expect(screen.getByText('MARICOPA')).toBeInTheDocument();
    expect(screen.getByText('ARIZONA MINERALS LLC')).toBeInTheDocument();
    expect(screen.getByText('GOLD, SILVER')).toBeInTheDocument();
    expect(screen.getByText('20.5 ac')).toBeInTheDocument();
  });

  it('expands a card and shows detailed fields when header is clicked', () => {
    render(<ClaimsList claims={[sampleClaims[0]]} />);

    // Detailed fields should NOT be visible before expanding
    expect(screen.queryByText('GILA & SALT RIVER')).not.toBeInTheDocument();
    expect(screen.queryByText('📍 View on Map')).not.toBeInTheDocument();

    // Click the header button to expand
    fireEvent.click(screen.getByRole('button', { name: /DESERT GOLD/i }));

    // Detailed fields should now appear
    expect(screen.getByText('GILA & SALT RIVER')).toBeInTheDocument();
    expect(screen.getByText('📍 View on Map')).toBeInTheDocument();
    expect(screen.getByText('33.4484')).toBeInTheDocument();
    expect(screen.getByText(/Abandoned due to failure/i)).toBeInTheDocument();
  });

  it('collapses a card when clicking the header a second time', () => {
    render(<ClaimsList claims={[sampleClaims[0]]} />);
    const header = screen.getByRole('button', { name: /DESERT GOLD/i });

    fireEvent.click(header); // expand
    expect(screen.getByText('📍 View on Map')).toBeInTheDocument();

    fireEvent.click(header); // collapse
    expect(screen.queryByText('📍 View on Map')).not.toBeInTheDocument();
  });

  it('calls onSelectClaim with the claim id when a card is expanded', () => {
    const onSelectClaim = jest.fn();
    render(
      <ClaimsList
        claims={sampleClaims}
        onSelectClaim={onSelectClaim}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /DESERT GOLD/i }));
    expect(onSelectClaim).toHaveBeenCalledWith(1);
  });

  it('calls onViewOnMap with the claim object when "View on Map" is clicked', () => {
    const onViewOnMap = jest.fn();
    render(
      <ClaimsList
        claims={[sampleClaims[0]]}
        onViewOnMap={onViewOnMap}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /DESERT GOLD/i })); // expand
    fireEvent.click(screen.getByText('📍 View on Map'));
    expect(onViewOnMap).toHaveBeenCalledWith(sampleClaims[0]);
  });

  it('auto-expands a card when selectedClaimId changes', async () => {
    const { rerender } = render(
      <ClaimsList claims={sampleClaims} selectedClaimId={null} />
    );

    // Not yet expanded
    expect(screen.queryByText('📍 View on Map')).not.toBeInTheDocument();

    // Simulate the map selecting a claim
    await act(async () => {
      rerender(<ClaimsList claims={sampleClaims} selectedClaimId={2} />);
    });

    // GOLDEN HORIZON (id=2) should now be expanded
    expect(screen.getByText('📍 View on Map')).toBeInTheDocument();
  });

  it('shows loading message when loading is true', () => {
    render(<ClaimsList claims={[]} loading={true} />);
    expect(screen.getByText(/loading claims/i)).toBeInTheDocument();
  });

  it('shows status badges with correct text', () => {
    render(<ClaimsList claims={sampleClaims} />);
    expect(screen.getByText('CLOSED')).toBeInTheDocument();
    expect(screen.getByText('ABANDONED')).toBeInTheDocument();
  });
});
