'use client'

type GlobalErrorProps = {
  error: Error & { digest?: string }
  retry: () => void
}

/**
 * Renders a minimal fallback UI when the root layout itself fails.
 *
 * This replaces the root layout, so it must define its own html/body and
 * cannot rely on global CSS or shared components. The token values are
 * repeated inline for that reason — keep them in step with `globals.css`.
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
          backgroundColor: '#141413',
          color: '#c3c2b7',
          fontFamily: 'Arial, Helvetica, sans-serif',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '480px', padding: '0 20px' }}>
          <h1 style={{ margin: '0 0 16px', color: '#f5f5f3', fontSize: '32px' }}>
            Something went wrong
          </h1>
          <p style={{ margin: '0 0 24px', fontSize: '16px', lineHeight: 1.6 }}>
            An unexpected error occurred. Please try again.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              backgroundColor: '#3987e5',
              color: '#1a1a19',
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
