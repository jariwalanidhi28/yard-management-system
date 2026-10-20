import React from 'react';

const StatusBadge = ({ status }) => {
  if (!status) return null;

  const normalized = String(status).toLowerCase().trim();

  let bgClass = 'bg-secondary';

  switch (normalized) {
    // Available / Active / Valid / Delivered / Completed
    case 'available':
    case 'active':
    case 'valid':
    case 'delivered':
    case 'completed':
      bgClass = 'bg-success';
      break;

    // Occupied / In Progress / Loading / Unloading / In Transit / Inside Yard / Expiring Soon
    case 'occupied':
    case 'inside yard':
    case 'in progress':
    case 'loading':
    case 'unloading':
    case 'in transit':
    case 'expiring soon':
      bgClass = 'bg-warning text-dark';
      break;

    // Scheduled / Created / Arrived / Standard
    case 'scheduled':
    case 'created':
    case 'arrived':
      bgClass = 'bg-primary';
      break;

    // Blocked / Cancelled / Inactive / Expired / Maintenance
    case 'blocked':
    case 'cancelled':
    case 'inactive':
    case 'expired':
    case 'maintenance':
    case 'archived':
      bgClass = 'bg-danger';
      break;

    // Exited
    case 'exited':
      bgClass = 'bg-info text-dark';
      break;

    default:
      bgClass = 'bg-secondary';
      break;
  }

  return (
    <span className={`badge ${bgClass} px-2 py-1 fs-7 fw-semibold`}>
      {status}
    </span>
  );
};

export default StatusBadge;
