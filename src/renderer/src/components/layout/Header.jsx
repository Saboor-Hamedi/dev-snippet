

const Header = () => {
    return (
      <header
        className=" bg-red-400 drag-header"
        style={{
          height: '36px',
          background: 'var(--header-bg)',
          WebkitAppRegion: 'drag',
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            aria-hidden
            style={{ width: 18, height: 18, background: 'var(--accent)', borderRadius: 4 }}
          />
          <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--header-fg)' }}>
            Quick Snippets
          </span>
        </div>

        <div
          className=""
          style={{
            marginLeft: 'auto',
            WebkitAppRegion: 'no-drag',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <button
            title="Settings"
            onClick={() => window.postMessage({ type: 'open-settings' }, '*')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--header-fg)',
              cursor: 'pointer',
              padding: '6px',
              fontSize: 12
            }}
          >
            ⚙️
          </button>
        </div>
      </header>
    )
}


export default Header