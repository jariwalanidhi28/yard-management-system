import React from 'react';

const PageHeader = ({ title, subtitle, actions }) => {
  return (
    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 pb-2 border-bottom">
      <div>
        <h2 className="fs-4 fw-bold text-dark mb-1">{title}</h2>
        {subtitle && <p className="text-muted small mb-0">{subtitle}</p>}
      </div>
      {actions && <div className="mt-3 mt-md-0 d-flex gap-2 align-items-center">{actions}</div>}
    </div>
  );
};

export default PageHeader;
