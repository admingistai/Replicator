/**
 * Widget.js - Custom JavaScript injected into replicated websites
 * This script is automatically injected into all proxied websites
 * You can customize this file to add any functionality you need
 */

(function() {
  'use strict';

  // Configuration
  const config = {
    widgetName: 'Website Replicator Widget',
    version: '1.0.0',
    debug: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  };

  // Widget initialization
  function initWidget() {
    try {
      if (config.debug) {
        console.log(`${config.widgetName} v${config.version} initialized`);
        console.log('Current URL:', window.location.href);
        console.log('Origin:', window.location.origin);
      }

      // Add custom styles
      addCustomStyles();

      // Add widget banner
      addWidgetBanner();

      // Setup event listeners
      setupEventListeners();

      // Monitor page changes (for SPAs)
      observePageChanges();

      // Force banner visibility check
      setTimeout(() => {
        const banner = document.querySelector('.replicator-widget-banner');
        if (config.debug) {
          console.log('Banner element found:', !!banner);
          if (banner) {
            console.log('Banner visibility:', banner.style.display !== 'none');
          }
        }
      }, 1000);

    } catch (error) {
      console.error('Widget initialization failed:', error);
    }
  }

  // Add custom styles for the widget
  function addCustomStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .replicator-widget-banner {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        background: linear-gradient(90deg, #0070f3 0%, #0051cc 100%) !important;
        color: white !important;
        padding: 10px 20px !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        font-size: 14px !important;
        z-index: 999999 !important;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        animation: slideDown 0.3s ease-out !important;
        width: 100% !important;
        height: auto !important;
        min-height: 50px !important;
        opacity: 1 !important;
        visibility: visible !important;
      }

      @keyframes slideDown {
        from {
          transform: translateY(-100%);
        }
        to {
          transform: translateY(0);
        }
      }

      .replicator-widget-banner-content {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .replicator-widget-banner-icon {
        width: 20px;
        height: 20px;
        background: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: #0070f3;
      }

      .replicator-widget-banner-text {
        display: flex;
        align-items: center;
        gap: 5px;
      }

      .replicator-widget-banner-url {
        opacity: 0.9;
        font-size: 12px;
      }

      .replicator-widget-banner-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        font-size: 20px;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: background 0.2s;
      }

      .replicator-widget-banner-close:hover {
        background: rgba(255, 255, 255, 0.2);
      }

      body.replicator-widget-active {
        padding-top: 50px !important;
      }

      .replicator-widget-tooltip {
        position: fixed;
        background: #333;
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 1000000;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s;
      }

      .replicator-widget-tooltip.visible {
        opacity: 1;
      }
    `;
    document.head.appendChild(style);
  }

  // Add widget banner to show this is a replicated site
  function addWidgetBanner() {
    // Don't add banner if it already exists
    if (document.querySelector('.replicator-widget-banner')) {
      return;
    }

    const banner = document.createElement('div');
    banner.className = 'replicator-widget-banner';
    banner.innerHTML = `
      <div class="replicator-widget-banner-content">
        <div class="replicator-widget-banner-icon">R</div>
        <div class="replicator-widget-banner-text">
          <span>This is a replicated website</span>
          <span class="replicator-widget-banner-url">• ${window.location.hostname}</span>
        </div>
      </div>
      <button class="replicator-widget-banner-close" aria-label="Close banner">&times;</button>
    `;

    document.body.appendChild(banner);
    document.body.classList.add('replicator-widget-active');

    // Handle close button
    const closeBtn = banner.querySelector('.replicator-widget-banner-close');
    closeBtn.addEventListener('click', () => {
      banner.remove();
      document.body.classList.remove('replicator-widget-active');
    });
  }

  // Setup event listeners for enhanced functionality
  function setupEventListeners() {
    // Log navigation attempts
    document.addEventListener('click', function(e) {
      const link = e.target.closest('a');
      if (link && link.href) {
        if (config.debug) {
          console.log('Navigation intercepted:', link.href);
        }
      }
    });

    // Add tooltips to forms warning about limited functionality
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      form.addEventListener('mouseenter', showFormTooltip);
      form.addEventListener('mouseleave', hideTooltip);
    });

    // Monitor for new forms added dynamically
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1 && node.tagName === 'FORM') {
            node.addEventListener('mouseenter', showFormTooltip);
            node.addEventListener('mouseleave', hideTooltip);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Show tooltip for forms
  function showFormTooltip(e) {
    const tooltip = getOrCreateTooltip();
    tooltip.textContent = 'Form submissions may have limited functionality in replicated mode';
    
    const rect = e.target.getBoundingClientRect();
    tooltip.style.left = rect.left + 'px';
    tooltip.style.top = (rect.top - 35) + 'px';
    tooltip.classList.add('visible');
  }

  // Hide tooltip
  function hideTooltip() {
    const tooltip = document.querySelector('.replicator-widget-tooltip');
    if (tooltip) {
      tooltip.classList.remove('visible');
    }
  }

  // Get or create tooltip element
  function getOrCreateTooltip() {
    let tooltip = document.querySelector('.replicator-widget-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.className = 'replicator-widget-tooltip';
      document.body.appendChild(tooltip);
    }
    return tooltip;
  }

  // Observe page changes for SPAs
  function observePageChanges() {
    // Override pushState and replaceState
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function() {
      originalPushState.apply(history, arguments);
      handlePageChange();
    };

    history.replaceState = function() {
      originalReplaceState.apply(history, arguments);
      handlePageChange();
    };

    // Listen for popstate events
    window.addEventListener('popstate', handlePageChange);
  }

  // Handle page changes
  function handlePageChange() {
    if (config.debug) {
      console.log('Page changed:', window.location.href);
    }

    // Re-add banner if it was removed
    setTimeout(() => {
      addWidgetBanner();
    }, 100);
  }

  // Custom functionality examples (you can extend these)
  
  // Example 1: Track page views
  function trackPageView() {
    if (config.debug) {
      console.log('Page view tracked:', {
        url: window.location.href,
        title: document.title,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Example 2: Add custom analytics
  function addAnalytics() {
    // Add your custom analytics code here
    // This is just a placeholder example
    window.replicatorAnalytics = {
      track: function(event, properties) {
        if (config.debug) {
          console.log('Analytics event:', event, properties);
        }
      }
    };
  }

  // Example 3: Modify page content
  function modifyContent() {
    // Example: Add watermark to images
    // const images = document.querySelectorAll('img');
    // images.forEach(img => {
    //   img.style.opacity = '0.9';
    // });
  }

  // Initialize the widget when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }

  // Expose widget API for external use
  window.ReplicatorWidget = {
    version: config.version,
    init: initWidget,
    trackPageView: trackPageView,
    config: config
  };

})();