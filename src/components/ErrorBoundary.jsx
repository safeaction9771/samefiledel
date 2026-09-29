import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '30px 20px',
          textAlign: 'center',
          background: 'rgba(15, 23, 42, 0.95)',
          borderRadius: 14,
          border: '1px solid rgba(239, 68, 68, 0.3)',
          margin: 16,
          color: '#f8fafc'
        }}>
          <AlertTriangle size={36} style={{ color: '#ef4444', marginBottom: 12 }} />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: 8 }}>
            화면을 불러오는 중 일시적인 오류가 발생했습니다.
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 16 }}>
            {this.state.error?.message || '잠시 후 다시 시도해 주세요.'}
          </p>
          <button
            onClick={this.handleReset}
            style={{
              background: '#10b981',
              color: '#0f172a',
              border: 'none',
              borderRadius: 8,
              padding: '8px 18px',
              fontSize: '0.82rem',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} />
            다시 시도
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
