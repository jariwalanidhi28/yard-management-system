import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StatusBadge from '../components/StatusBadge';
import StatCard from '../components/StatCard';
import ConfirmDialog from '../components/ConfirmDialog';
import FormField from '../components/FormField';
import DataTable from '../components/DataTable';
import SearchFilterBar from '../components/SearchFilterBar';
import { Truck } from 'lucide-react';

describe('Frontend Reusable UI Components', () => {
  describe('StatusBadge', () => {
    it('renders Available status with success badge styling', () => {
      render(<StatusBadge status="Available" />);
      const badge = screen.getByText('Available');
      expect(badge).toBeInTheDocument();
      expect(badge.className).toContain('bg-success');
    });

    it('renders Occupied status with warning badge styling', () => {
      render(<StatusBadge status="Occupied" />);
      const badge = screen.getByText('Occupied');
      expect(badge).toBeInTheDocument();
      expect(badge.className).toContain('bg-warning');
    });

    it('renders Blocked status with danger badge styling', () => {
      render(<StatusBadge status="Blocked" />);
      const badge = screen.getByText('Blocked');
      expect(badge).toBeInTheDocument();
      expect(badge.className).toContain('bg-danger');
    });
  });

  describe('StatCard', () => {
    it('renders title, value and subtitle correctly', () => {
      render(
        <StatCard
          title="Active Vehicles"
          value={42}
          subtext="Currently checked in"
          icon={Truck}
        />
      );
      expect(screen.getByText('Active Vehicles')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText('Currently checked in')).toBeInTheDocument();
    });
  });

  describe('ConfirmDialog', () => {
    it('renders title and message when open and handles actions', () => {
      const handleConfirm = vi.fn();
      const handleCancel = vi.fn();

      render(
        <ConfirmDialog
          isOpen={true}
          title="Delete Confirmation"
          message="Are you sure you want to delete this resource?"
          confirmText="Yes, Delete"
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      );

      expect(screen.getByText('Delete Confirmation')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to delete this resource?')).toBeInTheDocument();

      const confirmBtn = screen.getByText('Yes, Delete');
      fireEvent.click(confirmBtn);
      expect(handleConfirm).toHaveBeenCalledTimes(1);

      const cancelBtn = screen.getByText('Cancel');
      fireEvent.click(cancelBtn);
      expect(handleCancel).toHaveBeenCalledTimes(1);
    });

    it('does not render when isOpen is false', () => {
      const { container } = render(
        <ConfirmDialog isOpen={false} onConfirm={() => {}} onCancel={() => {}} />
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe('FormField', () => {
    it('renders input with label and handles change events', () => {
      const handleChange = vi.fn();
      render(
        <FormField
          label="License Plate"
          name="plate"
          value="TRK-100"
          onChange={handleChange}
          required
        />
      );

      expect(screen.getByText(/License Plate/)).toBeInTheDocument();
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('TRK-100');

      fireEvent.change(input, { target: { value: 'TRK-200' } });
      expect(handleChange).toHaveBeenCalled();
    });

    it('displays validation error message when present', () => {
      render(
        <FormField
          label="Email"
          name="email"
          value="invalid"
          onChange={() => {}}
          error="Please provide a valid email format"
        />
      );

      expect(screen.getByText('Please provide a valid email format')).toBeInTheDocument();
      expect(screen.getByRole('textbox').className).toContain('is-invalid');
    });
  });

  describe('DataTable', () => {
    const columns = [
      { header: 'ID', key: 'id' },
      { header: 'Name', key: 'name' },
    ];

    it('displays loading spinner when isLoading is true', () => {
      render(<DataTable columns={columns} data={[]} isLoading={true} />);
      expect(screen.getByText(/Loading records/i)).toBeInTheDocument();
    });

    it('displays empty message when data is empty', () => {
      render(
        <DataTable
          columns={columns}
          data={[]}
          isLoading={false}
          emptyMessage="No vehicles registered."
        />
      );
      expect(screen.getByText('No vehicles registered.')).toBeInTheDocument();
    });

    it('renders table rows when data is provided', () => {
      const sampleData = [
        { id: '1', name: 'Freightliner Alpha' },
        { id: '2', name: 'Volvo Beta' },
      ];

      render(<DataTable columns={columns} data={sampleData} isLoading={false} />);
      expect(screen.getByText('Freightliner Alpha')).toBeInTheDocument();
      expect(screen.getByText('Volvo Beta')).toBeInTheDocument();
    });
  });

  describe('SearchFilterBar', () => {
    it('handles search input and filter selection', () => {
      const handleSearch = vi.fn();
      const handleFilter = vi.fn();
      const handleReset = vi.fn();

      render(
        <SearchFilterBar
          search="test"
          onSearchChange={handleSearch}
          filters={[
            {
              key: 'status',
              label: 'All Statuses',
              options: ['Active', 'Inactive'],
            },
          ]}
          activeFilters={{ status: 'Active' }}
          onFilterChange={handleFilter}
          onReset={handleReset}
        />
      );

      const searchInput = screen.getByPlaceholderText(/Search by keyword/i);
      expect(searchInput).toHaveValue('test');

      const select = screen.getByRole('combobox');
      expect(select).toHaveValue('Active');

      fireEvent.change(select, { target: { value: 'Inactive' } });
      expect(handleFilter).toHaveBeenCalledWith('status', 'Inactive');

      const resetBtn = screen.getByRole('button', { name: /Reset/i });
      fireEvent.click(resetBtn);
      expect(handleReset).toHaveBeenCalledTimes(1);
    });
  });
});
