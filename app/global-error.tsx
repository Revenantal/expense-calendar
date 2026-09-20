'use client'

type GlobalErrorProps = {
  error: Error & { digest?: string }
  retry: () => void
}

/**
 * Renders a minimal fallback UI when the root layout itself fails.
 *
 * This replaces the root layout, so it must define its own html/body and
 * cannot rely on global CSS or shared components.
 */
export default function GlobalError({ retry }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          display: 'flex',
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ffffff',
          color: '#374151',
          fontFamily: 'Arial, Helvetica, sans-serif',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '480px', padding: '0 20px' }}>
          <h1 style={{ margin: '0 0 16px', color: '#111827', fontSize: '32px' }}>
            Something went wrong
          </h1>
          <p style={{ margin: '0 0 24px', fontSize: '16px', lineHeight: 1.6 }}>
            An unexpected error occurred. Please try again.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              backgroundColor: '#1a56db',
              color: '#ffffff',
              border: 'none',
              padding: '14px 28px',
              fontSize: '15px',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
