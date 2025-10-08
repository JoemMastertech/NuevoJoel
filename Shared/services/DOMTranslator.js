import TranslationService from './TranslationService.js';


import Logger from '../utils/logger.js';

/**
 * DOM Translator
 * Manages dynamic translation of DOM elements
 * Handles automatic text identification and translation rendering
 */
class DOMTranslator {
  constructor() {
    this.translationService = TranslationService;
    this.observer = null;
    this.isInitialized = false;
    this.translatedElements = new Set();
    
    Logger.info('DOMTranslator: Initialized');
  }

  /**
   * Initialize the DOM translator
   * Sets up automatic text identification and mutation observer
   */
  initialize() {
    if (this.isInitialized) {
      Logger.warn('DOMTranslator: Already initialized');
      return;
    }

    // Identify and mark translatable elements
    this.identifyTranslatableElements();
    
    // Set up mutation observer for dynamic content
    this.setupMutationObserver();
    
    this.isInitialized = true;
    Logger.info('DOMTranslator: Initialization completed');
  }

  /**
   * Identify and mark elements that should be translatable
   * Adds data-translate attributes to relevant elements
   */
  identifyTranslatableElements() {
    // Define selectors for elements that should be translated
    const translatableSelectors = [
      'button:not([data-translate])',
      'h1:not([data-translate])',
      'h2:not([data-translate])',
      'h3:not([data-translate])',
      'h4:not([data-translate])',
      'h5:not([data-translate])',
      'h6:not([data-translate])',
      'p:not([data-translate])',
      'span.menu-text:not([data-translate])',
      'span.category-name:not([data-translate])',
      'label:not([data-translate])',
      '.language-btn:not([data-translate])',
      '.nav-btn:not([data-translate])',
      '.product-name:not([data-translate])',
      '.product-description:not([data-translate])',
      '.price-label:not([data-translate])',
      '.category-title:not([data-translate])'
    ];

    // Elements to exclude from translation
    const excludeSelectors = [
      'script',
      'style',
      'code',
      'pre',
      '[data-no-translate]',
      '.price', // Price values shouldn't be translated
      '.number', // Numeric values
      '[contenteditable="true"]' // Editable content
    ];

    translatableSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      
      elements.forEach(element => {
        // Skip if element is inside an excluded container
        if (this.isExcluded(element, excludeSelectors)) {
          return;
        }

        // Avoid translating containers that have translatable descendants
        // or critical dynamic children with IDs (to preserve inner markup)
        const hasTranslatableDescendants = element.querySelector('[data-translate]') !== null;
        const hasCriticalTotalSpan = element.querySelector('#order-total-amount') !== null;
        const hasChildWithId = Array.from(element.children || []).some(child => !!child.id);
        if (hasTranslatableDescendants || hasCriticalTotalSpan || hasChildWithId) {
          return;
        }

        // Skip if element has no meaningful text content
        const textContent = element.textContent.trim();
        if (!textContent || textContent.length < 2) {
          return;
        }

        // Skip if text is only numbers or symbols
        if (/^[\d\s\$\€\£\¥\₹\.\,\-\+\(\)]+$/.test(textContent)) {
          return;
        }

        // Generate unique text key
        const textKey = this.generateTextKey(element, textContent);
        const namespace = this.determineNamespace(element);

        // Add translation attributes
        element.setAttribute('data-translate', textKey);
        element.setAttribute('data-namespace', namespace);
        element.setAttribute('data-original-text', textContent);

        Logger.debug(`Marked for translation: ${textKey} (${namespace})`);
      });
    });
  }

  /**
   * Identify and mark a specific element for translation
   * @param {Element} element - Element to process
   */
  identifySpecificElement(element) {
    // Elements to exclude from translation
    const excludeSelectors = [
      'script',
      'style',
      'code',
      'pre',
      '[data-no-translate]',
      '.price', // Price values shouldn't be translated
      '.number', // Numeric values
      '[contenteditable="true"]' // Editable content
    ];

    // Skip if element is excluded
    if (this.isExcluded(element, excludeSelectors)) {
      return;
    }

    // Skip if element has no meaningful text content
    const textContent = element.textContent.trim();
    if (!textContent || textContent.length < 2) {
      return;
    }

    // Skip if text is only numbers or symbols
    if (/^[\d\s\$\€\£\¥\₹\.\,\-\+\(\)]+$/.test(textContent)) {
      return;
    }

    // Avoid translating containers that have translatable descendants
    // or critical dynamic children with IDs (to preserve inner markup)
    const hasTranslatableDescendants = element.querySelector('[data-translate]') !== null;
    const hasCriticalTotalSpan = element.querySelector('#order-total-amount') !== null;
    const hasChildWithId = Array.from(element.children || []).some(child => !!child.id);
    if (hasTranslatableDescendants || hasCriticalTotalSpan || hasChildWithId) {
      return;
    }

    // Check if element matches translatable criteria
    const translatableTypes = ['BUTTON', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN', 'LABEL'];
    const translatableClasses = ['menu-text', 'category-name', 'language-btn', 'nav-btn', 'product-name', 'product-description', 'price-label', 'category-title'];
    
    const isTranslatableType = translatableTypes.includes(element.tagName);
    const hasTranslatableClass = translatableClasses.some(cls => element.classList.contains(cls));
    
    if (isTranslatableType || hasTranslatableClass) {
      // Generate unique text key
      const textKey = this.generateTextKey(element, textContent);
      const namespace = this.determineNamespace(element);
      
      // Set data-translate attribute
      element.setAttribute('data-translate', `${namespace}.${textKey}`);
      element.setAttribute('data-original-text', textContent);
      
      Logger.debug(`DOMTranslator: Marked element for translation: ${namespace}.${textKey}`);
    }
  }

  /**
   * Check if element should be excluded from translation
   * @param {Element} element - Element to check
   * @param {Array} excludeSelectors - Array of selectors to exclude
   * @returns {boolean} True if element should be excluded
   */
  isExcluded(element, excludeSelectors) {
    // Check if element matches any exclude selector
    for (const selector of excludeSelectors) {
      if (element.matches(selector)) {
        return true;
      }
    }

    // Check if element is inside an excluded container
    for (const selector of excludeSelectors) {
      if (element.closest(selector)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Generate unique text key for element
   * @param {Element} element - DOM element
   * @param {string} textContent - Text content
   * @returns {string} Unique text key
   */
  generateTextKey(element) {
    // Try to use existing ID or class for consistency
    if (element.id) {
      return `${element.tagName.toLowerCase()}_${element.id}`;
    }

    // Use class names if available
    if (element.className) {
      const cleanClassName = element.className.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
      if (cleanClassName) {
        return `${element.tagName.toLowerCase()}_${cleanClassName}`;
      }
    }

    // Use parent context for better identification
    const parent = element.parentElement;
    let parentContext = '';
    
    if (parent) {
      if (parent.id) {
        parentContext = `${parent.id}_`;
      } else if (parent.className) {
        const parentClass = parent.className.split(' ')[0];
        parentContext = `${parentClass}_`;
      }
    }

    // Generate hash from text content for uniqueness
    const textHash = this.simpleHash(element.textContent.trim());
    return `${parentContext}${element.tagName.toLowerCase()}_${textHash}`;
  }

  /**
   * Determine namespace based on element context
   * @param {Element} element - DOM element
   * @returns {string} Namespace
   */
  determineNamespace(element) {
    // Check parent containers for context
    if (element.closest('.settings-menu, #settings-menu')) {
      return 'settings';
    }
    
    if (element.closest('.drawer-menu, #drawer-menu')) {
      return 'menu';
    }
    
    if (element.closest('.product-card, .product-item')) {
      return 'products';
    }
    
    if (element.closest('button')) {
      return 'buttons';
    }
    
    if (element.closest('nav, .navigation')) {
      return 'navigation';
    }
    
    if (element.matches('h1, h2, h3, h4, h5, h6')) {
      return 'headings';
    }

    return 'general';
  }

  /**
   * Simple hash function for generating unique keys
   * @param {string} str - String to hash
   * @returns {string} Hash string
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Set up mutation observer to handle dynamically added content
   */
  setupMutationObserver() {
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Process new elements
              this.processNewElement(node);
            }
          });
        }
      });
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    Logger.debug('DOMTranslator: Mutation observer set up');
  }

  /**
   * Process newly added elements
   * @param {Element} element - New element
   */
  processNewElement(element) {
    // Temporarily disconnect observer to prevent infinite loops
    if (this.observer) {
      this.observer.disconnect();
    }
    
    try {
      // Mark the new element and its children for translation
      const elementsToProcess = [element, ...element.querySelectorAll('*')];
      
      elementsToProcess.forEach(el => {
        if (el.nodeType === Node.ELEMENT_NODE && !el.hasAttribute('data-translate')) {
          // Apply identification logic only to this specific element
          this.identifySpecificElement(el);
          
          // If current language is not Spanish, translate immediately
          const currentLang = this.translationService.getCurrentLanguage();
          if (currentLang !== 'es' && el.hasAttribute('data-translate')) {
            this.translateElement(el, currentLang);
          }
        }
      });
    } finally {
      // Reconnect observer
      if (this.observer) {
        this.observer.observe(document.body, {
          childList: true,
          subtree: true
        });
      }
    }
  }

  /**
   * Translate a specific element
   * @param {Element} element - Element to translate
   * @param {string} targetLanguage - Target language
   */
  async translateElement(element, targetLanguage) {
    const textKey = element.getAttribute('data-translate');
    const namespace = element.getAttribute('data-namespace') || 'general';
    const originalText = element.getAttribute('data-original-text') || element.textContent.trim();

    if (!textKey || !originalText) {
      return;
    }

    try {
      const translatedText = await this.translationService.getTranslation(
        textKey, 
        originalText, 
        targetLanguage, 
        namespace
      );
      
      element.textContent = translatedText;
      this.translatedElements.add(element);
      
    } catch (error) {
      Logger.error(`Error translating element ${textKey}:`, error);
    }
  }

  /**
   * Translate all marked elements to target language
   * @param {string} targetLanguage - Target language code
   */
  async translateAll(targetLanguage) {
    const elements = document.querySelectorAll('[data-translate]');
    const translationPromises = Array.from(elements).map(element => 
      this.translateElement(element, targetLanguage)
    );

    await Promise.all(translationPromises);
    Logger.info(`Translated ${elements.length} elements to ${targetLanguage}`);
  }

  /**
   * Reset all elements to original language (Spanish)
   */
  resetToOriginal() {
    const elements = document.querySelectorAll('[data-translate][data-original-text]');
    
    elements.forEach(element => {
      const originalText = element.getAttribute('data-original-text');
      if (originalText) {
        element.textContent = originalText;
      }
    });

    this.translatedElements.clear();
    Logger.info('Reset all elements to original language');
  }

  /**
   * Destroy the DOM translator
   * Cleans up observers and resets state
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    this.resetToOriginal();
    this.translatedElements.clear();
    this.isInitialized = false;
    
    Logger.info('DOMTranslator: Destroyed');
  }

  /**
   * Get translation statistics
   * @returns {Object} Translation statistics
   */
  getStats() {
    const totalElements = document.querySelectorAll('[data-translate]').length;
    const translatedElements = this.translatedElements.size;
    
    return {
      totalTranslatableElements: totalElements,
      currentlyTranslated: translatedElements,
      currentLanguage: this.translationService.getCurrentLanguage()
    };
  }
}

// Export singleton instance
export default new DOMTranslator();