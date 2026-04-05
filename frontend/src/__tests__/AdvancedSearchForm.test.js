import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdvancedSearchForm from '../components/AdvancedSearchForm';

describe('AdvancedSearchForm', () => {
  it('renders search form with county dropdown', () => {
    render(<AdvancedSearchForm onSearch={jest.fn()} />);
    expect(screen.getByText('Search Mining Claims')).toBeInTheDocument();
    expect(screen.getByLabelText(/county/i)).toBeInTheDocument();
  });

  it('renders submit button', () => {
    render(<AdvancedSearchForm onSearch={jest.fn()} />);
    expect(screen.getByRole('button', { name: /search claims/i })).toBeInTheDocument();
  });

  it('advanced options are hidden by default', () => {
    render(<AdvancedSearchForm onSearch={jest.fn()} />);
    expect(screen.queryByLabelText(/claim type/i)).not.toBeInTheDocument();
  });

  it('shows advanced options when toggle is clicked', () => {
    render(<AdvancedSearchForm onSearch={jest.fn()} />);
    fireEvent.click(screen.getByText(/show advanced options/i));
    expect(screen.getByLabelText(/claim type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
  });

  it('calls onSearch with filters on form submit', () => {
    const onSearch = jest.fn();
    render(<AdvancedSearchForm onSearch={onSearch} />);
    fireEvent.submit(screen.getByRole('button', { name: /search claims/i }).closest('form'));
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith(expect.objectContaining({ county: '' }));
  });

  it('updates county filter when selected', () => {
    const onSearch = jest.fn();
    render(<AdvancedSearchForm onSearch={onSearch} />);
    fireEvent.change(screen.getByLabelText(/county/i), {
      target: { name: 'county', value: 'MARICOPA' }
    });
    fireEvent.submit(screen.getByRole('button', { name: /search claims/i }).closest('form'));
    expect(onSearch).toHaveBeenCalledWith(expect.objectContaining({ county: 'MARICOPA' }));
  });
});
