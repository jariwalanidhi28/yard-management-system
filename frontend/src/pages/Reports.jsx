import React, { useState, useEffect } from 'react';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Filter,
  Clock,
  DoorOpen,
  MapPin,
  Anchor,
  Package,
  Users,
} from 'lucide-react';

const Reports = () => {
  const [activeReport, setActiveReport] = useState('gate-visits');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      switch (activeReport) {
        case 'gate-visits':
          endpoint = '/reports/gate-visits';
          break;
        case 'yard-utilization':
          endpoint = '/reports/yard-utilization';
          break;
        case 'dock-utilization':
          endpoint = '/reports/dock-utilization';
          break;
        case 'shipments':
          endpoint = '/reports/shipments';
          break;
        case 'driver-activity':
          endpoint = '/reports/driver-activity';
          break;
        default:
          endpoint = '/reports/gate-visits';
      }

      const res = await api.get(endpoint, { params });
      setReportData(res.data.data);
    } catch (err) {
      toast.error('Failed to load analytical report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeReport, startDate, endDate]);

  const handleExportCsv = async () => {
    try {
      const params = new URLSearchParams({ type: activeReport });
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await api.get(`/reports/export?${params.toString()}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `yms_${activeReport}_report_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('CSV Report exported safely.');
    } catch (err) {
      toast.error('Failed to export CSV report.');
    }
  };

  return (
    <div className="container-fluid p-0">
      <PageHeader
        title="Reports & Logistics Analytics"
        subtitle="Turnaround durations, yard slot occupancy, dock utilization ratios, and driver compliance."
        actions={
          <div className="d-flex gap-2 no-print">
            <button
              className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 shadow-sm"
              onClick={() => window.print()}
            >
              <Printer size={15} />
              <span>Print Report</span>
            </button>
            <button
              className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm"
              onClick={handleExportCsv}
            >
              <Download size={15} />
              <span>Export CSV</span>
            </button>
          </div>
        }
      />

      {/* Report Categories Pills */}
      <ul className="nav nav-pills mb-4 bg-white p-2 rounded-3 shadow-sm border no-print">
        <li className="nav-item">
          <button
            className={`nav-link py-2 px-3 d-flex align-items-center gap-1 ${activeReport === 'gate-visits' ? 'active' : ''}`}
            onClick={() => setActiveReport('gate-visits')}
          >
            <DoorOpen size={16} />
            <span>Turnaround & Gate Visits</span>
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link py-2 px-3 d-flex align-items-center gap-1 ${activeReport === 'yard-utilization' ? 'active' : ''}`}
            onClick={() => setActiveReport('yard-utilization')}
          >
            <MapPin size={16} />
            <span>Yard Slot Utilization</span>
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link py-2 px-3 d-flex align-items-center gap-1 ${activeReport === 'dock-utilization' ? 'active' : ''}`}
            onClick={() => setActiveReport('dock-utilization')}
          >
            <Anchor size={16} />
            <span>Dock Utilization</span>
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link py-2 px-3 d-flex align-items-center gap-1 ${activeReport === 'shipments' ? 'active' : ''}`}
            onClick={() => setActiveReport('shipments')}
          >
            <Package size={16} />
            <span>Shipments Summary</span>
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link py-2 px-3 d-flex align-items-center gap-1 ${activeReport === 'driver-activity' ? 'active' : ''}`}
            onClick={() => setActiveReport('driver-activity')}
          >
            <Users size={16} />
            <span>Driver Compliance & Visits</span>
          </button>
        </li>
      </ul>

      {/* Date Range Toolbar */}
      <div className="card border-0 shadow-sm p-3 mb-4 bg-white no-print">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-auto d-flex align-items-center gap-2">
            <span className="small text-secondary fw-semibold">Filter Date Range:</span>
          </div>
          <div className="col-6 col-md-3">
            <input
              type="date"
              className="form-control form-control-sm"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Start Date"
            />
          </div>
          <div className="col-6 col-md-3">
            <input
              type="date"
              className="form-control form-control-sm"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="End Date"
            />
          </div>
          <div className="col-auto">
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Generating report computations..." />
      ) : (
        <div>
          {/* Gate Visits & Turnaround Report */}
          {activeReport === 'gate-visits' && reportData && (
            <div>
              <div className="row g-3 mb-4">
                <div className="col-6 col-md-3">
                  <div className="card p-3 border-0 shadow-sm text-center">
                    <div className="text-muted small">Total Visits</div>
                    <div className="fs-3 fw-bold text-dark">{reportData.summary?.totalVisits || 0}</div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="card p-3 border-0 shadow-sm text-center">
                    <div className="text-muted small">Completed Visits</div>
                    <div className="fs-3 fw-bold text-success">{reportData.summary?.completedVisits || 0}</div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="card p-3 border-0 shadow-sm text-center">
                    <div className="text-muted small">Ongoing Yard Stays</div>
                    <div className="fs-3 fw-bold text-warning">{reportData.summary?.ongoingVisits || 0}</div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="card p-3 border-0 shadow-sm text-center">
                    <div className="text-muted small">Average Turnaround Time</div>
                    <div className="fs-3 fw-bold text-primary">{reportData.summary?.averageTurnaroundMinutes || 0} mins</div>
                  </div>
                </div>
              </div>

              <div className="card border-0 shadow-sm">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light fs-7 text-uppercase">
                      <tr>
                        <th>Pass #</th>
                        <th>Vehicle</th>
                        <th>Driver</th>
                        <th>Purpose</th>
                        <th>Entry Time</th>
                        <th>Exit Time</th>
                        <th>Turnaround Duration</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody className="fs-7">
                      {reportData.visits?.map((v) => (
                        <tr key={v._id}>
                          <td className="fw-semibold font-monospace text-primary">{v.gatePassNumber}</td>
                          <td>{v.vehicle?.registrationNumber || 'N/A'}</td>
                          <td>{v.driver?.fullName || 'N/A'}</td>
                          <td>{v.purpose}</td>
                          <td>{new Date(v.entryTime).toLocaleString()}</td>
                          <td>{v.exitTime ? new Date(v.exitTime).toLocaleString() : 'Ongoing Inside Yard'}</td>
                          <td className="fw-semibold">
                            {v.turnaroundMinutes} mins {v.isOngoing && '(Ongoing)'}
                          </td>
                          <td><StatusBadge status={v.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Yard Utilization Report */}
          {activeReport === 'yard-utilization' && reportData && (
            <div>
              <div className="row g-3 mb-4">
                <div className="col-6 col-md-3">
                  <div className="card p-3 border-0 shadow-sm text-center">
                    <div className="text-muted small">Usable Slots (Excl Blocked)</div>
                    <div className="fs-3 fw-bold text-dark">{reportData.summary?.usableSlots || 0}</div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="card p-3 border-0 shadow-sm text-center">
                    <div className="text-muted small">Occupied Slots</div>
                    <div className="fs-3 fw-bold text-warning">{reportData.summary?.occupiedSlots || 0}</div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="card p-3 border-0 shadow-sm text-center">
                    <div className="text-muted small">Blocked Slots</div>
                    <div className="fs-3 fw-bold text-danger">{reportData.summary?.blockedSlots || 0}</div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="card p-3 border-0 shadow-sm text-center">
                    <div className="text-muted small">Effective Utilization</div>
                    <div className="fs-3 fw-bold text-primary">{reportData.summary?.utilizationPercentage || 0}%</div>
                  </div>
                </div>
              </div>

              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white py-3 fw-bold">Zone-by-Zone Utilization Breakdown</div>
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light fs-7 text-uppercase">
                      <tr>
                        <th>Zone Name</th>
                        <th>Zone Code</th>
                        <th>Total Slots</th>
                        <th>Available</th>
                        <th>Occupied</th>
                        <th>Blocked</th>
                        <th>Usable Denominator</th>
                        <th>Utilization %</th>
                      </tr>
                    </thead>
                    <tbody className="fs-7">
                      {reportData.zoneBreakdown?.map((z) => (
                        <tr key={z.zoneId}>
                          <td className="fw-bold">{z.name}</td>
                          <td className="font-monospace text-primary">{z.code}</td>
                          <td>{z.totalSlots}</td>
                          <td className="text-success fw-semibold">{z.availableSlots}</td>
                          <td className="text-warning fw-semibold">{z.occupiedSlots}</td>
                          <td className="text-danger">{z.blockedSlots}</td>
                          <td>{z.usableSlots}</td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div className="progress flex-grow-1" style={{ height: '6px' }}>
                                <div
                                  className="progress-bar bg-primary"
                                  style={{ width: `${z.utilizationPercentage}%` }}
                                ></div>
                              </div>
                              <span className="fw-bold">{z.utilizationPercentage}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Dock Utilization Report */}
          {activeReport === 'dock-utilization' && reportData && (
            <div>
              <div className="row g-3 mb-4">
                <div className="col-6 col-md-3">
                  <div className="card p-3 border-0 shadow-sm text-center">
                    <div className="text-muted small">Total Appointments</div>
                    <div className="fs-3 fw-bold text-dark">{reportData.summary?.totalAppointments || 0}</div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="card p-3 border-0 shadow-sm text-center">
                    <div className="text-muted small">Completed Ops</div>
                    <div className="fs-3 fw-bold text-success">{reportData.summary?.totalCompleted || 0}</div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="card p-3 border-0 shadow-sm text-center">
                    <div className="text-muted small">In Progress</div>
                    <div className="fs-3 fw-bold text-warning">{reportData.summary?.totalInProgress || 0}</div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="card p-3 border-0 shadow-sm text-center">
                    <div className="text-muted small">Overdue Appointments</div>
                    <div className="fs-3 fw-bold text-danger">{reportData.summary?.overdueCount || 0}</div>
                  </div>
                </div>
              </div>

              <div className="card border-0 shadow-sm">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light fs-7 text-uppercase">
                      <tr>
                        <th>Dock Code</th>
                        <th>Dock Name</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Total Appts</th>
                        <th>Completed</th>
                        <th>In Progress</th>
                        <th>Scheduled</th>
                        <th>Cancelled</th>
                      </tr>
                    </thead>
                    <tbody className="fs-7">
                      {reportData.dockBreakdown?.map((d) => (
                        <tr key={d.dockId}>
                          <td className="fw-bold font-monospace text-primary">{d.code}</td>
                          <td>{d.name}</td>
                          <td>{d.dockType}</td>
                          <td><StatusBadge status={d.status} /></td>
                          <td className="fw-bold">{d.totalAppointments}</td>
                          <td className="text-success">{d.completed}</td>
                          <td className="text-warning">{d.inProgress}</td>
                          <td className="text-primary">{d.scheduled}</td>
                          <td className="text-muted">{d.cancelled}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Shipments Summary Report */}
          {activeReport === 'shipments' && reportData && (
            <div>
              <div className="row g-3 mb-4">
                <div className="col-12 col-md-4">
                  <div className="card p-3 border-0 shadow-sm text-center">
                    <div className="text-muted small">Total Orders Logged</div>
                    <div className="fs-3 fw-bold text-dark">{reportData.summary?.totalShipments || 0}</div>
                  </div>
                </div>
                <div className="col-12 col-md-8">
                  <div className="card p-3 border-0 shadow-sm">
                    <div className="text-muted small mb-2">Shipment Distribution</div>
                    <div className="d-flex flex-wrap gap-2">
                      {Object.entries(reportData.summary?.statusCounts || {}).map(([st, cnt]) => (
                        <div key={st} className="badge bg-light text-dark border p-2">
                          <span>{st}: </span>
                          <strong className="text-primary">{cnt}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="card border-0 shadow-sm">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light fs-7 text-uppercase">
                      <tr>
                        <th>Tracking #</th>
                        <th>Order #</th>
                        <th>Consignee</th>
                        <th>Route</th>
                        <th>Weight & Qty</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody className="fs-7">
                      {reportData.shipments?.map((s) => (
                        <tr key={s._id}>
                          <td className="fw-bold font-monospace text-primary">{s.trackingNumber}</td>
                          <td className="font-monospace">{s.orderNumber}</td>
                          <td>{s.consignee}</td>
                          <td>{s.origin} → {s.destination}</td>
                          <td>{s.weight} {s.weightUnit} ({s.quantity} units)</td>
                          <td><StatusBadge status={s.currentStatus} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Driver Activity Report */}
          {activeReport === 'driver-activity' && Array.isArray(reportData) && (
            <div className="card border-0 shadow-sm">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light fs-7 text-uppercase">
                    <tr>
                      <th>Driver Name</th>
                      <th>Phone</th>
                      <th>License #</th>
                      <th>License Expiry</th>
                      <th>Compliance</th>
                      <th>Total Visits</th>
                      <th>Active Visits</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody className="fs-7">
                    {reportData.map((d) => (
                      <tr key={d.id}>
                        <td className="fw-bold text-dark">{d.fullName}</td>
                        <td className="small text-muted">{d.phoneNumber}</td>
                        <td className="font-monospace">{d.licenseNumber}</td>
                        <td>{new Date(d.licenseExpiryDate).toLocaleDateString()}</td>
                        <td><StatusBadge status={d.licenseStatus} /></td>
                        <td className="fw-bold">{d.totalVisits}</td>
                        <td className="text-warning fw-bold">{d.activeVisits}</td>
                        <td><StatusBadge status={d.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
