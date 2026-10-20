import React from 'react';
import { Search, X, RotateCcw } from 'lucide-react';

const SearchFilterBar = ({
  search = '',
  onSearchChange,
  placeholder = 'Search by keyword...',
  filters = [],
  onFilterChange,
  activeFilters = {},
  onReset,
}) => {
  return (
    <div className="card border-0 bg-white shadow-sm p-3 mb-4">
      <div className="row g-2 align-items-center">
        {/* Search Input */}
        <div className="col-12 col-md-5">
          <div className="input-group">
            <span className="input-group-text bg-light border-end-0 text-muted">
              <Search size={16} />
            </span>
            <input
              type="text"
              className="form-control bg-light border-start-0 ps-0"
              placeholder={placeholder}
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            {search && (
              <button
                className="btn btn-light border-start-0 text-muted"
                type="button"
                onClick={() => onSearchChange('')}
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Filters */}
        {filters.map((filter) => (
          <div key={filter.key} className="col-6 col-md-3">
            <select
              className="form-select bg-light"
              value={activeFilters[filter.key] || ''}
              onChange={(e) => onFilterChange(filter.key, e.target.value)}
            >
              <option value="">{filter.label}</option>
              {filter.options.map((opt) => {
                const val = typeof opt === 'string' ? opt : opt.value;
                const label = typeof opt === 'string' ? opt : opt.label;
                return (
                  <option key={val} value={val}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>
        ))}

        {/* Reset Button */}
        {onReset && (
          <div className="col-auto ms-auto">
            <button
              className="btn btn-outline-secondary d-flex align-items-center gap-1 btn-sm py-2 px-3"
              onClick={onReset}
              title="Reset all filters"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchFilterBar;
