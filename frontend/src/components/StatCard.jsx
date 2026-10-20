import React from 'react';

const StatCard = ({ title, value, icon: Icon, color = 'primary', subtext }) => {
  return (
    <div className="stat-card h-100">
      <div className="d-flex align-items-center justify-content-between mb-2">
        <span className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>
          {title}
        </span>
        {Icon && (
          <div
            className={`p-2 rounded-3 bg-${color}-subtle text-${color} d-flex align-items-center justify-content-center`}
            style={{ width: '38px', height: '38px' }}
          >
            <Icon size={20} />
          </div>
        )}
      </div>
      <div className="fs-3 fw-bold text-dark">{value !== undefined && value !== null ? value : '-'}</div>
      {subtext && <div className="text-muted small mt-1">{subtext}</div>}
    </div>
  );
};

export default StatCard;
