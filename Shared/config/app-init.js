import ScreenManager from '../../Interfaces/web/ui-adapters/screens/screen-manager.js';
/**
 * Application Initialization Module - Enhanced Version
 * Integrates legacy initialization with new comprehensive system
 * 
 * @fileoverview Enhanced application initialization with Phase 3B improvements
 * @author Master Technology Bar Development Team
 * @version 2.0.0
 * @since 2024
 * 
 * @module AppInit
 * @requires ProductRenderer for UI rendering
 * @requires SafeModal for modal management
 * @requires DIContainer for dependency injection
 * @requires AppConfig for configuration management
 * @requires errorHandler for error handling
 * @requires domUtils for DOM manipulation
 * 
 * Features:
 * - Legacy application initialization
 * - Enhanced configuration management
 * - Performance optimization integration
 * - Error handling and recovery
 * - Progressive enhancement
 * - Module integration
 */

import ProductRenderer from '../../Interfaces/web/ui-adapters/components/product-table.js';
import SafeModal from '../../Interfaces/web/ui-adapters/components/SafeModal.js';
import DIContainer from '../core/DIContainer.js';
import ProductDataAdapter from '../../Infraestructura/adapters/ProductDataAdapter.js';
import AppConfig from '../core/AppConfig.js';
// Import shared utilities
import { setSafeInnerHTML } from '../utils/domUtils.js';
import { ErrorHandler, logError, logWarning } from '../utils/errorHandler.js';
import Logger from '../utils/logger.js';
import SimpleCache from '../utils/simpleCache.js';
import { DEBUG, UI, PERFORMANCE, CACHE_KEYS } from './constants.js';
import TranslationService from '../services/TranslationService.js';

/* initial view timing in milliseconds */
const INITIAL_DELAY = 100;

/* fade animation settings */
const FADE_CONFIG = {};

