export default function ErrorDisplay({ error, onRetry }) {
  // Determine error type and provide appropriate guidance
  const getErrorInfo = () => {
    if (error.includes('timed out') || error.includes('timeout')) {
      return {
        type: 'timeout',
        icon: '⏱️',
        title: 'Request Timed Out',
        message: 'The website took too long to respond. This might be due to a slow connection or the website being temporarily unavailable.',
        suggestions: [
          'Check if the website is accessible in your browser',
          'Try again with a simpler page from the same domain',
          'Wait a moment and retry'
        ]
      };
    }

    if (error.includes('CORS') || error.includes('security')) {
      return {
        type: 'security',
        icon: '🔒',
        title: 'Security Restriction',
        message: 'The website has security policies that prevent it from being replicated.',
        suggestions: [
          'Try using the "Open in New Tab" option',
          'Some websites cannot be embedded due to X-Frame-Options or CSP headers',
          'Contact the website owner for API access if needed'
        ]
      };
    }

    if (error.includes('not found') || error.includes('404')) {
      return {
        type: 'not-found',
        icon: '🔍',
        title: 'Website Not Found',
        message: 'The URL you entered could not be found.',
        suggestions: [
          'Double-check the URL for typos',
          'Ensure the website is publicly accessible',
          'Try the base domain first (e.g., https://example.com)'
        ]
      };
    }

    if (error.includes('network') || error.includes('reach')) {
      return {
        type: 'network',
        icon: '🌐',
        title: 'Network Error',
        message: 'Unable to connect to the website.',
        suggestions: [
          'Check your internet connection',
          'Verify the URL is correct and includes http:// or https://',
          'The website might be down or blocking automated requests'
        ]
      };
    }

    // Default error
    return {
      type: 'generic',
      icon: '⚠️',
      title: 'Error Loading Website',
      message: error,
      suggestions: [
        'Verify the URL is correct',
        'Check if the website is accessible in your browser',
        'Try a different website'
      ]
    };
  };

  const errorInfo = getErrorInfo();

  return (
    <div className="error-display" role="alert" aria-live="assertive">
      <div className="error-content">
        <div className="error-icon">{errorInfo.icon}</div>
        <h2>{errorInfo.title}</h2>
        <p className="error-message">{errorInfo.message}</p>
        
        {errorInfo.suggestions.length > 0 && (
          <div className="suggestions">
            <h3>Suggestions:</h3>
            <ul>
              {errorInfo.suggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          </div>
        )}

        <button onClick={onRetry} className="retry-button">
          Try Another URL
        </button>
      </div>

      <style jsx>{`
        .error-display {
          max-width: 600px;
          margin: 2rem auto;
          padding: 2rem;
          background: #fff5f5;
          border: 1px solid #ffdddd;
          border-radius: 8px;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .error-content {
          text-align: center;
        }

        .error-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        h2 {
          color: #dc3545;
          margin: 0 0 1rem 0;
          font-size: 1.5rem;
        }

        .error-message {
          color: #666;
          margin: 0 0 1.5rem 0;
          line-height: 1.6;
        }

        .suggestions {
          background: white;
          border-radius: 6px;
          padding: 1.5rem;
          margin: 1.5rem 0;
          text-align: left;
        }

        .suggestions h3 {
          margin: 0 0 0.75rem 0;
          color: #333;
          font-size: 1.1rem;
        }

        .suggestions ul {
          margin: 0;
          padding-left: 1.5rem;
          color: #666;
        }

        .suggestions li {
          margin: 0.5rem 0;
          line-height: 1.5;
        }

        .retry-button {
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
          font-weight: 600;
          color: white;
          background: #0070f3;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .retry-button:hover {
          background: #0051cc;
          transform: translateY(-1px);
        }

        .retry-button:active {
          transform: translateY(0);
        }

        @media (max-width: 640px) {
          .error-display {
            margin: 1rem;
            padding: 1.5rem;
          }

          .error-icon {
            font-size: 2.5rem;
          }

          h2 {
            font-size: 1.25rem;
          }

          .suggestions {
            padding: 1rem;
          }

          .suggestions ul {
            padding-left: 1.25rem;
          }
        }
      `}</style>
    </div>
  );
}