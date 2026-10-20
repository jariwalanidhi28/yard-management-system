import React from 'react';
import LoadingSpinner from './LoadingSpinner';
import { Inbox } from 'lucide-react';

const DataTable = ({
  columns = [],
  data = [],
  isLoading = false,
  emptyMessage = 'No records found matching your query.',
  onRowClick,
}) => {
  if (isLoading) {
    return <LoadingSpinner message="Loading records..." />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="card border-0 bg-light p-5 text-center my-3">
        <div className="d-flex justify-content-center text-muted mb-2">
          <Inbox size={42} strokeWidth={1.5} />
        </div>
        <h6 className="text-secondary fw-semibold">No Data Available</h6>
        <p className="text-muted small mb-0">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle mb-0">
        <thead className="table-light border-bottom">
          <tr>
            {columns.map((col, index) => (
              <th
                key={col.key || index}
                scope="col"
                className={`text-uppercase fs-7 fw-semibold text-secondary py-3 ${col.className || ''}`}
                style={col.style}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="border-top-0">
          {data.map((row, rowIndex) => (
            <tr
              key={row._id || row.id || rowIndex}
              onClick={() => onRowClick && onRowClick(row)}
              style={{ cursor: onRowClick ? 'pointer' : 'default' }}
            >
              {columns.map((col, colIndex) => (
                <td key={col.key || colIndex} className={`py-3 ${col.cellClassName || ''}`}>
                  {col.render
                    ? col.render(row, rowIndex)
                    : col.key.split('.').reduce((obj, key) => (obj ? obj[key] : '-'), row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
