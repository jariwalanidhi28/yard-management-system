import React from 'react';

const LoadingSpinner = ({ message = 'Loading details...', fullPage = false }) => {
  const content = (
    <div className="d-flex flex-column align-items-center justify-content-center p-5">
      <div className="spinner-border text-primary" role="status" style={{ width: '2.5rem', height: '2.5rem' }}>
        <span className="visually-hidden">Loading...</span>
      </div>
      {message && <p className="mt-3 text-muted fw-medium fs-6">{message}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;
