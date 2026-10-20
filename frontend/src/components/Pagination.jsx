import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ pagination, onPageChange }) => {
  if (!pagination || pagination.totalPages <= 1) return null;

  const { page, totalPages, total, limit } = pagination;

  const startRecord = (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, total);

  // Generate page numbers
  const pages = [];
  const maxButtons = 5;
  let startPage = Math.max(1, page - Math.floor(maxButtons / 2));
  let endPage = Math.min(totalPages, startPage + maxButtons - 1);

  if (endPage - startPage + 1 < maxButtons) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center mt-3 pt-3 border-top">
      <div className="text-muted small mb-2 mb-sm-0">
        Showing <span className="fw-semibold text-dark">{startRecord}</span> to{' '}
        <span className="fw-semibold text-dark">{endRecord}</span> of{' '}
        <span className="fw-semibold text-dark">{total}</span> records
      </div>
      <nav aria-label="Page navigation">
        <ul className="pagination pagination-sm mb-0">
          <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}>
            <button
              className="page-link d-flex align-items-center"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              aria-label="Previous"
            >
              <ChevronLeft size={14} />
            </button>
          </li>

          {pages.map((p) => (
            <li key={p} className={`page-item ${p === page ? 'active' : ''}`}>
              <button className="page-link" onClick={() => onPageChange(p)}>
                {p}
              </button>
            </li>
          ))}

          <li className={`page-item ${page >= totalPages ? 'disabled' : ''}`}>
            <button
              className="page-link d-flex align-items-center"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              aria-label="Next"
            >
              <ChevronRight size={14} />
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Pagination;
