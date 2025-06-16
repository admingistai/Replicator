import { useState } from 'react';
import { validateUrl } from '../utils/urlValidator';

export default function URLInputForm({ onSubmit, loading, error }) {
  const [url, setUrl] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous validation error
    setValidationError('');

    // Validate URL
    const validation = validateUrl(url);
    if (!validation.isValid) {
      setValidationError(validation.error);
      return;
    }

    // Submit valid URL
    await onSubmit(url);
  };

  const handleInputChange = (e) => {
    setUrl(e.target.value);
    // Clear validation error when user types
    if (validationError) {
      setValidationError('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="url-form">
      <div className="form-group">
        <label htmlFor="urlInput">Enter Website URL:</label>
        <div className="input-wrapper">
          <input
            type="url"
            id="urlInput"
            value={url}
            onChange={handleInputChange}
            placeholder="https://example.com"
            required
            pattern="https?://.+"
            maxLength={2048}
            aria-describedby="urlError"
            aria-invalid={!!validationError || !!error}
            disabled={loading}
            autoFocus
          />
          <button 
            type="submit" 
            disabled={loading || !url.trim()}
            aria-busy={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Loading...
              </>
            ) : (
              'Replicate Website'
            )}
          </button>
        </div>
        {validationError && (
          <div id="urlError" role="alert" className="error-message">
            {validationError}
          </div>
        )}
      </div>

      <div className="help-text">
        <p>Enter the complete URL including http:// or https://</p>
        <p>Examples: https://example.com, https://blog.example.com/page</p>
      </div>

      <style jsx>{`
        .url-form {
          max-width: 600px;
          margin: 2rem auto;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #333;
          font-size: 1.1rem;
        }

        .input-wrapper {
          display: flex;
          gap: 0.5rem;
          align-items: stretch;
        }

        input {
          flex: 1;
          padding: 0.75rem 1rem;
          font-size: 1rem;
          border: 2px solid #e0e0e0;
          border-radius: 6px;
          transition: border-color 0.2s, box-shadow 0.2s;
          font-family: inherit;
        }

        input:focus {
          outline: none;
          border-color: #0070f3;
          box-shadow: 0 0 0 3px rgba(0, 112, 243, 0.1);
        }

        input:disabled {
          background: #f5f5f5;
          cursor: not-allowed;
        }

        input[aria-invalid="true"] {
          border-color: #dc3545;
        }

        button {
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
          font-weight: 600;
          color: white;
          background: #0070f3;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          white-space: nowrap;
        }

        button:hover:not(:disabled) {
          background: #0051cc;
          transform: translateY(-1px);
        }

        button:active:not(:disabled) {
          transform: translateY(0);
        }

        button:disabled {
          background: #ccc;
          cursor: not-allowed;
          transform: none;
        }

        .spinner {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .error-message {
          margin-top: 0.5rem;
          color: #dc3545;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .error-message::before {
          content: "⚠️";
        }

        .help-text {
          text-align: center;
          color: #666;
          font-size: 0.9rem;
        }

        .help-text p {
          margin: 0.25rem 0;
        }

        @media (max-width: 640px) {
          .input-wrapper {
            flex-direction: column;
          }

          button {
            width: 100%;
            justify-content: center;
          }

          .help-text {
            text-align: left;
          }
        }
      `}</style>
    </form>
  );
}