const AppInit = {
  // Enhanced initialization state
  isInitialized: false,
  initializationPromise: null,
  startTime: null,
  modules: new Map(),
  isRecovering: false,
  
  // Retry mechanism for DOM elements
  retryCount: 0,
  maxRetries: 3,
  
  // Loading state to prevent concurrent calls
  isLoading: false,
  
  /**
   * Enhanced initialization method
   * Integrates with new AppConfig system while maintaining legacy functionality
   * 
   * @param {Object} [options={}] - Initialization options
   * @param {boolean} [options.enableEnhancedFeatures=true] - Enable Phase 3B features
   * @param {boolean} [options.skipLegacyInit=false] - Skip legacy initialization
   * @param {Object} [options.customConfig={}] - Custom configuration overrides
   * @returns {Promise<boolean>} Initialization success
   */
  async initialize(options = {}) {
    if (this.isInitialized) {
      Logger.info('AppInit already initialized');
      return true;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performEnhancedInitialization(options);
    return this.initializationPromise;
  },

  /**
   * Performs enhanced initialization with Phase 3B features
   * 
   * @param {Object} options - Initialization options
   * @returns {Promise<boolean>} Success status
   */
  async performEnhancedInitialization(options) {
    try {
      this.startTime = performance.now();
      Logger.info('Starting Enhanced Master Technology Bar Application...');
      
      // Clear any stale cache on app start if needed
      if (options.clearCache) {
        SimpleCache.clear();
        Logger.debug('AppInit: Cache cleared on startup');
      }
      
      // Make AppInit globally available first
      window.AppInit = this;
      
      // Phase 1: Initialize enhanced configuration system
      if (options.enableEnhancedFeatures !== false) {
        await this.initializeEnhancedConfig(options.customConfig || {});
      }
      
      // Phase 2: Initialize core systems
      await this.initializeCoreSystem();
      
      // Phase 3: Initialize legacy systems (if not skipped)
      if (!options.skipLegacyInit) {
        await this.initializeLegacySystems();
      }
      
      // Phase 4: Initialize enhanced modules
      if (options.enableEnhancedFeatures !== false) {
        await this.initializeEnhancedModules();
      }
      
      // Phase 5: Start application
      await this.startApplication();
      
      this.isInitialized = true;
      this.logInitializationSuccess();
      
      return true;
    } catch (error) {
      ErrorHandler.handle(error, 'AppInit.enhancedInitialize');
      return this.handleInitializationError(error, options);
    }
  },

  /**
   * Initializes enhanced configuration system
   * 
   * @param {Object} customConfig - Custom configuration
   * @returns {Promise<void>}
   */
  async initializeEnhancedConfig(customConfig) {
    try {
      // AppConfig is already initialized in constructor
      // Just validate the configuration
      AppConfig.validateConfiguration();
      const configSuccess = true;
      
      Logger.info('Enhanced configuration initialized');
      
      // Store reference for easy access
      this.modules.set('appConfig', AppConfig);
    } catch (error) {
      logWarning('Enhanced config initialization failed, using legacy config', error);
      // Fallback to legacy configuration
      this.initializeLegacyConfig();
    }
  },

  /**
   * Initializes core system components
   * 
   * @returns {Promise<void>}
   */
  async initializeCoreSystem() {
    // Initialize Dependency Injection Container
    this.setupDIContainer();
    
    // SafeModal auto-registers itself as 'safe-modal' when imported
    // No need to register it manually here
    
    Logger.info('Core systems initialized');
  },

  /**
   * Initializes legacy systems for backward compatibility
   * 
   * @returns {Promise<void>}
   */
  async initializeLegacySystems() {
    // Initialize legacy configuration if enhanced config failed
    if (!this.modules.has('appConfig')) {
      this.initializeLegacyConfig();
    }
    
    Logger.info('Legacy systems initialized');
  },

  /**
   * Initializes enhanced modules from Phase 3B
   * 
   * @returns {Promise<void>}
   */
  async initializeEnhancedModules() {
    try {
      // Enhanced modules initialization
      // Performance modules would be initialized here when available
      
      // Set up enhanced error handling
      this.setupEnhancedErrorHandling();
      
      // Set up performance monitoring
      if (AppConfig.get('performance.enableMonitoring')) {
        this.setupPerformanceMonitoring();
      }
      
      Logger.info('Enhanced modules initialized');
    } catch (error) {
      logWarning('Some enhanced modules failed to initialize', error);
    }
  },

  /**
   * Starts the application with enhanced features
   * 
   * @returns {Promise<void>}
   */
  async startApplication() {
    // Enhance existing modals now that DOM is ready
    this.enhanceExistingModals();
    
    // Start the welcome sequence with enhanced timing
    const delay = AppConfig.get('ui.initialDelay') || INITIAL_DELAY;
    
    setTimeout(() => {
      this.startWelcomeSequence();
      this.initializeDrawerMenu();
      
      // Initialize enhanced UI features
      this.initializeEnhancedUI();
    }, delay);
    
    Logger.info('Application started');
  },

  /**
   * Initializes legacy configuration for backward compatibility
   */
  initializeLegacyConfig() {
    // Define appConfig - Global configuration for business rules and validations
    window.appConfig = {
      validations: {
        ageCheck: {
          enabled: false // Age verification completely disabled for legal compliance
        },
        stockEnabled: false // Stock validation disabled but ready for future implementation
      }
    };
    
    Logger.info('Legacy configuration initialized');
  },

  /**
   * Sets up enhanced error handling
   */
  setupEnhancedErrorHandling() {
    // Global error handler
    window.addEventListener('error', (event) => {
      logError('Global error in AppInit context', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      });
    });
    
    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      logError('Unhandled promise rejection in AppInit context', event.reason);
      event.preventDefault();
    });
  },

  /**
   * Sets up performance monitoring
   */
  setupPerformanceMonitoring() {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              Logger.warn(`Long task in AppInit: ${entry.duration.toFixed(2)}ms`);
            }
          }
        });
        
        observer.observe({ entryTypes: ['longtask'] });
      } catch (error) {
        logWarning('Performance monitoring setup failed', error);
      }
    }
  },

  /**
   * Enhances existing modal elements with show/hide methods
   * Creates a global modal enhancement system that persists across DOM changes
   */
  enhanceExistingModals() {
    // Create a global modal enhancement function
    window.enhanceModalGlobally = function(modal) {
      if (!modal || !modal.id) {
        Logger.warn('enhanceModalGlobally: Invalid modal provided');
        return;
      }
      
      // Force add show method (always override)
      modal.show = function() {
        this.classList.remove('modal-hidden');
        this.classList.add('modal-flex');
        // Semantic open state for drink modal
        if (this.id === 'drink-options-modal' || this.classList.contains('drink-modal')) {
          this.classList.add('is-open');
        }
      };
      
      // Force add hide method (always override)
      modal.hide = function() {
        this.classList.remove('modal-flex');
        this.classList.add('modal-hidden');
        // Clear semantic open state for drink modal
        if (this.id === 'drink-options-modal' || this.classList.contains('drink-modal')) {
          this.classList.remove('is-open');
        }
      };
    };
    
    // Enhance all existing modals
    const modalElements = document.querySelectorAll('.modal');
    modalElements.forEach((modal) => {
      window.enhanceModalGlobally(modal);
    });
    
    // Set up a MutationObserver to automatically enhance new modals
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                // Check if the added node is a modal
                if (node.classList && node.classList.contains('modal')) {
                  window.enhanceModalGlobally(node);
                }
                // Check for modals within the added node
                const modalsInNode = node.querySelectorAll && node.querySelectorAll('.modal');
                if (modalsInNode) {
                  modalsInNode.forEach(modal => {
                    window.enhanceModalGlobally(modal);
                  });
                }
              }
            });
          }
        });
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  },

  /**
   * Initializes enhanced UI features
   */
  initializeEnhancedUI() {
    // Apply theme from configuration
    const theme = AppConfig.get('ui.theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    
    // Enable animations if configured
    if (AppConfig.get('ui.animations')) {
      document.documentElement.classList.add('animations-enabled');
    }
    
    // Add progressive enhancement classes
    document.documentElement.classList.add('js-enabled', 'enhanced-features');
    document.documentElement.classList.remove('no-js');
    
    Logger.info('Enhanced UI features initialized');
  },

  /**
   * Handles initialization errors with recovery
   * 
   * @param {Error} error - Initialization error
   * @param {Object} options - Original options
   * @returns {Promise<boolean>} Recovery success
   */
  async handleInitializationError(error, options) {
    logError('AppInit initialization failed, attempting recovery', error);
    
    // Prevent multiple recovery attempts
    if (this.isRecovering) {
      Logger.warn('Recovery already in progress, skipping duplicate attempt');
      return false;
    }
    
    this.isRecovering = true;
    
    try {
      // Try fallback initialization without enhanced features
      if (options.enableEnhancedFeatures !== false) {
        Logger.info('Attempting fallback initialization...');
        const result = await this.performEnhancedInitialization({
          ...options,
          enableEnhancedFeatures: false
        });
        this.isRecovering = false;
        return result;
      }
      
      // Last resort: basic legacy initialization
      Logger.info('Attempting basic legacy initialization...');
      this.basicLegacyInitialize();
      this.isRecovering = false;
      return true;
    } catch (fallbackError) {
      logError('All initialization attempts failed', fallbackError);
      this.isRecovering = false;
      return false;
    }
  },

  /**
   * Basic legacy initialization as last resort
   */
  basicLegacyInitialize() {
    // Make AppInit globally available
    window.AppInit = this;
    
    // Initialize basic DI container
    this.setupDIContainer();
    
    // Initialize legacy config
    this.initializeLegacyConfig();
    
    // SafeModal auto-registers itself as 'safe-modal' when imported
    // No manual registration needed
    
    // Start basic welcome sequence
    setTimeout(() => {
      try {
        this.startWelcomeSequence();
        this.initializeDrawerMenu();
      } catch (error) {
        logError('Basic initialization failed', error);
      }
    }, INITIAL_DELAY);
    
    this.isInitialized = true;
    Logger.info('Basic legacy initialization completed');
  },

  /**
   * Logs initialization success with statistics
   */
  logInitializationSuccess() {
    const endTime = performance.now();
    const totalTime = endTime - this.startTime;
    
    Logger.info('Enhanced AppInit initialization completed successfully!', {
      totalTime: `${totalTime.toFixed(2)}ms`,
      modules: Array.from(this.modules.keys()).length
    });
    
    if (AppConfig.get && AppConfig.get('ui.debugMode')) {
       Logger.debug('Initialization modules', Array.from(this.modules.keys()));
       // Logger.debug('AppConfig stats', AppConfig.getStats()); // Method doesn't exist
      Logger.debug('SimpleCache stats', SimpleCache.getStats());
    }
    
    // Emit event to notify other components that initialization is complete
    const event = new CustomEvent('app-init-complete', {
      detail: {
        totalTime,
        modules: Array.from(this.modules.keys()),
        timestamp: Date.now()
      }
    });
    document.dispatchEvent(event);
    Logger.debug('app-init-complete event dispatched');
  },

  /**
   * Gets module instance
   * 
   * @param {string} moduleName - Module name
   * @returns {*} Module instance or null
   */
  getModule(moduleName) {
    return this.modules.get(moduleName) || null;
  },

  /**
   * Gets initialization statistics
   * 
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      isInitialized: this.isInitialized,
      initializationTime: this.startTime ? performance.now() - this.startTime : 0,
      modules: Array.from(this.modules.keys()),
      hasEnhancedConfig: this.modules.has('appConfig'),
      appConfigStats: this.modules.has('appConfig') ? 'Available' : null
    };
  },
  
  startWelcomeSequence: function() {
    ScreenManager.startWelcomeSequence();
  },
  
  initializeDrawerMenu: function() {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const drawerMenu = document.getElementById('drawer-menu');
    const drawerOverlay = document.getElementById('drawer-overlay');
    const drawerContent = document.querySelector('.drawer-content');
    
    // Add logo at the top of the drawer
    const logoContainer = document.createElement('div');
    logoContainer.className = 'drawer-logo-container';
    const logoImage = document.createElement('img');
    logoImage.src = 'https://udtlqjmrtbcpdqknwuro.supabase.co/storage/v1/object/public/productos/recursos/logos/Logo5.webp';
    logoImage.alt = 'Master Technology Bar Logo';
    logoImage.className = 'drawer-logo';
    logoContainer.appendChild(logoImage);
    drawerContent.appendChild(logoContainer);
    
    // Define navigation items with their content types
    const navigationItems = [
      { label: 'Coctelería', target: 'cocteleria' },
      { label: 'Refrescos', target: 'refrescos' },
      { label: 'Licores', target: 'licores' },
      { label: 'Cervezas', target: 'cervezas' },
      { label: 'Pizzas', target: 'pizzas' },
      { label: 'Alitas', target: 'alitas' },
      { label: 'Sopas', target: 'sopas' },
      { label: 'Ensaladas', target: 'ensaladas' },
      { label: 'Carnes', target: 'carnes' },
      { label: 'Café', target: 'cafe' },
      { label: 'Postres', target: 'postres' },
      { label: 'Órdenes', action: 'orders' },
      { label: 'Crear orden', action: 'createOrder' }
    ];
    
    // Create menu items with translation attributes
    navigationItems.forEach(item => {
      const button = document.createElement('button');
      button.className = 'nav-button';
      button.textContent = item.label;

      if (item.target) {
        button.setAttribute('data-target', item.target);
      }

      if (item.action) {
        button.setAttribute('data-action', item.action);
      }

      // Define a stable translation key based on target/action
      const keySuffix = item.action
        ? (item.action === 'createOrder' ? 'create_order' : item.action)
        : item.target;
      const textKey = `menu.${keySuffix}`;

      // Set translation attributes so DOMTranslator respects them
      button.setAttribute('data-translate', textKey);
      button.setAttribute('data-namespace', 'menu');
      button.setAttribute('data-original-text', item.label);

      // Translate immediately if current language is not Spanish
      try {
        const currentLang = TranslationService.getCurrentLanguage();
        if (currentLang && currentLang !== 'es') {
          // Use TranslationService directly for immediate translation
          TranslationService.getTranslation(textKey, item.label, currentLang, 'menu')
            .then(translated => {
              button.textContent = translated || item.label;
            })
            .catch(() => {
              // Fallback: keep original
              button.textContent = item.label;
            });
        }
      } catch (e) {
        Logger.warn('TranslationService not ready; using original text for menu button', e);
      }

      drawerContent.appendChild(button);
    });
    
    // Add footer with registered trademark
    const footerContainer = document.createElement('div');
    footerContainer.className = 'drawer-footer';
    // Asignación segura: cadena estática sin riesgo XSS
    footerContainer.innerHTML = '® MasterTechnologyBar.com';
    drawerContent.appendChild(footerContainer);
    
    // Toggle drawer menu on hamburger button click
    hamburgerBtn.addEventListener('click', () => {
      drawerMenu.classList.toggle('open');
      drawerOverlay.classList.toggle('active');
    });
    
    // Close drawer when clicking overlay
    drawerOverlay.addEventListener('click', () => {
      drawerMenu.classList.remove('open');
      drawerOverlay.classList.remove('active');
    });
    
    // Menu item click handlers
    const menuButtons = drawerMenu.querySelectorAll('.nav-button');
    menuButtons.forEach(button => {
      button.addEventListener('click', async () => {
        const target = button.getAttribute('data-target');
        const action = button.getAttribute('data-action');
        
        // Clear active state from all buttons
        menuButtons.forEach(btn => btn.classList.remove('active'));
        
        // Set active state on clicked button
        button.classList.add('active');
        
        // Close the drawer
        drawerMenu.classList.remove('open');
        drawerOverlay.classList.remove('active');
        
        // Execute the appropriate action
        if (target) {
          await this.loadContent(target);
        } else if (action === 'orders') {
          // Call the order system's show orders function
          const OrderSystem = window.OrderSystem;
          if (OrderSystem) {
            OrderSystem.showOrdersScreen();
          }
        } else if (action === 'createOrder') {
          // Call the order system's toggle order mode function
          const OrderSystem = window.OrderSystem;
          if (OrderSystem) {
            OrderSystem.toggleOrderMode();
          }
        }
      });
    });
    
    // Set first button as active by default
    if (menuButtons && menuButtons.length > 0) {
      const defaultButton = menuButtons[0];
      if (defaultButton && defaultButton.classList) {
        defaultButton.classList.add('active');
      }
    };
  },
  
  /**
   * Ensures the main screen is visible by removing hidden class
   * Used as a fallback when DOM elements are not found
   */
  ensureMainScreenVisible: function(contentType) {
    Logger.info(`[NAVIGATION DEBUG] ensureMainScreenVisible called with contentType: ${contentType}`);
    
    setTimeout(() => {
      Logger.info(`[NAVIGATION DEBUG] ensureMainScreenVisible timeout executed`);
      
      const mainScreen = document.querySelector('.main-content-screen') || 
                        document.querySelector('[data-category]');
      
      Logger.info(`[NAVIGATION DEBUG] ensureMainScreenVisible - element search:`, {
        mainScreenFound: !!mainScreen,
        mainScreenClasses: mainScreen?.className,
        mainScreenDisplay: mainScreen ? getComputedStyle(mainScreen).display : 'N/A',
        mainScreenVisibility: mainScreen ? getComputedStyle(mainScreen).visibility : 'N/A'
      });
      
      if (mainScreen) {
        Logger.info(`[NAVIGATION DEBUG] Attempting to make mainScreen visible`);
        
        const beforeClasses = mainScreen.className;
        mainScreen.classList.remove('screen-hidden');
        mainScreen.classList.add('screen-visible');
        const afterClasses = mainScreen.className;
        
        Logger.info(`[NAVIGATION DEBUG] Class changes:`, {
          before: beforeClasses,
          after: afterClasses,
          displayAfter: getComputedStyle(mainScreen).display,
          visibilityAfter: getComputedStyle(mainScreen).visibility
        });
        
        // Screen visibility fixed, but not retrying loadContent to avoid recursion
        Logger.info(`[NAVIGATION DEBUG] Screen visibility fixed, but stopping here to avoid recursion`);
        this.isLoading = false; // Release lock
      } else {
        Logger.error(`[NAVIGATION DEBUG] MainScreen still not found in ensureMainScreenVisible`);
        
        // Log all available elements for debugging
        const allElements = document.querySelectorAll('*');
        const screenElements = Array.from(allElements).filter(el => 
          el.className && (el.className.includes('screen') || el.className.includes('content'))
        );
        
        Logger.info(`[NAVIGATION DEBUG] Available screen/content elements:`, 
          screenElements.map(el => ({
            tag: el.tagName,
            id: el.id,
            classes: el.className,
            display: getComputedStyle(el).display
          }))
        );
        
        logError('Cannot find main screen element to make visible');
      }
    }, 100);
  },
  
  /**
   * Loads and renders content based on the specified category
   * Handles content switching with smooth transitions and proper state management
   * @param {string} contentType - The category of content to load (cocteleria, refrescos, etc.)
   */
  loadContent: async function(contentType = 'cocteleria') {
    // Prevent concurrent calls
    if (this.isLoading) {
      Logger.warn(`[NAVIGATION DEBUG] loadContent already in progress, ignoring call for: ${contentType}`);
      return;
    }
    
    // Check if user is actively navigating (DOM is being modified)
    const isUserNavigating = this.checkUserNavigation();
    if (isUserNavigating && contentType === 'cocteleria') {
      Logger.info('🚫 User navigation detected, skipping automatic cocteleria load');
      return;
    }
    
    this.isLoading = true;
    Logger.info(`[NAVIGATION DEBUG] loadContent called with contentType: ${contentType}`);
    Logger.info(`[NAVIGATION DEBUG] Current URL: ${window.location.href}`);
    Logger.info(`[NAVIGATION DEBUG] Current retry count: ${this.retryCount || 0}`);
    
    const contentContainer = document.getElementById('content-container');
    const pageTitle = document.querySelector('.page-header .page-title');
    // Use a more robust selector that finds the element even if hidden
    const mainScreen = document.querySelector('.main-content-screen') || document.querySelector('[data-category]');
    const hamburgerBtn = document.getElementById('hamburger-btn');
    
    // Log detailed element states
    Logger.info(`[NAVIGATION DEBUG] Element search results:`, {
      contentContainer: {
        found: !!contentContainer,
        id: contentContainer?.id,
        classes: contentContainer?.className,
        display: contentContainer ? getComputedStyle(contentContainer).display : 'N/A',
        visibility: contentContainer ? getComputedStyle(contentContainer).visibility : 'N/A'
      },
      mainScreen: {
        found: !!mainScreen,
        classes: mainScreen?.className,
        display: mainScreen ? getComputedStyle(mainScreen).display : 'N/A',
        visibility: mainScreen ? getComputedStyle(mainScreen).visibility : 'N/A',
        hasScreenHidden: mainScreen?.classList.contains('screen-hidden'),
        hasScreenVisible: mainScreen?.classList.contains('screen-visible')
      }
    });
    
    // Log all elements with relevant classes for debugging
    const allScreens = document.querySelectorAll('[class*="screen"]');
    Logger.info(`[NAVIGATION DEBUG] All screen elements found: ${allScreens.length}`);
    allScreens.forEach((screen, index) => {
      Logger.info(`[NAVIGATION DEBUG] Screen ${index}:`, {
        classes: screen.className,
        id: screen.id,
        display: getComputedStyle(screen).display,
        visibility: getComputedStyle(screen).visibility
      });
    });
    
    // Additional debugging right before validation
    Logger.info(`[NAVIGATION DEBUG] Pre-validation check:`, {
      contentContainer: {
        exists: !!contentContainer,
        isNull: contentContainer === null,
        isUndefined: contentContainer === undefined,
        type: typeof contentContainer
      },
      mainScreen: {
        exists: !!mainScreen,
        isNull: mainScreen === null,
        isUndefined: mainScreen === undefined,
        type: typeof mainScreen,
        nodeType: mainScreen?.nodeType,
        parentNode: !!mainScreen?.parentNode
      }
    });
    
    // Additional debugging for mainScreen validation issue
    Logger.info(`[NAVIGATION DEBUG] Validation check details:`, {
      contentContainer: {
        exists: !!contentContainer,
        truthyCheck: !contentContainer,
        actualValue: contentContainer
      },
      mainScreen: {
        exists: !!mainScreen,
        truthyCheck: !mainScreen,
        actualValue: mainScreen,
        isElement: mainScreen instanceof Element,
        nodeType: mainScreen?.nodeType
      }
    });
    
    if (!contentContainer || !mainScreen) {
      Logger.warn(`[NAVIGATION DEBUG] Required DOM elements not found, retrying in 100ms... (attempt ${(this.retryCount || 0) + 1})`);
      Logger.warn('[NAVIGATION DEBUG] Missing elements:', {
        contentContainer: !!contentContainer,
        mainScreen: !!mainScreen
      });
      
      // Retry once after a short delay, but limit retries to prevent infinite loops
      if (!this.retryCount) this.retryCount = 0;
      if (this.retryCount < 3) {
        this.retryCount++;
        setTimeout(() => {
          const retryContainer = document.getElementById('content-container');
          const retryMainScreen = document.querySelector('.main-content-screen') || document.querySelector('[data-category]');
          
          Logger.info(`[NAVIGATION DEBUG] Retry ${this.retryCount} - Element check:`, {
            retryContainer: !!retryContainer,
            retryMainScreen: !!retryMainScreen
          });
          
          if (!retryContainer || !retryMainScreen) {
            logError('Required DOM elements still not found after retry ' + this.retryCount);
            this.isLoading = false; // Release lock on error
            if (this.retryCount >= 3) {
              Logger.error(`[NAVIGATION DEBUG] Max retries reached. Attempting recovery...`);
              // Reset retry count and try to show the main screen
              this.retryCount = 0;
              this.ensureMainScreenVisible();
            }
            return;
          }
          
          // Elements found in retry, but not calling loadContent recursively to avoid concurrency issues
          Logger.info(`[NAVIGATION DEBUG] Elements found in retry, releasing lock`);
          this.isLoading = false; // Release lock
        }, 100);
        return;
      } else {
        Logger.error(`[NAVIGATION DEBUG] Max retries reached. Attempting recovery...`);
        // Reset retry count and try to show the main screen
        this.retryCount = 0;
        this.ensureMainScreenVisible();
        return;
      }
    }
    
    // Reset retry count on successful element finding
    this.retryCount = 0;
    
    Logger.info(`[NAVIGATION DEBUG] Elements found successfully. Processing visibility...`);
    
    // Ensure main screen is visible
    if (mainScreen.classList.contains('screen-hidden')) {
      Logger.info(`[NAVIGATION DEBUG] MainScreen was hidden, making it visible`);
      mainScreen.classList.remove('screen-hidden');
      mainScreen.classList.add('screen-visible');
    } else {
      Logger.info(`[NAVIGATION DEBUG] MainScreen visibility state:`, {
        hasScreenHidden: mainScreen.classList.contains('screen-hidden'),
        hasScreenVisible: mainScreen.classList.contains('screen-visible'),
        allClasses: mainScreen.className
      });
    }

    // Ensure contentType is valid - Fallback to default if invalid category provided
    contentType = this.validateContentType(contentType);
    
    // Update data-category attribute - Important for CSS styling and order system logic
    mainScreen.setAttribute('data-category', contentType);
    
    // No longer needed as title is integrated in tables
    if (pageTitle) {
      pageTitle.classList.add('page-title-hidden');
      pageTitle.classList.remove('page-title-visible');
    }

    contentContainer.classList.add('opacity-0');
    contentContainer.classList.remove('opacity-1');
    
    setTimeout(async () => {
      // Preserve sidebar while clearing content
      const sidebar = document.getElementById('order-sidebar');
      const sidebarHTML = sidebar ? sidebar.outerHTML : null;
      
      // Clear only the content, not the entire container structure
      const actualContentContainer = document.getElementById('content-container');
      if (actualContentContainer) {
        // Only clear the content container, leaving sidebar intact
        actualContentContainer.innerHTML = '';
      } else {
        // If content-container doesn't exist, clear main container but preserve sidebar
        contentContainer.innerHTML = '';
        if (sidebarHTML) {
          contentContainer.insertAdjacentHTML('beforeend', sidebarHTML);
        }
      }
      
      const success = await this.initializeContent(contentType, actualContentContainer || contentContainer);
      
      if (success) {
        contentContainer.classList.add('opacity-1');
        contentContainer.classList.remove('opacity-0');
        
        // Hamburger button position is now fixed via CSS - no dynamic repositioning needed
        
        // Dispatch event to notify that content initialization is complete
        document.dispatchEvent(new CustomEvent('app-content-ready', {
          detail: { contentType }
        }));
      }
    }, 50);
    
    // Update active state in drawer menu
    const drawerButtons = document.querySelectorAll('#drawer-menu .nav-button');
    if (drawerButtons) {
      drawerButtons.forEach(btn => {
        if (btn && btn.classList) {
          const btnTarget = btn.getAttribute('data-target');
          if (btnTarget === contentType) {
            btn.classList.add('active');
          } else {
            btn.classList.remove('active');
          }
        }
      });
    }
    
    // Always release the loading lock
    this.isLoading = false;
  },
  
  validateContentType: function(contentType) {
    const validTypes = [
      'cocteleria', 'refrescos', 'licores', 'cervezas', 
      'pizzas', 'alitas', 'sopas', 'ensaladas', 
      'carnes', 'cafe', 'postres'
    ];
    
    return validTypes.includes(contentType) ? contentType : 'cocteleria';
  },
  
  getContentTypes: function() {
    return [
      'cocteleria', 'refrescos', 'licores', 'cervezas', 
      'pizzas', 'alitas', 'sopas', 'ensaladas', 
      'carnes', 'cafe', 'postres'
    ];
  },
  
  getCategoryTitle: function(contentType) {
    // Ensure contentType is not null/undefined
    if (!contentType) {
      return 'Coctelería';
    }
    
    // Map content type to display title
    const titles = {
      'cocteleria': 'Coctelería',
      'refrescos': 'Refrescos',
      'licores': 'Licores',
      'cervezas': 'Cervezas',
      'pizzas': 'Pizzas',
      'alitas': 'Alitas',
      'sopas': 'Sopas',
      'ensaladas': 'Ensaladas',
      'carnes': 'Carnes',
      'cafe': 'Café',
      'postres': 'Postres'
    };
    
    return titles[contentType] || contentType.charAt(0).toUpperCase() + contentType.slice(1);
  },

  initializeContent: async function(contentType, container) {
    if (!container) return false;
    
    // Always work with content-container to preserve sidebar structure
    let targetContainer = document.getElementById('content-container');
    
    if (!targetContainer) {
      // Create content-container within the proper structure
      const flexContainer = document.querySelector('.content-container-flex');
      if (flexContainer) {
        targetContainer = document.createElement('div');
        targetContainer.id = 'content-container';
        const existingSidebar = flexContainer.querySelector('#order-sidebar');
        if (existingSidebar) {
          flexContainer.insertBefore(targetContainer, existingSidebar);
        } else {
          flexContainer.appendChild(targetContainer);
        }
      } else {
        // Fallback: create the entire structure if missing
        targetContainer = document.createElement('div');
        targetContainer.id = 'content-container';
        container.appendChild(targetContainer);
      }
    } else {
      // Simply clear the existing content-container
      targetContainer.innerHTML = '';
    }
    
    container = targetContainer;
    
    try {
      switch(contentType) {
        case 'cocteleria':
          await ProductRenderer.renderCocktails(container);
          break;
        case 'refrescos':
          await ProductRenderer.renderRefrescos(container);
          break;
        case 'licores':
          await ProductRenderer.renderLicores(container);
          break;
        case 'cervezas':
          await ProductRenderer.renderCervezas(container);
          break;
        case 'pizzas':
          await ProductRenderer.renderPizzas(container);
          break;
        case 'alitas':
          await ProductRenderer.renderAlitas(container);
          break;
        case 'sopas':
          await ProductRenderer.renderSopas(container);
          break;
        case 'ensaladas':
          await ProductRenderer.renderEnsaladas(container);
          break;
        case 'carnes':
          await ProductRenderer.renderCarnes(container);
          break;
        case 'cafe':
          await ProductRenderer.renderCafe(container);
          break;
        case 'postres':
          await ProductRenderer.renderPostres(container);
          break;
        default:
          logWarning(`Contenido no disponible para: ${contentType}`);
          setSafeInnerHTML(container, '<p>Contenido no disponible</p>');
          return false;
      }
      
      // Initialize ProductRenderer event delegation after content is rendered
      ProductRenderer.initEventDelegation();
      
      return true;
    } catch (err) {
      logError('Error loading content', err);
      setSafeInnerHTML(container, '<p>Error cargando contenido</p>');
      return false;
    }
  },

  /**
   * Checks if user is actively navigating by detecting recent DOM changes
   * @returns {boolean} True if user navigation is detected
   */
  checkUserNavigation: function() {
    // Check if drawer menu is open (user is selecting)
    const drawerMenu = document.getElementById('drawer-menu');
    if (drawerMenu && drawerMenu.classList.contains('open')) {
      return true;
    }
    
    // Check if any navigation button was recently clicked
    const activeButtons = document.querySelectorAll('.nav-button.active');
    if (activeButtons.length > 0) {
      const lastActiveButton = activeButtons[activeButtons.length - 1];
      const target = lastActiveButton.getAttribute('data-target');
      // If active button is not cocteleria, user is navigating
      if (target && target !== 'cocteleria') {
        return true;
      }
    }
    
    return false;
  },

  /**
   * Setup Dependency Injection Container
   * Simplified version - using monolithic system instead of modular services
   */
  setupDIContainer: function() {
    // Create minimal DI container for ProductDataAdapter only
    window.container = new DIContainer();
    
    // Register AppConfig as singleton
    window.container.singleton('AppConfig', () => {
      return AppConfig;
    });
    
    // Register ProductRepository as singleton (still used by some components)
    window.container.singleton('ProductRepository', () => {
      return new ProductDataAdapter();
    });

    Logger.info('DI Container initialized (simplified)');
  }
};

export default AppInit;