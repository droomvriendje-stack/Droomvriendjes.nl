import React from 'react';

/**
 * ErrorBoundary — catches React render errors and shows a friendly fallback
 * instead of a blank/black screen.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <SomeComponent />
 *   </ErrorBoundary>
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[ErrorBoundary] Caught a React error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const { fallback } = this.props;

      // Allow a custom fallback UI to be passed as a prop
      if (fallback) {
        return typeof fallback === 'function'
          ? fallback(this.state.error, this.state.errorInfo)
          : fallback;
      }

      // Default fallback — minimal, always renderable
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'sans-serif',
            background: '#fafafa',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🐻</div>
          <h1 style={{ color: '#8B7355', marginBottom: '0.5rem' }}>
            Er is iets misgegaan
          </h1>
          <p style={{ color: '#666', maxWidth: '480px', marginBottom: '1.5rem' }}>
            De pagina kon niet worden geladen. Probeer de pagina te vernieuwen.
            Als het probleem aanhoudt, neem dan contact met ons op.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#8B7355',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              cursor: 'pointer',
            }}
          >
            Pagina vernieuwen
          </button>
          {import.meta.env.DEV && this.state.error && (
            <details
              style={{
                marginTop: '2rem',
                textAlign: 'left',
                background: '#fff3f3',
                border: '1px solid #fcc',
                borderRadius: '8px',
                padding: '1rem',
                maxWidth: '700px',
                width: '100%',
              }}
            >
              <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#c00' }}>
                Foutdetails (alleen zichtbaar in development)
              </summary>
              <pre style={{ marginTop: '0.5rem', fontSize: '0.8rem', overflow: 'auto' }}>
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
