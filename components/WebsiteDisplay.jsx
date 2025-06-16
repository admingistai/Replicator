import { useState, useEffect, useRef } from 'react';

export default function WebsiteDisplay({ url, onBack }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const iframeRef = useRef(null);
  const [iframeHeight, setIframeHeight] = useState('100vh');

  // Encode the URL to pass it safely as a parameter
  const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;

  useEffect(() => {
    // Reset states when URL changes
    setLoading(true);
    setError(null);
  }, [url]);

  const handleIframeLoad = () => {
    setLoading(false);
    
    // Try to adjust iframe height based on content
    try {
      if (iframeRef.current) {
        // This might not work due to cross-origin restrictions,
        // but we try anyway for same-origin content
        const contentHeight = iframeRef.current.contentWindow.document.body.scrollHeight;
        if (contentHeight) {
          setIframeHeight(`${contentHeight}px`);
        }
      }
    } catch (e) {
      // Expected for cross-origin content
      console.log('Cross-origin content - using default height');
    }
  };

  const handleIframeError = () => {
    setLoading(false);
    setError('Failed to load the website. The site may be blocking embedded content.');
  };

  return (
    <div className="website-display">
      <div className="controls">
        <button onClick={onBack} className="back-button">
          ← Back to URL Input
        </button>
        <div className="url-info">
          <span className="label">Replicating:</span>
          <span className="url">{url}</span>
        </div>
        <button 
          onClick={() => window.open(proxyUrl, '_blank')} 
          className="new-tab-button"
          title="Open in new tab"
        >
          Open in New Tab ↗
        </button>
      </div>

      <div className="iframe-container">
        {loading && (
          <div className="loading-overlay">
            <div className="loading-content">
              <div className="spinner"></div>
              <p>Loading website...</p>
              <p className="loading-url">{url}</p>
            </div>
          </div>
        )}

        {error ? (
          <div className="error-container">
            <h2>Unable to Display Website</h2>
            <p>{error}</p>
            <p>Try opening the website in a new tab using the button above.</p>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            src={proxyUrl}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            title="Replicated Website"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals"
            allow="accelerometer; camera; encrypted-media; geolocation; gyroscope; microphone; payment"
            style={{ height: iframeHeight }}
          />
        )}
      </div>

      <style jsx>{`
        .website-display {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 200px);
          min-height: 600px;
        }

        .controls {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: #f8f9fa;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }

        .back-button {
          padding: 0.5rem 1rem;
          font-size: 0.9rem;
          font-weight: 500;
          color: #0070f3;
          background: white;
          border: 1px solid #0070f3;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .back-button:hover {
          background: #0070f3;
          color: white;
        }

        .url-info {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          overflow: hidden;
        }

        .url-info .label {
          font-weight: 600;
          color: #666;
          flex-shrink: 0;
        }

        .url-info .url {
          color: #333;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .new-tab-button {
          padding: 0.5rem 1rem;
          font-size: 0.9rem;
          font-weight: 500;
          color: #666;
          background: white;
          border: 1px solid #ddd;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .new-tab-button:hover {
          background: #f5f5f5;
          border-color: #999;
        }

        .iframe-container {
          flex: 1;
          position: relative;
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          overflow: hidden;
        }

        iframe {
          width: 100%;
          min-height: 100%;
          border: none;
          display: block;
        }

        .loading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.95);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }

        .loading-content {
          text-align: center;
        }

        .spinner {
          width: 40px;
          height: 40px;
          margin: 0 auto 1rem;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #0070f3;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .loading-content p {
          margin: 0.5rem 0;
          color: #666;
        }

        .loading-url {
          font-size: 0.9rem;
          color: #999;
          max-width: 400px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .error-container {
          padding: 2rem;
          text-align: center;
          color: #666;
        }

        .error-container h2 {
          color: #dc3545;
          margin-bottom: 1rem;
        }

        .error-container p {
          margin: 0.5rem 0;
        }

        @media (max-width: 640px) {
          .website-display {
            height: calc(100vh - 250px);
            min-height: 400px;
          }

          .controls {
            justify-content: center;
          }

          .url-info {
            order: 3;
            width: 100%;
            justify-content: center;
          }

          .new-tab-button {
            order: 2;
          }
        }
      `}</style>
    </div>
  );
}