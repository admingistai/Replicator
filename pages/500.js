import Link from 'next/link';

export default function Custom500() {
  return (
    <div className="error-page">
      <div className="error-content">
        <div className="error-icon">⚠️</div>
        <h1>500 - Server Error</h1>
        <p>Something went wrong on our end. Please try again later.</p>
        <Link href="/" className="home-button">
          Go back home
        </Link>
      </div>

      <style jsx>{`
        .error-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fafafa;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .error-content {
          text-align: center;
          padding: 2rem;
        }

        .error-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        h1 {
          font-size: 2rem;
          margin: 0 0 1rem 0;
          color: #dc3545;
        }

        p {
          color: #666;
          margin: 0 0 2rem 0;
          font-size: 1.1rem;
        }

        .home-button {
          display: inline-block;
          padding: 0.75rem 1.5rem;
          background: #0070f3;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          transition: background 0.2s;
        }

        .home-button:hover {
          background: #0051cc;
        }
      `}</style>
    </div>
  );
}