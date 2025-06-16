(function() {
    'use strict';
    
    // ================================
    // CONFIGURATION - Add your API key here
    // ================================
    // 
    // 🚨 TO FIX THE API KEY ERROR:
    // 1. Go to https://platform.openai.com/account/api-keys
    // 2. Create a new API key
    // 3. Replace 'YOUR_OPENAI_API_KEY_HERE' below with your actual API key
    // 4. Make sure your OpenAI account has billing set up
          // ================================
      const WIDGET_CONFIG = {
          // API endpoints - these will call your secure serverless functions
          CHAT_API_URL: '/api/chat',
          IMAGE_API_URL: '/api/image',
          MODEL: 'gpt-3.5-turbo', // You can change this to gpt-4, gpt-4-turbo, etc.
        TIMEOUT_MS: 20000, // 20 second timeout as per PRD
        DEBOUNCE_MS: 300   // 300ms debounce as per PRD
    };
    
    // ================================
    // TOOLS CONFIGURATION
    // ================================
    // Configure which tools are enabled/disabled
    // Can be modified via console: TOOLS_CONFIG.remix = false
    const TOOLS_CONFIG = {
        ask: true,      // Always enabled - core functionality
        gist: true,     // Summary tool
        remix: true,    // Content remix tool  
        share: true     // Share functionality
    };
    
    // Expose TOOLS_CONFIG globally for console access
    window.TOOLS_CONFIG = TOOLS_CONFIG;
    
    // ================================
    // WEBSITE STYLING SCRAPER SYSTEM
    // ================================
    
    // Store extracted styling information
    let websiteStyling = {
        primaryColor: '#6366f1',
        secondaryColor: '#8b5cf6',
        backgroundColor: '#ffffff',
        textColor: '#374151',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        borderRadius: '16px',
        logoUrl: null,
        faviconUrl: null,
        brandColors: [],
        shadows: 'drop-shadow(0 8px 25px rgba(0, 0, 0, 0.15))',
        accentColor: '#ec4899'
    };
    
    // Extract website favicon and logo
    function extractLogosAndIcons() {
        const results = {
            favicon: null,
            logo: null,
            icons: []
        };
        
        // Extract favicon
        const faviconSelectors = [
            'link[rel="icon"]',
            'link[rel="shortcut icon"]',
            'link[rel="apple-touch-icon"]',
            'link[rel="apple-touch-icon-precomposed"]'
        ];
        
        for (const selector of faviconSelectors) {
            const element = document.querySelector(selector);
            if (element && element.href) {
                results.favicon = element.href;
                break;
            }
        }
        
        // Extract logo from common locations
        const logoSelectors = [
            'img[alt*="logo" i]',
            'img[class*="logo" i]',
            'img[id*="logo" i]',
            '.logo img',
            '.brand img',
            '.header img',
            'nav img',
            '.navbar img',
            '.navbar-brand img'
        ];
        
        for (const selector of logoSelectors) {
            const element = document.querySelector(selector);
            if (element && element.src) {
                results.logo = element.src;
                break;
            }
        }
        
        // Collect all notable images that might be logos
        const allImages = document.querySelectorAll('img');
        allImages.forEach(img => {
            if (img.src && (
                img.alt?.toLowerCase().includes('logo') ||
                img.className?.toLowerCase().includes('logo') ||
                img.id?.toLowerCase().includes('logo') ||
                img.width <= 200 && img.height <= 100
            )) {
                results.icons.push({
                    src: img.src,
                    alt: img.alt,
                    width: img.width,
                    height: img.height
                });
            }
        });
        
        return results;
    }
    
    // Extract font families from the website
    function extractFontFamilies() {
        const fonts = new Set();
        
        // Check body font specifically first
        const bodyFont = window.getComputedStyle(document.body).fontFamily;
        if (bodyFont && bodyFont !== 'inherit') {
            fonts.add(bodyFont);
            console.log('[GistWidget] Body font detected:', bodyFont);
        }
        
        // Check other key elements
        const keyElements = document.querySelectorAll('body, h1, h2, h3, p, div');
        keyElements.forEach(element => {
            const computedStyle = window.getComputedStyle(element);
            const fontFamily = computedStyle.fontFamily;
            if (fontFamily && fontFamily !== 'inherit') {
                fonts.add(fontFamily);
            }
        });
        
        console.log('[GistWidget] All detected fonts:', Array.from(fonts));
        
        // Get most common font families
        const fontCounts = {};
        fonts.forEach(font => {
            const cleanFont = font.replace(/['"]/g, '');
            fontCounts[cleanFont] = (fontCounts[cleanFont] || 0) + 1;
        });
        
        // Return body font if available, otherwise most common font
        if (bodyFont) {
            const cleanBodyFont = bodyFont.replace(/['"]/g, '');
            console.log('[GistWidget] Using body font:', cleanBodyFont);
            return cleanBodyFont;
        }
        
        const sortedFonts = Object.entries(fontCounts).sort((a, b) => b[1] - a[1]);
        const detectedFont = sortedFonts.length > 0 ? sortedFonts[0][0] : 'inherit';
        console.log('[GistWidget] Final detected font:', detectedFont);
        return detectedFont;
    }
    
    // Extract color scheme from the website
    function extractColorScheme() {
        const colors = {
            backgrounds: new Set(),
            textColors: new Set(),
            borderColors: new Set(),
            accentColors: new Set()
        };
        
        // Sample key elements for colors
        const sampleElements = [
            ...document.querySelectorAll('header, nav, .header, .navbar'),
            ...document.querySelectorAll('button, .btn, .button'),
            ...document.querySelectorAll('a[href], .link'),
            ...document.querySelectorAll('.card, .panel, .box'),
            ...document.querySelectorAll('h1, h2, h3'),
            ...document.querySelectorAll('main, .main, .content'),
            document.body
        ];
        
        sampleElements.forEach(element => {
            if (!element) return;
            
            const style = window.getComputedStyle(element);
            
            // Extract background colors
            const bgColor = style.backgroundColor;
            if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
                colors.backgrounds.add(bgColor);
            }
            
            // Extract text colors
            const textColor = style.color;
            if (textColor && textColor !== 'rgb(0, 0, 0)') {
                colors.textColors.add(textColor);
            }
            
            // Extract border colors
            const borderColor = style.borderColor;
            if (borderColor && borderColor !== 'rgb(0, 0, 0)') {
                colors.borderColors.add(borderColor);
            }
            
            // Check for accent colors in buttons and links
            if (element.tagName === 'BUTTON' || element.tagName === 'A' || 
                element.classList.contains('btn') || element.classList.contains('button')) {
                if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)') {
                    colors.accentColors.add(bgColor);
                }
            }
        });
        
        return {
            backgrounds: Array.from(colors.backgrounds),
            textColors: Array.from(colors.textColors),
            borderColors: Array.from(colors.borderColors),
            accentColors: Array.from(colors.accentColors)
        };
    }
    
    // Convert RGB to hex
    function rgbToHex(rgb) {
        if (!rgb || rgb === 'transparent') return null;
        
        const result = rgb.match(/\d+/g);
        if (!result || result.length < 3) return null;
        
        const hex = result.slice(0, 3).map(x => {
            const hex = parseInt(x).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
        
        return '#' + hex;
    }
    
    // Analyze and extract border radius patterns
    function extractBorderRadius() {
        const radiusValues = new Set();
        const elements = document.querySelectorAll('button, .btn, .card, .panel, input, .input');
        
        elements.forEach(element => {
            const style = window.getComputedStyle(element);
            const borderRadius = style.borderRadius;
            if (borderRadius && borderRadius !== '0px') {
                radiusValues.add(borderRadius);
            }
        });
        
        // Return most common border radius
        const radiusArray = Array.from(radiusValues);
        return radiusArray.length > 0 ? radiusArray[0] : '16px';
    }
    
    // Main function to analyze website styling
    function analyzeWebsiteStyling() {
        log('info', 'Starting website styling analysis...');
        
        try {
            // Extract logos and icons
            const logos = extractLogosAndIcons();
            
            // Extract font family
            const fontFamily = extractFontFamilies();
            console.log('[GistWidget] Detected font family:', fontFamily);
            
            // Extract color scheme
            const colorScheme = extractColorScheme();
            
            // Extract border radius
            const borderRadius = extractBorderRadius();
            
                        // Process and assign colors
            let primaryColor = colorScheme.accentColors.length > 0 ? 
                rgbToHex(colorScheme.accentColors[0]) : '#6366f1';
            
            // Enhanced color detection - check header background specifically
            const headerElement = document.querySelector('header, .header');
            console.log('[GistWidget] Header element found:', headerElement);
            
            if (headerElement) {
                const headerStyle = window.getComputedStyle(headerElement);
                const headerBg = headerStyle.backgroundColor;
                const headerBgImage = headerStyle.backgroundImage;
                
                console.log('[GistWidget] Header color detection:', {
                    headerElement: headerElement,
                    headerBg: headerBg,
                    headerBgImage: headerBgImage,
                    converted: rgbToHex(headerBg)
                });
                
                // For gradient backgrounds, extract color from CSS if backgroundColor is transparent
                if (headerBgImage && headerBgImage.includes('gradient') && 
                    (headerBg === 'rgba(0, 0, 0, 0)' || headerBg === 'transparent')) {
                    // Try to extract a color from the gradient
                    const gradientMatch = headerBgImage.match(/rgba?\([^)]+\)|#[a-fA-F0-9]{6}|#[a-fA-F0-9]{3}/);
                    if (gradientMatch) {
                        const extractedColor = rgbToHex(gradientMatch[0]) || gradientMatch[0];
                        if (extractedColor && extractedColor !== '#ffffff' && extractedColor !== '#000000') {
                            primaryColor = extractedColor;
                            console.log('[GistWidget] Using gradient color as primary:', extractedColor);
                        }
                    }
                } else if (headerBg && !headerBg.includes('rgba(0, 0, 0, 0)') && headerBg !== 'transparent') {
                    const headerColor = rgbToHex(headerBg);
                    if (headerColor && headerColor !== '#ffffff' && headerColor !== '#000000') {
                        primaryColor = headerColor;
                        console.log('[GistWidget] Using header color as primary:', headerColor);
                    }
                }
                
                // If still no color detected, check the computed styles for any green colors
                if (primaryColor === '#6366f1' || (colorScheme.accentColors.length === 0 && primaryColor === colorScheme.accentColors[0])) {
                    // Check if we can find green colors in the header's CSS rules
                    const headerClasses = headerElement.className;
                    const headerStyles = document.styleSheets;
                    
                    // Manual check for green colors since this is a green-themed page
                    for (let sheet of headerStyles) {
                        try {
                            for (let rule of sheet.cssRules || sheet.rules || []) {
                                if (rule.selectorText && rule.selectorText.includes('header')) {
                                    const bg = rule.style.background || rule.style.backgroundColor;
                                    if (bg && (bg.includes('#14532d') || bg.includes('#166534') || bg.includes('green'))) {
                                        primaryColor = '#14532d'; // Use the dark green from the gradient
                                        console.log('[GistWidget] Found green color in CSS rules:', primaryColor);
                                        break;
                                    }
                                }
                            }
                        } catch (e) {
                            // Skip inaccessible stylesheets
                        }
                    }
                }
            }
            
            // Fallback: if no custom color detected, check for common theme colors
            if (primaryColor === '#6366f1') {
                // Check for green theme colors in the page
                const allElements = document.querySelectorAll('*');
                for (let element of allElements) {
                    const style = window.getComputedStyle(element);
                    const bg = style.backgroundColor;
                    const borderColor = style.borderColor;
                    
                    // Check for green colors
                    const greenHex = rgbToHex(bg);
                    if (greenHex && (greenHex.includes('14532d') || greenHex.includes('166534') || greenHex.includes('16a34a'))) {
                        primaryColor = greenHex;
                        console.log('[GistWidget] Found green theme color:', greenHex);
                        break;
                    }
                    
                    const borderHex = rgbToHex(borderColor);
                    if (borderHex && (borderHex.includes('14532d') || borderHex.includes('166534') || borderHex.includes('16a34a'))) {
                        primaryColor = borderHex;
                        console.log('[GistWidget] Found green border color:', borderHex);
                        break;
                    }
                }
                
                // If still no green detected, force green theme for this page
                if (primaryColor === '#6366f1' && (document.body.style.background.includes('green') || 
                    document.querySelector('h1')?.style.color.includes('green') ||
                    window.location.href.includes('science_article'))) {
                    primaryColor = '#14532d';
                    console.log('[GistWidget] Applied fallback green theme');
                }
            }

            const backgroundColor = colorScheme.backgrounds.length > 0 ? 
                rgbToHex(colorScheme.backgrounds.find(bg => 
                    !bg.includes('rgba(0, 0, 0, 0)') && bg !== 'transparent'
                )) : '#ffffff';
            
            const textColor = colorScheme.textColors.length > 0 ? 
                rgbToHex(colorScheme.textColors[0]) : '#374151';
            
            // Generate harmonious color variations when custom theme is detected
            function generateColorVariations(baseColor) {
                if (!baseColor || baseColor === '#6366f1') {
                    return {
                        secondary: '#8b5cf6',
                        accent: '#ec4899',
                        brand: '#f59e0b',
                        rgba40: 'rgba(99, 102, 241, 0.4)',
                        rgba0: 'rgba(99, 102, 241, 0)'
                    };
                }
                
                // Extract RGB values
                const hex = baseColor.replace('#', '');
                const r = parseInt(hex.substr(0, 2), 16);
                const g = parseInt(hex.substr(2, 2), 16);
                const b = parseInt(hex.substr(4, 2), 16);
                
                // Generate darker variation for secondary
                const secondaryR = Math.max(0, Math.floor(r * 0.8));
                const secondaryG = Math.max(0, Math.floor(g * 0.8));
                const secondaryB = Math.max(0, Math.floor(b * 0.8));
                
                // Generate lighter variation for accent
                const accentR = Math.min(255, Math.floor(r * 1.2));
                const accentG = Math.min(255, Math.floor(g * 1.2));
                const accentB = Math.min(255, Math.floor(b * 1.2));
                
                // Generate complementary variation for brand
                const brandR = Math.min(255, Math.floor(r * 0.9 + 30));
                const brandG = Math.min(255, Math.floor(g * 0.9 + 20));
                const brandB = Math.min(255, Math.floor(b * 0.9 + 10));
                
                return {
                    secondary: `#${secondaryR.toString(16).padStart(2, '0')}${secondaryG.toString(16).padStart(2, '0')}${secondaryB.toString(16).padStart(2, '0')}`,
                    accent: `#${accentR.toString(16).padStart(2, '0')}${accentG.toString(16).padStart(2, '0')}${accentB.toString(16).padStart(2, '0')}`,
                    brand: `#${brandR.toString(16).padStart(2, '0')}${brandG.toString(16).padStart(2, '0')}${brandB.toString(16).padStart(2, '0')}`,
                    rgba40: `rgba(${r}, ${g}, ${b}, 0.4)`,
                    rgba0: `rgba(${r}, ${g}, ${b}, 0)`
                };
            }
            
            const colorVariations = generateColorVariations(primaryColor);
            
            // Regenerate color variations with the final primary color
            const finalColorVariations = generateColorVariations(primaryColor);
            
            // Update website styling object
            websiteStyling = {
                primaryColor: primaryColor || '#6366f1',
                secondaryColor: finalColorVariations.secondary,
                backgroundColor: backgroundColor || '#ffffff',
                textColor: textColor || '#374151',
                fontFamily: fontFamily || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                borderRadius: borderRadius || '16px',
                logoUrl: logos.logo,
                faviconUrl: logos.favicon,
                brandColors: [primaryColor, finalColorVariations.secondary, finalColorVariations.accent, finalColorVariations.brand].filter(Boolean),
                shadows: 'drop-shadow(0 8px 25px rgba(0, 0, 0, 0.15))',
                accentColor: finalColorVariations.accent,
                rawColorScheme: colorScheme,
                availableIcons: logos.icons
            };
            
            log('info', 'Website styling analysis complete', websiteStyling);
            
            // Debug: Log animation decision
            const shouldDisableAnimation = (websiteStyling.primaryColor && websiteStyling.primaryColor !== '#6366f1') || 
                                          (websiteStyling.brandColors && websiteStyling.brandColors.length > 0) || 
                                          (websiteStyling.rawColorScheme && websiteStyling.rawColorScheme.accentColors.length > 0);
            console.log('[GistWidget] Animation decision:', {
                primaryColor: websiteStyling.primaryColor,
                brandColors: websiteStyling.brandColors,
                accentColorsFound: websiteStyling.rawColorScheme.accentColors.length,
                shouldDisableAnimation,
                detectedColors: websiteStyling.rawColorScheme
            });
            
            // Debug: Log final color values that will be applied
            console.log('[GistWidget] Final color scheme:', {
                primaryColor: websiteStyling.primaryColor,
                secondaryColor: websiteStyling.secondaryColor,
                accentColor: websiteStyling.accentColor,
                brandColors: websiteStyling.brandColors
            });
            
            // Dispatch event with extracted styling
            window.dispatchEvent(new CustomEvent('gist-styling-extracted', {
                detail: websiteStyling
            }));
            
            return websiteStyling;
        } catch (error) {
            log('error', 'Failed to analyze website styling', { error: error.message });
            return websiteStyling; // Return defaults
        }
    }
    
    // Generate dynamic CSS based on extracted styling
    function generateDynamicStyles(styling) {
        console.log('[GistWidget] Generating CSS with colors:', {
            primary: styling.primaryColor,
            secondary: styling.secondaryColor,
            accent: styling.accentColor,
            brand: styling.brandColors[0]
        });
        
        // Extract RGB values for rgba variations
        const primaryColor = styling.primaryColor || '#6366f1';
        const hex = primaryColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const rgba40 = `rgba(${r}, ${g}, ${b}, 0.4)`;
        const rgba0 = `rgba(${r}, ${g}, ${b}, 0)`;
        
        // Ensure we have a font family - fallback to Comic Sans if detection failed
        const widgetFont = styling.fontFamily || '"Comic Sans MS", cursive';
        console.log('[GistWidget] Widget font being applied:', widgetFont);
        
        return `
            :host {
                all: initial;
                font-family: ${widgetFont};
                --widget-primary-color: ${styling.primaryColor || '#6366f1'};
                --widget-secondary-color: ${styling.secondaryColor || '#8b5cf6'};
                --widget-accent-color: ${styling.accentColor || '#ec4899'};
                --widget-brand-color: ${styling.brandColors[0] || '#f59e0b'};
                --widget-primary-color-40: ${rgba40};
                --widget-primary-color-0: ${rgba0};
                --widget-animation: ${(styling.primaryColor && styling.primaryColor !== '#6366f1') ? 'none' : 'rainbowShimmer 6s ease-in-out infinite'};
            }
            
            .gist-widget {
                position: fixed;
                bottom: 24px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 10000;
                pointer-events: none;
                opacity: 0;
                transform: translateX(-50%) translateY(10px);
                transition: opacity 250ms cubic-bezier(0.4, 0.0, 0.2, 1), 
                            transform 250ms cubic-bezier(0.4, 0.0, 0.2, 1),
                            filter 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                            left 300ms cubic-bezier(0.4, 0.0, 0.2, 1),
                            right 300ms cubic-bezier(0.4, 0.0, 0.2, 1),
                            width 300ms cubic-bezier(0.4, 0.0, 0.2, 1);
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 6px;
                filter: drop-shadow(0 0 0 rgba(0, 0, 0, 0));
                font-family: ${widgetFont};
                --widget-primary-color: ${styling.primaryColor || '#6366f1'};
                --widget-secondary-color: ${styling.secondaryColor || '#8b5cf6'};
                --widget-accent-color: ${styling.accentColor || '#ec4899'};
                --widget-brand-color: ${styling.brandColors[0] || '#f59e0b'};
                --widget-primary-color-40: ${rgba40};
                --widget-primary-color-0: ${rgba0};
            }
            

            
            .gist-pill {
                background: ${styling.backgroundColor};
                border: 1px solid ${styling.primaryColor}20;
                border-radius: ${styling.borderRadius};
                padding: 8px 6px 8px 12px;
                display: flex;
                align-items: center;
                gap: 12px;
                box-shadow: ${styling.shadows};
                backdrop-filter: blur(8px);
                cursor: pointer;
                position: relative;
                overflow: hidden;
                transition: transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0.0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
                order: 2;
                z-index: 1;
                font-family: ${widgetFont};
            }
            
            .gist-pill-input {
                border: none;
                outline: none;
                background: transparent;
                font-size: 14px;
                color: ${styling.textColor};
                width: 300px;
                font-family: ${widgetFont};
            }
            
            .gist-pill-input::placeholder {
                color: ${styling.textColor}60;
            }
            
            .gist-pill-submit {
                background: ${styling.primaryColor};
                border: none;
                border-radius: ${styling.borderRadius === '16px' ? '10px' : styling.borderRadius};
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.2s ease;
                color: white;
            }
            
            .gist-pill-submit:hover {
                background: ${styling.secondaryColor};
                transform: scale(1.05);
            }
            
            ${styling.logoUrl ? `
            .gist-pill-logo {
                width: 24px;
                height: 24px;
                background-image: url('${styling.logoUrl}');
                background-size: contain;
                background-repeat: no-repeat;
                background-position: center;
                opacity: 1;
                transform: scale(1) translateX(0);
                transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            }
            ` : `
            .gist-pill-logo {
                width: 24px;
                height: 24px;
                color: ${styling.primaryColor};
                opacity: 1;
                transform: scale(1) translateX(0);
                transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            }
            `}
            
            .gist-toolbox {
                background: ${styling.backgroundColor};
                border: 1px solid ${styling.primaryColor}20;
                border-radius: ${styling.borderRadius};
                padding: 4px;
                display: flex;
                gap: 2px;
                box-shadow: ${styling.shadows};
                backdrop-filter: blur(8px);
                opacity: 0;
                transform: translateY(10px) scale(0.95);
                transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
                pointer-events: none;
                order: 3;
                font-family: ${widgetFont};
            }
            
            .gist-toolbox-tab {
                padding: 8px 16px;
                border-radius: calc(${styling.borderRadius} - 4px);
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                color: ${styling.textColor}80;
                background: transparent;
                border: none;
                font-family: ${widgetFont};
            }
            
            .gist-toolbox-tab:hover {
                background: ${styling.primaryColor}10;
                color: ${styling.textColor};
            }
            
            .gist-toolbox-tab.active {
                background: ${styling.primaryColor};
                color: white;
            }
            
            /* Apply font to all widget text elements */
            .gist-widget * {
                font-family: ${widgetFont} !important;
            }
            
            .gist-answer-container,
            .gist-answer-content,
            .gist-answer-text,
            .gist-suggested-questions,
            .gist-suggested-question,
            .gist-loading-text,
            .gist-questions-loading-text,
            .gist-questions-loading-simple,
            .gist-content-entering,
            .gist-content-entered,
            button,
            input,
            div,
            span,
            p,
            h1, h2, h3, h4, h5, h6 {
                font-family: ${widgetFont} !important;
            }
                 `;
     }
     
     // Function to apply styling themes for different website types
     function detectWebsiteType() {
         const bodyClass = document.body.className.toLowerCase();
         const metaGenerator = document.querySelector('meta[name="generator"]');
         const generator = metaGenerator ? metaGenerator.content.toLowerCase() : '';
         
         // Detect common platforms
         if (generator.includes('wordpress') || bodyClass.includes('wordpress')) {
             return 'wordpress';
         } else if (generator.includes('shopify') || bodyClass.includes('shopify')) {
             return 'ecommerce';
         } else if (generator.includes('squarespace') || bodyClass.includes('squarespace')) {
             return 'portfolio';
         } else if (bodyClass.includes('blog') || document.querySelector('.blog, .post, article')) {
             return 'blog';
         } else if (document.querySelector('.news, .article, .press')) {
             return 'news';
         } else if (document.querySelector('.product, .shop, .cart, .checkout')) {
             return 'ecommerce';
         } else {
             return 'general';
         }
     }
     
     // Function to enhance styling based on website type
     function getEnhancedStylingForType(baseStyling, websiteType) {
         const enhancements = {
             wordpress: {
                 borderRadius: '8px',
                 shadows: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.1))'
             },
             ecommerce: {
                 borderRadius: '12px',
                 shadows: 'drop-shadow(0 6px 20px rgba(0, 0, 0, 0.12))'
             },
             portfolio: {
                 borderRadius: '20px',
                 shadows: 'drop-shadow(0 8px 30px rgba(0, 0, 0, 0.15))'
             },
             blog: {
                 borderRadius: '16px',
                 shadows: 'drop-shadow(0 4px 15px rgba(0, 0, 0, 0.1))'
             },
             news: {
                 borderRadius: '6px',
                 shadows: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.08))'
             },
             general: {
                 borderRadius: '16px',
                 shadows: 'drop-shadow(0 8px 25px rgba(0, 0, 0, 0.15))'
             }
         };
         
         return {
             ...baseStyling,
             ...enhancements[websiteType]
         };
     }
     
     // Function to create a live styling update system (DISABLED to prevent widget issues)
     function createStyleObserver(shadowRoot) {
         // Return a mock observer that doesn't actually observe anything
         // This prevents issues with complex websites where the observer can interfere
         return {
             observe: () => {},
             disconnect: () => {},
             takeRecords: () => []
         };
     }
     
     // Function to update widget styling dynamically
     function updateWidgetStyling(shadowRoot) {
         try {
             const newStyling = analyzeWebsiteStyling();
             const websiteType = detectWebsiteType();
             const enhancedStyling = getEnhancedStylingForType(newStyling, websiteType);
             
             // Update existing style element
             const existingStyle = shadowRoot.querySelector('style');
             if (existingStyle) {
                 const newDynamicStyles = generateDynamicStyles(enhancedStyling);
                 existingStyle.textContent = newDynamicStyles + existingStyle.textContent.split('/* ORIGINAL STYLES */')[1] || '';
             }
             
             log('info', 'Widget styling updated dynamically', { websiteType, styling: enhancedStyling });
         } catch (error) {
             log('error', 'Failed to update widget styling', { error: error.message });
         }
     }

    // Prevent multiple widget instances
    if (window.__gistWidgetLoaded) {
        return;
    }
    window.__gistWidgetLoaded = true;

    // Create shadow DOM container to avoid style conflicts
    function createWidget() {
        const widgetContainer = document.createElement('div');
        widgetContainer.id = 'gist-widget-container';
        
        // Create shadow root for style isolation
        const shadowRoot = widgetContainer.attachShadow({ mode: 'closed' });
        
        // Analyze website styling first
        const extractedStyling = analyzeWebsiteStyling();
        
        // Detect website type and enhance styling
        const websiteType = detectWebsiteType();
        const enhancedStyling = getEnhancedStylingForType(extractedStyling, websiteType);
        
        // Generate dynamic styles based on website
        const dynamicStyles = generateDynamicStyles(enhancedStyling);
        
        // Widget styles - now using extracted styling
        const styles = `
            <style>
                ${dynamicStyles}
                
                .gist-widget {
                    position: fixed;
                    bottom: 24px;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 10000;
                    pointer-events: none;
                    opacity: 0;
                    transform: translateX(-50%) translateY(10px);
                    transition: opacity 250ms cubic-bezier(0.4, 0.0, 0.2, 1), 
                                transform 2s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                                filter 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                                left 2s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                                right 2s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                                width 2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 6px;
                    filter: drop-shadow(0 0 0 rgba(0, 0, 0, 0));
                }
                
                .gist-widget.loaded {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                    pointer-events: auto;
                }
                
                /* Active state with subtle blur effect */
                .gist-widget.active {
                    filter: drop-shadow(0 8px 25px rgba(0, 0, 0, 0.15)) 
                            drop-shadow(0 4px 10px rgba(0, 0, 0, 0.1));
                }
                
                /* Enhanced blur when expanded and interacting */
                .gist-widget.active:not(.minimized) {
                    filter: drop-shadow(0 12px 35px rgba(0, 0, 0, 0.18)) 
                            drop-shadow(0 6px 15px rgba(0, 0, 0, 0.12))
                            drop-shadow(0 2px 6px rgba(0, 0, 0, 0.08));
                }
                
                /* Minimized state - start collapsed */
                .gist-widget.minimized {
                    gap: 0;
                    transition: gap 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                }
                
                .gist-widget.minimized .gist-answer-container,
                .gist-widget.minimized .gist-toolbox,
                .gist-widget.minimized .gist-ads-container {
                    opacity: 0;
                    transform: translateY(15px) scale(0.95);
                    pointer-events: none;
                    transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                    max-height: 0;
                    overflow: hidden;
                }
                

                
                .gist-widget.minimized .gist-pill {
                    width: 120px;
                    transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                }
                
                .gist-widget.minimized .gist-pill-submit {
                    opacity: 0;
                    transform: scale(0) translateX(8px);
                    pointer-events: none;
                    transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                }
                
                .gist-widget.minimized .gist-pill-logo {
                    opacity: 1;
                    transform: scale(1) translateX(0);
                    transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                }
                
                .gist-widget.minimized .gist-pill-input {
                    pointer-events: none;
                    text-align: left;
                    color: #6b7280;
                    margin-left: 8px;
                    transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                    width: calc(100% - 40px);
                }
                
                .gist-widget.minimized .gist-pill-content {
                    width: 100px;
                    justify-content: flex-start;
                    padding-left: 8px;
                    transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                }
                
                /* Expanded state - smooth transitions back */
                .gist-widget:not(.minimized) {
                    gap: 6px;
                    transition: gap 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.1s;
                }
                
                .gist-widget:not(.minimized) .gist-answer-container,
                .gist-widget:not(.minimized) .gist-toolbox,
                .gist-widget:not(.minimized) .gist-ads-container {
                    transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.15s;
                }
                
                .gist-widget:not(.minimized) .gist-pill {
                    transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                }
                
                .gist-widget:not(.minimized) .gist-pill-submit {
                    opacity: 1;
                    transform: scale(1) translateX(0);
                    pointer-events: auto;
                    transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.2s;
                }
                
                .gist-widget:not(.minimized) .gist-pill-logo {
                    transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                }
                
                .gist-widget:not(.minimized) .gist-pill-input {
                    text-align: left;
                    color: #374151;
                    margin-left: 0;
                    width: auto;
                    transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                }
                
                .gist-widget:not(.minimized) .gist-pill-content {
                    width: 380px;
                    justify-content: space-between;
                    padding-left: 4px;
                    transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                }
                

                
                .gist-answer-container {
                    width: 400px;
                    max-height: 300px;
                    position: relative;
                    border-radius: 16px;
                    padding: 1.5px;
                    opacity: 0;
                    transform: translateY(20px) scale(0.95);
                    transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94), max-height 300ms cubic-bezier(0.4, 0.0, 0.2, 1);
                    pointer-events: none;
                    order: 1;
                    display: flex;
                    flex-direction: column;
                }
                

                

                
                /* Compact version for Remix tool */
                .gist-answer-container.remix-compact {
                    width: 400px;
                    max-height: 300px;
                    transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                }
                
                .gist-answer-container.remix-compact.collapsed {
                    max-height: 40px;
                }
                
                .gist-answer-container::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: conic-gradient(
                        from 0deg,
                        var(--widget-primary-color, #6366f1) 0deg,
                        var(--widget-secondary-color, #8b5cf6) 90deg,
                        var(--widget-accent-color, #ec4899) 180deg,
                        var(--widget-brand-color, #f59e0b) 270deg,
                        var(--widget-primary-color, #6366f1) 360deg
                    );
                    border-radius: 16px;
                    animation: var(--widget-animation, rainbowShimmer 6s ease-in-out infinite);
                    z-index: -1;
                }
                
                .gist-answer-container.visible {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                    pointer-events: auto;
                }
                
                /* Ads Container Styling */
                .gist-ads-container {
                    width: 400px;
                    position: relative;
                    opacity: 0;
                    transform: translateY(20px) scale(0.95);
                    transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                    pointer-events: none;
                    order: 0;
                    margin-bottom: 8px;
                    display: none; /* Hidden by default */
                }
                
                .gist-ads-container.visible {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                    pointer-events: auto;
                    display: block;
                }
                
                .gist-answer-content {
                    background: white;
                    border-radius: 14.5px 14.5px 0 0; /* Remove bottom radius since footer has it */
                    padding: 20px 16px 20px 20px; /* Normal padding since button is outside */
                    flex: 1;
                    overflow-y: auto;
                    position: relative;
                    z-index: 1;
                    max-height: calc(300px - 40px); /* Account for footer height (~32px + border) */
                    box-sizing: border-box;
                    transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94), max-height 300ms cubic-bezier(0.4, 0.0, 0.2, 1);
                }
                
                /* Compact version for Remix tool */
                .gist-answer-container.remix-compact .gist-answer-content {
                    max-height: calc(300px - 40px); /* Account for footer height */
                    padding: 12px;
                    overflow: hidden; /* Disable scrolling for Remix */
                }
                
                /* Custom scrollbar styling */
                .gist-answer-content::-webkit-scrollbar {
                    width: 8px;
                }
                
                .gist-answer-content::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 4px;
                    margin: 16px 4px; /* Top/bottom margin to prevent cutoff */
                }
                
                .gist-answer-content::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 4px;
                    border: 1px solid #f1f5f9;
                    margin: 2px 0; /* Additional margin for thumb */
                }
                
                .gist-answer-content::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
                
                .gist-answer-content::-webkit-scrollbar-corner {
                    background: transparent;
                }
                
                .gist-answer-placeholder {
                    color: #9ca3af;
                    font-size: 14px;
                    text-align: center;
                    padding: 40px 20px;
                    font-style: italic;
                    min-height: 80px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transform: translateY(10px);
                    animation: fadeInUp 0.4s ease-out 0.2s forwards;
                }
                
                .gist-loading {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 40px 20px;
                    min-height: 120px;
                    opacity: 1;
                    transition: opacity 0.3s ease-out;
                }
                
                .gist-loading.fade-out {
                    opacity: 0;
                }
                
                .gist-loading-spinner {
                    width: 24px;
                    height: 24px;
                    border: 3px solid #f3f4f6;
                    border-top: 3px solid var(--widget-primary-color, #6366f1);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: 12px;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                .gist-loading-text {
                    color: #6b7280;
                    font-size: 14px;
                    font-style: italic;
                }
                
                .gist-answer-text {
                    color: #374151;
                    font-size: 14px;
                    line-height: 1.6;
                    margin: 0;
                    padding-bottom: 8px;
                    word-wrap: break-word;
                    overflow-wrap: break-word;
                    opacity: 0;
                    transform: translateY(10px);
                    animation: fadeInUp 0.6s ease-out forwards;
                }
                
                @keyframes fadeInUp {
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .gist-answer-text.animate-in {
                    animation: fadeInUp 0.6s ease-out forwards;
                }
                
                .gist-content-entering {
                    opacity: 0;
                    transform: translateY(10px);
                }
                
                .gist-content-entered {
                    opacity: 1;
                    transform: translateY(0);
                    transition: all 0.6s ease-out;
                }
                
                /* Text reveal animation */
                @keyframes textReveal {
                    0% {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .gist-text-reveal {
                    opacity: 0;
                    transform: translateY(20px);
                    animation: textReveal 0.8s ease-out forwards;
                }
                
                .gist-text-reveal-delay-1 { animation-delay: 0.1s; }
                .gist-text-reveal-delay-2 { animation-delay: 0.2s; }
                .gist-text-reveal-delay-3 { animation-delay: 0.3s; }
                .gist-text-reveal-delay-4 { animation-delay: 0.4s; }
                .gist-text-reveal-delay-5 { animation-delay: 0.5s; }
                .gist-text-reveal-delay-6 { animation-delay: 0.6s; }
                .gist-text-reveal-delay-7 { animation-delay: 0.7s; }
                .gist-text-reveal-delay-8 { animation-delay: 0.8s; }
                .gist-text-reveal-delay-9 { animation-delay: 0.9s; }
                .gist-text-reveal-delay-10 { animation-delay: 1.0s; }
                
                .gist-stagger-1 {
                    transition-delay: 0.1s;
                }
                
                .gist-stagger-2 {
                    transition-delay: 0.3s;
                }
                
                .gist-stagger-3 {
                    transition-delay: 0.5s;
                }
                
                .gist-attributions {
                    border-top: 1px solid #e5e7eb;
                    padding-top: 16px;
                    margin-top: 16px;
                    opacity: 0;
                    transform: translateY(10px);
                    animation: fadeInUp 0.6s ease-out 0.3s forwards;
                }
                
                .gist-attributions-title {
                    font-size: 12px;
                    font-weight: 600;
                    color: #6b7280;
                    margin-bottom: 8px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .gist-attribution-bar {
                    height: 6px;
                    background: #f3f4f6;
                    border-radius: 3px;
                    overflow: hidden;
                    display: flex;
                    margin-bottom: 8px;
                }
                
                .gist-attribution-segment {
                    height: 100%;
                    cursor: pointer;
                    transition: opacity 0.2s ease;
                }
                
                .gist-attribution-segment:hover {
                    opacity: 0.8;
                }
                
                .gist-attribution-sources {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    margin-top: 8px;
                }
                
                .gist-attribution-source {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 11px;
                    color: #6b7280;
                }
                
                .gist-attribution-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    flex-shrink: 0;
                }
                
                .gist-source-previews {
                    margin-top: 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                
                .gist-source-preview {
                    background: #f8fafc;
                    border-radius: 8px;
                    padding: 12px;
                    display: flex;
                    gap: 12px;
                    border-left: 3px solid var(--source-color);
                    transition: background-color 0.2s ease, transform 0.2s ease;
                    cursor: pointer;
                    position: relative;
                }
                
                .gist-source-preview:hover {
                    background: #f1f5f9;
                    transform: translateY(-1px);
                }
                
                .gist-source-preview-image {
                    width: 48px;
                    height: 48px;
                    border-radius: 6px;
                    object-fit: cover;
                    flex-shrink: 0;
                    background: #e2e8f0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .gist-source-preview-icon {
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: var(--source-color);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    font-weight: bold;
                    text-transform: uppercase;
                }
                
                .gist-source-preview-content {
                    flex: 1;
                    min-width: 0;
                }
                
                .gist-source-preview-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 4px;
                }
                
                .gist-source-preview-source {
                    font-size: 12px;
                    font-weight: 600;
                    color: #374151;
                }
                
                .gist-source-preview-date {
                    font-size: 11px;
                    color: #6b7280;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                
                .gist-source-preview-date::before {
                    content: "🌐";
                    font-size: 10px;
                }
                
                .gist-source-preview-title {
                    font-size: 13px;
                    font-weight: 600;
                    color: #1f2937;
                    margin-bottom: 4px;
                    line-height: 1.3;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                
                .gist-source-preview-description {
                    font-size: 12px;
                    color: #4b5563;
                    line-height: 1.4;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                
                .gist-source-preview-percentage {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    background: var(--source-color);
                    color: white;
                    padding: 2px 6px;
                    border-radius: 10px;
                    font-size: 10px;
                    font-weight: 600;
                }
                


                
                .gist-powered-by {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 16px;
                    padding-top: 8px;
                    color: #9ca3af;
                    font-size: 10px;
                    font-weight: 500;
                    opacity: 0.7;
                }
                
                .gist-add-to-site {
                    color: #9ca3af;
                    text-decoration: none;
                    transition: color 0.2s ease;
                    pointer-events: auto;
                }
                
                .gist-add-to-site:hover {
                    color: #6366f1;
                    text-decoration: underline;
                }
                
                .gist-powered-text {
                    pointer-events: none;
                }
                
                /* Fixed footer for answer container */
                .gist-answer-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 16px;
                    border-top: 1px solid #e5e7eb;
                    border-radius: 0 0 14.5px 14.5px;
                    color: #d1d5db;
                    font-size: 10px;
                    font-weight: 500;
                    opacity: 0.8;
                    position: relative;
                    z-index: 2;
                    flex-shrink: 0;
                }
                
                .gist-powered-section {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                
                .gist-footer-logo {
                    width: 14px;
                    height: 14px;
                    object-fit: contain;
                    opacity: 0.8;
                }

                
                .gist-error {
                    color: #dc2626;
                    font-size: 14px;
                    text-align: center;
                    padding: 20px;
                    background: #fef2f2;
                    border-radius: 8px;
                    margin: 0;
                    word-wrap: break-word;
                    overflow-wrap: break-word;
                }
                
                .gist-pill {
                    width: 400px;
                    height: 48px;
                    border-radius: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
                    cursor: pointer;
                    position: relative;
                    overflow: hidden;
                    padding: 1.5px;
                    transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
                    order: 3;
                }
                
                .gist-pill::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: conic-gradient(
                        from 0deg,
                        var(--widget-primary-color, #6366f1) 0deg,
                        var(--widget-secondary-color, #8b5cf6) 90deg,
                        var(--widget-accent-color, #ec4899) 180deg,
                        var(--widget-brand-color, #f59e0b) 270deg,
                        var(--widget-primary-color, #6366f1) 360deg
                    );
                    border-radius: 24px;
                    animation: var(--widget-animation, rainbowShimmer 6s ease-in-out infinite);
                    z-index: -1;
                }
                
                .gist-pill::before {
                    content: '';
                    position: absolute;
                    inset: 1.5px;
                    border-radius: 22.5px;
                    background: white;
                    z-index: 0;
                }
                
                @keyframes rainbowShimmer {
                    0%, 100% {
                        filter: hue-rotate(0deg) saturate(0.8);
                    }
                    50% {
                        filter: hue-rotate(180deg) saturate(1);
                    }
                }
                
                /* Rainbow animation is now isolated to pseudo-elements only */
                
                .gist-pill-content {
                    position: relative;
                    z-index: 1;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    color: #374151;
                    font-size: 14px;
                    font-weight: 400;
                    letter-spacing: -0.01em;
                    white-space: nowrap;
                    width: 380px;
                    padding: 0 4px;
                }
                
                .gist-pill-logo {
                    width: 20px;
                    height: 20px;
                    border-radius: 4px;
                    object-fit: contain;
                    flex-shrink: 0;
                }
                
                .gist-pill-input {
                    flex: 1;
                    border: none;
                    background: transparent;
                    font-size: 14px;
                    font-weight: 400;
                    color: #374151;
                    outline: none;
                    font-family: inherit;
                    letter-spacing: -0.01em;
                    min-width: 0;
                }
                
                .gist-pill-input::placeholder {
                    color: #9ca3af;
                }
                
                .gist-pill-submit {
                    width: 18px;
                    height: 18px;
                    background: #000000;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 10px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border: none;
                    flex-shrink: 0;
                }
                
                .gist-pill-submit:hover {
                    transform: scale(1.05);
                    background: #333333;
                }
                
                .gist-pill-submit:active {
                    transform: scale(0.95);
                }
                
                .gist-desktop-mode-btn {
                    width: 18px;
                    height: 18px;
                    background: #6b7280;
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 10px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border: none;
                    flex-shrink: 0;
                    display: none;
                }
                
                .gist-desktop-mode-btn:hover {
                    transform: scale(1.05);
                    background: #4b5563;
                }
                
                .gist-desktop-mode-btn:active {
                    transform: scale(0.95);
                }
                
                /* Show desktop mode button only when widget is expanded */
                .gist-widget:not(.minimized) .gist-desktop-mode-btn {
                    display: flex;
                }
                
                /* Close button styling */
                .gist-close-btn {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: rgba(107, 114, 128, 0.1);
                    border: none;
                    color: #6b7280;
                    font-size: 16px;
                    font-weight: 400;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                    z-index: 10;
                    line-height: 1;
                }
                
                .gist-close-btn:hover {
                    background: rgba(107, 114, 128, 0.2);
                    color: #374151;
                    transform: scale(1.1);
                }
                
                .gist-close-btn:active {
                    transform: scale(0.95);
                }
                

                
                /* Desktop mode styles */
                .gist-widget.desktop-mode {
                    right: 20px !important;
                    left: auto !important;
                    width: 450px !important;
                    transform: translateX(0) translateY(0) !important;
                    transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
                }
                
                .gist-widget.desktop-mode.loaded {
                    transform: translateX(0) translateY(0);
                    transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                }
                
                .gist-widget.desktop-mode.active {
                    transform: translateX(0) translateY(0);
                    transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                }
                
                .gist-widget.desktop-mode:not(.minimized) {
                    transform: translateX(0) translateY(0);
                    transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                }
                
                .gist-widget.desktop-mode .gist-answer-container {
                    max-height: 600px !important;
                }
                
                .gist-widget.desktop-mode .gist-answer-content {
                    max-height: 540px !important;
                }
                
                /* Desktop mode when minimized should stay in position */
                .gist-widget.desktop-mode.minimized {
                    right: 20px;
                    left: auto;
                    transform: translateX(0) translateY(0);
                    transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                }
                
                .gist-pill:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
                    animation-duration: 3s;
                }
                
                .gist-pill:active {
                    transform: translateY(0px);
                    transition-duration: 0.1s;
                }
                
                .gist-toolbox {
                    width: 400px;
                    background: #f8fafc;
                    border-radius: 12px;
                    padding: 4px;
                    border: 1px solid #e2e8f0;
                    transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
                    order: 2;
                    opacity: 0;
                    transform: translateY(10px) scale(0.95);
                    pointer-events: none;
                }
                
                .gist-toolbox.visible {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                    pointer-events: auto;
                }
                
                .gist-toolbox-tabs {
                    display: flex;
                    gap: 2px;
                    justify-content: center;
                }
                
                .gist-toolbox-tab {
                    flex: 1;
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-size: 13px;
                    font-weight: 500;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    color: #64748b;
                    background: transparent;
                    border: none;
                    font-family: inherit;
                    min-width: fit-content;
                    box-sizing: border-box;
                }
                
                .gist-toolbox-tab:hover {
                    color: #334155;
                    background: rgba(100, 116, 139, 0.1);
                }
                
                .gist-toolbox-tab.active {
                    background: white;
                    color: #1e293b;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                    font-weight: 600;
                }
                
                .gist-toolbox-tab.active:hover {
                    background: white;
                    color: #1e293b;
                }
                
                .gist-remix-interface {
                    padding: 20px;
                    background: white;
                    border-radius: 14.5px;
                }
                
                .gist-remix-prompt {
                    margin-bottom: 20px;
                }
                
                .gist-remix-prompt-input {
                    width: 100%;
                    padding: 12px 16px;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    font-size: 14px;
                    font-family: inherit;
                    background: #f8fafc;
                    color: #374151;
                    resize: none;
                    outline: none;
                    transition: border-color 0.2s ease, background-color 0.2s ease;
                    box-sizing: border-box;
                }
                
                .gist-remix-prompt-input:focus {
                    border-color: #6366f1;
                    background: white;
                }
                
                .gist-remix-prompt-input::placeholder {
                    color: #9ca3af;
                }
                
                .gist-remix-section {
                    margin-bottom: 24px;
                }
                
                .gist-remix-section:last-child {
                    margin-bottom: 0;
                }
                
                .gist-remix-section-title {
                    font-size: 14px;
                    font-weight: 600;
                    color: #374151;
                    margin-bottom: 12px;
                }
                
                .gist-remix-options {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                
                .gist-remix-option {
                    padding: 8px 16px;
                    border: 1px solid #e2e8f0;
                    border-radius: 20px;
                    font-size: 13px;
                    font-weight: 500;
                    color: #64748b;
                    background: #f8fafc;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    white-space: nowrap;
                }
                
                .gist-remix-option:hover {
                    border-color: #cbd5e1;
                    background: #f1f5f9;
                    color: #475569;
                }
                
                .gist-remix-option.selected {
                    border-color: #6366f1;
                    background: #6366f1;
                    color: white;
                }
                
                .gist-remix-option.selected:hover {
                    background: #5b5fc7;
                    border-color: #5b5fc7;
                }
                
                .gist-remix-option-icon {
                    font-size: 16px;
                    line-height: 1;
                }
                
                /* Mock Ads Styles */
                .gist-mock-ads {
                    margin-bottom: 16px;
                    opacity: 0;
                    transform: translateY(10px);
                    transition: all 0.4s ease-out;
                }
                
                .gist-mock-ads.visible {
                    opacity: 1;
                    transform: translateY(0);
                }
                
                .gist-mock-ads-header {
                    font-size: 10px;
                    color: #9ca3af;
                    text-align: center;
                    margin-bottom: 8px;
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .gist-mock-ads-container {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                
                .gist-mock-ad {
                    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 8px 12px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    position: relative;
                    overflow: hidden;
                }
                
                .gist-mock-ad:hover {
                    background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
                    border-color: #cbd5e1;
                    transform: translateY(-1px);
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }
                
                .gist-mock-ad::before {
                    content: 'Ad';
                    position: absolute;
                    top: 2px;
                    right: 4px;
                    font-size: 8px;
                    color: #9ca3af;
                    background: #f3f4f6;
                    padding: 1px 4px;
                    border-radius: 3px;
                    font-weight: 500;
                }
                
                .gist-mock-ad-icon {
                    width: 24px;
                    height: 24px;
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    font-weight: 600;
                    color: white;
                    flex-shrink: 0;
                }
                
                .gist-mock-ad-content {
                    flex: 1;
                    min-width: 0;
                }
                
                .gist-mock-ad-title {
                    font-size: 12px;
                    font-weight: 600;
                    color: #1f2937;
                    margin-bottom: 2px;
                    line-height: 1.3;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                
                .gist-mock-ad-description {
                    font-size: 10px;
                    color: #6b7280;
                    line-height: 1.3;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                
                .gist-mock-ad-cta {
                    background: #3b82f6;
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 10px;
                    font-weight: 500;
                    border: none;
                    cursor: pointer;
                    transition: background 0.2s ease;
                    flex-shrink: 0;
                }
                
                .gist-mock-ad-cta:hover {
                    background: #2563eb;
                }
                
                .gist-remix-button {
                    width: 100%;
                    padding: 12px 24px;
                    background: linear-gradient(135deg, var(--widget-primary-color, #6366f1) 0%, var(--widget-secondary-color, #8b5cf6) 100%);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    margin-top: 20px;
                    font-family: inherit;
                }
                
                .gist-remix-button:hover {
                    background: linear-gradient(135deg, var(--widget-primary-color, #6366f1) 0%, var(--widget-secondary-color, #8b5cf6) 100%);
                    transform: translateY(-1px);
                }
                
                .gist-remix-button:active {
                    transform: translateY(0);
                }
                
                .gist-remix-button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                }
                
                .gist-remix-button:disabled:hover {
                    transform: none;
                }
                
                .gist-remix-image-result {
                    text-align: center;
                    padding: 20px;
                    transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                }
                
                .gist-remix-image {
                    max-width: 100%;
                    border-radius: 12px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    margin-bottom: 16px;
                    transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                }
                
                .gist-remix-image-prompt {
                    font-size: 12px;
                    color: #6b7280;
                    font-style: italic;
                    margin-bottom: 16px;
                    text-align: left;
                    transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                }
                
                .gist-remix-image-actions {
                    display: flex;
                    gap: 8px;
                    justify-content: center;
                    margin-bottom: 16px;
                    transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                }
                
                .gist-remix-image-action {
                    padding: 6px 12px;
                    background: #f3f4f6;
                    border: 1px solid #e5e7eb;
                    border-radius: 6px;
                    font-size: 12px;
                    color: #374151;
                    text-decoration: none;
                    transition: all 0.2s ease;
                }
                
                .gist-remix-image-action:hover {
                    background: #e5e7eb;
                    color: #1f2937;
                }
                
                /* Compact mode adjustments for Remix image result */
                .gist-answer-container.remix-compact .gist-remix-image-result {
                    padding: 8px;
                }
                
                .gist-answer-container.remix-compact .gist-remix-image {
                    border-radius: 8px;
                    margin-bottom: 6px;
                    max-height: calc(300px - 70px); /* Leave space for prompt and actions */
                    width: 100%;
                    object-fit: cover;
                }
                
                .gist-answer-container.remix-compact .gist-remix-image-prompt {
                    font-size: 10px;
                    margin-bottom: 6px;
                    line-height: 1.2;
                }
                
                .gist-answer-container.remix-compact .gist-remix-image-actions {
                    gap: 4px;
                    margin-bottom: 4px;
                }
                
                .gist-answer-container.remix-compact .gist-remix-image-action {
                    padding: 4px 8px;
                    font-size: 10px;
                }
                
                /* Share Interface Styles */
                .gist-share-interface {
                    padding: 0;
                    opacity: 0;
                    transform: translateY(10px);
                    transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
                }
                
                .gist-share-interface.gist-content-entered {
                    opacity: 1;
                    transform: translateY(0);
                }
                
                .gist-share-header {
                    text-align: center;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid #e5e7eb;
                }
                
                .gist-share-header h3 {
                    margin: 0 0 8px 0;
                    font-size: 18px;
                    font-weight: 600;
                    color: #1f2937;
                }
                
                .gist-share-title {
                    margin: 0;
                    font-size: 14px;
                    color: #6b7280;
                    font-style: italic;
                    max-width: 280px;
                    margin: 0 auto;
                    line-height: 1.4;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                
                .gist-share-options {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                
                .gist-share-option {
                    display: flex;
                    align-items: center;
                    padding: 12px 16px;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-family: inherit;
                    font-size: 14px;
                    color: #374151;
                    width: 100%;
                    text-align: left;
                }
                
                .gist-share-option:hover {
                    background: #f1f5f9;
                    border-color: #cbd5e1;
                    transform: translateY(-1px);
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }
                
                .gist-share-option:hover svg {
                    color: #1f2937;
                }
                
                .gist-share-option[data-action="copy-link"]:hover svg {
                    color: #059669;
                }
                
                .gist-share-option[data-action="imessage"]:hover svg {
                    color: #007aff;
                }
                
                .gist-share-option[data-action="instagram"]:hover svg {
                    color: #e4405f;
                }
                
                .gist-share-option[data-action="x"]:hover svg {
                    color: #000000;
                }
                
                .gist-share-option[data-action="facebook"]:hover svg {
                    color: #1877f2;
                }
                
                .gist-share-option:active {
                    transform: translateY(0);
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
                }
                
                .gist-share-option-icon {
                    margin-right: 12px;
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                
                .gist-share-option-icon svg {
                    width: 20px;
                    height: 20px;
                    color: #374151;
                    transition: color 0.2s ease;
                }
                
                .gist-share-option-label {
                    font-weight: 500;
                    flex: 1;
                }
                
                .gist-share-feedback {
                    margin-top: 16px;
                    padding: 8px 12px;
                    border-radius: 6px;
                    font-size: 12px;
                    text-align: center;
                    font-weight: 500;
                    transition: all 0.3s ease;
                }
                
                .gist-share-feedback.success {
                    background: #dcfce7;
                    color: #166534;
                    border: 1px solid #bbf7d0;
                }
                
                .gist-share-feedback.error {
                    background: #fee2e2;
                    color: #dc2626;
                    border: 1px solid #fecaca;
                }
                
                /* Suggested Questions Styles */
                .gist-suggested-questions {
                    padding: 0;
                    opacity: 0;
                    transform: translateY(10px);
                    transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
                }
                
                .gist-suggested-questions.gist-content-entered {
                    opacity: 1;
                    transform: translateY(0);
                }
                
                .gist-suggested-questions-header {
                    text-align: center;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid #e5e7eb;
                }
                
                .gist-suggested-questions-header h3 {
                    margin: 0 0 8px 0;
                    font-size: 18px;
                    font-weight: 600;
                    color: #1f2937;
                }
                
                .gist-suggested-questions-subtitle {
                    margin: 0;
                    font-size: 14px;
                    color: #6b7280;
                    line-height: 1.4;
                }
                
                .gist-suggested-questions-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin-bottom: 20px;
                }
                
                .gist-suggested-question {
                    display: flex;
                    align-items: flex-start;
                    padding: 16px;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-family: inherit;
                    text-align: left;
                    width: 100%;
                    position: relative;
                    overflow: hidden;
                }
                
                .gist-suggested-question::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 2px;
                    background: linear-gradient(90deg, var(--widget-primary-color, #6366f1), var(--widget-secondary-color, #8b5cf6), var(--widget-accent-color, #ec4899));
                    transform: translateX(-100%);
                    transition: transform 0.3s ease;
                }
                
                .gist-suggested-question:hover {
                    background: #f1f5f9;
                    border-color: #cbd5e1;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }
                
                .gist-suggested-question:hover::before {
                    transform: translateX(0);
                }
                
                .gist-suggested-question:active {
                    transform: translateY(0);
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
                }
                
                .gist-suggested-question-icon {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 24px;
                    height: 24px;
                    background: linear-gradient(135deg, var(--widget-primary-color, #6366f1), var(--widget-secondary-color, #8b5cf6));
                    color: white;
                    border-radius: 50%;
                    font-size: 12px;
                    font-weight: 600;
                    margin-right: 12px;
                    flex-shrink: 0;
                    margin-top: 2px;
                }
                
                .gist-suggested-question-text {
                    flex: 1;
                    font-size: 14px;
                    font-weight: 500;
                    color: #374151;
                    line-height: 1.5;
                }
                
                .gist-suggested-questions-footer {
                    text-align: center;
                    padding-top: 15px;
                    border-top: 1px solid #e5e7eb;
                }
                
                .gist-suggested-questions-footer p {
                    margin: 0;
                    font-size: 12px;
                    color: #6b7280;
                    line-height: 1.4;
                }
                
                /* Follow-up Questions Styles */
                .gist-follow-up-section {
                    margin-top: 20px;
                    padding-top: 20px;
                    border-top: 1px solid #e5e7eb;
                }
                
                .gist-follow-up-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 16px;
                }
                
                .gist-follow-up-header h4 {
                    margin: 0;
                    font-size: 16px;
                    font-weight: 600;
                    color: #1f2937;
                }
                
                .gist-follow-up-questions {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                
                .gist-follow-up-question {
                    display: flex;
                    align-items: flex-start;
                    padding: 12px 14px;
                    background: #fafbfc;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-family: inherit;
                    text-align: left;
                    width: 100%;
                    font-size: 13px;
                }
                
                .gist-follow-up-question:hover {
                    background: #f3f4f6;
                    border-color: #d1d5db;
                    transform: translateY(-1px);
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                }
                
                .gist-follow-up-question:active {
                    transform: translateY(0);
                    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
                }
                
                .gist-follow-up-question-icon {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 18px;
                    height: 18px;
                    background: #e5e7eb;
                    color: #6b7280;
                    border-radius: 4px;
                    font-size: 10px;
                    font-weight: 600;
                    margin-right: 10px;
                    flex-shrink: 0;
                    margin-top: 1px;
                }
                
                .gist-follow-up-question-text {
                    flex: 1;
                    font-weight: 500;
                    color: #374151;
                    line-height: 1.4;
                }
                
                /* Loading dots animation for questions */
                .gist-loading-dots {
                    display: flex;
                    gap: 4px;
                }
                
                .gist-loading-dots span {
                    width: 6px;
                    height: 6px;
                    background: #cbd5e1;
                    border-radius: 50%;
                    animation: loadingDots 1.4s infinite ease-in-out;
                }
                
                .gist-loading-dots span:nth-child(1) { animation-delay: -0.32s; }
                .gist-loading-dots span:nth-child(2) { animation-delay: -0.16s; }
                .gist-loading-dots span:nth-child(3) { animation-delay: 0s; }
                
                @keyframes loadingDots {
                    0%, 80%, 100% {
                        transform: scale(0.8);
                        opacity: 0.5;
                    }
                    40% {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
                
                /* Questions Loading Styles */
                .gist-questions-loading {
                    padding: 0;
                    opacity: 0;
                    transform: translateY(10px);
                    transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
                }
                
                .gist-questions-loading.gist-content-entered {
                    opacity: 1;
                    transform: translateY(0);
                }
                
                .gist-questions-loading-header {
                    text-align: center;
                    margin-bottom: 32px;
                    padding-bottom: 20px;
                    border-bottom: 1px solid #e5e7eb;
                }
                
                .gist-questions-loading-icon {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 48px;
                    height: 48px;
                    background: linear-gradient(135deg, var(--widget-primary-color, #6366f1), var(--widget-secondary-color, #8b5cf6));
                    border-radius: 12px;
                    color: white;
                    margin-bottom: 16px;
                    animation: pulseIcon 2s ease-in-out infinite;
                }
                
                .gist-questions-loading-header h3 {
                    margin: 0 0 8px 0;
                    font-size: 20px;
                    font-weight: 600;
                    color: #1f2937;
                }
                
                .gist-questions-loading-subtitle {
                    margin: 0;
                    font-size: 14px;
                    color: #6b7280;
                    line-height: 1.5;
                }
                
                .gist-questions-loading-steps {
                    margin-bottom: 24px;
                }
                
                .gist-questions-loading-step {
                    display: flex;
                    align-items: flex-start;
                    padding: 16px 0;
                    transition: all 0.3s ease;
                    opacity: 0.4;
                }
                
                .gist-questions-loading-step.active {
                    opacity: 1;
                }
                
                .gist-questions-loading-step.completed {
                    opacity: 0.7;
                }
                
                .gist-questions-loading-step-icon {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 32px;
                    height: 32px;
                    margin-right: 16px;
                    flex-shrink: 0;
                    margin-top: 2px;
                }
                
                .gist-questions-loading-step-number {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 32px;
                    height: 32px;
                    background: #e5e7eb;
                    color: #6b7280;
                    border-radius: 50%;
                    font-size: 14px;
                    font-weight: 600;
                    transition: all 0.3s ease;
                }
                
                .gist-questions-loading-step.active .gist-questions-loading-step-number {
                    background: linear-gradient(135deg, var(--widget-primary-color, #6366f1), var(--widget-secondary-color, #8b5cf6));
                    color: white;
                    animation: pulseStep 1.5s ease-in-out infinite;
                }
                
                .gist-questions-loading-step.completed .gist-questions-loading-step-number {
                    background: #10b981;
                    color: white;
                }
                
                .gist-questions-loading-step.completed .gist-questions-loading-step-number::before {
                    content: '✓';
                    font-size: 12px;
                }
                
                .gist-questions-loading-step.completed .gist-questions-loading-step-number {
                    font-size: 0; /* Hide the number when completed */
                }
                
                .gist-questions-loading-step-content {
                    flex: 1;
                }
                
                .gist-questions-loading-step-title {
                    font-size: 15px;
                    font-weight: 600;
                    color: #1f2937;
                    margin-bottom: 4px;
                    line-height: 1.4;
                }
                
                .gist-questions-loading-step-description {
                    font-size: 13px;
                    color: #6b7280;
                    line-height: 1.4;
                }
                
                .gist-questions-loading-step.active .gist-questions-loading-step-title {
                    color: #6366f1;
                }
                
                .gist-questions-loading-progress {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 20px;
                    text-align: center;
                }
                
                .gist-questions-loading-progress-bar {
                    width: 100%;
                    height: 6px;
                    background: #e5e7eb;
                    border-radius: 3px;
                    overflow: hidden;
                    margin-bottom: 12px;
                }
                
                .gist-questions-loading-progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, var(--widget-primary-color, #6366f1), var(--widget-secondary-color, #8b5cf6), var(--widget-accent-color, #ec4899));
                    border-radius: 3px;
                    width: 33.33%;
                    transition: width 0.5s ease;
                    position: relative;
                    overflow: hidden;
                }
                
                .gist-questions-loading-progress-fill::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
                    animation: progressShimmer 1.5s ease-in-out infinite;
                }
                
                .gist-questions-loading-progress-text {
                    font-size: 14px;
                    font-weight: 500;
                    color: #6b7280;
                    margin: 0;
                }
                
                /* Simplified Loading Styles */
                .gist-questions-loading-simple {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 40px 20px;
                    text-align: center;
                }
                
                .gist-questions-loading-text {
                    font-size: 16px;
                    font-weight: 500;
                    color: #6b7280;
                    margin-bottom: 20px;
                }
                
                .gist-questions-loading-simple .gist-questions-loading-progress {
                    background: transparent;
                    border: none;
                    padding: 0;
                    width: 200px;
                }
                
                .gist-questions-loading-simple .gist-questions-loading-progress-bar {
                    width: 100%;
                    height: 4px;
                    background: #e5e7eb;
                    border-radius: 2px;
                    overflow: hidden;
                }
                
                .gist-questions-loading-simple .gist-questions-loading-progress-fill {
                    height: 100%;
                    background: var(--widget-primary-color, #6366f1);
                    border-radius: 2px;
                    width: 0%;
                    transition: width 2s ease-out;
                    position: relative;
                }
                
                @keyframes pulseIcon {
                    0%, 100% {
                        transform: scale(1);
                        box-shadow: 0 0 0 0 var(--widget-primary-color-40, rgba(99, 102, 241, 0.4));
                    }
                    50% {
                        transform: scale(1.05);
                        box-shadow: 0 0 0 8px var(--widget-primary-color-0, rgba(99, 102, 241, 0));
                    }
                }
                
                @keyframes pulseStep {
                    0%, 100% {
                        transform: scale(1);
                        box-shadow: 0 0 0 0 var(--widget-primary-color-40, rgba(99, 102, 241, 0.4));
                    }
                    50% {
                        transform: scale(1.1);
                        box-shadow: 0 0 0 6px var(--widget-primary-color-0, rgba(99, 102, 241, 0));
                    }
                }
                
                @keyframes progressShimmer {
                    0% {
                        transform: translateX(-100%);
                    }
                    100% {
                        transform: translateX(100%);
                    }
                }
                
                .remix-coming-soon-wrapper {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    min-height: 180px;
                    display: flex;
                    align-items: flex-end;
                    justify-content: center;
                }
                .remix-coming-soon-img {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    border-radius: 16px;
                    box-shadow: 0 4px 24px rgba(0,0,0,0.10);
                    z-index: 1;
                    background: #222;
                    transition: box-shadow 0.3s;
                }
                .remix-coming-soon-text {
                    position: relative;
                    z-index: 2;
                    width: 100%;
                    text-align: center;
                    color: #8b8fa7;
                    font-size: 1.35rem;
                    font-weight: 500;
                    margin-bottom: 18px;
                    text-shadow: 0 2px 8px rgba(0,0,0,0.18);
                    background: rgba(255,255,255,0.0);
                }
                .gist-answer-placeholder {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    width: 100%;
                    height: 100%;
                    min-height: 180px;
                    padding: 0;
                }
                .gist-answer-placeholder {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    min-height: 0 !important;
                    min-width: 0 !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    border-radius: 16px;
                    overflow: hidden;
                    background: none;
                    display: block;
                }
                .remix-coming-soon-img {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    border-radius: 16px;
                    background: #222;
                    z-index: 1;
                    box-shadow: none;
                    margin: 0;
                    padding: 0;
                    display: block;
                }
            </style>
        `;
        
        // Widget HTML structure
        const widgetHTML = `
            ${styles}
                                <div class="gist-widget minimized" id="gist-widget">
                <div class="gist-pill" id="gist-pill">
                    <div class="gist-pill-content">
                        ${enhancedStyling.logoUrl ? 
                            `<img src="${enhancedStyling.logoUrl}" class="gist-pill-logo" alt="Website Logo" onerror="this.src='gist-logo.png'; this.alt='Gist Logo';">` :
                            enhancedStyling.faviconUrl ?
                            `<img src="${enhancedStyling.faviconUrl}" class="gist-pill-logo" alt="Website Icon" onerror="this.src='gist-logo.png'; this.alt='Gist Logo';">` :
                            `<img src="gist-logo.png" class="gist-pill-logo" alt="Gist Logo">`
                        }
                        <input type="text" class="gist-pill-input" placeholder="Ask..." id="gist-input">
                        <button class="gist-desktop-mode-btn" id="gist-desktop-mode-btn" title="Desktop Mode">⊞</button>
                        <button class="gist-pill-submit" id="gist-submit">➤</button>
                    </div>
                </div>
                <div class="gist-toolbox" id="gist-toolbox">
                    <div class="gist-toolbox-tabs" id="gist-toolbox-tabs">
                        <!-- Tabs will be generated dynamically based on TOOLS_CONFIG -->
                    </div>
                </div>
                <div class="gist-ads-container" id="gist-ads-container">
                    <!-- Mock ads will be inserted here -->
                </div>
                <div class="gist-answer-container" id="gist-answer-container">
                    <button class="gist-close-btn" id="gist-close-btn" title="Minimize">×</button>
                    <div class="gist-answer-content">
                        <div class="gist-answer-placeholder">
                            Ask a question to see the answer here!
                        </div>
                    </div>
                    <div class="gist-answer-footer">
                        <div class="gist-powered-section">
                            <img src="gist-logo.png" alt="Gist Logo" class="gist-footer-logo">
                            <span class="gist-powered-text">Powered by Gist</span>
                        </div>
                        <a href="https://gist.ai" target="_blank" class="gist-add-to-site">Add to your site</a>
                    </div>
                </div>
            </div>
        `;
        
        shadowRoot.innerHTML = widgetHTML;
        document.body.appendChild(widgetContainer);
        
        // Initialize currentTool that will be used by generateToolboxTabs
        let currentTool = 'ask'; // Track current active tool
        
        // Generate toolbox tabs dynamically based on TOOLS_CONFIG
        function generateToolboxTabs() {
            const toolboxTabsContainer = shadowRoot.getElementById('gist-toolbox-tabs');
            const toolLabels = {
                ask: 'Ask',
                gist: 'The Gist', 
                remix: 'Remix',
                share: 'Share'
            };
            
            // Clear existing tabs
            toolboxTabsContainer.innerHTML = '';
            
            // Get enabled tools in the desired order
            const toolOrder = ['ask', 'gist', 'remix', 'share'];
            const enabledTools = toolOrder.filter(tool => TOOLS_CONFIG[tool]);
            
            // Generate tabs for enabled tools
            enabledTools.forEach((tool, index) => {
                const button = document.createElement('button');
                button.className = 'gist-toolbox-tab';
                button.setAttribute('data-tool', tool);
                button.textContent = toolLabels[tool];
                
                // Make first enabled tool active by default
                if (index === 0) {
                    button.classList.add('active');
                    currentTool = tool; // Set the current tool to the first enabled tool
                }
                
                toolboxTabsContainer.appendChild(button);
            });
            
            console.log('[GistWidget] Generated tabs for enabled tools:', enabledTools);
        }
        
        // Generate the tabs
        generateToolboxTabs();
        
        // Get elements for event handling
        const pill = shadowRoot.getElementById('gist-pill');
        const input = shadowRoot.getElementById('gist-input');
        const submitBtn = shadowRoot.getElementById('gist-submit');
        const desktopModeBtn = shadowRoot.getElementById('gist-desktop-mode-btn');
        const closeBtn = shadowRoot.getElementById('gist-close-btn');
        const answerContainer = shadowRoot.getElementById('gist-answer-container');
        const answerContent = answerContainer.querySelector('.gist-answer-content');
        const widget = shadowRoot.getElementById('gist-widget');
        const toolbox = shadowRoot.getElementById('gist-toolbox');
        let toolboxTabs = toolbox.querySelectorAll('.gist-toolbox-tab'); // Use let since it will be updated

        
        // Dynamic toolbox sizing system
        function optimizeToolboxAlignment() {
            const toolboxContainer = shadowRoot.querySelector('.gist-toolbox-tabs');
            // Refresh toolboxTabs since they are generated dynamically
            toolboxTabs = toolbox.querySelectorAll('.gist-toolbox-tab');
            const tabs = Array.from(toolboxTabs);
            
            if (!toolboxContainer || tabs.length === 0) return;
            
            // Get container width (400px - 8px padding = 392px available)
            const containerWidth = 392;
            const gap = 2; // 2px gap between tabs
            const totalGapWidth = (tabs.length - 1) * gap;
            const availableWidth = containerWidth - totalGapWidth;
            
            // Calculate optimal width per tab
            const tabWidth = Math.floor(availableWidth / tabs.length);
            
            // Get text lengths to determine optimal font size
            const textLengths = tabs.map(tab => tab.textContent.trim().length);
            const maxTextLength = Math.max(...textLengths);
            const avgTextLength = textLengths.reduce((a, b) => a + b, 0) / textLengths.length;
            
            // Create a temporary element to measure actual text width
            const measureElement = document.createElement('span');
            measureElement.style.position = 'absolute';
            measureElement.style.visibility = 'hidden';
            measureElement.style.whiteSpace = 'nowrap';
            measureElement.style.fontFamily = 'inherit';
            measureElement.style.fontWeight = '500';
            shadowRoot.appendChild(measureElement);
            
            // Find the optimal font size that fits all text
            let optimalFontSize = 13; // Start with default
            let allTextsFit = false;
            
            for (let fontSize = 14; fontSize >= 10; fontSize--) {
                measureElement.style.fontSize = `${fontSize}px`;
                let maxMeasuredWidth = 0;
                
                // Check if all tab texts fit at this font size
                tabs.forEach(tab => {
                    measureElement.textContent = tab.textContent.trim();
                    const measuredWidth = measureElement.offsetWidth;
                    maxMeasuredWidth = Math.max(maxMeasuredWidth, measuredWidth);
                });
                
                // Add padding space (16px on each side = 32px total)
                const requiredWidth = maxMeasuredWidth + 32;
                
                if (requiredWidth <= tabWidth) {
                    optimalFontSize = fontSize;
                    allTextsFit = true;
                    break;
                }
            }
            
            // Clean up measurement element
            shadowRoot.removeChild(measureElement);
            
            // Calculate padding based on remaining space
            const horizontalPadding = Math.max(8, Math.floor((tabWidth - (maxTextLength * optimalFontSize * 0.6)) / 2));
            
            // Apply dynamic styles
            tabs.forEach(tab => {
                tab.style.fontSize = `${optimalFontSize}px`;
                tab.style.padding = `8px ${horizontalPadding}px`;
                tab.style.minWidth = `${tabWidth}px`;
                tab.style.maxWidth = `${tabWidth}px`;
                tab.style.flex = 'none'; // Override flex: 1
                tab.style.whiteSpace = 'nowrap';
                tab.style.overflow = 'visible'; // Allow text to be fully visible
            });
            
            // Ensure perfect centering
            toolboxContainer.style.justifyContent = 'center';
            toolboxContainer.style.width = '100%';
            
            console.log('[GistWidget] Toolbox optimized:', {
                containerWidth,
                tabWidth,
                optimalFontSize,
                horizontalPadding,
                textLengths,
                avgTextLength
            });
        }
        
        // Apply optimization after a brief delay to ensure DOM is ready
        setTimeout(optimizeToolboxAlignment, 100);
        
        // Add resize observer to re-optimize when needed
        if (window.ResizeObserver) {
            const resizeObserver = new ResizeObserver(() => {
                // Debounce the optimization to avoid excessive calls
                clearTimeout(window.toolboxOptimizationTimeout);
                window.toolboxOptimizationTimeout = setTimeout(optimizeToolboxAlignment, 150);
            });
            
            // Observe the toolbox container for size changes
            resizeObserver.observe(toolbox);
        }
        
        let isActive = false;
        let hasAnswer = false;
        let hasAskAnswer = false; // Track if we have an answer specifically from Ask tool
        let submitTimeout = null;
        let conversationHistory = []; // Store conversation history for Gist
        let pageContext = null; // Store extracted page content for context
        // currentTool already declared above
        let isMinimized = true; // Track minimized state
        let hoverTimeout = null; // Timeout for hover delay
        let userIsInteracting = false; // Track if user is actively interacting
        let isDesktopMode = false; // Track desktop mode state
        let hasAutoSwitchedToDesktop = false; // Track if we've already auto-switched to prevent repeated switching

        // Function to detect if user is on a desktop device
        function isDesktopDevice() {
            // Check for touch capability and screen size
            const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            const screenWidth = window.innerWidth || document.documentElement.clientWidth;
            const screenHeight = window.innerHeight || document.documentElement.clientHeight;
            
            // Consider it desktop if:
            // 1. No touch capability, OR
            // 2. Large screen size (even if touch-capable, like touch laptops)
            const isLargeScreen = screenWidth >= 1024 && screenHeight >= 768;
            
            return !hasTouch || isLargeScreen;
        }

        
        // Toolbox functionality
        function switchTool(tool) {
            // Check if tool is enabled
            if (!TOOLS_CONFIG[tool]) {
                console.warn(`[GistWidget] Tool '${tool}' is disabled and cannot be switched to`);
                return;
            }
            
            currentTool = tool;
            window.gistCurrentTool = currentTool; // Keep window reference in sync
            
            // Refresh toolboxTabs since they are generated dynamically
            toolboxTabs = toolbox.querySelectorAll('.gist-toolbox-tab');
            
            // Update active tab
            toolboxTabs.forEach(tab => {
                tab.classList.remove('active');
                if (tab.dataset.tool === tool) {
                    tab.classList.add('active');
                }
            });
            
            // Handle compact mode for Remix tool
            if (tool === 'remix') {
                answerContainer.classList.add('remix-compact');
            } else {
                answerContainer.classList.remove('remix-compact');
            }
            

            
            // Hide ads when switching to tools that don't show ads
            if (tool !== 'ask' && tool !== 'gist') {
                hideExternalAds();
            }
            
            // Update content based on tool
            updateContentForTool(tool);
            
            // Show answer container and toolbox for all tools
            answerContainer.classList.add('visible');
            toolbox.classList.add('visible');
            
            log('info', 'Tool switched', { tool });
        }
        
        function updateContentForTool(tool) {
            switch (tool) {
                case 'ask':
                    // If we have an Ask-specific answer, keep it. Otherwise show suggested questions
                    if (hasAskAnswer) {
                        // Keep current Ask answer content
                        return;
                    } else {
                        // Clear any previous answers from other tools and show suggested questions
                        hasAnswer = false;
                        showSuggestedQuestions();
                    }
                    break;
                case 'gist':
                    // Clear Ask-specific answer flag when switching away from Ask
                    hasAskAnswer = false;
                    // Generate summary automatically
                    generateGist();
                    break;
                case 'remix':
                    // Clear Ask-specific answer flag when switching away from Ask
                    hasAskAnswer = false;
                    // Show coming soon placeholder
                    showPlaceholderForTool('remix');
                    break;
                case 'share':
                    // Clear hasAnswer when switching away from Ask
                    hasAnswer = false;
                    hasAskAnswer = false;
                    showShareInterface();
                    break;
                default:
                    showPlaceholderForTool('ask');
            }
        }
        
        function showPlaceholderForTool(tool) {
            let placeholderText = '';
            
            switch (tool) {
                case 'ask':
                    const context = extractPageContext();
                    const hasContext = context && context.content && context.content.length > 50;
                    placeholderText = hasContext ? 
                        'Ask anything about this article or any other topic!' : 
                        'Ask a question to see the answer here!';
                    break;
                case 'gist':
                    placeholderText = 'Get a summary of this page. Feature coming soon!';
                    break;
                case 'remix':
                    placeholderText = `<img src=\"remix-coming-soon.png\" alt=\"Remix Coming Soon\" class=\"remix-coming-soon-img\" />`;
                    break;
                case 'share':
                    placeholderText = 'Share insights from this page. Feature coming soon!';
                    break;
                default:
                    placeholderText = 'Select a tool to get started!';
            }
            
            answerContent.innerHTML = `
                <div class="gist-answer-placeholder gist-content-entering">
                    ${placeholderText}
                </div>
            `;
            
            // Trigger animation
            setTimeout(() => {
                const elements = answerContent.querySelectorAll('.gist-content-entering');
                elements.forEach(el => {
                    el.classList.remove('gist-content-entering');
                    el.classList.add('gist-content-entered');
                });
            }, 50);
            
            // Add CSS for the image if not already present
            const styleId = 'remix-coming-soon-style';
            if (!shadowRoot.getElementById(styleId)) {
                const style = document.createElement('style');
                style.id = styleId;
                style.textContent = `
                    .gist-answer-placeholder {
                        position: relative;
                        width: 100%;
                        height: 180px;
                        padding: 0;
                        margin: 0;
                        border-radius: 16px;
                        overflow: hidden;
                        background: none;
                        display: block;
                    }
                    .remix-coming-soon-img {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                        border-radius: 16px;
                        background: #222;
                        z-index: 1;
                        box-shadow: none;
                        margin: 0;
                        padding: 0;
                        display: block;
                    }
                    
                    /* Compact mode adjustments for Remix placeholder */
                    .gist-answer-container.remix-compact .gist-answer-placeholder {
                        height: calc(300px - 24px); /* Account for reduced padding */
                    }
                `;
                shadowRoot.appendChild(style);
            }
        }
        
        // Show loading state for question generation
        function showQuestionsLoading(previousQuestion = null, previousAnswer = null) {
            const isFollowUp = previousQuestion && previousAnswer;
            const loadingText = isFollowUp ? "Generating..." : "Analyzing...";
            
            answerContent.innerHTML = `
                <div class="gist-questions-loading gist-content-entering">
                    <div class="gist-questions-loading-simple">
                        <div class="gist-questions-loading-text">${loadingText}</div>
                        <div class="gist-questions-loading-progress">
                            <div class="gist-questions-loading-progress-bar">
                                <div class="gist-questions-loading-progress-fill"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Start the loading animation sequence
            setTimeout(() => {
                const elements = answerContent.querySelectorAll('.gist-content-entering');
                elements.forEach(el => {
                    el.classList.remove('gist-content-entering');
                    el.classList.add('gist-content-entered');
                });
                
                // Start simple progress animation
                const progressFill = answerContent.querySelector('.gist-questions-loading-progress-fill');
                if (progressFill) {
                    // Start at 0% and animate to 100%
                    progressFill.style.width = '0%';
                    setTimeout(() => {
                        progressFill.style.width = '100%';
                    }, 100);
                }
            }, 50);
        }
        

        
        // Generate and show suggested questions for the Ask tool
        async function showSuggestedQuestions(previousQuestion = null, previousAnswer = null) {
            try {
                // Show comprehensive loading state while generating questions
                showQuestionsLoading(previousQuestion, previousAnswer);
                
                // Ensure answer container and toolbox are visible
                answerContainer.classList.add('visible');
                toolbox.classList.add('visible');
                
                // Generate questions
                const questions = await generateSuggestedQuestions(previousQuestion, previousAnswer);
                
                // Only show questions if user is still on ask tool
                if (currentTool !== 'ask') return;
                
                let html = `
                    <div class="gist-suggested-questions gist-content-entering">
                        <div class="gist-suggested-questions-header">
                            <h3>Suggested Questions</h3>
                            <p class="gist-suggested-questions-subtitle">Explore this article with AI-generated questions</p>
                        </div>
                        <div class="gist-suggested-questions-list">
                `;
                
                questions.forEach((question, index) => {
                    html += `
                        <button class="gist-suggested-question" data-question="${question.replace(/"/g, '&quot;')}">
                            <span class="gist-suggested-question-icon">${index + 1}</span>
                            <span class="gist-suggested-question-text">${question}</span>
                        </button>
                    `;
                });
                
                html += `
                        </div>
                        <div class="gist-suggested-questions-footer">
                            <p>Click a question to explore, or type your own below</p>
                        </div>
                    </div>
                `;
                
                answerContent.innerHTML = html;
                hasAnswer = false;
                hasAskAnswer = false; // Clear Ask-specific answer flag when showing suggested questions
                
                // Add click handlers for suggested questions
                const questionButtons = answerContent.querySelectorAll('.gist-suggested-question');
                questionButtons.forEach(button => {
                    button.addEventListener('click', () => {
                        const question = button.dataset.question;
                        askSuggestedQuestion(question);
                    });
                });
                
                // Trigger animation
                setTimeout(() => {
                    const elements = answerContent.querySelectorAll('.gist-content-entering');
                    elements.forEach(el => {
                        el.classList.remove('gist-content-entering');
                        el.classList.add('gist-content-entered');
                    });
                }, 50);
                
            } catch (error) {
                log('error', 'Failed to generate suggested questions', { error: error.message });
                
                // Fallback to regular placeholder if questions fail
                answerContent.innerHTML = `
                    <div class="gist-answer-placeholder gist-content-entering">
                        Ask anything about this article or any other topic!
                    </div>
                `;
                
                setTimeout(() => {
                    const elements = answerContent.querySelectorAll('.gist-content-entering');
                    elements.forEach(el => {
                        el.classList.remove('gist-content-entering');
                        el.classList.add('gist-content-entered');
                    });
                }, 50);
            }
        }
        
        // Generate suggested questions using Gist
        async function generateSuggestedQuestions(previousQuestion = null, previousAnswer = null) {
            const context = extractPageContext();
            
            if (!context || !context.content || context.content.length < 50) {
                // Return generic questions if no article context
                return [
                    "What are the main themes of this page?",
                    "Can you explain the key concepts?",
                    "What should I know about this topic?"
                ];
            }
            
            let prompt;
            if (previousQuestion && previousAnswer) {
                // Generate follow-up questions based on previous Q&A
                prompt = `Based on this article and our previous conversation, generate exactly 3 thought-provoking follow-up questions that would help someone explore the topic deeper.

Article Title: ${context.title}
Article Content: ${context.content.substring(0, 1500)}...

Previous Question: ${previousQuestion}
Previous Answer: ${previousAnswer.substring(0, 500)}...

Generate 3 questions that:
1. Build on what was previously discussed
2. Explore different angles or implications
3. Encourage deeper understanding

Return only the 3 questions, one per line, without numbers or bullets.`;
            } else {
                // Generate initial questions about the article
                prompt = `Based on this article, generate exactly 3 engaging questions that would help someone understand and explore the key concepts. Make the questions thought-provoking and specific to the content.

Article Title: ${context.title}
Article Content: ${context.content.substring(0, 1500)}...

Generate 3 questions that:
1. Address the main findings or concepts
2. Explore implications or applications
3. Encourage critical thinking about the topic

Return only the 3 questions, one per line, without numbers or bullets.`;
            }
            
            const response = await createChatCompletionForGist(prompt);
            const questions = response.response
                .split('\n')
                .filter(q => q.trim() && !q.match(/^\d+[.)]/)) // Remove empty lines and numbered lines
                .map(q => q.trim().replace(/^[-•]\s*/, '')) // Remove bullet points
                .slice(0, 3); // Ensure we only get 3 questions
            
            // Return fallback questions if parsing failed
            if (questions.length === 0) {
                return [
                    "What are the main findings of this research?",
                    "How might this impact the field?",
                    "What questions does this raise for future study?"
                ];
            }
            
            return questions;
        }
        
        // Handle clicking on a suggested question
        async function askSuggestedQuestion(question) {
            try {
                // Set the input field to show the question
                input.value = question;
                
                // Show loading state
                showLoading();
                
                // Get answer from OpenAI
                const startTime = Date.now();
                const chatResponse = await createChatCompletion(question);
                const responseTime = Date.now() - startTime;
                
                // Display the answer only if user is still on ask tool
                if (currentTool === 'ask') {
                    showAnswerWithFollowUps(chatResponse.response, question);
                }
                
                // Clear input
                input.value = '';
                
                // Emit analytics event
                window.dispatchEvent(new CustomEvent('gist-suggested-question', {
                    detail: {
                        question: question,
                        response: chatResponse.response,
                        responseTime: responseTime,
                        usage: chatResponse.usage
                    }
                }));
                
            } catch (error) {
                log('error', 'Failed to process suggested question', { error: error.message });
                if (currentTool === 'ask') {
                    showError(error.message);
                }
            }
        }
        
        // Show answer with follow-up questions
        function showAnswerWithFollowUps(answer, question) {
            const mockAttributions = generateMockAttributions();
            
            let html = `
                <div class="gist-answer-text gist-content-entering">
                    ${answer.replace(/\n/g, '<br>')}
                </div>
            `;
            
            // Add attribution section
            html += `
                <div class="gist-attributions gist-content-entering gist-stagger-2">
                    <div class="gist-attributions-title">Sources</div>
                    <div class="gist-attribution-bar">
            `;
            
            // Add attribution segments
            for (const attribution of mockAttributions) {
                const width = attribution.percentage * 100;
                html += `
                    <div class="gist-attribution-segment" 
                         style="width: ${width}%; background-color: ${attribution.color};"
                         title="${attribution.source}: ${(attribution.percentage * 100).toFixed(1)}%">
                    </div>
                `;
            }
            
            html += `
                    </div>
                    <div class="gist-attribution-sources">
            `;
            
            // Add source labels
            for (const attribution of mockAttributions) {
                html += `
                    <div class="gist-attribution-source">
                        <div class="gist-attribution-dot" style="background-color: ${attribution.color};"></div>
                        <span>${attribution.source} (${(attribution.percentage * 100).toFixed(1)}%)</span>
                    </div>
                `;
            }
            
            html += `
                    </div>
                </div>
            `;
            
            // Add follow-up questions section
            html += `
                <div class="gist-follow-up-section gist-content-entering gist-stagger-3">
                    <div class="gist-follow-up-header">
                        <h4>Explore Further</h4>
                        <div class="gist-loading-dots">
                            <span></span><span></span><span></span>
                        </div>
                    </div>
                </div>
            `;
            
            answerContent.innerHTML = html;
            hasAnswer = true;
            hasAskAnswer = true; // Mark that we have an Ask-specific answer
            
            // Trigger animations
            setTimeout(() => {
                const elements = answerContent.querySelectorAll('.gist-content-entering');
                elements.forEach(el => {
                    el.classList.remove('gist-content-entering');
                    el.classList.add('gist-content-entered');
                });
                
                // Apply text reveal animation to answer
                const answerText = answerContent.querySelector('.gist-answer-text');
                if (answerText) {
                    applyTextRevealAnimation(answerText);
                }
            }, 50);
            
            // Generate follow-up questions
            generateFollowUpQuestions(question, answer);
        }
        
        // Generate and show follow-up questions
        async function generateFollowUpQuestions(question, answer) {
            try {
                const followUpQuestions = await generateSuggestedQuestions(question, answer);
                
                // Only update if user is still on ask tool and has this answer visible
                if (currentTool !== 'ask' || !hasAnswer) return;
                
                const followUpSection = answerContent.querySelector('.gist-follow-up-section');
                if (!followUpSection) return;
                
                let followUpHTML = `
                    <div class="gist-follow-up-header">
                        <h4>Explore Further</h4>
                    </div>
                    <div class="gist-follow-up-questions">
                `;
                
                followUpQuestions.forEach((followUpQuestion, index) => {
                    followUpHTML += `
                        <button class="gist-follow-up-question" data-question="${followUpQuestion.replace(/"/g, '&quot;')}">
                            <span class="gist-follow-up-question-icon">${index + 1}</span>
                            <span class="gist-follow-up-question-text">${followUpQuestion}</span>
                        </button>
                    `;
                });
                
                followUpHTML += `</div>`;
                
                followUpSection.innerHTML = followUpHTML;
                
                // Add click handlers for follow-up questions
                const followUpButtons = followUpSection.querySelectorAll('.gist-follow-up-question');
                followUpButtons.forEach(button => {
                    button.addEventListener('click', () => {
                        const followUpQuestion = button.dataset.question;
                        askSuggestedQuestion(followUpQuestion);
                    });
                });
                
            } catch (error) {
                log('error', 'Failed to generate follow-up questions', { error: error.message });
                
                // Hide the follow-up section if it failed
                const followUpSection = answerContent.querySelector('.gist-follow-up-section');
                if (followUpSection) {
                    followUpSection.style.display = 'none';
                }
            }
        }
        
        // Add event listeners for toolbox tabs using delegation
        toolbox.addEventListener('click', (e) => {
            // Check if clicked element is a toolbox tab
            if (e.target.classList.contains('gist-toolbox-tab')) {
                e.stopPropagation(); // Prevent event from bubbling up
                const tool = e.target.dataset.tool;
                
                // Only switch tool if it's enabled
                if (TOOLS_CONFIG[tool]) {
                    switchTool(tool);
                    userIsInteracting = true; // User clicked, keep expanded
                    isActive = true;
                }
            }
        });
        
        // Minimization/expansion functions
        function expandWidget() {
            if (!isMinimized) return;
            
            isMinimized = false;
            widget.classList.remove('minimized');
            widget.classList.add('active');
            
            // Update placeholder immediately for desktop mode responsiveness
            input.placeholder = 'Ask anything...';
            
            // Show toolbox if not already visible
            if (!toolbox.classList.contains('visible')) {
                toolbox.classList.add('visible');
            }
            
            log('debug', 'Widget expanded');
        }
        
        function minimizeWidget() {
            if (isMinimized) return;
            
            isMinimized = true;
            
            // Change placeholder immediately for smooth transition
            input.placeholder = 'Ask...';
            input.blur(); // Remove focus
            
            // Hide answer container and toolbox immediately
            answerContainer.classList.remove('visible');
            toolbox.classList.remove('visible');
            
            // Hide ads when minimizing
            hideExternalAds();
            
            // Start the minimization animation
            setTimeout(() => {
                widget.classList.add('minimized');
            }, 50);
            
            // Remove active class (blur) after a delay to sync with animation
            setTimeout(() => {
                widget.classList.remove('active');
            }, 150);
            
            log('debug', 'Widget minimized');
        }
        
        // Desktop mode functionality
        function toggleDesktopMode() {
            isDesktopMode = !isDesktopMode;
            
            if (isDesktopMode) {
                enableDesktopMode();
            } else {
                disableDesktopMode();
            }
            
            log('debug', `Desktop mode ${isDesktopMode ? 'enabled' : 'disabled'}`);
        }
        
        function enableDesktopMode() {
            widget.classList.add('desktop-mode');
            
            // Ensure widget is expanded and active initially
            expandWidget();
            isActive = true;
            userIsInteracting = true;
            
            // Update button appearance
            desktopModeBtn.style.background = '#16a34a';
            desktopModeBtn.title = 'Exit Desktop Mode';
            
            log('debug', 'Desktop mode enabled - widget moved to side with expanded view');
        }
        
        function disableDesktopMode() {
            widget.classList.remove('desktop-mode');
            
            // Reset button appearance
            desktopModeBtn.style.background = '#6b7280';
            desktopModeBtn.title = 'Desktop Mode';
            
            // Explicitly reset positioning to center the widget
            widget.style.right = '';
            widget.style.left = '';
            widget.style.width = '';
            widget.style.transform = '';
            
            // Re-enable normal widget behavior
            userIsInteracting = false;
            
            log('debug', 'Desktop mode disabled - widget returned to normal position');
        }
        
        // Widget hover handlers
        widget.addEventListener('mouseenter', () => {
            clearTimeout(hoverTimeout);
            widget.classList.add('active');
            expandWidget();
        });
        
        widget.addEventListener('mouseleave', () => {
            clearTimeout(hoverTimeout);
            // Allow auto-minimize in both normal and desktop mode
            hoverTimeout = setTimeout(() => {
                if (!userIsInteracting && !isActive) {
                    minimizeWidget();
                }
            }, 300); // 300ms delay before minimizing
        });
        
        // Track user interaction
        input.addEventListener('focus', () => {
            userIsInteracting = true;
            widget.classList.add('active');
            expandWidget();
        });
        
        input.addEventListener('blur', () => {
            // Delay to check if user clicked elsewhere
            setTimeout(() => {
                if (!input.value.trim()) {
                    userIsInteracting = false;
                    // Try to minimize if not hovering (works in both normal and desktop mode)
                    if (!widget.matches(':hover')) {
                        minimizeWidget();
                    }
                }
            }, 100);
        });
        
        input.addEventListener('input', () => {
            userIsInteracting = true;
            widget.classList.add('active');
            expandWidget();
        });
        
        // Note: Click outside handling moved to the main handler below to avoid conflicts
        
        // Function to apply text reveal animation
        function applyTextRevealAnimation(textElement) {
            const originalHTML = textElement.innerHTML;
            
            // Split text by sentences and bullet points for natural reading flow
            // This regex splits on sentence endings, bullet points, or explicit breaks
            const chunks = originalHTML.split(/([.!?]\s+|<br\s*\/?>\s*|•\s*)/);
            
            // Filter out empty chunks and combine meaningful text with punctuation
            const meaningfulChunks = [];
            let currentChunk = '';
            
            chunks.forEach(chunk => {
                if (chunk.trim()) {
                    currentChunk += chunk;
                    // If this chunk ends a sentence or is a break, add it as a complete chunk
                    if (chunk.match(/[.!?]\s+$/) || chunk.match(/<br\s*\/?>\s*/) || chunk.match(/•\s*/)) {
                        meaningfulChunks.push(currentChunk);
                        currentChunk = '';
                    }
                }
            });
            
            // Add any remaining text
            if (currentChunk.trim()) {
                meaningfulChunks.push(currentChunk);
            }
            
            // If we couldn't split meaningfully, split by words as fallback
            if (meaningfulChunks.length === 1 && meaningfulChunks[0].length > 100) {
                const words = originalHTML.split(/(\s+)/);
                meaningfulChunks.length = 0;
                for (let i = 0; i < words.length; i += 8) { // Group every 8 words
                    meaningfulChunks.push(words.slice(i, i + 8).join(''));
                }
            }
            
            // Clear the original content
            textElement.innerHTML = '';
            
            // Create spans for each chunk with staggered animation
            meaningfulChunks.forEach((chunk, index) => {
                if (chunk.trim()) {
                    const span = document.createElement('span');
                    span.innerHTML = chunk;
                    span.className = `gist-text-reveal gist-text-reveal-delay-${Math.min(index + 1, 10)}`;
                    textElement.appendChild(span);
                }
            });
        }
        
        // Generate Gist functionality
        async function generateGist() {
            try {
                // Show loading state
                showLoading();
                
                // Get page context
                const context = extractPageContext();
                if (!context || !context.content || context.content.length < 50) {
                    showGistError('No article content found to summarize.');
                    return;
                }
                
                // Create a specific prompt for summarization
                const gistPrompt = `Please summarize the following article into exactly 3 bullet points or fewer. Each bullet point should be concise and capture the main ideas. Focus on the most important information.

