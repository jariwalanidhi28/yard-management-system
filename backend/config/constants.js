const ROLES = {
  ADMIN: 'admin',
  STAFF: 'staff',
};

const VEHICLE_TYPES = [
  'Semi-Trailer',
  'Flatbed',
  'Container Truck',
  'Box Truck',
  'Tanker',
  'Van',
  'Other',
];

const VEHICLE_STATUS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  MAINTENANCE: 'Maintenance',
  ARCHIVED: 'Archived',
};

const CAPACITY_UNITS = ['Tons', 'Kg', 'Pallets', 'CBM'];

const DRIVER_STATUS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
};

const YARD_SLOT_TYPES = [
  'Standard',
  'Oversized',
  'Reefer',
  'Hazmat',
  'Staging',
];

const YARD_SLOT_STATUS = {
  AVAILABLE: 'Available',
  OCCUPIED: 'Occupied',
  BLOCKED: 'Blocked',
};

const GATE_VISIT_STATUS = {
  INSIDE_YARD: 'Inside Yard',
  EXITED: 'Exited',
  CANCELLED: 'Cancelled',
};

const GATE_VISIT_PURPOSES = [
  'Loading',
  'Unloading',
  'Parking',
  'Maintenance',
  'Inspection',
  'Other',
];

const DOCK_TYPES = ['Loading', 'Unloading', 'Dual'];

const DOCK_STATUS = {
  ACTIVE: 'Active',
  MAINTENANCE: 'Maintenance',
};

const DOCK_APPOINTMENT_STATUS = {
  SCHEDULED: 'Scheduled',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const DOCK_OPERATION_TYPES = ['Loading', 'Unloading'];

const SHIPMENT_STATUS = {
  CREATED: 'Created',
  ARRIVED: 'Arrived',
  LOADING: 'Loading',
  IN_TRANSIT: 'In Transit',
  UNLOADING: 'Unloading',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

const SHIPMENT_WEIGHT_UNITS = ['Kg', 'Tons', 'Lbs'];

const YARD_MOVEMENT_ACTIONS = {
  ALLOCATION: 'Allocation',
  REASSIGNMENT: 'Reassignment',
  RELEASE: 'Release',
};

module.exports = {
  ROLES,
  VEHICLE_TYPES,
  VEHICLE_STATUS,
  CAPACITY_UNITS,
  DRIVER_STATUS,
  YARD_SLOT_TYPES,
  YARD_SLOT_STATUS,
  GATE_VISIT_STATUS,
  GATE_VISIT_PURPOSES,
  DOCK_TYPES,
  DOCK_STATUS,
  DOCK_APPOINTMENT_STATUS,
  DOCK_OPERATION_TYPES,
  SHIPMENT_STATUS,
  SHIPMENT_WEIGHT_UNITS,
  YARD_MOVEMENT_ACTIONS,
};
