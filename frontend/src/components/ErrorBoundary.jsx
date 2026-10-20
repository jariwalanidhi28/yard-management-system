import React, { Component } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="container py-5 text-center">
          <div className="card shadow-sm border-0 p-5 mx-auto" style={{ maxWidth: '550px' }}>
            <div className="text-danger mb-3">
              <AlertTriangle size={56} />
            </div>
            <h4 className="fw-bold text-dark mb-2">Something Went Wrong</h4>
            <p className="text-muted mb-4">
              An unexpected application error occurred. We apologize for the inconvenience.
            </p>
            {this.state.error && (
              <div className="alert alert-light border small text-start mb-4 overflow-auto" style={{ maxHeight: '150px' }}>
                <code>{this.state.error.toString()}</code>
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="btn btn-primary d-inline-flex align-items-center justify-content-center gap-2 px-4 py-2"
            >
              <RotateCcw size={16} />
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
