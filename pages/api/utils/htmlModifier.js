import cheerio from 'cheerio';
import { URL } from 'url';

class HtmlModifier {
  /**
   * Modifies HTML to inject widget.js and fix relative URLs
   * @param {string} html - Original HTML content
   * @param {string} targetUrl - The URL being proxied
   * @returns {string} Modified HTML
   */
  modifyHtml(html, targetUrl) {
    try {
      // Load HTML with cheerio
      const $ = cheerio.load(html, {
        decodeEntities: false,
        scriptingEnabled: true
      });

      // Parse the target URL for base URL construction
      const parsedUrl = new URL(targetUrl);
      const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;

      // Inject widget.js before closing body tag
      this.injectWidget($);

      // Fix all relative URLs to absolute
      this.fixUrls($, baseUrl, parsedUrl);

      // Add base tag if not present
      this.addBaseTag($, targetUrl);

      // Modify forms to work through proxy
      this.modifyForms($, targetUrl);

      // Return modified HTML
      return $.html();
    } catch (error) {
      console.error('Error modifying HTML:', error);
      // Return original HTML if modification fails
      return html;
    }
  }

  /**
   * Inject widget.js script tag
   */
  injectWidget($) {
    const widgetScript = '<script src="/widget.js" data-injected="true"></script>';
    
    // Try to inject before closing body tag
    if ($('body').length > 0) {
      $('body').append(widgetScript);
    } else if ($('html').length > 0) {
      // If no body tag, append to html
      $('html').append(widgetScript);
    } else {
      // Last resort: append to end of document
      $.root().append(widgetScript);
    }

    // Also inject a script to handle navigation within the proxied site
    const navigationHandler = `
      <script data-proxy-navigation="true">
        (function() {
          // Override link clicks to stay within proxy
          document.addEventListener('click', function(e) {
            const link = e.target.closest('a');
            if (link && link.href && !link.href.startsWith('javascript:')) {
              e.preventDefault();
              const targetUrl = link.href;
              const proxyUrl = '/api/proxy?url=' + encodeURIComponent(targetUrl);
              window.location.href = proxyUrl;
            }
          });

          // Override form submissions
          document.addEventListener('submit', function(e) {
            const form = e.target;
            if (form && form.action) {
              e.preventDefault();
              console.warn('Form submission through proxy is limited');
            }
          });
        })();
      </script>
    `;
    
    $('body').append(navigationHandler);
  }

  /**
   * Convert relative URLs to absolute URLs
   */
  fixUrls($, baseUrl, parsedUrl) {
    // Attributes that contain URLs
    const urlAttributes = {
      'href': ['a', 'link', 'area', 'base'],
      'src': ['img', 'script', 'iframe', 'frame', 'embed', 'source', 'input', 'audio', 'video', 'track'],
      'action': ['form'],
      'data': ['object'],
      'srcset': ['img', 'source'],
      'poster': ['video']
    };

    // Process each attribute type
    Object.entries(urlAttributes).forEach(([attr, tags]) => {
      tags.forEach(tag => {
        $(`${tag}[${attr}]`).each((i, elem) => {
          const $elem = $(elem);
          let value = $elem.attr(attr);
          
          if (value && !this.isDataUri(value) && !this.isAbsoluteUrl(value)) {
            // Handle srcset specially (can contain multiple URLs)
            if (attr === 'srcset') {
              value = this.fixSrcset(value, baseUrl, parsedUrl);
            } else {
              value = this.resolveUrl(value, baseUrl, parsedUrl);
            }
            
            $elem.attr(attr, value);
          }
        });
      });
    });

    // Fix CSS url() references in style attributes
    $('[style]').each((i, elem) => {
      const $elem = $(elem);
      let style = $elem.attr('style');
      if (style) {
        style = this.fixCssUrls(style, baseUrl, parsedUrl);
        $elem.attr('style', style);
      }
    });

    // Fix inline styles
    $('style').each((i, elem) => {
      const $elem = $(elem);
      let css = $elem.html();
      if (css) {
        css = this.fixCssUrls(css, baseUrl, parsedUrl);
        $elem.html(css);
      }
    });
  }

  /**
   * Add base tag for proper URL resolution
   */
  addBaseTag($, targetUrl) {
    if ($('base').length === 0) {
      $('head').prepend(`<base href="${targetUrl}">`);
    }
  }

  /**
   * Modify forms to show warning about limited functionality
   */
  modifyForms($, targetUrl) {
    $('form').each((i, elem) => {
      const $form = $(elem);
      // Add a data attribute to identify proxied forms
      $form.attr('data-proxied', 'true');
      
      // If form has relative action, make it absolute
      const action = $form.attr('action');
      if (action && !this.isAbsoluteUrl(action)) {
        const parsedUrl = new URL(targetUrl);
        const absoluteAction = this.resolveUrl(action, `${parsedUrl.protocol}//${parsedUrl.host}`, parsedUrl);
        $form.attr('action', absoluteAction);
      }
    });
  }

  /**
   * Helper: Check if URL is absolute
   */
  isAbsoluteUrl(url) {
    return /^https?:\/\//.test(url) || /^\/\//.test(url);
  }

  /**
   * Helper: Check if URL is a data URI
   */
  isDataUri(url) {
    return /^data:/.test(url);
  }

  /**
   * Helper: Resolve relative URL to absolute
   */
  resolveUrl(relativeUrl, baseUrl, parsedUrl) {
    try {
      // Handle protocol-relative URLs
      if (relativeUrl.startsWith('//')) {
        return `${parsedUrl.protocol}${relativeUrl}`;
      }
      
      // Handle absolute paths
      if (relativeUrl.startsWith('/')) {
        return `${baseUrl}${relativeUrl}`;
      }
      
      // Handle relative paths
      const currentPath = parsedUrl.pathname.endsWith('/') 
        ? parsedUrl.pathname 
        : parsedUrl.pathname.substring(0, parsedUrl.pathname.lastIndexOf('/') + 1);
      
      return new URL(relativeUrl, `${baseUrl}${currentPath}`).href;
    } catch (e) {
      // If URL resolution fails, return original
      return relativeUrl;
    }
  }

  /**
   * Helper: Fix srcset attribute (contains multiple URLs)
   */
  fixSrcset(srcset, baseUrl, parsedUrl) {
    return srcset.split(',').map(src => {
      const parts = src.trim().split(/\s+/);
      if (parts.length > 0 && !this.isAbsoluteUrl(parts[0]) && !this.isDataUri(parts[0])) {
        parts[0] = this.resolveUrl(parts[0], baseUrl, parsedUrl);
      }
      return parts.join(' ');
    }).join(', ');
  }

  /**
   * Helper: Fix CSS url() references
   */
  fixCssUrls(css, baseUrl, parsedUrl) {
    return css.replace(/url\(['"]?([^'")]+)['"]?\)/g, (match, url) => {
      if (!this.isAbsoluteUrl(url) && !this.isDataUri(url)) {
        const absoluteUrl = this.resolveUrl(url, baseUrl, parsedUrl);
        return `url('${absoluteUrl}')`;
      }
      return match;
    });
  }
}

// Export singleton instance
export const htmlModifier = new HtmlModifier();