import { useState } from 'react';
import URLInputForm from '../components/URLInputForm';
import WebsiteDisplay from '../components/WebsiteDisplay';
import ErrorDisplay from '../components/ErrorDisplay';

export default function Home() {
  const [targetUrl, setTargetUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showWebsite, setShowWebsite] = useState(false);

  const handleUrlSubmit = async (url) => {
    try {
      setLoading(true);
      setError(null);
      setShowWebsite(false);
      
      // Validate URL on client side first
      const urlPattern = /^https?:\/\/.+/;
      if (!urlPattern.test(url)) {
        throw new Error('Please enter a valid URL including http:// or https://');
      }

      // Test if the proxy endpoint can reach the URL
      const testResponse = await fetch(`/api/proxy?url=${encodeURIComponent(url)}&test=true`);
      const testResult = await testResponse.json();

      if (!testResponse.ok) {
        throw new Error(testResult.error || 'Unable to reach the specified website');
      }

      setTargetUrl(url);
      setShowWebsite(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setShowWebsite(false);
    setTargetUrl('');
  };

  return (
    <div className="container">
      <header>
        <h1>Website Replicator</h1>
        <p>Enter a URL to replicate any website with custom JavaScript injection</p>
      </header>

      <main>
        {!showWebsite && (
          <>
            <URLInputForm 
              onSubmit={handleUrlSubmit} 
              loading={loading}
              error={error}
            />
            {error && (
              <ErrorDisplay 
                error={error} 
                onRetry={handleRetry}
              />
            )}
          </>
        )}

        {showWebsite && (
          <WebsiteDisplay 
            url={targetUrl}
            onBack={handleRetry}
          />
        )}
      </main>

      <footer>
        <div className="disclaimer">
          <strong>Disclaimer:</strong> This tool is for educational and testing purposes only. 
          Please ensure you have permission to replicate websites and respect copyright laws 
          and terms of service.
        </div>
      </footer>

      <style jsx>{`
        .container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
        }

        header {
          background: #0070f3;
          color: white;
          padding: 2rem;
          text-align: center;
        }

        header h1 {
          margin: 0 0 0.5rem 0;
          font-size: 2.5rem;
        }

        header p {
          margin: 0;
          opacity: 0.9;
        }

        main {
          flex: 1;
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }

        footer {
          background: #f5f5f5;
          padding: 1rem 2rem;
          border-top: 1px solid #e0e0e0;
        }

        .disclaimer {
          max-width: 800px;
          margin: 0 auto;
          text-align: center;
          color: #666;
          font-size: 0.9rem;
        }

        @media (max-width: 640px) {
          header h1 {
            font-size: 1.75rem;
          }

          main {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
}