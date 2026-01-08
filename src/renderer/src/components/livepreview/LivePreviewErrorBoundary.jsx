import React from 'react'

class LivePreviewErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('LivePreview Error Boundary caught:', error, errorInfo)
    this.setState({ error, errorInfo })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          margin: '20px',
          border: '1px solid #ef4444',
          borderRadius: '8px',
          background: 'rgba(239, 68, 68, 0.05)',
          color: '#ef4444',
          fontFamily: 'monospace',
          fontSize: '12px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Preview Rendering Error</h3>
          <p style={{ margin: '0 0 10px 0' }}>
            The preview encountered an error and cannot be displayed. This is likely due to:
          </p>
          <ul style={{ margin: '0 0 10px 0', paddingLeft: '20px' }}>
            <li>Invalid Mermaid diagram syntax</li>
            <li>Malformed HTML in markdown</li>
            <li>Unsupported markdown features</li>
          </ul>
          <details style={{ marginTop: '10px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Error Details</summary>
            <pre style={{ 
              marginTop: '10px', 
              padding: '10px', 
              background: 'rgba(0,0,0,0.1)', 
              borderRadius: '4px',
              overflow: 'auto',
              maxHeight: '200px'
            }}>
              {this.state.error?.toString()}
              {'\n\n'}
              {this.state.errorInfo?.componentStack}
            </pre>
          </details>
          <button
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            style={{
              marginTop: '10px',
              padding: '6px 12px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default LivePreviewErrorBoundary
