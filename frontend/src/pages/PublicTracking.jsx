import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { Truck, Search, MapPin, Clock, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

const PublicTracking = () => {
  const { trackingNumber: paramTracking } = useParams();
  const [query, setQuery] = useState(paramTracking || '');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (searchNum) => {
    const num = searchNum || query;
    if (!num) return;

    setLoading(true);
    setError('');
    setData(null);

    try {
      const res = await api.get(`/shipments/track/${num.trim()}`);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Shipment tracking number was not found.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (paramTracking) {
      handleTrack(paramTracking);
    }
  }, [paramTracking]);

  return (
    <div className="min-vh-100 bg-light py-5">
      <div className="container" style={{ maxWidth: '780px' }}>
        {/* Brand Banner */}
        <div className="text-center mb-5">
          <div className="bg-primary text-white p-3 rounded-circle d-inline-flex mb-3 shadow-sm">
            <Truck size={32} />
          </div>
          <h3 className="fw-bold text-dark">Yard Logistics Public Tracking</h3>
          <p className="text-muted small">
            Track real-time shipment status, facility milestones, and transit timeline.
          </p>
        </div>

        {/* Search Bar */}
        <div className="card shadow-sm border-0 p-4 mb-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleTrack();
            }}
          >
            <div className="input-group input-group-lg">
              <span className="input-group-text bg-light text-muted border-end-0">
                <Search size={20} />
              </span>
              <input
                type="text"
                className="form-control bg-light border-start-0"
                placeholder="Enter Tracking Number (e.g. TRK-20261019-0001)..."
                value={query}
                onChange={(e) => setQuery(e.target.value.toUpperCase())}
              />
              <button className="btn btn-primary px-4 fw-semibold" type="submit" disabled={loading}>
                {loading ? 'Searching...' : 'Track'}
              </button>
            </div>
          </form>

          {/* Quick link example */}
          <div className="mt-2 text-center text-muted small">
            <span>Sample tracking number: </span>
            <button
              className="btn btn-link btn-sm p-0 font-monospace text-decoration-none"
              onClick={() => {
                setQuery('TRK-20261019-0001');
                handleTrack('TRK-20261019-0001');
              }}
            >
              TRK-20261019-0001
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="alert alert-danger shadow-sm py-3 text-center mb-4" role="alert">
            {error}
          </div>
        )}

        {/* Tracking Details */}
        {data && (
          <div className="card shadow-sm border-0 p-4 p-md-5 mb-4">
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center pb-4 mb-4 border-bottom">
              <div>
                <span className="text-muted small text-uppercase fw-bold">Tracking Number</span>
                <h4 className="fw-bold font-monospace text-primary mb-1">{data.trackingNumber}</h4>
                <div className="small text-muted font-monospace">Order Reference: {data.orderNumber}</div>
              </div>
              <div className="mt-3 mt-sm-0 text-sm-end">
                <span className="text-muted small d-block mb-1">Status</span>
                <StatusBadge status={data.status} />
              </div>
            </div>

            {/* Route Summary */}
            <div className="row g-3 p-3 bg-light rounded-3 border mb-4 text-center">
              <div className="col-5">
                <span className="text-muted small">Origin</span>
                <div className="fw-bold text-dark">{data.origin}</div>
              </div>
              <div className="col-2 d-flex align-items-center justify-content-center text-primary">
                <ArrowRight size={24} />
              </div>
              <div className="col-5">
                <span className="text-muted small">Destination</span>
                <div className="fw-bold text-dark">{data.destination}</div>
              </div>
            </div>

            {/* Milestones */}
            <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
              <Clock size={18} />
              <span>Milestone Progress</span>
            </h6>

            <div className="tracking-timeline mt-4">
              {data.timeline?.map((evt, idx) => (
                <div key={idx} className="tracking-timeline-item">
                  <div className="tracking-timeline-point"></div>
                  <div className="d-flex justify-content-between align-items-baseline">
                    <span className="fw-bold text-dark fs-6">{evt.status}</span>
                    <small className="text-muted">{new Date(evt.timestamp).toLocaleString()}</small>
                  </div>
                  <div className="small text-secondary mt-1">
                    <MapPin size={12} className="inline me-1 text-muted" />
                    {evt.location}
                  </div>
                  {evt.notes && (
                    <div className="small text-muted mt-1 bg-white p-2 rounded border">
                      {evt.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center mt-4">
          <Link to="/login" className="small text-decoration-none text-muted">
            ← Staff and Operator Sign-in Portal
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PublicTracking;
