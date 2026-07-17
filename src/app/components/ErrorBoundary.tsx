import { Component, type ErrorInfo, type ReactNode } from 'react';

// Root error boundary. Without one, ANY render-time throw unmounts the whole
// React tree and the app goes blank white (the class of crash that produced the
// Share/Sidebar white screens). This catches it, keeps the app alive, and shows
// a recoverable card with a reload button instead of a dead white page.
//
// Deliberately self-contained: no theme/language context, no app imports — the
// thing that threw might be exactly those, so the fallback must not depend on
// anything that could also be broken.
interface State { error: Error | null; }

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surfaces in the WebView console / logcat so a recurrence is diagnosable.
    console.error('[SaveBoard] Uncaught render error:', error, info.componentStack);
  }

  handleReload = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 16,
        padding: 24, textAlign: 'center', background: '#F7F7FB',
        fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1A1A2E',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16, display: 'flex',
          alignItems: 'center', justifyContent: 'center', fontSize: 28,
          background: 'linear-gradient(135deg,#7C3AED,#6366F1)',
        }}>⚠️</div>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Something went wrong</h1>
        <p style={{ fontSize: 14, color: '#6B7280', margin: 0, maxWidth: 320 }}>
          The app hit an unexpected error. Your saved links are safe — reloading usually fixes it.
        </p>
        <button onClick={this.handleReload} style={{
          marginTop: 8, padding: '12px 28px', borderRadius: 12, border: 'none',
          background: 'linear-gradient(135deg,#7C3AED,#6366F1)', color: '#fff',
          fontSize: 15, fontWeight: 600, cursor: 'pointer',
        }}>Reload</button>
        {error.message && (
          <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 12, maxWidth: 320, wordBreak: 'break-word' }}>
            {error.message}
          </p>
        )}
      </div>
    );
  }
}