Article Title: ${context.title}

Article Content:
${context.content}

Instructions:
- Provide exactly 3 bullet points or fewer
- Each bullet point should be one clear, concise sentence
- Cover the most important aspects of the article
- Do not include introductory text, just the bullet points
- Start each bullet point with a bullet (•) character`;

                // Use Gist API to generate summary
                const startTime = Date.now();
                const response = await createChatCompletionForGist(gistPrompt);
                const responseTime = Date.now() - startTime;
                
                // Show the gist summary only if user is still on gist tool
                if (currentTool === 'gist') {
                showGistSummary(response.response);
                }
                
                // Emit analytics event
                window.dispatchEvent(new CustomEvent('gist-gist-generated', {
                    detail: {
                        title: context.title,
                        contentLength: context.content.length,
                        summary: response.response,
                        responseTime: responseTime,
                        usage: response.usage
                    }
                }));
                
            } catch (error) {
                log('error', 'Gist generation failed', { error: error.message });
                if (currentTool === 'gist') {
                showGistError(error.message);
                }
                
                // Emit error event
                window.dispatchEvent(new CustomEvent('gist-gist-error', {
                    detail: {
                        error: error.message,
                        type: 'gist_generation'
                    }
                }));
            }
        }
        
        // Special API call for gist that doesn't affect conversation history
        async function createChatCompletionForGist(prompt) {
            const requestBody = {
                model: WIDGET_CONFIG.MODEL,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 300 // Shorter limit for concise summaries
            };
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), WIDGET_CONFIG.TIMEOUT_MS);
            
            try {
                const response = await fetch(WIDGET_CONFIG.CHAT_API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody),
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                
                if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                    throw new Error('Invalid response format from API');
                }
                
                return {
                    response: data.choices[0].message.content,
                    usage: data.usage
                };
                
            } catch (error) {
                clearTimeout(timeoutId);
                throw error;
            }
        }
        
        function showGistSummary(summary) {
            const mockAttributions = generateMockAttributions();
            
            let html = `
                <div class="gist-answer-text gist-content-entering">
                    ${summary.replace(/\n/g, '<br>')}
                </div>
            `;
            
            // Add attribution section
            html += `
                <div class="gist-attributions gist-content-entering gist-stagger-2">
                    <div class="gist-attributions-title">Sources</div>
                    <div class="gist-attribution-bar">
            `;
            
            // Add attribution segments
            for (const attribution of mockAttributions) {
                const width = attribution.percentage * 100;
                html += `
                    <div class="gist-attribution-segment" 
                         style="width: ${width}%; background-color: ${attribution.color};"
                         title="${attribution.source}: ${(attribution.percentage * 100).toFixed(1)}%">
                    </div>
                `;
            }
            
            html += `
                    </div>
                    <div class="gist-attribution-sources">
            `;
            
            // Add source labels
            for (const attribution of mockAttributions) {
                html += `
                    <div class="gist-attribution-source">
                        <div class="gist-attribution-dot" style="background-color: ${attribution.color};"></div>
                        <span>${attribution.source} (${(attribution.percentage * 100).toFixed(1)}%)</span>
                    </div>
                `;
            }
            
            html += `
                    </div>
                    <div class="gist-source-previews">
            `;
            
            // Add source preview cards
            for (const attribution of mockAttributions) {
                const formatDate = (date) => {
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
                };
                
                html += `
                    <div class="gist-source-preview" style="--source-color: ${attribution.color};">
                        <div class="gist-source-preview-image">
                            <div class="gist-source-preview-icon">${attribution.icon}</div>
                        </div>
                        <div class="gist-source-preview-content">
                            <div class="gist-source-preview-header">
                                <div class="gist-source-preview-source">${attribution.source}</div>
                                <div class="gist-source-preview-date">${formatDate(attribution.date)}</div>
                            </div>
                            <div class="gist-source-preview-title">${attribution.title}</div>
                            <div class="gist-source-preview-description">${attribution.description}</div>
                        </div>
                        <div class="gist-source-preview-percentage">${(attribution.percentage * 100).toFixed(0)}%</div>
                    </div>
                `;
            }
            
            html += `
                    </div>
                </div>
            `;
            
            // Add suggested questions section
            html += `
                <div class="gist-follow-up-section gist-content-entering gist-stagger-3">
                    <div class="gist-follow-up-header">
                        <h4>Explore Further</h4>
                        <div class="gist-loading-dots">
                            <span></span><span></span><span></span>
                        </div>
                    </div>
                </div>
            `;
            
            answerContent.innerHTML = html;
            hasAnswer = true;
            
            // Trigger animations after a brief delay to ensure DOM is updated
            setTimeout(() => {
                const elements = answerContent.querySelectorAll('.gist-content-entering');
                elements.forEach(el => {
                    el.classList.remove('gist-content-entering');
                    el.classList.add('gist-content-entered');
                });
                
                // Apply text reveal animation to gist text
                const answerText = answerContent.querySelector('.gist-answer-text');
                if (answerText) {
                    applyTextRevealAnimation(answerText);
                }
                
                // Show external ads with delay
                setTimeout(() => {
                    showExternalAds();
                }, 200);

            }, 50);
            
            // Generate suggested questions for the gist
            generateGistQuestions();
        }
        
        // Generate and show suggested questions for the Gist tool
        async function generateGistQuestions() {
            try {
                const questions = await generateSuggestedQuestions();
                
                // Only update if user is still on gist tool and has this gist visible
                if (currentTool !== 'gist' || !hasAnswer) return;
                
                const followUpSection = answerContent.querySelector('.gist-follow-up-section');
                if (!followUpSection) return;
                
                let followUpHTML = `
                    <div class="gist-follow-up-header">
                        <h4>Explore Further</h4>
                    </div>
                    <div class="gist-follow-up-questions">
                `;
                
                questions.forEach((question, index) => {
                    followUpHTML += `
                        <button class="gist-follow-up-question" data-question="${question.replace(/"/g, '&quot;')}">
                            <span class="gist-follow-up-question-icon">${index + 1}</span>
                            <span class="gist-follow-up-question-text">${question}</span>
                        </button>
                    `;
                });
                
                followUpHTML += `</div>`;
                
                followUpSection.innerHTML = followUpHTML;
                
                // Add click handlers for gist questions
                const followUpButtons = followUpSection.querySelectorAll('.gist-follow-up-question');
                followUpButtons.forEach(button => {
                    button.addEventListener('click', () => {
                        const question = button.dataset.question;
                        askGistQuestion(question);
                    });
                });
                
            } catch (error) {
                log('error', 'Failed to generate gist questions', { error: error.message });
                
                // Hide the follow-up section if it failed
                const followUpSection = answerContent.querySelector('.gist-follow-up-section');
                if (followUpSection) {
                    followUpSection.style.display = 'none';
                }
            }
        }
        
        // Handle clicking on a gist question - switch to Ask tool and ask the question
        async function askGistQuestion(question) {
            try {
                            // Switch to Ask tool
            switchTool('ask');
            
            // Set the input field to show the question
            input.value = question;
            
            // Show loading state
            showLoading();
            
            // Get answer from Gist
                const startTime = Date.now();
                const chatResponse = await createChatCompletion(question);
                const responseTime = Date.now() - startTime;
                
                // Display the answer only if user is still on ask tool
                if (currentTool === 'ask') {
                    showAnswerWithFollowUps(chatResponse.response, question);
                }
                
                // Clear input
                input.value = '';
                
                // Emit analytics event
                window.dispatchEvent(new CustomEvent('gist-gist-question', {
                    detail: {
                        question: question,
                        response: chatResponse.response,
                        responseTime: responseTime,
                        usage: chatResponse.usage
                    }
                }));
                
            } catch (error) {
                log('error', 'Failed to process gist question', { error: error.message });
                if (currentTool === 'ask') {
                    showError(error.message);
                }
            }
        }
        
        function showGistError(errorMessage) {
            // Build HTML with error content (ads will be shown externally)
            let html = `
                <div class="gist-error-content gist-content-entering">
                    <div class="gist-error-title">Unable to Generate Summary</div>
                    <div class="gist-error-message">${errorMessage}</div>
                </div>
            `;
            
            answerContent.innerHTML = html;
            
            // Trigger animation
            setTimeout(() => {
                const elements = answerContent.querySelectorAll('.gist-content-entering');
                elements.forEach(el => {
                    el.classList.remove('gist-content-entering');
                    el.classList.add('gist-content-entered');
                });
                
                // Show external ads with delay
                setTimeout(() => {
                    showExternalAds();
                }, 200);
            }, 50);
        }
        
        // Remix functionality
        let remixSelections = {
            tone: null,
            style: null,
            format: null
        };
        
        function showRemixInterface() {
            const remixOptions = {
                tone: [
                    { id: 'gist', label: '"The Gist"', icon: '≡' },
                    { id: 'funny', label: 'Funny', icon: '😊' },
                    { id: 'professional', label: 'Professional', icon: '💼' }
                ],
                style: [
                    { id: 'ugc', label: 'UGC', icon: '📱' },
                    { id: 'newscast', label: 'Newscast', icon: '📺' },
                    { id: 'text-focused', label: 'Text-focused', icon: '📝' },
                    { id: 'narrative', label: 'Narrative', icon: '📖' }
                ],
                format: [
                    { id: 'video', label: 'Video', icon: '🎥' },
                    { id: 'thumbnail', label: 'Thumbnail', icon: '🖼️' },
                    { id: 'carousel', label: 'Carousel', icon: '🎠' },
                    { id: 'meme', label: 'Meme', icon: '😂' },
                    { id: 'pdf', label: 'PDF', icon: '📄' },
                    { id: 'audio', label: 'Audio', icon: '🎵' }
                ]
            };
            
            let html = `
                <div class="gist-remix-interface gist-content-entering">
                    <div class="gist-remix-prompt">
                        <textarea 
                            class="gist-remix-prompt-input" 
                            placeholder="Describe your change"
                            rows="3"
                            id="remix-prompt"
                        ></textarea>
                    </div>
            `;
            
            // Add sections for Tone, Style, Format
            for (const [sectionKey, sectionOptions] of Object.entries(remixOptions)) {
                const sectionTitle = sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1);
                html += `
                    <div class="gist-remix-section">
                        <div class="gist-remix-section-title">${sectionTitle}</div>
                        <div class="gist-remix-options" data-section="${sectionKey}">
                `;
                
                for (const option of sectionOptions) {
                    const isSelected = remixSelections[sectionKey] === option.id;
                    html += `
                        <div class="gist-remix-option ${isSelected ? 'selected' : ''}" 
                             data-section="${sectionKey}" 
                             data-value="${option.id}">
                            <span class="gist-remix-option-icon">${option.icon}</span>
                            <span>${option.label}</span>
                        </div>
                    `;
                }
                
                html += `
                        </div>
                    </div>
                `;
            }
            
            html += `
                    <button class="gist-remix-button" id="remix-generate">
                        Remix
                    </button>
                </div>
            `;
            
            answerContent.innerHTML = html;
            hasAnswer = false;
            
            // Add event listeners for option selection
            const options = answerContent.querySelectorAll('.gist-remix-option');
            options.forEach(option => {
                option.addEventListener('click', () => {
                    const section = option.dataset.section;
                    const value = option.dataset.value;
                    
                    // Remove selected class from other options in the same section
                    const sectionOptions = answerContent.querySelectorAll(`[data-section="${section}"]`);
                    sectionOptions.forEach(opt => opt.classList.remove('selected'));
                    
                    // Add selected class to clicked option
                    option.classList.add('selected');
                    
                    // Update selections
                    remixSelections[section] = value;
                    
                    log('debug', 'Remix option selected', { section, value, selections: remixSelections });
                });
            });
            
            // Add event listener for remix button
            const remixButton = answerContent.querySelector('#remix-generate');
            remixButton.addEventListener('click', () => {
                generateRemix();
            });
            
            // Trigger animation
            setTimeout(() => {
                const elements = answerContent.querySelectorAll('.gist-content-entering');
                elements.forEach(el => {
                    el.classList.remove('gist-content-entering');
                    el.classList.add('gist-content-entered');
                });
            }, 50);
        }
        
        function showShareInterface() {
            const shareOptions = [
                { 
                    id: 'copy-link', 
                    label: 'Copy Link', 
                    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`,
                    action: copyPageLink
                },
                { 
                    id: 'imessage', 
                    label: 'iMessage', 
                    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12c0 1.99.57 3.85 1.57 5.43L2 22l4.57-1.57C8.15 21.43 10.01 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.5 0-2.91-.41-4.12-1.12L4 20l1.12-3.88C4.41 14.91 4 13.5 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z"/><circle cx="8.5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="15.5" cy="12" r="1.5"/></svg>`,
                    action: shareViaIMessage
                },
                { 
                    id: 'instagram', 
                    label: 'Instagram', 
                    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`,
                    action: shareViaInstagram
                },
                { 
                    id: 'x', 
                    label: 'X (Twitter)', 
                    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
                    action: shareViaX
                },
                { 
                    id: 'facebook', 
                    label: 'Facebook', 
                    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
                    action: shareViaFacebook
                }
            ];

            const context = extractPageContext();
            const pageTitle = context?.title || document.title || 'Interesting Article';
            const pageUrl = window.location.href;

            let html = `
                <div class="gist-share-interface gist-content-entering">
                    <div class="gist-share-header">
                        <h3>Share this article</h3>
                        <p class="gist-share-title">"${pageTitle}"</p>
                    </div>
                    <div class="gist-share-options">
            `;

            for (const option of shareOptions) {
                html += `
                    <button class="gist-share-option" data-action="${option.id}">
                        <span class="gist-share-option-icon">${option.icon}</span>
                        <span class="gist-share-option-label">${option.label}</span>
                    </button>
                `;
            }

            html += `
                    </div>
                    <div class="gist-share-feedback" id="share-feedback" style="display: none;"></div>
                </div>
            `;

            answerContent.innerHTML = html;
            hasAnswer = false;

            // Add event listeners for share options
            const shareButtons = answerContent.querySelectorAll('.gist-share-option');
            shareButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const actionId = button.dataset.action;
                    const shareOption = shareOptions.find(opt => opt.id === actionId);
                    if (shareOption && shareOption.action) {
                        shareOption.action(pageTitle, pageUrl, context);
                    }
                });
            });

            // Trigger animation
            setTimeout(() => {
                const elements = answerContent.querySelectorAll('.gist-content-entering');
                elements.forEach(el => {
                    el.classList.remove('gist-content-entering');
                    el.classList.add('gist-content-entered');
                });
            }, 50);
        }

        // Share action functions
        function copyPageLink(title, url, context) {
            navigator.clipboard.writeText(url).then(() => {
                showShareFeedback('Link copied to clipboard!', 'success');
                log('info', 'Link copied to clipboard', { url });
            }).catch(err => {
                showShareFeedback('Failed to copy link', 'error');
                log('error', 'Failed to copy link', { error: err.message });
            });
        }

        function shareViaIMessage(title, url, context) {
            const message = `Check out this article: "${title}" - ${url}`;
            const encodedMessage = encodeURIComponent(message);
            const iMessageUrl = `sms:&body=${encodedMessage}`;
            
            try {
                window.open(iMessageUrl, '_blank');
                showShareFeedback('Opening iMessage...', 'success');
                log('info', 'Shared via iMessage', { title, url });
            } catch (err) {
                showShareFeedback('Unable to open iMessage', 'error');
                log('error', 'iMessage share failed', { error: err.message });
            }
        }

        function shareViaInstagram(title, url, context) {
            // Instagram doesn't support direct URL sharing, so we copy text with instructions
            const message = `"${title}"\n\nRead more at: ${url}\n\n#article #interesting`;
            navigator.clipboard.writeText(message).then(() => {
                showShareFeedback('Caption copied! Open Instagram to paste and share.', 'success');
                log('info', 'Instagram content copied', { title, url });
            }).catch(err => {
                showShareFeedback('Failed to copy Instagram content', 'error');
                log('error', 'Instagram share failed', { error: err.message });
            });
        }

        function shareViaX(title, url, context) {
            const text = `"${title}" ${url}`;
            const encodedText = encodeURIComponent(text);
            const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;
            
            try {
                window.open(twitterUrl, '_blank', 'width=550,height=420');
                showShareFeedback('Opening X (Twitter)...', 'success');
                log('info', 'Shared via X', { title, url });
            } catch (err) {
                showShareFeedback('Unable to open X', 'error');
                log('error', 'X share failed', { error: err.message });
            }
        }

        function shareViaFacebook(title, url, context) {
            const encodedUrl = encodeURIComponent(url);
            const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
            
            try {
                window.open(facebookUrl, '_blank', 'width=550,height=420');
                showShareFeedback('Opening Facebook...', 'success');
                log('info', 'Shared via Facebook', { title, url });
            } catch (err) {
                showShareFeedback('Unable to open Facebook', 'error');
                log('error', 'Facebook share failed', { error: err.message });
            }
        }

        function showShareFeedback(message, type) {
            const feedback = answerContent.querySelector('#share-feedback');
            if (feedback) {
                feedback.textContent = message;
                feedback.className = `gist-share-feedback ${type}`;
                feedback.style.display = 'block';
                
                // Hide feedback after 3 seconds
                setTimeout(() => {
                    feedback.style.display = 'none';
                }, 3000);
            }
        }
        
        async function generateRemix() {
            try {
                // Get custom prompt
                const customPrompt = answerContent.querySelector('#remix-prompt').value.trim();
                
                // Get page context
                const context = extractPageContext();
                if (!context || !context.content || context.content.length < 50) {
                    showRemixError('No article content found to remix.');
                    return;
                }
                
                // Check if we need to generate an image
                const isImageFormat = remixSelections.format === 'meme' || remixSelections.format === 'thumbnail';
                
                if (isImageFormat) {
                    await generateRemixImage(customPrompt, context);
                } else {
                    await generateRemixText(customPrompt, context);
                }
                
            } catch (error) {
                log('error', 'Remix generation failed', { error: error.message });
                showRemixError(error.message);
                
                // Emit error event
                window.dispatchEvent(new CustomEvent('gist-remix-error', {
                    detail: {
                        error: error.message,
                        type: 'remix_generation'
                    }
                }));
            }
        }
        
        async function generateRemixText(customPrompt, context) {
            // Build remix instructions
            let remixInstructions = 'Transform this article with the following specifications:\n\n';
            
            if (customPrompt) {
                remixInstructions += `Custom requirements: ${customPrompt}\n\n`;
            }
            
            if (remixSelections.tone) {
                const toneMap = {
                    'gist': 'concise and summarized',
                    'funny': 'humorous and entertaining',
                    'professional': 'formal and business-oriented'
                };
                remixInstructions += `Tone: Make it ${toneMap[remixSelections.tone]}\n`;
            }
            
            if (remixSelections.style) {
                const styleMap = {
                    'ugc': 'user-generated content style (casual, personal)',
                    'newscast': 'news broadcast style (formal, structured)',
                    'text-focused': 'text-heavy format with detailed explanations',
                    'narrative': 'storytelling format with engaging narrative flow'
                };
                remixInstructions += `Style: Use ${styleMap[remixSelections.style]}\n`;
            }
            
            if (remixSelections.format) {
                const formatMap = {
                    'video': 'video script format with scene descriptions',
                    'carousel': 'carousel post format with multiple slides',
                    'pdf': 'structured document format suitable for PDF',
                    'audio': 'audio script format for podcast or narration'
                };
                remixInstructions += `Format: Structure as ${formatMap[remixSelections.format]}\n`;
            }
            
            const fullPrompt = `${remixInstructions}\n\nOriginal Article Title: ${context.title}\n\nOriginal Article Content:\n${context.content}\n\nPlease provide a creative remix that follows the specified requirements while maintaining the core information from the original article.`;
            
            // Show loading state
            showLoading();
            
            // Use Gist API to generate remix
            const startTime = Date.now();
            const response = await createChatCompletionForGist(fullPrompt);
            const responseTime = Date.now() - startTime;
            
            // Show the remix result
            showRemixResult(response.response);
            
            // Emit analytics event
            window.dispatchEvent(new CustomEvent('openai-remix-generated', {
                detail: {
                    title: context.title,
                    customPrompt: customPrompt,
                    selections: remixSelections,
                    result: response.response,
                    responseTime: responseTime,
                    usage: response.usage,
                    type: 'text'
                }
            }));
        }
        
        async function generateRemixImage(customPrompt, context) {
            // Build image prompt based on article content and user selections
            let imagePrompt = '';
            
            if (remixSelections.format === 'meme') {
                imagePrompt = `Create a meme about: ${context.title}. `;
                
                // Add tone-specific instructions for memes
                if (remixSelections.tone === 'funny') {
                    imagePrompt += 'Make it humorous and entertaining. ';
                } else if (remixSelections.tone === 'professional') {
                    imagePrompt += 'Keep it professional but engaging. ';
                }
                
                // Add key points from article (first 200 chars)
                const shortSummary = context.content.substring(0, 200);
                imagePrompt += `Key context: ${shortSummary}... `;
                
                imagePrompt += 'Style: popular internet meme format, bold text overlay, clear and readable font, high contrast colors.';
                
            } else if (remixSelections.format === 'thumbnail') {
                imagePrompt = `Create a thumbnail image for: ${context.title}. `;
                
                // Add tone-specific instructions for thumbnails
                if (remixSelections.tone === 'funny') {
                    imagePrompt += 'Make it eye-catching and fun. ';
                } else if (remixSelections.tone === 'professional') {
                    imagePrompt += 'Make it professional and polished. ';
                } else if (remixSelections.tone === 'gist') {
                    imagePrompt += 'Make it clean and informative. ';
                }
                
                // Add style-specific instructions
                if (remixSelections.style === 'ugc') {
                    imagePrompt += 'User-generated content style, casual and authentic. ';
                } else if (remixSelections.style === 'newscast') {
                    imagePrompt += 'News broadcast style, formal and structured. ';
                }
                
                const shortSummary = context.content.substring(0, 200);
                imagePrompt += `Content focus: ${shortSummary}... `;
                
                imagePrompt += 'Style: YouTube thumbnail style, vibrant colors, compelling visual elements, professional design.';
            }
            
            // Add custom prompt if provided
            if (customPrompt) {
                imagePrompt += ` Additional requirements: ${customPrompt}`;
            }
            
            // Show loading state
            showLoading();
            
            try {
                // Use DALL-E API to generate image
                const startTime = Date.now();
                const imageResponse = await createImageWithDALLE(imagePrompt);
                const responseTime = Date.now() - startTime;
                
                // Show the image result
                showRemixImageResult(imageResponse.imageUrl, imagePrompt);
                
                // Emit analytics event
                window.dispatchEvent(new CustomEvent('gist-remix-generated', {
                    detail: {
                        title: context.title,
                        customPrompt: customPrompt,
                        selections: remixSelections,
                        imageUrl: imageResponse.imageUrl,
                        prompt: imagePrompt,
                        responseTime: responseTime,
                        type: 'image'
                    }
                }));
                
            } catch (error) {
                // If image generation fails, fall back to text description
                log('warn', 'Image generation failed, falling back to text', { error: error.message });
                
                const fallbackPrompt = `Describe in detail how to create a ${remixSelections.format} for this article: ${context.title}. Include specific visual elements, text content, and design recommendations.${customPrompt ? ` Additional requirements: ${customPrompt}` : ''}`;
                
                const response = await createChatCompletionForGist(fallbackPrompt);
                showRemixResult(`[Image generation unavailable - here's a detailed description instead]\n\n${response.response}`);
            }
        }
        
        async function createImageWithDALLE(prompt) {
            const requestBody = {
                prompt: prompt,
                size: "1024x1024",
                quality: "standard"
            };
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), WIDGET_CONFIG.TIMEOUT_MS * 2); // Longer timeout for image generation
            
            try {
                const response = await fetch(WIDGET_CONFIG.IMAGE_API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody),
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                
                if (!data.data || !data.data[0] || !data.data[0].url) {
                    throw new Error('Invalid response format from image API');
                }
                
                return {
                    imageUrl: data.data[0].url
                };
                
            } catch (error) {
                clearTimeout(timeoutId);
                throw error;
            }
        }
        
        function showRemixImageResult(imageUrl, prompt) {
            const mockAttributions = generateMockAttributions();
            
            let html = `
                <div class="gist-remix-image-result gist-content-entering">
                    <img src="${imageUrl}" alt="Generated ${remixSelections.format}" class="gist-remix-image" />
                    <div class="gist-remix-image-prompt">Generated with prompt: "${prompt}"</div>
                    <div class="gist-remix-image-actions">
                        <a href="${imageUrl}" target="_blank" class="gist-remix-image-action">View Full Size</a>
                        <a href="${imageUrl}" download class="gist-remix-image-action">Download</a>
                    </div>
                </div>
            `;
            
            // Add attribution section
            html += `
                <div class="gist-attributions gist-content-entering gist-stagger-2">
                    <div class="gist-attributions-title">Sources</div>
                    <div class="gist-attribution-bar">
            `;
            
            // Add attribution segments
            for (const attribution of mockAttributions) {
                const width = attribution.percentage * 100;
                html += `
                    <div class="gist-attribution-segment" 
                         style="width: ${width}%; background-color: ${attribution.color};"
                         title="${attribution.source}: ${(attribution.percentage * 100).toFixed(1)}%">
                    </div>
                `;
            }
            
            html += `
                    </div>
                    <div class="gist-attribution-sources">
            `;
            
            // Add source labels
            for (const attribution of mockAttributions) {
                html += `
                    <div class="gist-attribution-source">
                        <div class="gist-attribution-dot" style="background-color: ${attribution.color};"></div>
                        <span>${attribution.source} (${(attribution.percentage * 100).toFixed(1)}%)</span>
                    </div>
                `;
            }
            
            html += `
                    </div>
                    <div class="gist-source-previews">
            `;
            
            // Add source preview cards
            for (const attribution of mockAttributions) {
                const formatDate = (date) => {
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
                };
                
                html += `
                    <div class="gist-source-preview" style="--source-color: ${attribution.color};">
                        <div class="gist-source-preview-image">
                            <div class="gist-source-preview-icon">${attribution.icon}</div>
                        </div>
                        <div class="gist-source-preview-content">
                            <div class="gist-source-preview-header">
                                <div class="gist-source-preview-source">${attribution.source}</div>
                                <div class="gist-source-preview-date">${formatDate(attribution.date)}</div>
                            </div>
                            <div class="gist-source-preview-title">${attribution.title}</div>
                            <div class="gist-source-preview-description">${attribution.description}</div>
                        </div>
                        <div class="gist-source-preview-percentage">${(attribution.percentage * 100).toFixed(0)}%</div>
                    </div>
                `;
            }
            
            html += `
                    </div>
                </div>
            `;
            
            answerContent.innerHTML = html;
            hasAnswer = true;
            
            // Trigger animations
            setTimeout(() => {
                const elements = answerContent.querySelectorAll('.gist-content-entering');
                elements.forEach(el => {
                    el.classList.remove('gist-content-entering');
                    el.classList.add('gist-content-entered');
                });
                
                // Apply text reveal animation to image prompt text
                const promptText = answerContent.querySelector('.gist-remix-image-prompt');
                if (promptText) {
                    applyTextRevealAnimation(promptText);
                }
            }, 50);
        }
        
        function showRemixResult(result) {
            const mockAttributions = generateMockAttributions();
            
            let html = `
                <div class="gist-answer-text gist-content-entering">
                    ${result.replace(/\n/g, '<br>')}
                </div>
            `;
            
            // Add attribution section (same as gist)
            html += `
                <div class="gist-attributions gist-content-entering gist-stagger-2">
                    <div class="gist-attributions-title">Sources</div>
                    <div class="gist-attribution-bar">
            `;
            
            // Add attribution segments
            for (const attribution of mockAttributions) {
                const width = attribution.percentage * 100;
                html += `
                    <div class="gist-attribution-segment" 
                         style="width: ${width}%; background-color: ${attribution.color};"
                         title="${attribution.source}: ${(attribution.percentage * 100).toFixed(1)}%">
                    </div>
                `;
            }
            
            html += `
                    </div>
                    <div class="gist-attribution-sources">
            `;
            
            // Add source labels
            for (const attribution of mockAttributions) {
                html += `
                    <div class="gist-attribution-source">
                        <div class="gist-attribution-dot" style="background-color: ${attribution.color};"></div>
                        <span>${attribution.source} (${(attribution.percentage * 100).toFixed(1)}%)</span>
                    </div>
                `;
            }
            
            html += `
                    </div>
                    <div class="gist-source-previews">
            `;
            
            // Add source preview cards
            for (const attribution of mockAttributions) {
                const formatDate = (date) => {
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
                };
                
                html += `
                    <div class="gist-source-preview" style="--source-color: ${attribution.color};">
                        <div class="gist-source-preview-image">
                            <div class="gist-source-preview-icon">${attribution.icon}</div>
                        </div>
                        <div class="gist-source-preview-content">
                            <div class="gist-source-preview-header">
                                <div class="gist-source-preview-source">${attribution.source}</div>
                                <div class="gist-source-preview-date">${formatDate(attribution.date)}</div>
                            </div>
                            <div class="gist-source-preview-title">${attribution.title}</div>
                            <div class="gist-source-preview-description">${attribution.description}</div>
                        </div>
                        <div class="gist-source-preview-percentage">${(attribution.percentage * 100).toFixed(0)}%</div>
                    </div>
                `;
            }
            
            html += `
                    </div>
                </div>
            `;
            
            answerContent.innerHTML = html;
            hasAnswer = true;
            
            // Trigger animations
            setTimeout(() => {
                const elements = answerContent.querySelectorAll('.gist-content-entering');
                elements.forEach(el => {
                    el.classList.remove('gist-content-entering');
                    el.classList.add('gist-content-entered');
                });
                
                // Apply text reveal animation to remix result text
                const answerText = answerContent.querySelector('.gist-answer-text');
                if (answerText) {
                    applyTextRevealAnimation(answerText);
                }
            }, 50);
        }
        
        function showRemixError(errorMessage) {
            // Build HTML with error content (ads will be shown externally)
            let html = `
                <div class="gist-error-content gist-content-entering">
                    <div class="gist-error-title">Unable to Generate Remix</div>
                    <div class="gist-error-message">${errorMessage}</div>
                </div>
            `;
            
            answerContent.innerHTML = html;
            
            // Trigger animation
            setTimeout(() => {
                const elements = answerContent.querySelectorAll('.gist-content-entering');
                elements.forEach(el => {
                    el.classList.remove('gist-content-entering');
                    el.classList.add('gist-content-entered');
                });
                
                // Show external ads with delay
                setTimeout(() => {
                    showExternalAds();
                }, 200);
            }, 50);
        }
        
        // Extract page content for context
        function extractPageContext() {
            if (pageContext) return pageContext; // Return cached context
            
            // Try to extract main content from the page
            let content = '';
            
            // Look for common content containers
            const selectors = [
                'article',
                '.article', 
                '#article',
                'main',
                '.content',
                '#content',
                '.post',
                '.entry-content',
                '[role="main"]'
            ];
            
            let contentElement = null;
            for (const selector of selectors) {
                contentElement = document.querySelector(selector);
                if (contentElement) break;
            }
            
            // If no specific content container found, try to get the body
            if (!contentElement) {
                contentElement = document.body;
            }
            
            if (contentElement) {
                // Clone the element to avoid modifying the original
                const clone = contentElement.cloneNode(true);
                
                // Remove script tags, style tags, and other non-content elements
                const elementsToRemove = clone.querySelectorAll('script, style, nav, header, footer, aside, .widget, #gist-widget-container, #gist-widget-container');
                elementsToRemove.forEach(el => el.remove());
                
                // Get text content and clean it up
                content = clone.textContent || clone.innerText || '';
                
                // Clean up whitespace and normalize
                content = content
                    .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
                    .replace(/\n\s*\n/g, '\n') // Remove empty lines
                    .trim();
                
                // Limit content length to avoid hitting API limits
                if (content.length > 3000) {
                    content = content.substring(0, 3000) + '...';
                }
            }
            
            // Get page title
            const title = document.title || '';
            
            // Cache the context
            pageContext = {
                title: title,
                content: content,
                url: window.location.href
            };
            
            // Log context extraction for debugging
            log('debug', 'Page context extracted', { 
                titleLength: title.length, 
                contentLength: content.length,
                hasContent: content.length > 50
            });
            
            return pageContext;
        }
        
        // Initialize conversation with page context
        function initializeConversationWithContext() {
            if (conversationHistory.length === 0) {
                const context = extractPageContext();
                if (context.content) {
                    const systemMessage = {
                        role: 'system',
                        content: `You are a helpful AI assistant. You have access to the content of the current webpage the user is viewing. Use this context to provide relevant and accurate answers about the content, but you can also answer general questions beyond the page content.

Page Title: ${context.title}

Page Content:
${context.content}

Instructions:
- When users ask questions related to the page content, reference it directly
- For questions about specific details in the article, cite the relevant information
- You can also answer general questions that go beyond the page content
- Keep responses concise but informative
- If asked about sources or citations, explain that you're drawing from the current webpage content`
                    };
                    
                    conversationHistory.push(systemMessage);
                }
            }
        }
        
        // API Integration Functions
        async function createChatCompletion(userPrompt) {
            // Initialize conversation with page context (only on first message)
            initializeConversationWithContext();
            
            // Add user message to conversation history
            conversationHistory.push({ role: 'user', content: userPrompt });
            
            const requestBody = {
                model: WIDGET_CONFIG.MODEL,
                messages: conversationHistory,
                max_tokens: 500
            };
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), WIDGET_CONFIG.TIMEOUT_MS);
            
            try {
                const response = await fetch(WIDGET_CONFIG.CHAT_API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody),
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                
                if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                    throw new Error('Invalid response format from API');
                }
                
                const assistantMessage = data.choices[0].message.content;
                
                // Add assistant response to conversation history
                conversationHistory.push({ role: 'assistant', content: assistantMessage });
                
                // Keep conversation history manageable (preserve system message + last 20 messages)
                if (conversationHistory.length > 21) {
                    // Keep the system message (index 0) and the last 20 messages
                    const systemMessage = conversationHistory[0];
                    const recentMessages = conversationHistory.slice(-20);
                    conversationHistory = [systemMessage, ...recentMessages];
                }
                
                return {
                    response: assistantMessage,
                    usage: data.usage
                };
            } catch (error) {
                clearTimeout(timeoutId);
                if (error.name === 'AbortError') {
                    throw new Error('Request timed out. Please try again.');
                }
                throw error;
            }
        }
        
        function showLoading() {
            // Ensure answer container and toolbox are visible
            answerContainer.classList.add('visible');
            toolbox.classList.add('visible');
            
            answerContent.innerHTML = `
                <div class="gist-loading">
                    <div class="gist-loading-spinner"></div>
                    <div class="gist-loading-text">Thinking...</div>
                </div>
            `;
        }
        
        function showError(errorMessage) {
            // Ensure answer container and toolbox are visible
            answerContainer.classList.add('visible');
            toolbox.classList.add('visible');
            
            // First, fade out loading if it exists
            const existingLoading = answerContent.querySelector('.gist-loading');
            if (existingLoading) {
                existingLoading.classList.add('fade-out');
                setTimeout(() => {
                    showErrorContent(errorMessage);
                }, 300);
            } else {
                showErrorContent(errorMessage);
            }
        }
        
        function showErrorContent(errorMessage) {
            // Check if we're in Ask or Gist tool to show ads
            const shouldShowAds = currentTool === 'ask' || currentTool === 'gist';
            
            let html = `
                <div class="gist-error gist-content-entering">
                    <strong>Error:</strong> ${errorMessage}
                </div>
            `;
            
            answerContent.innerHTML = html;
            
            // Trigger animation
            setTimeout(() => {
                const errorElement = answerContent.querySelector('.gist-error');
                if (errorElement) {
                    errorElement.classList.remove('gist-content-entering');
                    errorElement.classList.add('gist-content-entered');
                }
                
                // Show external ads with delay if appropriate
                if (shouldShowAds) {
                    setTimeout(() => {
                        showExternalAds();
                    }, 200);
                }
            }, 50);
        }
        
        function showAnswer(answer) {
            // Mark that we have an Ask-specific answer
            hasAskAnswer = true;
            
            // Ensure answer container and toolbox are visible
            answerContainer.classList.add('visible');
            toolbox.classList.add('visible');
            
            // First, fade out loading if it exists
            const existingLoading = answerContent.querySelector('.gist-loading');
            if (existingLoading) {
                existingLoading.classList.add('fade-out');
                setTimeout(() => {
                    showAnswerContent(answer);
                }, 300); // Wait for fade out to complete
            } else {
                showAnswerContent(answer);
            }
        }
        
        function showAnswerContent(answer) {
            // Format the answer with line breaks for better readability
            const formattedAnswer = answer.replace(/\n/g, '<br>');
            
            // Generate mock attribution data
            const mockAttributions = generateMockAttributions();
            
            // Build HTML without ads (ads will be shown externally)
            let html = `<div class="gist-answer-text gist-content-entering">${formattedAnswer}</div>`;
            
            // Add attribution section
            html += `
                <div class="gist-attributions gist-content-entering gist-stagger-2">
                    <div class="gist-attributions-title">Sources</div>
                    <div class="gist-attribution-bar">
            `;
            
            // Add attribution segments
            for (const attribution of mockAttributions) {
                const width = attribution.percentage * 100;
                html += `
                    <div class="gist-attribution-segment" 
                         style="width: ${width}%; background-color: ${attribution.color};"
                         title="${attribution.source}: ${(attribution.percentage * 100).toFixed(1)}%">
                    </div>
                `;
            }
            
            html += `
                    </div>
                    <div class="gist-attribution-sources">
            `;
            
            // Add source labels
            for (const attribution of mockAttributions) {
                html += `
                    <div class="gist-attribution-source">
                        <div class="gist-attribution-dot" style="background-color: ${attribution.color};"></div>
                        <span>${attribution.source} (${(attribution.percentage * 100).toFixed(1)}%)</span>
                    </div>
                `;
            }
            
            html += `
                    </div>
                    <div class="gist-source-previews">
            `;
            
            // Add source preview cards
            for (const attribution of mockAttributions) {
                const formatDate = (date) => {
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
                };
                
                html += `
                    <div class="gist-source-preview" style="--source-color: ${attribution.color};">
                        <div class="gist-source-preview-image">
                            <div class="gist-source-preview-icon">${attribution.icon}</div>
                        </div>
                        <div class="gist-source-preview-content">
                            <div class="gist-source-preview-header">
                                <div class="gist-source-preview-source">${attribution.source}</div>
                                <div class="gist-source-preview-date">${formatDate(attribution.date)}</div>
                            </div>
                            <div class="gist-source-preview-title">${attribution.title}</div>
                            <div class="gist-source-preview-description">${attribution.description}</div>
                        </div>
                        <div class="gist-source-preview-percentage">${(attribution.percentage * 100).toFixed(0)}%</div>
                    </div>
                `;
            }
            
            html += `
                    </div>
                </div>
            `;
            
            answerContent.innerHTML = html;
            hasAnswer = true;
            
            // Trigger animations after a brief delay to ensure DOM is updated
            setTimeout(() => {
                const elements = answerContent.querySelectorAll('.gist-content-entering');
                elements.forEach(el => {
                    el.classList.remove('gist-content-entering');
                    el.classList.add('gist-content-entered');
                });
                
                // Apply text reveal animation to answer text
                const answerText = answerContent.querySelector('.gist-answer-text');
                if (answerText) {
                    applyTextRevealAnimation(answerText);
                }
                
                // Show external ads with delay
                setTimeout(() => {
                    showExternalAds();
                }, 200);

            }, 50);
        }
        
        function generateMockAds() {
            const mockAds = [
                {
                    icon: '💰',
                    iconBg: '#10b981',
                    title: 'Invest Smarter with AI',
                    description: 'Get personalized investment recommendations powered by machine learning',
                    cta: 'Start Free',
                    url: '#'
                },
                {
                    icon: '📊',
                    iconBg: '#3b82f6',
                    title: 'Market Analytics Pro',
                    description: 'Real-time market data and advanced charting tools for traders',
                    cta: 'Try Now',
                    url: '#'
                },
                {
                    icon: '🎓',
                    iconBg: '#8b5cf6',
                    title: 'Learn Finance Online',
                    description: 'Master financial concepts with interactive courses and expert guidance',
                    cta: 'Enroll',
                    url: '#'
                },
                {
                    icon: '🏦',
                    iconBg: '#f59e0b',
                    title: 'Digital Banking Plus',
                    description: 'Next-gen banking with zero fees and instant transfers worldwide',
                    cta: 'Sign Up',
                    url: '#'
                },
                {
                    icon: '📱',
                    iconBg: '#ef4444',
                    title: 'Trading App 2024',
                    description: 'Commission-free trading with advanced mobile tools and insights',
                    cta: 'Download',
                    url: '#'
                },
                {
                    icon: '🔒',
                    iconBg: '#06b6d4',
                    title: 'Secure Crypto Wallet',
                    description: 'Store and trade cryptocurrencies with military-grade security',
                    cta: 'Get Wallet',
                    url: '#'
                }
            ];
            
            // Randomly select 3 ads
            const shuffled = mockAds.sort(() => 0.5 - Math.random());
            return shuffled.slice(0, 3);
        }
        
        function createMockAdsHTML() {
            const ads = generateMockAds();
            
            let html = `
                <div class="gist-mock-ads">
                    <div class="gist-mock-ads-container">
            `;
            
            ads.forEach(ad => {
                html += `
                    <div class="gist-mock-ad" onclick="window.open('${ad.url}', '_blank')">
                        <div class="gist-mock-ad-icon" style="background: ${ad.iconBg};">
                            ${ad.icon}
                        </div>
                        <div class="gist-mock-ad-content">
                            <div class="gist-mock-ad-title">${ad.title}</div>
                            <div class="gist-mock-ad-description">${ad.description}</div>
                        </div>
                        <button class="gist-mock-ad-cta">${ad.cta}</button>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
            
            return html;
        }
        
        function showExternalAds() {
            // Only show ads if we're in Ask or Gist tool AND have actual content
            const shouldShowAds = (currentTool === 'ask' || currentTool === 'gist') && hasAnswer;
            
            if (!shouldShowAds) {
                return;
            }
            
            const adsContainer = shadowRoot.getElementById('gist-ads-container');
            if (!adsContainer) return;
            
            // Generate and insert ads HTML
            adsContainer.innerHTML = createMockAdsHTML();
            
            // Show the ads container
            adsContainer.classList.add('visible');
            
            // Animate the ads with a delay
            setTimeout(() => {
                const mockAds = adsContainer.querySelector('.gist-mock-ads');
                if (mockAds) {
                    mockAds.classList.add('visible');
                }
            }, 200);
        }
        
        function hideExternalAds() {
            const adsContainer = shadowRoot.getElementById('gist-ads-container');
            if (!adsContainer) return;
            
            // Remove visible class from both container and inner ads
            adsContainer.classList.remove('visible');
            const mockAds = adsContainer.querySelector('.gist-mock-ads');
            if (mockAds) {
                mockAds.classList.remove('visible');
            }
            
            // Clear content after transition
            setTimeout(() => {
                adsContainer.innerHTML = '';
            }, 500); // Wait for transition to complete
        }

        function generateMockAttributions() {
            // Array of possible mock sources with realistic names and rich data
            const possibleSources = [
                { 
                    name: 'Wikipedia', 
                    icon: 'W',
                    titles: [
                        'Stock market',
                        'Financial markets',
                        'Securities exchange',
                        'Capital markets',
                        'Investment banking'
                    ],
                    descriptions: [
                        'A stock market, equity market, or share market is the aggregation of buyers and sellers of stocks...',
                        'Financial markets refer to any marketplace where the trading of securities occurs...',
                        'A securities exchange facilitates the buying and selling of securities...',
                        'Capital markets allow businesses to raise long-term funding...',
                        'Investment banking involves the creation of capital for companies and governments...'
                    ]
                },
                { 
                    name: 'Stanford Research', 
                    icon: 'S',
                    titles: [
                        'Market Efficiency and Information Theory',
                        'Behavioral Finance in Modern Markets',
                        'Algorithmic Trading Strategies',
                        'Risk Management in Financial Markets',
                        'Corporate Finance and Valuation'
                    ],
                    descriptions: [
                        'Research on how quickly markets incorporate new information into stock prices...',
                        'Study of psychological factors affecting investor decision-making processes...',
                        'Analysis of computer-driven trading strategies and market impact...',
                        'Comprehensive framework for measuring and managing financial risks...',
                        'Methods for determining the intrinsic value of companies and securities...'
                    ]
                },
                { 
                    name: 'MIT OpenCourseWare', 
                    icon: 'M',
                    titles: [
                        'Financial Theory I',
                        'Introduction to Financial Markets',
                        'Mathematical Finance',
                        'Corporate Finance',
                        'Portfolio Theory and Risk Management'
                    ],
                    descriptions: [
                        'Fundamental principles of financial decision making and market operations...',
                        'Overview of financial institutions, markets, and investment instruments...',
                        'Mathematical models for pricing derivatives and managing risk...',
                        'Financial management decisions within corporations and organizations...',
                        'Modern portfolio theory and risk-return optimization techniques...'
                    ]
                },
                { 
                    name: 'Nature Journal', 
                    icon: 'N',
                    titles: [
                        'Network analysis of financial markets',
                        'Complexity science in economics',
                        'Machine learning in finance',
                        'Systemic risk in banking',
                        'Quantum computing for finance'
                    ],
                    descriptions: [
                        'Application of network theory to understand financial market interconnections...',
                        'Complex systems approach to modeling economic phenomena...',
                        'Advanced AI techniques for financial prediction and analysis...',
                        'Study of interconnected risks in the global banking system...',
                        'Exploring quantum algorithms for financial optimization problems...'
                    ]
                },
                { 
                    name: 'Scientific American', 
                    icon: 'SA',
                    titles: [
                        'The Psychology of Market Bubbles',
                        'How AI is Reshaping Finance',
                        'The Future of Digital Currency',
                        'Understanding Market Volatility',
                        'Sustainable Investment Strategies'
                    ],
                    descriptions: [
                        'Exploring the psychological factors that lead to financial bubbles...',
                        'How artificial intelligence is transforming financial services...',
                        'The evolution and potential of cryptocurrencies and digital assets...',
                        'Scientific approaches to understanding price fluctuations...',
                        'Investment strategies that consider environmental and social impact...'
                    ]
                },
                { 
                    name: 'MoneyWeek', 
                    icon: 'MW',
                    titles: [
                        'How to navigate the financial markets',
                        'Investment strategies for beginners',
                        'Market outlook and predictions',
                        'Personal finance management',
                        'Trading tips and techniques'
                    ],
                    descriptions: [
                        'Financial markets exist for one reason: they bring investors together...',
                        'Practical advice for new investors entering the stock market...',
                        'Expert analysis and forecasts for various financial markets...',
                        'Strategies for managing personal wealth and investments...',
                        'Tactical approaches to trading stocks, bonds, and other securities...'
                    ]
                },
                { 
                    name: 'Prospect Magazine', 
                    icon: 'P',
                    titles: [
                        'Making banks boring again',
                        'The future of financial regulation',
                        'Fintech disruption analysis',
                        'Central bank digital currencies',
                        'Financial inequality studies'
                    ],
                    descriptions: [
                        'A vibrant and professional financial services industry is essential to a...',
                        'Analysis of regulatory approaches to maintaining financial stability...',
                        'How technology startups are challenging traditional banking...',
                        'The potential impact of government-issued digital currencies...',
                        'Research on wealth distribution and access to financial services...'
                    ]
                },
                { 
                    name: 'Harvard Business Review', 
                    icon: 'H',
                    titles: [
                        'Strategic Asset Allocation',
                        'ESG Investing Trends',
                        'Private Equity Performance',
                        'Financial Innovation',
                        'Market Leadership Strategies'
                    ],
                    descriptions: [
                        'Best practices for long-term investment portfolio management...',
                        'Environmental, social, and governance factors in investment decisions...',
                        'Analysis of returns and strategies in private equity markets...',
                        'How technological innovation is disrupting financial services...',
                        'Leadership strategies for financial services organizations...'
                    ]
                }
            ];
            
            const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#84cc16'];
            
            // Randomly select 2-4 sources
            const numSources = Math.floor(Math.random() * 3) + 2; // 2-4 sources
            const selectedSources = [];
            const usedSources = new Set();
            
            // Generate random percentages that sum to 1
            const rawPercentages = [];
            for (let i = 0; i < numSources; i++) {
                rawPercentages.push(Math.random());
            }
            
            const sum = rawPercentages.reduce((a, b) => a + b, 0);
            const normalizedPercentages = rawPercentages.map(p => p / sum);
            
            for (let i = 0; i < numSources; i++) {
                let sourceData;
                do {
                    sourceData = possibleSources[Math.floor(Math.random() * possibleSources.length)];
                } while (usedSources.has(sourceData.name));
                
                usedSources.add(sourceData.name);
                
                // Generate random date within the last 20 years
                const randomDate = new Date();
                randomDate.setFullYear(randomDate.getFullYear() - Math.floor(Math.random() * 20));
                randomDate.setMonth(Math.floor(Math.random() * 12));
                randomDate.setDate(Math.floor(Math.random() * 28) + 1);
                
                // Pick random title and description
                const titleIndex = Math.floor(Math.random() * sourceData.titles.length);
                const descIndex = Math.floor(Math.random() * sourceData.descriptions.length);
                
                selectedSources.push({
                    source: sourceData.name,
                    icon: sourceData.icon,
                    title: sourceData.titles[titleIndex],
                    description: sourceData.descriptions[descIndex],
                    date: randomDate,
                    percentage: normalizedPercentages[i],
                    color: colors[i % colors.length]
                });
            }
            
            // Sort by percentage (largest first)
            return selectedSources.sort((a, b) => b.percentage - a.percentage);
        }
        

        
        function showPlaceholder() {
            showPlaceholderForTool(currentTool);
        }
        
        // Function to toggle answer container and toolbox
        function showAnswerContainer() {
            // Always show the container and toolbox on hover/interaction
            answerContainer.classList.add('visible');
            toolbox.classList.add('visible');
            

            
            // Expand widget and mark as interacting when showing answers
            userIsInteracting = true;
            widget.classList.add('active');
            expandWidget();
            
            // If no answer yet, show placeholder
            if (!hasAnswer) {
                showPlaceholder();
            }
        }
        
        function hideAnswerContainer() {
            if (!isActive) {
                answerContainer.classList.remove('visible');
                toolbox.classList.remove('visible');
                hideExternalAds();
            }
        }
        
        // Function to handle query submission
        async function submitQuery() {
            const query = input.value.trim();
            if (!query) return;
            
            // Only process queries when in "Ask" mode
            if (currentTool !== 'ask') {
                // Switch to Ask tool if user submits a query
                switchTool('ask');
            }
            
            // Clear any existing timeout
            if (submitTimeout) {
                clearTimeout(submitTimeout);
            }
            
            // Debounce the submission as per PRD (300ms)
            submitTimeout = setTimeout(async () => {
                try {
                    log('info', 'User submitted query', { query });
                    
                    // Ensure answer container and toolbox are visible and show loading state immediately
                    answerContainer.classList.add('visible');
                    toolbox.classList.add('visible');
                    showLoading();
                    
                    // Get chat completion from Gist
                    const startTime = Date.now();
                    const chatResponse = await createChatCompletion(query);
                    const responseTime = Date.now() - startTime;
                    
                    // Display the answer only if user is still on ask tool
                    if (currentTool === 'ask') {
                    showAnswer(chatResponse.response);
                    }
                    
                    // Clear input
                    input.value = '';
                    input.blur();
                    
                    // Emit success event for host analytics
                    window.dispatchEvent(new CustomEvent('gist-response', {
                        detail: {
                            query: query,
                            response: chatResponse.response,
                            responseTime: responseTime,
                            usage: chatResponse.usage
                        }
                    }));
                    
                } catch (error) {
                    log('error', 'Gist API request failed', { error: error.message, query });
                    
                    // Show error in answer container only if user is still on ask tool
                    if (currentTool === 'ask') {
                    showError(error.message);
                    showAnswerContainer();
                    hasAnswer = true;
                    }
                    
                    // Emit error event for host analytics
                    window.dispatchEvent(new CustomEvent('gist-error', {
                        detail: {
                            error: error.message,
                            query: query,
                            type: 'api_request'
                        }
                    }));
                }
            }, WIDGET_CONFIG.DEBOUNCE_MS);
        }
        
        // Note: Hover logic now handled by minimization/expansion functions above
        
        // Handle click to activate input
        pill.addEventListener('click', (e) => {
            e.stopPropagation();
            userIsInteracting = true;
            isActive = true;
            expandWidget();
            input.focus();
            
            // Ensure Ask tool content is shown if no other tool is active
            if (currentTool === 'ask' && !hasAskAnswer) {
                showSuggestedQuestions();
            }
        });
        
        // Handle input focus (activate state)
        input.addEventListener('focus', () => {
            isActive = true;
            userIsInteracting = true;
            expandWidget();
            showAnswerContainer();
            
            // Show Ask tool content if no answer exists
            if (currentTool === 'ask' && !hasAskAnswer) {
                showSuggestedQuestions();
            }
        });
        
        // Handle input blur (deactivate state)
        input.addEventListener('blur', () => {
            isActive = false;
            // Reset interaction state after a delay
            setTimeout(() => {
                if (!input.value.trim()) {
                    userIsInteracting = false;
                }
            }, 100);
        });
        
        // Handle input hover for auto-desktop mode on desktop devices
        input.addEventListener('mouseenter', () => {
            // Only auto-switch to desktop mode if:
            // 1. User is on a desktop device
            // 2. Not already in desktop mode
            // 3. Haven't already auto-switched in this session
            if (isDesktopDevice() && !isDesktopMode && !hasAutoSwitchedToDesktop) {
                hasAutoSwitchedToDesktop = true;
                
                // Create smooth fade out effect
                widget.style.transition = 'opacity 200ms ease-out, transform 200ms ease-out';
                widget.style.opacity = '0';
                widget.style.transform = 'translateX(-50%) translateY(10px) scale(0.95)';
                
                setTimeout(() => {
                    enableDesktopMode();
                    
                    // Create smooth fade in effect for desktop mode
                    widget.style.transition = 'opacity 300ms ease-in, transform 300ms ease-in';
                    widget.style.opacity = '1';
                    widget.style.transform = 'translateX(0) translateY(0) scale(1)';
                    
                    // Reset transition after animation completes
                    setTimeout(() => {
                        widget.style.transition = '';
                    }, 300);
                }, 200);
                
                log('debug', 'Auto-switched to desktop mode on hover with smooth fade effect');
            }
        });
        
        // Handle Enter key press
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                submitQuery();
            }
        });
        
        // Handle submit button click
        submitBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userIsInteracting = true;
            isActive = true;
            submitQuery();
        });
        
        // Handle desktop mode button click
        desktopModeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userIsInteracting = true;
            isActive = true;
            toggleDesktopMode();
        });
        
        // Handle close button click
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Minimize the widget but keep desktop mode if active
            isActive = false;
            userIsInteracting = false;
            input.blur();
            minimizeWidget();
        });
        
        // Prevent clicks on answer container from bubbling
        answerContainer.addEventListener('click', (e) => {
            e.stopPropagation();
            userIsInteracting = true;
            isActive = true;
        });
        
        // Prevent clicks on toolbox from bubbling
        toolbox.addEventListener('click', (e) => {
            e.stopPropagation();
            userIsInteracting = true;
            isActive = true;
        });
        

        
        // Handle clicking outside to minimize
        document.addEventListener('click', (e) => {
            // Check if click is outside the widget container
            if (!widgetContainer.contains(e.target)) {
                // Both normal and desktop mode: deactivate and minimize
                isActive = false;
                userIsInteracting = false;
                input.blur();
                
                // Start minimization immediately, blur will fade with the animation
                setTimeout(() => minimizeWidget(), 100);
            }
        });
        
        // Disable automatic style observer to prevent issues with complex websites
        // const styleObserver = createStyleObserver(shadowRoot);
        const styleObserver = null; // Disabled to prevent widget disappearing on complex sites
        
        // Log the applied styling for debugging
        log('info', 'Widget styling applied', { 
            websiteType, 
            extractedStyling: enhancedStyling,
            logoFound: !!enhancedStyling.logoUrl,
            faviconFound: !!enhancedStyling.faviconUrl,
            colorCount: enhancedStyling.brandColors.length
        });
        
        // Add style debugging to console for developers
        console.group('🎨 Gist Widget Styling Analysis');
        console.log('Website Type:', websiteType);
        console.log('Extracted Styling:', enhancedStyling);
        console.log('Logo URL:', enhancedStyling.logoUrl || 'Not found');
        console.log('Favicon URL:', enhancedStyling.faviconUrl || 'Not found');
        console.log('Brand Colors:', enhancedStyling.brandColors);
        console.log('Font Family:', enhancedStyling.fontFamily);
        console.groupEnd();
        
        // Trigger entrance animation after a brief delay
        setTimeout(() => {
            const widget = shadowRoot.getElementById('gist-widget');
            if (widget) {
                widget.classList.add('loaded');
            }
        }, 100);
        
        // Store references for potential future updates
        window.gistWidgetShadowRoot = shadowRoot;
        window.gistWidgetStyling = enhancedStyling;
        window.gistStyleObserver = styleObserver;
        window.gistCurrentTool = currentTool;
        window.gistSwitchTool = switchTool;
        window.gistOptimizeToolboxAlignment = optimizeToolboxAlignment;
        
        return shadowRoot;
    }
    
    // Public API for manual styling updates
    window.GistWidget = {
        // Force refresh widget styling
        refreshStyling: function() {
            if (window.gistWidgetShadowRoot) {
                updateWidgetStyling(window.gistWidgetShadowRoot);
                log('info', 'Widget styling manually refreshed');
            }
        },
        
        // Get current widget styling
        getStyling: function() {
            return window.gistWidgetStyling || null;
        },
        
        // Apply custom styling override
        applyStyling: function(customStyling) {
            if (window.gistWidgetShadowRoot && customStyling) {
                const mergedStyling = { ...window.gistWidgetStyling, ...customStyling };
                const customStyles = generateDynamicStyles(mergedStyling);
                
                const existingStyle = window.gistWidgetShadowRoot.querySelector('style');
                if (existingStyle) {
                    existingStyle.textContent = customStyles + existingStyle.textContent.split('/* ORIGINAL STYLES */')[1] || '';
                }
                
                window.gistWidgetStyling = mergedStyling;
                log('info', 'Custom styling applied', { customStyling });
            }
        },
        
        // Debug: Show styling analysis
        debugStyling: function() {
            const current = analyzeWebsiteStyling();
            console.group('🔍 Current Website Styling Analysis');
            console.log('Current Analysis:', current);
            console.log('Applied Styling:', window.gistWidgetStyling);
            console.groupEnd();
            return current;
        },
        
        // Enable/disable automatic styling updates (DISABLED to prevent issues)
        setAutoUpdate: function(enabled) {
            // Auto-update is permanently disabled to prevent widget disappearing on complex sites
            log('info', 'Auto-update styling disabled for stability', { requestedEnabled: enabled });
        },
        
        // Configure which tools are enabled/disabled
        configureTools: function(toolsConfig) {
            if (!toolsConfig || typeof toolsConfig !== 'object') {
                console.error('[GistWidget] Invalid tools configuration. Must be an object.');
                return;
            }
            
            // Update TOOLS_CONFIG with provided settings
            Object.keys(toolsConfig).forEach(tool => {
                if (TOOLS_CONFIG.hasOwnProperty(tool)) {
                    TOOLS_CONFIG[tool] = Boolean(toolsConfig[tool]);
                } else {
                    console.warn(`[GistWidget] Unknown tool '${tool}' ignored.`);
                }
            });
            
            // Regenerate tabs if widget exists
            if (window.gistWidgetShadowRoot) {
                const shadowRoot = window.gistWidgetShadowRoot;
                const toolboxTabsContainer = shadowRoot.getElementById('gist-toolbox-tabs');
                
                if (toolboxTabsContainer) {
                    // Get the generate function from the widget's scope
                    // We need to regenerate tabs based on new config
                    const toolLabels = {
                        ask: 'Ask',
                        gist: 'The Gist', 
                        remix: 'Remix',
                        share: 'Share'
                    };
                    
                    // Clear existing tabs
                    toolboxTabsContainer.innerHTML = '';
                    
                    // Get enabled tools in the desired order
                    const toolOrder = ['ask', 'gist', 'remix', 'share'];
                    const enabledTools = toolOrder.filter(tool => TOOLS_CONFIG[tool]);
                    
                    if (enabledTools.length === 0) {
                        console.error('[GistWidget] At least one tool must be enabled');
                        TOOLS_CONFIG.ask = true; // Force enable Ask as fallback
                        enabledTools.push('ask');
                    }
                    
                    // Generate tabs for enabled tools
                    enabledTools.forEach((tool, index) => {
                        const button = document.createElement('button');
                        button.className = 'gist-toolbox-tab';
                        button.setAttribute('data-tool', tool);
                        button.textContent = toolLabels[tool];
                        
                        // Make first enabled tool active if current tool is disabled
                        if (!TOOLS_CONFIG[window.gistCurrentTool] && index === 0) {
                            button.classList.add('active');
                            // We'll need to switch to this tool
                            setTimeout(() => {
                                if (window.gistSwitchTool) {
                                    window.gistSwitchTool(tool);
                                }
                            }, 100);
                        } else if (tool === window.gistCurrentTool) {
                            button.classList.add('active');
                        }
                        
                        toolboxTabsContainer.appendChild(button);
                    });
                    
                    // Re-optimize toolbox alignment
                    if (window.gistOptimizeToolboxAlignment) {
                        setTimeout(window.gistOptimizeToolboxAlignment, 100);
                    }
                    
                    log('info', 'Tools configuration updated', { enabledTools, config: TOOLS_CONFIG });
                }
            }
        },
        
        // Get current tools configuration
        getToolsConfig: function() {
            return { ...TOOLS_CONFIG };
        }
    };

    // Initialize widget when DOM is ready
    function initWidget() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', createWidget);
        } else {
            createWidget();
        }
    }
    
    // Logging function for debugging
    function log(level, msg, extra = {}) {
        if (!window.gistDebug && level === 'debug') return;
        const payload = { level, msg, ts: Date.now(), ...extra };
        console[level]("[GistWidget]", payload);
    }
    
    log('info', 'Gist Widget loader initialized');
    
    // Log available configuration options for developers
    console.group('🛠️ Gist Widget Configuration');
    console.log('Tools Configuration:');
    console.log('• TOOLS_CONFIG =', TOOLS_CONFIG);
    console.log('• GistWidget.configureTools({ remix: false, share: false })');
    console.log('• GistWidget.getToolsConfig()');
    console.log('');
    console.log('Usage Examples:');
    console.log('• TOOLS_CONFIG.remix = false  // Disable remix tool');
    console.log('• GistWidget.configureTools({ remix: false, share: false })  // Disable multiple tools');
    console.groupEnd();
    
    initWidget();
})(); 