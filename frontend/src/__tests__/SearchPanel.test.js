import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SearchPanel from '../components/SearchPanel';

// Use factory-based mock so Jest never loads the real api.js (which imports ESM axios)
const mockGetCounties = jest.fn();
const mockSearchClaims = jest.fn();

jest.mock('../services/api', () => ({
  __esModule: true,
  default: {
    getCounties: (...args) => mockGetCounties(...args),
    searchClaims: (...args) => mockSearchClaims(...args),
    getClaimDetails: jest.fn(),
    checkHealth: jest.fn()
  }
}));

const mockCounties = ['COCHISE', 'MARICOPA', 'MOHAVE', 'PIMA', 'YAVAPAI'];

beforeEach(() => {
  mockGetCounties.mockResolvedValue({ data: mockCounties });
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('SearchPanel', () => {
  it('renders the search form', async () => {
    render(<SearchPanel onSearch={jest.fn()} loading={false} />);
    expect(screen.getByText('Find Expired Mining Claims')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search claims/i })).toBeInTheDocument();
  });

  it('loads and displays county options from API', async () => {
    render(<SearchPanel onSearch={jest.fn()} loading={false} />);
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'MARICOPA' })).toBeInTheDocument();
    });
  });

  it('shows inline error when county API call fails', async () => {
    mockGetCounties.mockRejectedValue(new Error('Network error'));
    render(<SearchPanel onSearch={jest.fn()} loading={false} />);
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveTextContent(/could not load county list/i);
    });
  });

  it('submits only non-empty params — no timeframe key', async () => {
    const onSearch = jest.fn();
    render(<SearchPanel onSearch={onSearch} loading={false} />);

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'MARICOPA' })).toBeInTheDocument()
    );

    fireEvent.change(screen.getByLabelText(/county/i), { target: { value: 'MARICOPA' } });
    fireEvent.submit(
      screen.getByRole('button', { name: /search claims/i }).closest('form')
    );

    expect(onSearch).toHaveBeenCalledWith({ county: 'MARICOPA' });
    expect(onSearch.mock.calls[0][0]).not.toHaveProperty('timeframe');
  });

  it('submits date_from when Closed After is selected', async () => {
    const onSearch = jest.fn();
    render(<SearchPanel onSearch={onSearch} loading={false} />);

    await waitFor(() => expect(mockGetCounties).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText(/closed after/i), {
      target: { value: '2010-01-01' }
    });
    fireEvent.submit(
      screen.getByRole('button', { name: /search claims/i }).closest('form')
    );

    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({ date_from: '2010-01-01' })
    );
    expect(onSearch.mock.calls[0][0]).not.toHaveProperty('timeframe');
  });

  it('shows advanced options when toggle is clicked', () => {
    render(<SearchPanel onSearch={jest.fn()} loading={false} />);
    fireEvent.click(screen.getByText(/show advanced/i));
    expect(screen.getByLabelText(/township/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/claim type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/claimant name/i)).toBeInTheDocument();
  });

  it('submits claim_type and case_disposition from advanced options', async () => {
    const onSearch = jest.fn();
    render(<SearchPanel onSearch={onSearch} loading={false} />);

    await waitFor(() => expect(mockGetCounties).toHaveBeenCalled());

    fireEvent.click(screen.getByText(/show advanced/i));
    fireEvent.change(screen.getByLabelText(/claim type/i), { target: { value: 'PLACER' } });
    fireEvent.change(screen.getByLabelText(/status/i), { target: { value: 'ABANDONED' } });
    fireEvent.submit(
      screen.getByRole('button', { name: /search claims/i }).closest('form')
    );

    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({ claim_type: 'PLACER', case_disposition: 'ABANDONED' })
    );
  });

  it('uppercases township and range before submitting', async () => {
    const onSearch = jest.fn();
    render(<SearchPanel onSearch={onSearch} loading={false} />);

    await waitFor(() => expect(mockGetCounties).toHaveBeenCalled());

    fireEvent.click(screen.getByText(/show advanced/i));
    fireEvent.change(screen.getByLabelText(/township/i), { target: { value: 't5n' } });
    fireEvent.change(screen.getByLabelText(/range/i), { target: { value: 'r3e' } });
    fireEvent.submit(
      screen.getByRole('button', { name: /search claims/i }).closest('form')
    );

    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({ township: 'T5N', range: 'R3E' })
    );
  });

  it('disables buttons when loading is true', () => {
    render(<SearchPanel onSearch={jest.fn()} loading={true} />);
    expect(screen.getByRole('button', { name: /searching/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /reset/i })).toBeDisabled();
  });

  it('reset clears fields and calls onSearch with empty params', async () => {
    const onSearch = jest.fn();
    render(<SearchPanel onSearch={onSearch} loading={false} />);

    await waitFor(() => expect(mockGetCounties).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText(/county/i), { target: { value: 'PIMA' } });
    fireEvent.click(screen.getByRole('button', { name: /reset/i }));

    expect(onSearch).toHaveBeenLastCalledWith({});
    expect(screen.getByLabelText(/county/i)).toHaveValue('');
  });
});
