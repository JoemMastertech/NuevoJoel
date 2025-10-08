import OrderSystemCore from './../../../../Aplicacion/services/OrderCore.js';
import { formatPrice } from './../../../../Shared/utils/formatters.js';
import { getProductRepository } from './../../../../Shared/utils/diUtils.js';
import { setSafeInnerHTML, showModal, hideModal } from './../../../../Shared/utils/domUtils.js';
import { ErrorHandler, logError, logWarning, handleMissingElementError } from './../../../../Shared/utils/errorHandler.js';
import { calculateTotalDrinkCount, calculateTotalJuiceCount, calculateTotalJagerDrinkCount, isJuiceOption } from './../../../../Shared/utils/calculationUtils.js';
import Logger from './../../../../Shared/utils/logger.js';
import { OrderSystemValidations } from './order-system-validations.js';

// Simple hash to generate stable keys per text (match product-table)
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// Constants
const CONSTANTS = {
  MAX_DRINK_COUNT: 5,
  MAX_JUICE_COUNT: 2,
  SPECIAL_PRODUCTS: {
    NO_MODAL: ['HIPNOTIQ', 'BAILEYS'],
    JAGER: 'JAGERMEISTER',
    SPECIAL_RON: ['BACARDI MANGO', 'BACARDI RASPBERRY', 'MALIBU']
  },
  CATEGORIES: {
    FOOD: ['pizzas', 'alitas', 'sopas', 'ensaladas'],
    MEAT: 'carnes',
    DIGESTIVOS: 'digestivos',
    ESPUMOSOS: 'espumosos'
  },
  PRICE_TYPES: {
    BOTTLE: 'precioBotella',
    LITER: 'precioLitro',
    CUP: 'precioCopa'
  },
  SELECTORS: {
    ORDER_BTN: 'complete-order-btn',
    CANCEL_BTN: 'cancel-order-btn',
    SIDEBAR: 'order-sidebar',
    TABLES: '.product-table, .liquor-table, .product-grid'
  },
  MESSAGES: {
    SPECIAL: "Puedes elegir: 2 Jarras de jugo ó 5 Refrescos ó 1 Jarra de jugo y 2 Refrescos",
    ONLY_SODAS: "Puedes elegir hasta 5 refrescos",
    DEFAULT: "Puedes elegir hasta 5 acompañamientos",
    NO_REFRESCOS: "Este producto no incluye refrescos"
  },
  PRODUCT_OPTIONS: {
    RON: ['Mineral', 'Coca', 'Manzana'],
    TEQUILA: ['Mineral', 'Toronja', 'Botella de Agua', 'Coca'],
    BRANDY: ['Mineral', 'Coca', 'Manzana'],
    WHISKY: ['Mineral', 'Manzana', 'Ginger ale', 'Botella de Agua'],
    VODKA: ['Jugo de Piña', 'Jugo de Uva', 'Jugo de Naranja', 'Jugo de Arándano', 'Jugo de Mango', 'Jugo de Durazno', 'Mineral', 'Quina'],
    GINEBRA: ['Jugo de Piña', 'Jugo de Uva', 'Jugo de Naranja', 'Jugo de Arándano', 'Jugo de Mango', 'Jugo de Durazno', 'Mineral', 'Quina'],
    MEZCAL: ['Mineral', 'Toronja'],
    COGNAC: ['Mineral', 'Coca', 'Manzana', 'Botella de Agua'],
    DEFAULT: ['Mineral', 'Agua', 'Coca', 'Manzana']
  }
};
class OrderSystem {
  constructor(productRepository = null) {
    this.productRepository = productRepository;
    this.isInitialized = false;
    this.core = null;
    this.currentProduct = null;
    this.currentCategory = null;
    this.isOrderMode = false;
    this.selectedDrinks = [];
    this.drinkCounts = {};
    this.maxDrinkCount = CONSTANTS.MAX_DRINK_COUNT;
    this.bottleCategory = null;
    this.selectedCookingTerm = null;
    this.previousCategory = null;
    this.previousTitle = null;
    this.isShowingHistory = false;
    
    // Initialize cleanup function to avoid undefined errors
    this._cleanupFixedButton = function() {
      console.log("Default cleanup - no button to clean");
    };
    
    // Phase 3: Event delegation setup
    this.eventDelegationInitialized = false;
    this.boundDelegatedHandler = this.handleDelegatedEvent.bind(this);
  }

  _showModal(modalId) { showModal(modalId); }
  _hideModal(modalId) { hideModal(modalId); }

  _ensureProductRepository() {
    if (!this.productRepository) {
      try {
        this.productRepository = getProductRepository();
        this.isInitialized = true;
      } catch (error) {
        logError('Failed to initialize product repository', error);
        throw error;
      }
    }
  }

  initialize() {
    window.OrderSystem = this;
    this.core = new OrderSystemCore();
    
    try {
      this._ensureProductRepository();
    } catch (error) {
      logWarning('Product repository not available yet, will initialize on first use', error);
    }
    
    // Phase 3: Initialize centralized event delegation
    this.initEventDelegation();
    
    // Initialize mobile orientation listener
    this._initOrientationListener();
  }
  
  // Phase 3: Centralized event delegation system
  initEventDelegation() {
    if (this.eventDelegationInitialized) return;
    
    // Single document-level event listener for all interactions
    document.addEventListener('click', this.boundDelegatedHandler);
    this.eventDelegationInitialized = true;
    
    Logger.debug('OrderSystem event delegation initialized');
  }
  
  handleDelegatedEvent(event) {
    const target = event.target;
    
    // Handle order completion button
    if (target.id === CONSTANTS.SELECTORS.ORDER_BTN) {
      event.preventDefault();
      this.completeOrder();
      return;
    }
    
    // Handle cancel/toggle order button
    if (target.id === CONSTANTS.SELECTORS.CANCEL_BTN) {
      event.preventDefault();
      this.toggleOrderMode();
      return;
    }
    
    // Handle modal confirm/cancel buttons
    if (target.id === 'confirm-drinks-btn') {
      event.preventDefault();
      this.confirmDrinkOptions();
      return;
    }
    
    if (target.id === 'cancel-drinks-btn') {
      event.preventDefault();
      this.cancelProductSelection();
      return;
    }
    
    // Handle food modal buttons
    if (target.id === 'keep-ingredients-btn') {
      event.preventDefault();
      this._addFoodToOrder('Con todos los ingredientes');
      return;
    }
    
    if (target.id === 'customize-ingredients-btn') {
      event.preventDefault();
      this._showIngredientsInput();
      return;
    }
    
    if (target.id === 'confirm-ingredients-btn') {
      event.preventDefault();
      this._confirmIngredientCustomization();
      return;
    }
    
    if (target.id === 'cancel-ingredients-btn') {
      event.preventDefault();
      this.cancelProductSelection();
      return;
    }
    
    // Handle meat modal buttons
    if (target.id === 'change-garnish-btn') {
      event.preventDefault();
      this._showGarnishInput();
      return;
    }
    
    if (target.id === 'keep-garnish-btn') {
      event.preventDefault();
      this._addMeatToOrder('Guarnición estándar');
      return;
    }
    
    if (target.id === 'confirm-garnish-btn') {
      event.preventDefault();
      this._confirmGarnishCustomization();
      return;
    }
    
    if (target.id === 'cancel-garnish-btn') {
      event.preventDefault();
      this.cancelProductSelection();
      return;
    }
    
    // Handle counter buttons
    if (target && target.classList && target.classList.contains('counter-btn')) {
      event.preventDefault();
      this.handleCounterButton(target);
      return;
    }
    
    // Handle drink option buttons
    if (target && target.classList && target.classList.contains('drink-option')) {
      event.preventDefault();
      this.handleDrinkOptionButton(target);
      return;
    }
    
    // Handle jager boost checkbox
    if (target.id === 'boost-option') {
      this.handleBoostOption(target);
      return;
    }
    
    // Handle price buttons: if order mode is off, activate it and proceed
    if (target && target.classList && target.classList.contains('price-button')) {
      // Auto-activate order mode to ensure adding products works from price click
      if (!this.isOrderMode) {
        this.toggleOrderMode();
      }
      // Check if ProductRenderer is already handling price button events
      if (window.ProductRenderer && window.ProductRenderer.eventDelegationInitialized) {
        // ProductRenderer is handling price buttons, so we don't need to
        return;
      }

      if (target.disabled || (target.classList && target.classList.contains('non-selectable'))) {
        return;
      }

      const row = target.closest('tr');
      const card = target.closest('.product-card');

      if (row) {
        const nameCell = row.querySelector('.product-name');
        const priceText = target.textContent;
        const productName = nameCell.textContent;
        this.handleProductSelection(productName, priceText, row, event);
      } else if (card) {
        const productName = target.dataset.productName;
        const priceText = target.textContent;
        this.handleProductSelection(productName, priceText, card, event);
      }
      return;
    }
  }
  
  // Phase 3: Cleanup method for event delegation
  destroyEventDelegation() {
    if (this.eventDelegationInitialized) {
      document.removeEventListener('click', this.boundDelegatedHandler);
      this.eventDelegationInitialized = false;
      Logger.debug('OrderSystem event delegation destroyed');
    }
  }
  
  // Phase 3: Delegated event handlers
  handleCounterButton(target) {
    const container = target.closest('.drink-option-container');
    if (!container) return;
    
    const optionName = container.querySelector('.drink-option-name')?.textContent;
    const countDisplay = container.querySelector('.count-display');
    const isIncrement = target.textContent === '+';
    const isJager = target.closest('.exclusive-option-group');
    
    if (isJager) {
      const boostOption = document.querySelector('#boost-option')?.closest('.drink-option-container');
      if (isIncrement) {
        this._handleJagerIncrement(optionName, countDisplay, container, boostOption);
      } else {
        this._handleJagerDecrement(optionName, countDisplay, container, boostOption);
      }
    } else {
      if (isIncrement) {
        this._handleDrinkIncrement(optionName, countDisplay, container);
      } else {
        this._handleDrinkDecrement(optionName, countDisplay, container);
      }
    }
  }
  
  handleDrinkOptionButton(target) {
    if (target.textContent === 'Ninguno') {
      this.selectedDrinks = ['Ninguno'];
      this.drinkCounts = {};
      document.querySelectorAll('.drink-option').forEach(btn => {
        if (btn && btn.classList) {
          btn.classList.remove('selected');
        }
      });
      if (target && target.classList) {
        target.classList.add('selected');
      }
      const totalCountElement = document.getElementById('total-drinks-count');
      if (totalCountElement) totalCountElement.textContent = '0';
    }
  }
  
  handleBoostOption(target) {
    const boostOption = target.closest('.drink-option-container');
    const totalRefrescos = this.calculateTotalJagerDrinkCount();
    
    if (target.checked) {
      if (totalRefrescos > 0) {
        alert("Para seleccionar los Boost debe dejar los refrescos en 0");
        target.checked = false;
        return;
      }
      
      this.selectedDrinks = ['2 Boost'];
      this.drinkCounts = {};
      if (boostOption && boostOption.classList) {
        boostOption.classList.add('selected');
      }
      
      document.querySelectorAll('.exclusive-option-group .drink-option-container .counter-btn, .exclusive-option-group .drink-option-container .count-display')
        .forEach(el => {
          if (el && el.classList) {
            if (el.classList.contains('counter-btn')) el.disabled = true;
            if (el.classList.contains('count-display')) el.textContent = '0';
          }
        });
    } else {
      this.selectedDrinks = this.selectedDrinks.filter(drink => drink !== '2 Boost');
      if (boostOption && boostOption.classList) {
        boostOption.classList.remove('selected');
      }
      document.querySelectorAll('.exclusive-option-group .drink-option-container .counter-btn')
        .forEach(btn => {
          if (btn) {
            btn.disabled = false;
          }
        });
    }
    this.updateTotalJagerDrinkCount();
  }

  extractPrice(priceText) {
    if (!priceText || typeof priceText !== 'string') {
      logWarning('Invalid priceText provided to extractPrice', { priceText });
      return 0;
    }
    const numericString = priceText.replace(/[^\d.]/g, '');
    const price = parseFloat(numericString);
    return isNaN(price) ? 0 : price;
  }

  getProductMetadata(row) {
    if (row?.dataset?.productType) {
      return {
        type: (row.dataset.productType || 'unknown').toLowerCase(),
        category: (row.dataset.category || 'unknown').toLowerCase()
      };
    }
    
    const tableElement = row.closest('table, .category-grid, .product-grid');
    if (!tableElement) {
      logError("Could not find parent table/grid for row", null, { row });
      return { type: 'unknown', category: 'unknown' };
    }

    return {
      type: (tableElement.dataset.productType || 'unknown').toLowerCase(),
      category: (tableElement.dataset.category || 'unknown').toLowerCase()
    };
  }

  toggleOrderMode(skipClear = false) {
    // If we're turning off order mode and there are items, just clear them but keep buttons active
    if (this.isOrderMode && this.core && this.core.getItems && this.core.getItems().length > 0 && !skipClear) {
      this.core.clearItems();
      this.updateOrderDisplay();
      // Keep order mode active so buttons remain enabled
      return;
    }
    
    // If we're turning off order mode and there are no items, actually toggle off
    this.isOrderMode = !this.isOrderMode;
    const elements = this._getOrderModeElements();
    
    this._updateOrderModeUI(elements, this.isOrderMode);
    this._handleOrderModeCleanup(skipClear);
  }

  _getOrderModeElements() {
    return {
      sidebar: document.getElementById(CONSTANTS.SELECTORS.SIDEBAR),
      tables: document.querySelectorAll(CONSTANTS.SELECTORS.TABLES),
      wrapper: document.querySelector('.content-wrapper'),
      orderBtn: document.getElementById(CONSTANTS.SELECTORS.ORDER_BTN),
      body: document.body
    };
  }

  _updateOrderModeUI(elements, isActive) {
    this._updateOrderButton(elements.orderBtn, isActive);
    this._updateSidebarVisibility(elements.sidebar, isActive);
    this._updateTablesMode(elements.tables, isActive);
    this._updateWrapperState(elements.wrapper, isActive);
    this._updateBodyState(elements.body, isActive);
  }

  _updateOrderButton(orderBtn, isActive) {
    // Don't change the sidebar button text - it should remain "Completar Orden"
    // The hamburger menu button will be updated separately
    this._updateHamburgerMenuButton(isActive);
  }

  async _updateHamburgerMenuButton(isActive) {
    // Find the "Crear orden" button in the hamburger menu
    const hamburgerButtons = document.querySelectorAll('#drawer-menu .nav-button');
    const createOrderBtn = Array.from(hamburgerButtons).find(btn => 
      btn.getAttribute('data-action') === 'createOrder'
    );
    
    if (createOrderBtn) {
      // Set stable translation keys and original text
      if (isActive) {
        createOrderBtn.setAttribute('data-translate', 'menu.cancel_order');
        createOrderBtn.setAttribute('data-namespace', 'menu');
        createOrderBtn.setAttribute('data-original-text', 'CANCELAR ORDEN');
        createOrderBtn.textContent = 'CANCELAR ORDEN';
      } else {
        createOrderBtn.setAttribute('data-translate', 'menu.create_order');
        createOrderBtn.setAttribute('data-namespace', 'menu');
        createOrderBtn.setAttribute('data-original-text', 'Crear orden');
        createOrderBtn.textContent = 'Crear orden';
      }

      // Translate immediately if current language is not Spanish
      try {
        const TranslationService = (await import('../../../../Shared/services/TranslationService.js')).default;
        const currentLang = TranslationService.getCurrentLanguage();
        if (currentLang && currentLang !== 'es') {
          const textKey = createOrderBtn.getAttribute('data-translate');
          const originalText = createOrderBtn.getAttribute('data-original-text') || createOrderBtn.textContent.trim();
          const translated = await TranslationService.getTranslation(textKey, originalText, currentLang, 'menu');
          if (translated) {
            createOrderBtn.textContent = translated;
          }
        }
      } catch (e) {
        // If TranslationService is not available yet, keep original text
        Logger.warn('TranslationService not ready in _updateHamburgerMenuButton', e);
      }
    }
  }

  _updateSidebarVisibility(sidebar, isActive) {
    if (sidebar && sidebar.classList) {
      // Keep sidebar visible if there are items in the order, even when order mode is off
      const hasItems = this.core && this.core.getItems && this.core.getItems().length > 0;
      const shouldBeVisible = isActive || hasItems;
      
      sidebar.classList.toggle('sidebar-visible', shouldBeVisible);
      sidebar.classList.toggle('sidebar-hidden', !shouldBeVisible);
      // Semantic class for consistent CSS toggling
      sidebar.classList.toggle('is-open', shouldBeVisible);
      
      // Mobile orientation control
      if (shouldBeVisible) {
        this._handleMobileOrientation(sidebar);
      } else {
        // Handle hiding for mobile orientations
        this._handleMobileHiding(sidebar);
      }
      
      // Add/remove 'with-sidebar' class to content wrapper for mobile landscape mode
      const contentWrapper = document.querySelector('.content-wrapper');
      if (contentWrapper) {
        contentWrapper.classList.toggle('with-sidebar', shouldBeVisible && this._isLandscape());
      }
    }
  }
  
  _handleMobileOrientation(sidebar) {
    const isLandscape = this._isLandscape();
    
    // Remove all mobile orientation classes first
    sidebar.classList.remove('sidebar-mobile-portrait', 'sidebar-mobile-landscape', 
                            'sidebar-mobile-hidden', 'sidebar-landscape-hidden', 'active');
    
    if (isLandscape) {
      // Landscape: sidebar lateral deslizable
      sidebar.classList.add('sidebar-mobile-landscape', 'active');
    } else {
      // Portrait: sidebar inferior fijo
      sidebar.classList.add('sidebar-mobile-portrait');
    }
  }
  
  _isLandscape() {
     return window.innerWidth > window.innerHeight;
   }
   
  _handleMobileHiding(sidebar) {
    const isLandscape = this._isLandscape();
    
    // Remove all mobile orientation classes first
    sidebar.classList.remove('sidebar-mobile-portrait', 'sidebar-mobile-landscape', 
                            'sidebar-mobile-hidden', 'sidebar-landscape-hidden', 'active');
    // Ensure semantic open state is cleared on hide
    sidebar.classList.remove('is-open');
     
     if (isLandscape) {
       // Landscape: hide sidebar by sliding it to the right
       sidebar.classList.add('sidebar-landscape-hidden');
     } else {
       // Portrait: hide sidebar by sliding it down
       sidebar.classList.add('sidebar-mobile-hidden');
     }
   }
   
   _initOrientationListener() {
     // Listen for orientation changes
     window.addEventListener('orientationchange', () => {
       setTimeout(() => this._handleOrientationChange(), 100);
     });
     
     // Listen for resize events (covers desktop and mobile)
     window.addEventListener('resize', () => {
       clearTimeout(this.resizeTimeout);
       this.resizeTimeout = setTimeout(() => this._handleOrientationChange(), 150);
     });
   }
   
   _handleOrientationChange() {
     const sidebar = document.getElementById(CONSTANTS.SELECTORS.SIDEBAR);
     if (sidebar && sidebar.classList.contains('sidebar-visible')) {
       this._handleMobileOrientation(sidebar);
       
       // Update content wrapper class for landscape mode
       const contentWrapper = document.querySelector('.content-wrapper');
       if (contentWrapper) {
         contentWrapper.classList.toggle('with-sidebar', this._isLandscape());
       }
     }
   }

  _updateTablesMode(tables, isActive) {
    if (tables) {
      tables.forEach(table => {
        if (table && table.classList) {
          table.classList.toggle('price-selection-mode', isActive);
        }
      });
    }
  }

  _updateWrapperState(wrapper, isActive) {
    if (wrapper && wrapper.classList) {
      wrapper.classList.toggle('order-active', isActive);
    }
  }

  _updateBodyState(body, isActive) {
    if (body && body.classList) {
      body.classList.toggle('order-mode-active', isActive);
      // Reposition hamburger button when order mode changes
      this._repositionHamburgerButton(isActive);
    }
  }

  _repositionHamburgerButton(isOrderModeActive) {
    // Hamburger button position is now fixed via CSS - no dynamic repositioning needed
    // This function is kept for compatibility but does nothing
  }

  _handleOrderModeCleanup(skipClear) {
    if (!this.isOrderMode && !skipClear) {
      this.core.clearItems();
      this.updateOrderDisplay();
    }
  }

  handleProductSelection(productName, priceText, row, event) {
    if (!this._validateSelection(event)) return;
    
    this._resetSelectionState();
    
    const productData = this._extractProductData(productName, priceText, row, event);
    const handler = this._getProductHandler(productData.metadata.type);
    
    handler(productData);
  }

  _validateSelection(event) {
    return OrderSystemValidations.validateSelection(event, this.isOrderMode);
  }

  _extractProductData(productName, priceText, row, event) {
    const price = this.extractPrice(priceText);
    const metadata = this.getProductMetadata(row);
    const clickedPriceType = this.getPriceType(row, event.target);

    this.currentProduct = { name: productName, price, priceType: clickedPriceType };
    this.currentCategory = metadata.category;

    return {
      name: productName,
      price,
      priceType: clickedPriceType,
      metadata
    };
  }

  _getProductHandler(productType) {
    const handlers = {
      beverage: (data) => this.addProductToOrder({ 
        name: data.name, 
        price: data.price, 
        category: 'bebida', 
        customizations: [] 
      }),
      food: (data) => data.metadata.category === CONSTANTS.CATEGORIES.MEAT 
        ? this.showMeatCustomizationModal() 
        : this.showFoodCustomizationModal(),
      liquor: (data) => this._handleLiquorProduct(data.name, data.price)
    };

    return handlers[productType] || ((data) => {
      // Only add to order if it's not a beverage (to avoid duplicates)
      if (productType !== 'beverage') {
        logWarning(`Product "${data.name}" with type "${productType}" did not match specific handling.`);
        this.addProductToOrder({ name: data.name, price: data.price, category: 'otro', customizations: [] });
      } else {
        logWarning(`Beverage product "${data.name}" should have been handled by beverage handler.`);
      }
    });
  }

  _resetSelectionState() {
    this.selectedDrinks = [];
    this.drinkCounts = {};
    this.selectedCookingTerm = null;
  }

  _handleLiquorProduct(productName, price) {
    if (!this.currentProduct) {
      console.error('No current product selected for liquor handling');
      // Try to reconstruct currentProduct from parameters
      this.currentProduct = { name: productName, price: price, priceType: 'precio' };
      console.warn('Reconstructed currentProduct from parameters:', this.currentProduct);
    }
    const isBottle = this.currentProduct.priceType === CONSTANTS.PRICE_TYPES.BOTTLE;
    const isSpecialCategory = [CONSTANTS.CATEGORIES.DIGESTIVOS, CONSTANTS.CATEGORIES.ESPUMOSOS].includes(this.currentCategory);
    
    if (isBottle && isSpecialCategory) {
      if (this.currentCategory === CONSTANTS.CATEGORIES.DIGESTIVOS) {
        const normalizedName = productName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
        if (CONSTANTS.SPECIAL_PRODUCTS.NO_MODAL.some(p => normalizedName.includes(p))) {
          return this.addProductToOrder({ name: `Botella ${productName}`, price, category: 'licor', customizations: ['Sin acompañamientos'] });
        }
      } else {
        return this.addProductToOrder({ name: `Botella ${productName}`, price, category: 'licor', customizations: ['Sin acompañamientos'] });
      }
    }

    const modalMap = {
      [CONSTANTS.PRICE_TYPES.BOTTLE]: () => this.showDrinkOptionsModal(),
      [CONSTANTS.PRICE_TYPES.LITER]: () => this.showLiterOptionsModal(),
      [CONSTANTS.PRICE_TYPES.CUP]: () => this.showCupOptionsModal()
    };

    const showModal = modalMap[this.currentProduct.priceType];
    if (showModal) {
      showModal();
    } else {
      logWarning(`Liquor product "${productName}" with price type "${this.currentProduct.priceType}" has no specific modal.`);
      this.addProductToOrder({ name: productName, price, category: 'licor', customizations: ['Revisar presentación'] });
    }
  }

  getPriceType(row, clickedElement) {
    if (clickedElement.disabled || (clickedElement.classList && clickedElement.classList.contains('non-selectable')) || clickedElement.textContent.trim() === '--') {
      return null;
    }
    
    if (clickedElement.dataset.field) return clickedElement.dataset.field;
    
    const currentTable = row.closest('table');
    if (!currentTable) {
      logError("Could not find parent table for getPriceType", null, { row });
      return null;
    }
    
    const tableHeaders = currentTable.querySelectorAll('thead th');
    const cellIndex = Array.from(row.cells).findIndex(cell => cell.contains(clickedElement));
    
    if (cellIndex === -1 || !tableHeaders || cellIndex >= tableHeaders.length) {
      logError("Invalid headers or cellIndex in getPriceType", null, { tableHeaders, cellIndex });
      return null;
    }
    
    const headerText = tableHeaders[cellIndex]?.textContent.trim().toUpperCase() || '';
    
    if (headerText.includes('BOTELLA')) return CONSTANTS.PRICE_TYPES.BOTTLE;
    if (headerText.includes('LITRO')) return CONSTANTS.PRICE_TYPES.LITER;
    if (headerText.includes('COPA')) return CONSTANTS.PRICE_TYPES.CUP;
    
    return 'precio';
  }
  
  isBottleProduct(row) {
    return document.querySelectorAll('th').some(header => {
      const text = header.textContent.toUpperCase();
      return ['BOTELLA', 'LITRO', 'COPA'].some(type => text.includes(type));
    }) && row.querySelector('.product-price');
  }

  isFoodProduct() { return CONSTANTS.CATEGORIES.FOOD.includes(this.currentCategory); }
  isMeatProduct() { return this.currentCategory === CONSTANTS.CATEGORIES.MEAT; }

  calculateTotalJagerDrinkCount() { return calculateTotalJagerDrinkCount(this.selectedDrinks, this.drinkCounts); }

  updateTotalJagerDrinkCount() {
    const totalCountElement = document.getElementById('total-jager-drinks-count');
    const total = this.calculateTotalJagerDrinkCount();
    if (totalCountElement) totalCountElement.textContent = total;

    const boostCheck = document.getElementById('boost-option');
    document.querySelectorAll('.exclusive-option-group .drink-option-container .counter-btn')
      .forEach(btn => {
        if (btn.textContent === '+') btn.disabled = boostCheck.checked || total >= this.maxDrinkCount;
      });
  }

  showDrinkOptionsModal() {
    this.renderModalFromTemplate('drink-options-modal', 'drink-options-template');
    setTimeout(() => this._continueShowDrinkOptionsModal(), 50);
  }
  
  _continueShowDrinkOptionsModal() {
    const optionsContainer = this._initializeDrinkModal();
    if (!optionsContainer) {
      console.error('Failed to initialize drink modal - no options container available');
      return;
    }
    
    if (this._isJagermeisterBottle()) {
      this._setupJagermeisterOptions(optionsContainer);
    } else {
      this._setupRegularDrinkOptions(optionsContainer);
    }
  }

  _initializeDrinkModal() {
    if (!this.currentProduct) {
      console.error('No current product selected for drink modal initialization');
      return null;
    }
    const optionsContainer = document.getElementById('drink-options-container');
    optionsContainer.innerHTML = '';
    this._resetSelectionState();

    this.bottleCategory = this.getLiquorType(this.currentProduct.name);
    this.maxDrinkCount = CONSTANTS.MAX_DRINK_COUNT;
    
    setTimeout(() => this._updateModalTitle(), 10);
    return optionsContainer;
  }

  _setupJagermeisterOptions(optionsContainer) {
    if (!optionsContainer) {
      console.error('No options container provided for Jagermeister options setup');
      return;
    }
    this._createJagerMessage(optionsContainer);
    const exclusiveGroup = this._createElement('div', 'exclusive-option-group');
    const boostOption = this._createBoostOption();
    this._setupBoostEventListener(boostOption);
    exclusiveGroup.appendChild(boostOption);
    
    ['Botella de Agua', 'Mineral'].forEach(option => {
      exclusiveGroup.appendChild(this._createJagerDrinkOption(option, boostOption));
    });
    
    optionsContainer.appendChild(exclusiveGroup);
    optionsContainer.appendChild(this._createTotalCountContainer('total-jager-drinks-count'));
    
    this.updateTotalJagerDrinkCount();
    this._setupModalButtons();
    this._showModal('drink-options-modal');
  }

  _setupRegularDrinkOptions(optionsContainer) {
    if (!optionsContainer) {
      console.error('No options container provided for regular drink options setup');
      return;
    }
    if (!this.currentProduct) {
      console.error('No current product selected for regular drink options setup');
      return;
    }
    const drinkOptionsResult = this.getDrinkOptionsForProduct(this.currentProduct.name);
    if (!this._validateDrinkOptions(drinkOptionsResult)) {
      return;
    }
    
    const { drinkOptions } = drinkOptionsResult;
    optionsContainer.appendChild(this._createTotalCountContainer('total-drinks-count'));
    this.renderDrinkOptions(optionsContainer, drinkOptions);
    this.updateTotalDrinkCount();
    this._setupModalButtons();
    this._showModal('drink-options-modal');
  }

  _validateDrinkOptions(drinkOptionsResult) {
    if (!this.currentProduct) {
      console.error('No current product selected for drink options validation');
      return false;
    }
    const isValid = OrderSystemValidations.validateDrinkOptions(drinkOptionsResult, this.currentProduct.name);
    if (!isValid) {
      this._hideModal('drink-options-modal');
    }
    return isValid;
  }

  // Helper functions for modal optimization
  _isJagermeisterBottle() {
    if (!this.currentProduct) {
      console.error('No current product selected for Jagermeister bottle check');
      return false;
    }
    return this.bottleCategory === 'DIGESTIVOS' && 
           this.currentProduct.priceType === CONSTANTS.PRICE_TYPES.BOTTLE && 
           this.currentProduct.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().includes(CONSTANTS.SPECIAL_PRODUCTS.JAGER);
  }

  _updateModalTitle() {
    if (!this.currentProduct) {
      console.error('No current product selected for modal title update');
      return;
    }
    const modalTitle = document.querySelector('#drink-options-modal h3');
    if (!modalTitle) return;
    
    const { message } = this.getDrinkOptionsForProduct(this.currentProduct.name);
    const baseTitle = '¿Con qué desea acompañar su bebida?';
    const styleSpan = '<span class="modal-subtitle">';
    
    if (this.bottleCategory === 'VODKA' || this.bottleCategory === 'GINEBRA') {
      modalTitle.innerHTML = `${baseTitle}${styleSpan}Puedes elegir 2 Jarras de jugo ó 5 Refrescos ó 1 Jarra de jugo y 2 Refrescos</span>`;
    } else if (message === "Puedes elegir 5 refrescos") {
      modalTitle.innerHTML = `${baseTitle}${styleSpan}Puedes elegir 5 refrescos</span>`;
    } else {
      modalTitle.innerHTML = `${baseTitle}${styleSpan}${message}</span>`;
    }
  }

  _createElement(tag, className, textContent = '') {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (textContent) element.textContent = textContent;
    return element;
  }

  _createJagerMessage(container) {
    const messageElement = this._createElement('p', 'drink-options-message', 'Puedes elegir 5 Refrescos ó 2 Boost');
    container.appendChild(messageElement);
  }

  _createBoostOption() {
    const boostOption = this._createElement('div', 'jager-option-container');
    const boostCheck = this._createElement('input');
    Object.assign(boostCheck, {
      type: 'checkbox',
      name: 'jager-options',
      id: 'boost-option',
      className: 'jager-radio'
    });
    
    const boostLabel = this._createElement('label', 'jager-label', '2 Boost');
    boostLabel.htmlFor = 'boost-option';
    
    boostOption.appendChild(boostCheck);
    boostOption.appendChild(boostLabel);
    return boostOption;
  }

  _setupBoostEventListener(boostOption) {
    // Phase 3: No individual event listener needed - handled by delegation
    // The boost option will be handled by the centralized event system
  }

  _createJagerDrinkOption(option, boostOption) {
    const optionContainer = this._createElement('div', 'drink-option-container');
    const optionName = this._createElement('span', 'drink-option-name');
    optionName.textContent = option;
    const counterContainer = this._createElement('div', 'counter-container');
    
    const countDisplay = this._createElement('span', 'count-display', '0');
    const decrementBtn = this._createCounterButton('-', () => this._handleJagerDecrement(option, countDisplay, optionContainer, boostOption));
    const incrementBtn = this._createCounterButton('+', () => this._handleJagerIncrement(option, countDisplay, optionContainer, boostOption));
    
    counterContainer.append(decrementBtn, countDisplay, incrementBtn);
    optionContainer.append(optionName, counterContainer);
    return optionContainer;
  }

  _createCounterButton(text, clickHandler = null) {
    const btn = this._createElement('button', 'counter-btn');
    btn.textContent = text;
    // Phase 3: No individual event listener - handled by delegation
    return btn;
  }

  _handleJagerDecrement(option, countDisplay, optionContainer, boostOption) {
    const boostCheck = boostOption.querySelector('#boost-option');
    if (boostCheck.checked) {
      this._resetBoostSelection(boostCheck, boostOption);
    }
    
    const currentCount = this.drinkCounts[option] || 0;
    if (currentCount > 0) {
      this.drinkCounts[option] = currentCount - 1;
      countDisplay.textContent = this.drinkCounts[option];
      if (this.drinkCounts[option] === 0 && optionContainer && optionContainer.classList) {
        optionContainer.classList.remove('selected');
      }
      this.updateTotalJagerDrinkCount();
    }
  }

  _handleJagerIncrement(option, countDisplay, optionContainer, boostOption) {
    const boostCheck = boostOption.querySelector('#boost-option');
    if (boostCheck.checked) {
      this._resetBoostSelection(boostCheck, boostOption);
    }
    
    const totalCount = this.calculateTotalJagerDrinkCount();
    const currentCount = this.drinkCounts[option] || 0;
    
    if (totalCount < this.maxDrinkCount) {
      this.drinkCounts[option] = currentCount + 1;
      countDisplay.textContent = this.drinkCounts[option];
      if (optionContainer && optionContainer.classList) {
          if (optionContainer && optionContainer.classList) {
        optionContainer.classList.add('selected');
      }
        }
      this.updateTotalJagerDrinkCount();
    }
  }

  _resetBoostSelection(boostCheck, boostOption) {
    boostCheck.checked = false;
    if (boostOption && boostOption.classList) {
      boostOption.classList.remove('selected');
    }
    this.selectedDrinks = this.selectedDrinks.filter(drink => drink !== '2 Boost');
    document.querySelectorAll('.exclusive-option-group .drink-option-container .counter-btn')
      .forEach(btn => {
        if (btn) {
          btn.disabled = false;
        }
      });
  }

  _createTotalCountContainer(countId) {
    const container = this._createElement('div', 'total-count-container');
    setSafeInnerHTML(container, `<span>Total seleccionado: <span id="${countId}">0</span> / ${this.maxDrinkCount}</span>`);
    return container;
  }

  _setupModalButtons() {
    // Phase 3: No individual event listeners needed - handled by delegation
    // Modal buttons will be handled by the centralized event system
  }

  renderDrinkOptions(container, options) {
    // Validate that options is an array
    if (!Array.isArray(options)) {
      Logger.error('renderDrinkOptions: options is not an array:', options);
      return;
    }
    
    options.forEach(option => {
      container.appendChild(option === 'Ninguno' ? this._createNoneOption(option) : this._createDrinkOption(option));
    });
  }

  _createNoneOption(option) {
    const noneOption = this._createElement('button', 'drink-option');
    noneOption.textContent = option;
    // Phase 3: No individual event listener - handled by delegation
    return noneOption;
  }

  _createDrinkOption(option) {
    const optionContainer = this._createElement('div', 'drink-option-container');
    const optionName = this._createElement('span', 'drink-option-name');
    optionName.textContent = option;
    const counterContainer = this._createElement('div', 'counter-container');
    
    const countDisplay = this._createElement('span', 'count-display', '0');
    const decrementBtn = this._createCounterButton('-', () => this._handleDrinkDecrement(option, countDisplay, optionContainer));
    const incrementBtn = this._createCounterButton('+', () => this._handleDrinkIncrement(option, countDisplay, optionContainer));
    
    counterContainer.append(decrementBtn, countDisplay, incrementBtn);
    optionContainer.append(optionName, counterContainer);
    return optionContainer;
  }

  _handleDrinkDecrement(option, countDisplay, optionContainer) {
    const currentCount = this.drinkCounts[option] || 0;
    if (currentCount > 0) {
      this.drinkCounts[option] = currentCount - 1;
      countDisplay.textContent = this.drinkCounts[option];
      if (this.drinkCounts[option] === 0) {
        if (optionContainer && optionContainer.classList) {
          optionContainer.classList.remove('selected');
        }
        this.selectedDrinks = this.selectedDrinks.filter(drink => drink !== option);
      }
      this.updateTotalDrinkCount();
    }
  }

  _handleDrinkIncrement(option, countDisplay, optionContainer) {
    if (this._canIncrementDrink(option)) {
      const currentCount = this.drinkCounts[option] || 0;
      this.drinkCounts[option] = currentCount + 1;
      countDisplay.textContent = this.drinkCounts[option];
      optionContainer.classList.add('selected');
      if (!this.selectedDrinks.includes(option)) this.selectedDrinks.push(option);
      this.updateTotalDrinkCount();
    }
  }

  _canIncrementDrink(option) {
    const isJuice = isJuiceOption(option);
    const totalCount = this.calculateTotalDrinkCount();
    
    if (this._isSpecialBottleCategory()) {
      const [totalJuices, totalRefrescos] = this._getDrinkCounts();
      return this._validateSpecialBottleRules(isJuice, totalJuices, totalRefrescos);
    }
    return totalCount < this.maxDrinkCount;
  }

  _isSpecialBottleCategory() {
    if (this.bottleCategory === 'VODKA' || this.bottleCategory === 'GINEBRA') return true;
    if (this.bottleCategory === 'RON') {
      const normalizedName = this.currentProduct?.name?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase() || '';
      return ['BACARDI MANGO', 'BACARDI RASPBERRY', 'MALIBU'].some(name => normalizedName.includes(name));
    }
    return false;
  }

  _validateSpecialBottleRules(isJuice, totalJuices, totalRefrescos) {
    return OrderSystemValidations.validateSpecialBottleRules(
      isJuice, 
      totalJuices, 
      totalRefrescos, 
      this.bottleCategory, 
      this.currentProduct?.name
    );
  }



  calculateTotalDrinkCount() {
    return Object.values(this.drinkCounts).reduce((total, count) => total + count, 0);
  }

  calculateTotalJuiceCount() {
    return Object.entries(this.drinkCounts)
      .filter(([option]) => isJuiceOption(option))
      .reduce((total, [, count]) => total + count, 0);
  }

  updateTotalDrinkCount() {
    const totalCountElement = document.getElementById('total-drinks-count');
    const total = this.calculateTotalDrinkCount();
    if (totalCountElement) totalCountElement.textContent = total;

    const isSpecialProduct = this._isSpecialDrinkProduct();
    document.querySelectorAll('.drink-option-container .counter-btn[textContent="+"]').forEach(btn => {
      const optionContainer = btn.closest('.drink-option-container');
      const optionNameElement = optionContainer?.querySelector('.drink-option-name');
      if (!optionNameElement) return;

      const optionName = optionNameElement.textContent;
      const isJuice = isJuiceOption(optionName);
      const [totalJuices, totalRefrescos] = this._getDrinkCounts();

      btn.disabled = isSpecialProduct ? 
        this._validateSpecialDrinkLimits(isJuice, totalJuices, totalRefrescos) : 
        total >= this.maxDrinkCount;
    });
  }

  _isSpecialDrinkProduct() {
    return this._isSpecialBottleCategory() || this._isOnlySodaCategory();
  }
  
  _isOnlySodaCategory() {
    // Detectar subcategorías que solo tienen refrescos
    // Esto se puede expandir según las categorías específicas del negocio
    const currentOptions = this.getDrinkOptionsForProduct(this.currentProduct?.name || '');
    if (!currentOptions || !currentOptions.drinkOptions) return false;
    
    // Verificar si todas las opciones son refrescos (no jugos)
    return currentOptions.drinkOptions.every(option => !isJuiceOption(option)) && 
           currentOptions.drinkOptions.length > 0 && 
           !currentOptions.drinkOptions.includes('Ninguno');
  }

  _getDrinkCounts() {
    const totalJuices = this.calculateTotalJuiceCount();
    const totalRefrescos = Object.entries(this.drinkCounts)
      .filter(([opt]) => !isJuiceOption(opt))
      .reduce((sum, [, cnt]) => sum + cnt, 0);
    return [totalJuices, totalRefrescos];
  }

  _validateSpecialDrinkLimits(isJuice, totalJuices, totalRefrescos) {
    return OrderSystemValidations.validateSpecialDrinkLimits(
      isJuice, 
      totalJuices, 
      totalRefrescos, 
      this.bottleCategory, 
      this.currentProduct?.name
    );
  }

  getDrinkOptionsForProduct(productName) {
    // Validate input
    if (!productName || typeof productName !== 'string') {
      Logger.error('getDrinkOptionsForProduct: Invalid productName:', productName);
      return { drinkOptions: ['Ninguno'], message: 'Error: Producto no válido' };
    }
    
    const productType = this.getLiquorType(productName);
    const normalizedName = productName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    
    // Check special products first
    const specialProduct = this._getSpecialProductOptions(normalizedName);
    if (specialProduct && specialProduct.drinkOptions) {
      return specialProduct;
    }
    
    // Handle digestivos
    if (productType === 'DIGESTIVOS') {
      const digestivoResult = this._getDigestivoOptions(normalizedName, productName);
      if (digestivoResult && digestivoResult.drinkOptions) {
        return digestivoResult;
      }
    }
    
    // Handle espumosos
    if (productType === 'ESPUMOSOS') {
      return { drinkOptions: ['Ninguno'], message: CONSTANTS.MESSAGES.NO_REFRESCOS || 'Sin acompañamientos' };
    }
    
    // Get standard options with fallback
    let options = null;
    if (CONSTANTS.PRODUCT_OPTIONS && CONSTANTS.PRODUCT_OPTIONS[productType]) {
      options = CONSTANTS.PRODUCT_OPTIONS[productType];
    } else if (CONSTANTS.PRODUCT_OPTIONS && CONSTANTS.PRODUCT_OPTIONS.DEFAULT) {
      options = CONSTANTS.PRODUCT_OPTIONS.DEFAULT;
    } else {
      // Ultimate fallback
      options = ['Mineral', 'Coca', 'Manzana'];
    }
    
    // Determinar el mensaje apropiado según el tipo de producto
    let message;
    if (['VODKA', 'GINEBRA'].includes(productType)) {
      message = CONSTANTS.MESSAGES.SPECIAL || 'Opciones especiales';
    } else {
      // Verificar si es una categoría solo de refrescos
      const isOnlySodas = options.every(option => !isJuiceOption(option)) && 
                         options.length > 0 && 
                         !options.includes('Ninguno');
      message = isOnlySodas ? 
        (CONSTANTS.MESSAGES.ONLY_SODAS || 'Puedes elegir hasta 5 refrescos') :
        (CONSTANTS.MESSAGES.DEFAULT || 'Seleccione acompañamiento');
    }
    
    return { drinkOptions: options, message };
  }

  _getSpecialProductOptions(normalizedName) {
    if (!normalizedName || typeof normalizedName !== 'string') {
      return null;
    }
    
    const specialProducts = {
      'BACARDI MANGO': ['Sprite', 'Mineral', 'Quina', 'Jugo de Mango', 'Jugo de Arándano'],
      'BACARDI RASPBERRY': ['Sprite', 'Mineral', 'Quina', 'Jugo de Mango', 'Jugo de Arándano'],
      'MALIBU': ['Sprite', 'Mineral', 'Jugo de Piña']
    };
    
    for (const [key, options] of Object.entries(specialProducts)) {
      if (normalizedName.includes(key)) {
        return { 
          drinkOptions: Array.isArray(options) ? options : ['Ninguno'], 
          message: CONSTANTS.MESSAGES.SPECIAL || 'Opciones especiales'
        };
      }
    }
    return null;
  }

  _getDigestivoOptions(normalizedName, productName) {
    // Validate inputs
    if (!normalizedName || !productName || !this.currentProduct) {
      console.error('Invalid inputs or no current product for digestivo options');
      return { drinkOptions: ['Ninguno'], message: 'Sin acompañamientos' };
    }
    
    if (this.currentProduct && this.currentProduct.priceType === CONSTANTS.PRICE_TYPES.BOTTLE) {
      const digestivoOptions = {
        'LICOR 43': ['Botella de Agua', 'Mineral'],
        'CADENAS DULCE': ['Botella de Agua', 'Mineral'],
        'ZAMBUCA NEGRO': ['Botella de Agua', 'Mineral']
      };
      
      for (const [key, options] of Object.entries(digestivoOptions)) {
        if (normalizedName.includes(key)) {
          return { 
            drinkOptions: Array.isArray(options) ? options : ['Ninguno'], 
            message: "Seleccione acompañamiento:" 
          };
        }
      }
      return { 
        drinkOptions: ['Ninguno'], 
        message: CONSTANTS.MESSAGES.NO_REFRESCOS || 'Sin acompañamientos' 
      };
    }
    
    if (this.currentProduct && this.currentProduct.priceType === CONSTANTS.PRICE_TYPES.CUP && productName.includes("BAILEYS")) {
      return { drinkOptions: ['Rocas'], message: "Acompañamientos para copa" };
    }
    
    return { 
      drinkOptions: ['Ninguno'], 
      message: CONSTANTS.MESSAGES.NO_REFRESCOS || 'Sin acompañamientos' 
    };
  }

  confirmDrinkOptions() {
    if (!this.currentProduct) {
      console.error('No current product selected for drink options confirmation');
      // Try to recover from modal state if possible
      const modal = document.getElementById('drink-options-modal');
      if (modal) {
        this._hideModal('drink-options-modal');
      }
      this._showValidationModal('Error: No se pudo confirmar la selección. Por favor intente nuevamente.');
      return;
    }
    
    if (!this._hasValidDrinkSelection()) {
      this._showValidationModal('Por favor seleccione al menos un acompañamiento');
      return;
    }

    const { prefix, name, customization } = this._buildProductInfo();
    
    // Ensure we're in order mode before adding to order
    if (!this.isOrderMode) {
      console.warn('Attempting to add product when not in order mode, activating order mode');
      this.toggleOrderMode();
      
      // Wait for order mode to be fully activated and sidebar to be visible
      setTimeout(() => {
        this._addConfirmedProduct(prefix, name, customization);
      }, 300);
      return;
    }
    
    this._addConfirmedProduct(prefix, name, customization);
  }
  
  _addConfirmedProduct(prefix, name, customization) {
    this.addProductToOrder({
      name: `${prefix} ${name}`,
      price: this.currentProduct.price,
      category: this.currentProduct.category || 'licor',
      customizations: [customization]
    });

    this.selectedDrinks = [];
    this.drinkCounts = {};
    this._hideModal('drink-options-modal');
  }

  _hasValidDrinkSelection() {
    if (!this.currentProduct) {
      console.error('No current product selected for drink selection validation');
      return false;
    }
    return OrderSystemValidations.hasValidDrinkSelection(this.selectedDrinks, this.drinkCounts, this.currentProduct);
  }

  _buildProductInfo() {
    if (!this.currentProduct) {
      console.error('No current product selected for building product info');
      return { prefix: '', name: '', customization: 'Error: No product selected' };
    }
    const priceType = this.currentProduct.priceType;
    const productName = this.currentProduct.name.replace(/\s*\d+\s*ML/i, '');
    const isJagerBottle = this.currentProduct.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().includes('JAGERMEISTER') && 
                          priceType === 'precioBotella';

    const prefixMap = { 'precioBotella': 'Botella', 'precioLitro': 'Litro', 'precioCopa': 'Copa' };
    const prefix = prefixMap[priceType] || '';

    let customization = '';
    if (priceType === 'precioBotella') {
      if (isJagerBottle && this.selectedDrinks.includes('2 Boost')) {
        customization = 'Con: 2 Boost';
      } else if (Object.values(this.drinkCounts).some(count => count > 0)) {
        const customizations = Object.entries(this.drinkCounts)
          .filter(([, count]) => count > 0)
          .map(([drink, count]) => `${count}x ${drink}`);
        customization = `Con: ${customizations.join(', ')}`;
      } else {
        customization = this.selectedDrinks.includes('Ninguno') ? 'Sin acompañamientos' : `Con: ${this.selectedDrinks.join(', ')}`;
      }
    } else if (priceType === 'precioLitro') {
      customization = `Mezclador: ${this.selectedDrinks[0] || 'Ninguno'}`;
    } else if (priceType === 'precioCopa') {
      customization = `Estilo: ${this.selectedDrinks[0] || 'Ninguno'}`;
    }

    return { prefix, name: productName, customization };
  }

  showLiterOptionsModal() {
    this.renderModalFromTemplate('drink-options-modal', 'drink-options-template');
    
    setTimeout(() => {
      const modalTitle = document.querySelector('#drink-options-modal h3');
      if (modalTitle) {
        modalTitle.innerHTML = '¿Con qué desea acompañar su bebida?<span class="modal-subtitle">Cada litro se sirve con 6 oz del destilado que elija.</span>';
      }
    }, 10);
    
    this._setupOptionsModal('liter');
  }

  getLiterOptionsForProduct(category) {
    return this._getOptionsForProduct(category, 'liter');
  }

  showCupOptionsModal() {
    this.renderModalFromTemplate('drink-options-modal', 'drink-options-template');
    setTimeout(() => {
      const modalTitle = document.querySelector('#drink-options-modal h3');
      if (modalTitle) {
        modalTitle.innerHTML = '¿Con qué desea acompañar su bebida?<span class="modal-subtitle">Cada copa se sirve con 1 ½ oz del destilado que elija.</span>';
      }
    }, 10);
    this._setupOptionsModal('cup');
  }

  getCupOptionsForProduct(category) {
    return this._getOptionsForProduct(category, 'cup');
  }

  _getOptionsForProduct(category, type) {
    if (!this.currentProduct) {
      console.error('No current product selected for getting options');
      return type === 'liter' ? { options: ['Ninguno'], message: 'Error: No product selected' } : ['Ninguno'];
    }
    const productName = this.currentProduct.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    
    const specialProducts = {
      'BACARDI MANGO': ['Sprite', 'Mineral', type === 'liter' ? 'Tonic' : 'Tonic', 'Jugo de Mango', 'Jugo de Arándano'],
      'BACARDI RASPBERRY': ['Sprite', 'Mineral', 'Tonic', 'Jugo de Mango', 'Jugo de Arándano'],
      'MALIBU': ['Sprite', 'Mineral', 'Jugo de Piña', type === 'liter' ? 'Mineral-Piña' : 'Mineral-Piña']
    };
    
    for (const [key, options] of Object.entries(specialProducts)) {
      if (productName.includes(key)) {
        return type === 'liter' ? { options, message: 'Elija una opción para acompañar su litro:' } : options;
      }
    }

    const optionsMap = {
      'RON': ['Mineral', 'Manzana', 'Coca', 'Mineral-Coca', 'Mineral-Manzana', 'Pintado-Coca', 'Pintado-Manzana'],
      'TEQUILA': type === 'liter' ? 
        ['Toronja', 'Mineral', 'Coca', 'Toronja-Mineral', 'Paloma'] :
        ['Toronja', 'Mineral', 'Coca', 'Toronja-Mineral', 'Bandera', 'Paloma', 'Derecho'],
      'BRANDY': type === 'liter' ?
        ['Coca', 'Manzana', 'Mineral', 'Mineral-Coca', 'Mineral-Manzana'] :
        ['Coca', 'Manzana', 'Mineral', 'Mineral-Coca', 'Mineral-Manzana', 'Paris'],
      'WHISKY': type === 'liter' ?
        ['Mineral', 'Manzana', 'Ginger ale', 'Botella de Agua', 'Mineral-Ginger', 'Mineral-Manzana'] :
        ['Mineral', 'Manzana', 'Ginger ale', 'Botella de Agua', 'Rocas', 'Mineral-Manzana', 'Mineral-Ginger'],
      'VODKA': ['Jugo de Piña', 'Jugo de Naranja', 'Jugo de Arándano', 'Jugo de Mango', 'Jugo de Uva', 'Jugo de Durazno', 'Mineral', 'Tonic'],
      'GINEBRA': ['Jugo de Piña', 'Jugo de Naranja', 'Jugo de Arándano', 'Jugo de Mango', 'Jugo de Uva', 'Jugo de Durazno', 'Mineral', 'Tonic'],
      'MEZCAL': type === 'liter' ? ['Mineral', 'Toronja'] : ['Derecho Naranja y Sal de gusano', 'Toronja'],
      'COGNAC': type === 'liter' ? 
        ['Puesto-Mineral', 'Puesto-Coca', 'Puesto-Manzana'] :
        ['Puesto-Mineral', 'Puesto-Coca', 'Puesto-Manzana', 'Rocas', 'Paris'],
      'ESPUMOSOS': ['Ninguno'],
      'DIGESTIVOS': type === 'liter' ? ['Mineral', 'Botella de Agua'] : this._getDigestivoOptionsForCup(productName)
    };

    const options = optionsMap[category] || ['Mineral', 'Agua', 'Coca', 'Manzana'];
    return type === 'liter' ? { options, message: 'Elija una opción para acompañar su litro:' } : options;
  }

  _getDigestivoOptionsForCup(productName) {
    const digestivoMap = {
      'LICOR 43': ['Coñaquera Chaser Mineral', 'Rocas'],
      'JÄGERMEISTER': ['Derecho'],
      'BAILEYS': ['Rocas'],
      'CADENAS DULCE': ['Coñaquera Chaser Mineral', 'Rocas'],
      'ZAMBUCA NEGRO': [
        'Coñaquera Chaser Mineral-Moscas',
        'Coñaquera Chaser Mineral',
        'Rocas'  
      ]
    };
    
    for (const [key, options] of Object.entries(digestivoMap)) {
      const normalizedProductName = productName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const normalizedKey = key.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      
      if (normalizedProductName.includes(normalizedKey)) {
        return options;
      }
    }
    
    return ['Mineral', 'Botella de Agua'];
  }

  _setupOptionsModal(type) {
    if (!this.currentProduct) {
      console.error('No current product selected for options modal setup');
      this._hideModal('drink-options-modal');
      return;
    }
    const optionsContainer = document.getElementById('drink-options-container');
    if (!optionsContainer) {
      Logger.error(`Element 'drink-options-container' not found in ${type} options modal.`);
      this._hideModal('drink-options-modal');
      return;
    }
    
    optionsContainer.innerHTML = '';
    this.selectedDrinks = [];
    if (!this.currentProduct) {
      console.error('No current product selected for options modal setup');
      this._hideModal('drink-options-modal');
      return;
    }
    this.bottleCategory = this.getLiquorType(this.currentProduct.name);

    const options = this._getOptionsForModalType(type);
    this._renderOptionsGrid(options, optionsContainer);
    this._attachModalEventListeners();
    this._showModal('drink-options-modal');
  }

  _getOptionsForModalType(type) {
    if (!this.currentProduct) {
      console.error('No current product selected for getting modal options');
      return ['Ninguno'];
    }
    const productName = this.currentProduct.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    
    if (productName.includes('BACARDI MANGO') || productName.includes('BACARDI RASPBERRY')) {
      return ['Sprite', 'Mineral', 'Tonic', 'Jugo de Mango', 'Jugo de Arándano'];
    }
    if (productName.includes('MALIBU')) {
      return ['Sprite', 'Mineral', 'Jugo de Piña', 'Mineral-Piña'];
    }
    
    return type === 'liter' 
      ? this.getLiterOptionsForProduct(this.bottleCategory).options
      : this.getCupOptionsForProduct(this.bottleCategory);
  }

  _renderOptionsGrid(options, container) {
    const optionsGrid = document.createElement('div');
    // Keep existing class for compatibility and add BEM class for future
    optionsGrid.className = 'options-grid drink-modal__grid';
    
    options.forEach(option => {
      const optionButton = document.createElement('button');
      // Keep existing class and add BEM class
      optionButton.className = 'drink-option drink-modal__option';
      optionButton.textContent = option;
      optionButton.addEventListener('click', () => {
        document.querySelectorAll('.drink-option').forEach(btn => {
          btn.classList.remove('selected');
        });
        optionButton.classList.add('selected');
        this.selectedDrinks = [option];
      });
      optionsGrid.appendChild(optionButton);
    });

    container.appendChild(optionsGrid);
  }

  _attachModalEventListeners() {
    // Event listeners for modal buttons are now handled by event delegation
    // in handleDelegatedEvent method to prevent duplicate listeners
    // No need to attach individual listeners here
  }

  showFoodCustomizationModal() {
    this.renderModalFromTemplate('food-customization-modal', 'food-customization-template');
    setTimeout(() => this._setupFoodModal(), 50);
  }
  
  _setupFoodModal() {
    const ingredientsContainer = document.getElementById('ingredients-input-container');
    if (ingredientsContainer) ingredientsContainer.className = 'input-container-hidden';
    const ingredientsInput = document.getElementById('ingredients-to-remove');
    if (ingredientsInput) ingredientsInput.value = '';
    
    // Event listeners are now handled by event delegation in handleDelegatedEvent
    this._showModal('food-customization-modal');
  }

  _showIngredientsInput() {
    const ingredientsContainer = document.getElementById('ingredients-input-container');
    const ingredientsChoice = document.querySelector('.ingredients-choice');
    if (ingredientsContainer) ingredientsContainer.className = 'input-container-visible';
    if (ingredientsChoice) ingredientsChoice.className = 'choice-hidden';
  }

  _addFoodToOrder(customization) {
    if (!this.currentProduct) {
      console.error('No current product selected for food order');
      return;
    }
    this.addProductToOrder({
      name: this.currentProduct.name,
      price: this.currentProduct.price,
      category: 'comida',
      customizations: [customization]
    });
    this._hideModal('food-customization-modal');
  }

  _confirmIngredientCustomization() {
    const ingredientsElement = document.getElementById('ingredients-to-remove');
    if (!ingredientsElement) {
      console.error('Element with ID "ingredients-to-remove" not found');
      return;
    }
    const ingredientsToRemove = ingredientsElement.value.trim();
    const customization = ingredientsToRemove ? `Sin: ${ingredientsToRemove}` : 'Con todos los ingredientes';
    this._addFoodToOrder(customization);
  }

  showMeatCustomizationModal() {
    this.renderModalFromTemplate('meat-customization-modal', 'meat-customization-template');
    setTimeout(() => this._setupMeatModal(), 50);
  }
  
  _setupMeatModal() {
    const garnishContainer = document.getElementById('garnish-input-container');
    if (garnishContainer) garnishContainer.className = 'input-container-hidden';
    
    const garnishActions = document.querySelector('.garnish-actions');
    if (garnishActions) garnishActions.className = 'modal-actions garnish-actions input-container-hidden';
    
    const garnishModifications = document.getElementById('garnish-modifications');
    if (garnishModifications) garnishModifications.value = '';
    
    this.selectedCookingTerm = null;
    this._setupCookingOptions();
    
    // Event listeners are now handled by event delegation in handleDelegatedEvent
    this._showModal('meat-customization-modal');
  }

  _setupCookingOptions() {
    const cookingOptions = document.querySelectorAll('.cooking-option');
    cookingOptions.forEach(option => {
      option.classList.remove('selected');
      option.addEventListener('click', (e) => {
        cookingOptions.forEach(opt => opt.classList.remove('selected'));
        e.target.classList.add('selected');
        this.selectedCookingTerm = e.target.getAttribute('data-term');
      });
    });
  }

  _showGarnishInput() {
    if (!this._validateCookingTerm()) return;
    const garnishContainer = document.getElementById('garnish-input-container');
    const garnishChoice = document.querySelector('.garnish-choice');
    const garnishActions = document.querySelector('.garnish-actions');
    
    if (garnishContainer) garnishContainer.className = 'input-container-visible';
    if (garnishChoice) garnishChoice.className = 'choice-hidden';
    if (garnishActions) garnishActions.className = 'modal-actions garnish-actions input-container-visible';
  }

  _addMeatToOrder(garnishType) {
    if (!this._validateCookingTerm()) return;
    
    if (!this.currentProduct) {
      console.error('No current product selected for meat order');
      return;
    }
    
    this.addProductToOrder({
      name: this.currentProduct.name,
      price: this.currentProduct.price,
      category: 'comida',
      customizations: [`Término: ${this._getTermText(this.selectedCookingTerm)}`, garnishType]
    });
    this._hideModal('meat-customization-modal');
  }

  _getTermText(term) {
    const termMap = { 'medio': 'Término ½', 'tres-cuartos': 'Término ¾', 'bien-cocido': 'Bien Cocido' };
    return termMap[term] || term;
  }

  _confirmGarnishCustomization() {
    if (!this._validateCookingTerm()) return;
    const garnishElement = document.getElementById('garnish-modifications');
    if (!garnishElement) {
      console.error('Element with ID "garnish-modifications" not found');
      return;
    }
    const garnishModifications = garnishElement.value.trim();
    const garnishType = garnishModifications ? `Guarnición: ${garnishModifications}` : 'Guarnición estándar';
    this._addMeatToOrder(garnishType);
  }

  _validateCookingTerm() {
    const isValid = OrderSystemValidations.validateCookingTerm(this.selectedCookingTerm);
    if (!isValid) {
      OrderSystemValidations.showValidationModal(
        'Por favor seleccione un término de cocción primero',
        this._createSimpleModal.bind(this)
      );
    }
    return isValid;
  }

  _showValidationModal(message) {
    OrderSystemValidations.showValidationModal(message, this._createSimpleModal.bind(this));
  }

  cancelProductSelection() {
    ['drink-options-modal', 'food-customization-modal', 'meat-customization-modal']
      .forEach(modal => this._hideModal(modal));
    this._resetSelectionState();
    this.currentProduct = null;
  }

  addProductToOrder(orderItem) {
    // Ensure we're in order mode before adding to order
    if (!this.isOrderMode) {
      console.warn('Attempting to add product when not in order mode, activating order mode');
      this.toggleOrderMode();
    }
    
    // Ensure sidebar is visible before adding product
    const sidebar = document.getElementById(CONSTANTS.SELECTORS.SIDEBAR);
    if (sidebar) {
      if (sidebar.classList.contains('sidebar-hidden')) {
        sidebar.classList.remove('sidebar-hidden');
        sidebar.classList.add('sidebar-visible');
        sidebar.classList.add('is-open');
        
        // Add 'with-sidebar' class to content wrapper for mobile landscape mode
        const contentWrapper = document.querySelector('.content-wrapper');
        if (contentWrapper) {
          contentWrapper.classList.add('with-sidebar');
        }
        
        // Wait a bit for the sidebar to become visible before updating display
        setTimeout(() => {
          this.core.addProduct(orderItem);
          this.updateOrderDisplay();
          this.currentProduct = null;
        }, 100);
        return;
      }
    }
    
    this.core.addProduct(orderItem); 
    this.updateOrderDisplay();
    this.currentProduct = null;
  }

  updateOrderDisplay() {
    // Ensure sidebar is visible first if we're in order mode
    if (this.isOrderMode) {
      const sidebar = document.getElementById(CONSTANTS.SELECTORS.SIDEBAR);
      if (sidebar && sidebar.classList.contains('sidebar-hidden')) {
        sidebar.classList.remove('sidebar-hidden');
        sidebar.classList.add('sidebar-visible');
        sidebar.classList.add('is-open');
      }
    }
    
    const orderItemsContainer = document.getElementById('order-items');
    if (!orderItemsContainer) {
      console.warn('Element with ID "order-items" not found - sidebar may not be visible yet');
      
      // Debug: Log current DOM state
      const sidebar = document.getElementById(CONSTANTS.SELECTORS.SIDEBAR);
      console.log('🔍 DEBUG - updateOrderDisplay: order-items not found');
      console.log('  - isOrderMode:', this.isOrderMode);
      console.log('  - sidebar found:', !!sidebar);
      console.log('  - sidebar classes:', sidebar ? sidebar.className : 'N/A');
      console.log('  - sidebar style.display:', sidebar ? sidebar.style.display : 'N/A');
      console.log('  - order-items in DOM:', !!document.getElementById('order-items'));
      
      // If order-items is not found but we're in order mode, try to make sidebar visible and retry
      if (this.isOrderMode) {
        if (sidebar) {
          console.log('  - Making sidebar visible...');
          // Force sidebar to be visible
          sidebar.classList.remove('sidebar-hidden');
          sidebar.classList.add('sidebar-visible');
          sidebar.classList.add('is-open');
          
          // Add 'with-sidebar' class to content wrapper for mobile landscape mode
          const contentWrapper = document.querySelector('.content-wrapper');
          if (contentWrapper) {
            contentWrapper.classList.add('with-sidebar');
          }
          
          console.log('  - sidebar classes after change:', sidebar.className);
          
          // Try again after a short delay to allow DOM to update
          setTimeout(() => {
            const retryContainer = document.getElementById('order-items');
            console.log('🔍 DEBUG - updateOrderDisplay retry after 150ms:');
            console.log('  - order-items found on retry:', !!retryContainer);
            console.log('  - sidebar classes on retry:', sidebar ? sidebar.className : 'N/A');
            if (retryContainer) {
              console.log('  - SUCCESS: order-items found, updating content');
              this._updateOrderDisplayContent(retryContainer);
            } else {
              console.error('Element with ID "order-items" still not found after making sidebar visible');
              console.log('  - All elements with class sidebar-visible:', document.querySelectorAll('.sidebar-visible').length);
              console.log('  - All elements with id order-sidebar:', document.querySelectorAll('#order-sidebar').length);
              // Don't force order mode off, just log the error
              Logger.error('Unable to find order-items container even after making sidebar visible');
            }
          }, 150); // Increased timeout to allow for CSS transitions
        } else {
          console.error('Sidebar element not found in DOM');
        }
      }
      return;
    }
    this._updateOrderDisplayContent(orderItemsContainer);
  }

  _updateOrderDisplayContent(orderItemsContainer) {
    orderItemsContainer.innerHTML = '';

    const orderTotalAmount = document.getElementById('order-total-amount');
    if (!orderTotalAmount) {
      console.error('Element with ID "order-total-amount" not found');
      return;
    }

    const itemsToDisplay = this.core.getItems(); 

    itemsToDisplay.forEach(item => {
      const itemElement = document.createElement('div');
      itemElement.className = 'order-item';

      const itemHeader = document.createElement('div');
      itemHeader.className = 'order-item-header';

      const itemName = document.createElement('div');
      itemName.className = 'order-item-name';
      itemName.textContent = item.name;
      const nameKey = `product-name_${simpleHash((item.name || '').trim())}`;
      itemName.setAttribute('data-translate', nameKey);
      itemName.setAttribute('data-namespace', 'products');
      itemName.setAttribute('data-original-text', item.name || '');

      const removeButton = document.createElement('button');
      removeButton.className = 'remove-order-item';
      setSafeInnerHTML(removeButton, '&times;');
      removeButton.addEventListener('click', () => {
        this.removeOrderItem(item.id);
      });

      itemHeader.appendChild(itemName);
      itemHeader.appendChild(removeButton);

      const itemPrice = document.createElement('div');
      itemPrice.className = 'order-item-price';
      itemPrice.textContent = formatPrice(item.price);

      itemElement.appendChild(itemHeader);
      itemElement.appendChild(itemPrice);

      if (item.customizations && item.customizations.length > 0) {
        item.customizations.forEach(customization => {
          const customElem = document.createElement('div');
          customElem.className = 'order-item-customization';
          customElem.textContent = customization;
          const optKey = `product-option_${simpleHash((customization || '').trim())}`;
          customElem.setAttribute('data-translate', optKey);
          customElem.setAttribute('data-namespace', 'products');
          customElem.setAttribute('data-original-text', customization || '');
          itemElement.appendChild(customElem);
        });
      }

      orderItemsContainer.appendChild(itemElement);
    });

    const total = this.core.getTotal(); 
    orderTotalAmount.textContent = formatPrice(total);
  }

  removeOrderItem(itemId) {
    this.core.removeItem(itemId); 
    this.updateOrderDisplay();
  }

  completeOrder() {
    const currentOrderItems = this.core.getItems();
    
    if (currentOrderItems.length === 0) {
      OrderSystemValidations.showValidationModal(
        'La orden está vacía. Por favor agregue productos.',
        this._createSimpleModal.bind(this)
      );
      return;
    }

    this._showSuccessModal('¡Orden completada con éxito!', () => {
      const order = {
        id: Date.now(), 
        items: this.core.getItems(), 
        total: this.core.getTotal(), 
        date: new Date().toLocaleString()
      };
      
      const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      existingOrders.push(order);
      localStorage.setItem('orders', JSON.stringify(existingOrders));
      
      this.core.clearItems();
      this.updateOrderDisplay();
      this.toggleOrderMode(true);
    });
  }

  _showSuccessModal(message, onConfirm) {
    this._createSimpleModal(message, 'Aceptar', onConfirm);
  }

  _createSimpleModal(message, buttonText, onConfirm) {
    const modalBackdrop = this._createElement('div', 'modal-backdrop');
    const modalContent = this._createElement('div', 'modal-content');
    
    const modalTitle = this._createElement('h3');
    modalTitle.textContent = message;
    
    const modalActions = this._createElement('div', 'modal-actions');
    const confirmBtn = this._createElement('button', 'nav-button');
    confirmBtn.textContent = buttonText;
    confirmBtn.addEventListener('click', () => {
      document.body.removeChild(modalBackdrop);
      if (onConfirm) onConfirm();
    });
    
    modalActions.appendChild(confirmBtn);
    [modalTitle, modalActions].forEach(el => modalContent.appendChild(el));
    modalBackdrop.appendChild(modalContent);
    document.body.appendChild(modalBackdrop);
  }

  /**
   * Determines liquor category from product name for customization rules
   * Uses brand mapping and fallback logic for accurate liquor classification
   * Critical for applying correct accompaniment options and drink limits
   * @param {string} productName - Name of the liquor product
   * @returns {string} Liquor category (RON, TEQUILA, WHISKY, etc.)
   */
  getLiquorType(productName) {
    // Comprehensive brand to category mapping for accurate liquor classification
    const BRAND_MAPPING = {
      'BACARDÍ': 'RON', 'HAVANA': 'RON', 'MATUSALEM': 'RON', 
      'APPLETON ESTATE': 'RON', 'CAPITÁN MORGAN': 'RON', 'ZACAPA 23': 'RON',
      'MALIBU': 'RON', // Special handling in drink options
      
      'CUERVO': 'TEQUILA', 'DON JULIO': 'TEQUILA', 'HERRADURA': 'TEQUILA', 
      'MAESTRO DOBEL DIAMANTE': 'TEQUILA', 'TRADICIONAL': 'TEQUILA',
      
      'BUCHANAN': 'WHISKY', 'CHIVAS': 'WHISKY', 'JACK DANIELS': 'WHISKY', 
      'BLACK & WHITE': 'WHISKY', 'J.W.': 'WHISKY',
      
      'ABSOLUT': 'VODKA', 'GREY GOOSE': 'VODKA', 'SMIRNOFF': 'VODKA', 
      'STOLICHNAYA': 'VODKA',
      
      'TORRES': 'BRANDY', 'FUNDADOR': 'BRANDY', 'CARLOS I': 'BRANDY', 
      'TERRY CENTENARIO': 'BRANDY',
      
      'BOMBAY': 'GINEBRA', 'TANQUERAY': 'GINEBRA', 'BEEFEATER': 'GINEBRA', 
      'HENDRICK': 'GINEBRA', 'MONKEY 47': 'GINEBRA', 'THE BOTANIST': 'GINEBRA',
      
      '400 CONEJOS': 'MEZCAL', 'AMARÁS': 'MEZCAL', 'MONTELOBOS': 'MEZCAL', 
      'UNION': 'MEZCAL', 'TRIPAS DE MAGUEY': 'MEZCAL',
      
      'RÉMY MARTIN': 'COGNAC', 'HENNESSY': 'COGNAC', 'MARTELL': 'COGNAC', 
      'COURVOISIER': 'COGNAC',
      
      'HIPNOTIQ': 'DIGESTIVOS', 
      'LICOR 43': 'DIGESTIVOS', 
      'JÄGERMEISTER': 'DIGESTIVOS', 
      'BAILEYS': 'DIGESTIVOS', 
      'CADENAS DULCE': 'DIGESTIVOS', 
      'ZAMBUCA': 'DIGESTIVOS',
      
      'MOËT': 'ESPUMOSOS', 
      'CHANDON': 'ESPUMOSOS', 
      'TAITTINGER': 'ESPUMOSOS', 
      'VEUVE CLICQUOT': 'ESPUMOSOS'
    };

    const normalizedName = productName
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
      .toUpperCase();

    if (normalizedName.includes('MALIBU')) return 'RON';
    if (normalizedName.includes('TRIPAS DE MAGUEY')) return 'MEZCAL';

    for (const [brand, category] of Object.entries(BRAND_MAPPING)) {
      const normalizedBrand = brand.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
      if (normalizedName.includes(normalizedBrand)) return category;
    }

    if (normalizedName.includes("RON")) return 'RON';
    if (normalizedName.includes("TEQUILA")) return 'TEQUILA';
    if (normalizedName.includes("WHISKY")) return 'WHISKY';
    if (normalizedName.includes("VODKA")) return 'VODKA';
    if (normalizedName.includes("BRANDY")) return 'BRANDY';
    if (normalizedName.includes("GINEBRA") || normalizedName.includes("GIN")) return 'GINEBRA';
    if (normalizedName.includes("MEZCAL")) return 'MEZCAL';
    if (normalizedName.includes("COGNAC")) return 'COGNAC';
    if (normalizedName.includes("DIGESTIVO")) return 'DIGESTIVOS';
    if (normalizedName.includes("ESPUMOSO")) return 'ESPUMOSOS';

    return 'OTRO'; // Fallback for unrecognized products
  }

  renderModalFromTemplate(modalId, templateId) {
    const modal = document.getElementById(modalId); 
    if (!modal) {
      logError(`Modal element with ID '${modalId}' not found.`);
      throw new Error(`Modal element ${modalId} not found`);
    }
    
    modal.innerHTML = '';
    
    const template = document.getElementById(templateId);
    if (!template) {
      logError(`Plantilla faltante para: ${modalId}. Template ID: ${templateId}`);
      throw new Error(`Template ${templateId} no encontrado para modal ${modalId}`);
    }
    const clone = document.importNode(template.content, true);
    modal.appendChild(clone);
    
    // Re-enhance modal with show/hide methods after template loading
    // Use setTimeout to ensure DOM is fully updated
    setTimeout(() => {
      this.enhanceModalElement(modal);
    }, 0);
  }
  
  /**
   * Enhances a single modal element with show/hide methods
   * Uses the global enhancement system for consistency
   * @param {HTMLElement} modal - The modal element to enhance
   */
  enhanceModalElement(modal) {
    if (!modal) {
      Logger.error('enhanceModalElement: No modal provided');
      return;
    }
    
    // Force add show method (always override)
    modal.show = function() {
      this.className = this.className.replace('modal-hidden', '').trim() + ' modal-flex';
      // Semantic open state for drink modal
      if (this.id === 'drink-options-modal' || this.classList.contains('drink-modal')) {
        this.classList.add('is-open');
      }
    };
    
    // Force add hide method (always override)
    modal.hide = function() {
      this.className = this.className.replace('modal-flex', '').trim() + ' modal-hidden';
      // Clear semantic open state for drink modal
      if (this.id === 'drink-options-modal' || this.classList.contains('drink-modal')) {
        this.classList.remove('is-open');
      }
    };
    
    // Also use global enhancement if available as backup
    if (typeof window.enhanceModalGlobally === 'function') {
      window.enhanceModalGlobally(modal);
    }
    
    // Verify methods were added correctly (only log errors)
    if (typeof modal.show !== 'function' || typeof modal.hide !== 'function') {
      Logger.error(`Modal ${modal.id} enhancement FAILED - show: ${typeof modal.show}, hide: ${typeof modal.hide}`);
    }
  }

  deleteOrder(orderId) {
    this._showConfirmationModal(
      '¿Está seguro de que desea eliminar esta orden?',
      'Esta acción moverá la orden al historial.',
      () => {
        const savedOrders = JSON.parse(localStorage.getItem('orders') || '[]');
        const orderToDelete = savedOrders.find(order => order.id === orderId);
        const updatedOrders = savedOrders.filter(order => order.id !== orderId);
        localStorage.setItem('orders', JSON.stringify(updatedOrders));
        
        if (orderToDelete) {
          const orderHistory = JSON.parse(localStorage.getItem('orderHistory') || '[]');
          orderHistory.push({...orderToDelete, deletedAt: new Date().toLocaleString()});
          localStorage.setItem('orderHistory', JSON.stringify(orderHistory));
        }
        
        // Actualizar solo la vista activa correspondiente
        const ordersScreen = document.querySelector('.orders-screen');
        if (ordersScreen && !ordersScreen.classList.contains('screen-hidden')) {
          if (this.isShowingHistory) {
            const historyContainer = document.querySelector('.order-history-container');
            if (historyContainer) {
              this.populateOrderHistoryScreen(historyContainer); 
            }
          } else {
            // Limpiar y repoblar solo la lista de órdenes activas
            const ordersList = document.getElementById('orders-list');
            if (ordersList) {
              ordersList.innerHTML = '';
              this._populateOrdersList('orders-list', 'orders', 'No hay órdenes guardadas.', true);
            }
          }
        }
      }
    );
  }

  showOrdersScreen() {
    console.log("montado"); // Log para validar el montaje
    
    const elements = {
      mainContentScreen: document.querySelector('.main-content-screen'),
      contentContainer: document.getElementById('content-container'),
      pageTitleElement: document.querySelector('.page-title'),
      hamburgerBtn: document.getElementById('hamburger-btn'),
      ordersScreen: document.querySelector('.orders-screen')
    };
    
    elements.hamburgerBtn.className = 'hamburger-btn hamburger-hidden';
    elements.contentContainer.className = 'content-hidden';
    
    this.previousCategory = elements.mainContentScreen.getAttribute('data-category');
    this.previousTitle = elements.pageTitleElement ? elements.pageTitleElement.textContent : 'Coctelería';
    this.isShowingHistory = false;
    
    // Remover cualquier pantalla de órdenes existente para evitar duplicados
    if (elements.ordersScreen && elements.ordersScreen.parentNode) {
      elements.ordersScreen.parentNode.removeChild(elements.ordersScreen);
    }
    
    // Crear y agregar una nueva pantalla de órdenes
    elements.mainContentScreen.appendChild(this._createOrdersScreen());
    this.populateOrdersScreen();
  }

  _createOrdersScreen() {
    const ordersScreen = document.createElement('div');
    ordersScreen.className = 'orders-screen';
    
    const header = this._createOrdersHeader();
    const ordersListContainer = this._createElement('div', 'orders-list-container');
    const ordersList = this._createElement('div', 'orders-list', 'orders-list');
    
    ordersListContainer.appendChild(ordersList);
    ordersScreen.appendChild(header);
    ordersScreen.appendChild(ordersListContainer);
    
    return ordersScreen;
  }

  _createOrdersHeader() {
    const header = this._createElement('div', 'orders-screen-header');
    
    const buttons = [
      { class: 'nav-button orders-back-btn', text: 'Volver', handler: async () => await this.hideOrdersScreen() },
      { class: 'nav-button history-btn', text: 'Historial Órdenes', handler: (btn) => this.toggleOrderHistoryView(btn) }
    ];
    
    const backButton = this._createButton(buttons[0]);
    const title = this._createElement('h2', 'orders-screen-title');
    title.textContent = 'Órdenes Guardadas';
    const historyButton = this._createButton(buttons[1]);
    
    [backButton, title, historyButton].forEach(el => header.appendChild(el));
    return header;
  }

  _createElement(tag, className, id = null) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (id) element.id = id;
    return element;
  }

  _createButton({ class: className, text, handler }) {
    const button = this._createElement('button', className);
    button.textContent = text;
    button.addEventListener('click', async () => await handler(button));
    return button;
  }
  
  populateOrdersScreen() {
    this._populateOrdersList('orders-list', 'orders', 'No hay órdenes guardadas.', true);
  }

  toggleOrderHistoryView(button) {
    this.isShowingHistory = !this.isShowingHistory;
    const elements = {
      ordersList: document.getElementById('orders-list'),
      orderHistoryContainer: document.querySelector('.order-history-container'),
      ordersScreenTitle: document.querySelector('.orders-screen-title')
    };

    if (this.isShowingHistory) {
      this._showHistoryView(button, elements);
    } else {
      this._showActiveOrdersView(button, elements);
    }
  }

  _showHistoryView(button, { ordersList, orderHistoryContainer, ordersScreenTitle }) {
    console.log("Mostrando vista de historial");
    button.textContent = 'Ver Órdenes Activas';
    if (ordersScreenTitle) ordersScreenTitle.textContent = 'Historial de Órdenes';
    if (ordersList) {
      ordersList.classList.add('screen-hidden');
      ordersList.classList.remove('screen-visible');
    }
    
    // Siempre crear un nuevo contenedor de historial para evitar problemas de estado
    if (orderHistoryContainer && orderHistoryContainer.parentNode) {
      orderHistoryContainer.parentNode.removeChild(orderHistoryContainer);
    }
    orderHistoryContainer = this._createHistoryContainer();
    
    // Asegurarse de que el contenedor se muestra correctamente
    orderHistoryContainer.classList.add('screen-visible');
    orderHistoryContainer.classList.remove('screen-hidden');
    
    // Limpiar y repoblar el contenedor de historial
    orderHistoryContainer.innerHTML = '';
    this.populateOrderHistoryScreen(orderHistoryContainer);
  }

  _showActiveOrdersView(button, { ordersList, orderHistoryContainer, ordersScreenTitle }) {
    button.textContent = 'Historial Órdenes';
    if (ordersScreenTitle) ordersScreenTitle.textContent = 'Órdenes Guardadas';
    if (orderHistoryContainer) {
      orderHistoryContainer.classList.add('screen-hidden');
      orderHistoryContainer.classList.remove('screen-visible');
    }
    if (ordersList) {
      ordersList.classList.add('screen-visible');
      ordersList.classList.remove('screen-hidden');
    }
    this.populateOrdersScreen();
    
      // Limpiar el botón fijo al salir de la vista de historial
    console.log("Exiting history view - cleaning up button");
    this._cleanupFixedButton();
  }

  _createHistoryContainer() {
    const container = this._createElement('div', 'order-history-container orders-list');
    const parent = document.querySelector('.orders-list-container');
    if (parent) {
      parent.appendChild(container);
      return container;
    } else {
      logError('Cannot find .orders-list-container to append history');
      return null;
    }
  }
  
  populateOrderHistoryScreen(container) {
    container.innerHTML = '';
    
    // Agregar el contenedor de lista de órdenes
    const ordersListContent = this._createElement('div', 'history-list-content');
    container.appendChild(ordersListContent);
    
    // Poblar el contenedor con las órdenes del historial
    this._populateOrdersList(ordersListContent, 'orderHistory', 'No hay órdenes en el historial.', false);
    
    // Crear un contenedor fijo en la parte inferior para el botón de limpiar
    this._createFixedBottomClearButton(container);
  }

  _createFixedBottomClearButton(parentContainer) {
    console.log("Creating fixed bottom clear button");
    
    // Limpiar cualquier botón fijo existente antes de crear uno nuevo
    this._cleanupExistingFixedButtons();
    
    // Crear contenedor fijo en la parte inferior
    const fixedContainer = this._createElement('div', 'fixed-bottom-actions');
    Object.assign(fixedContainer.style, {
      position: 'fixed',
      bottom: '20px',
      left: '0',
      right: '0',
      textAlign: 'center',
      zIndex: '100'
    });
    
    // Crear el botón de limpiar historial
    const button = this._createElement('button', 'nav-button clear-history-btn');
    button.textContent = 'Limpiar Historial';
    Object.assign(button.style, {
      width: '90%',
      maxWidth: '300px',
      padding: '12px 24px',
      fontSize: '16px',
      backgroundColor: 'rgba(255, 99, 71, 0.2)',
      borderColor: 'rgba(255, 99, 71, 0.5)',
      color: 'rgba(255, 99, 71, 1)',
      borderRadius: '8px'
    });
    
    button.addEventListener('mouseover', function() {
      this.style.backgroundColor = 'rgba(255, 99, 71, 0.8)';
      this.style.color = 'white';
    });
    
    button.addEventListener('mouseout', function() {
      this.style.backgroundColor = 'rgba(255, 99, 71, 0.2)';
      this.style.color = 'rgba(255, 99, 71, 1)';
    });
    
    button.addEventListener('click', () => {
      // Encontrar el contenedor de lista de órdenes para limpiar
      const historyListContent = parentContainer.querySelector('.history-list-content');
      this.promptClearHistory(historyListContent || parentContainer);
    });
    
    fixedContainer.appendChild(button);
    
    // Hacer que el contenedor sea parte del contenedor de historial, no del body
    parentContainer.appendChild(fixedContainer);
    
    // Definir función para limpiar este botón específico
    this._cleanupFixedButton = function() {
      console.log("Cleaning up fixed bottom button");
      if (fixedContainer && fixedContainer.parentNode) {
        fixedContainer.parentNode.removeChild(fixedContainer);
      }
      // Reiniciar la función para evitar referencias colgantes
      this._cleanupFixedButton = function() { console.log("No fixed button to clean up"); };
    }.bind(this);
  }
  

  
  _cleanupExistingFixedButtons() {
    console.log("Cleaning up any existing fixed buttons");
    const existingFixedButtons = document.querySelectorAll('.fixed-bottom-actions');
    existingFixedButtons.forEach(btn => {
      btn.remove();
    });
  }
  
  // Modificar hideOrdersScreen para limpiar el botón fijo
  async hideOrdersScreen() {
    console.log("desmontado"); // Log para validar el desmontaje
    
    // Limpiar el botón fijo al salir de la pantalla de órdenes
    console.log("Hiding orders screen - cleaning up button");
    this._cleanupFixedButton();
    
    try {
      // Ocultar la pantalla de órdenes
      const ordersScreen = document.querySelector('.orders-screen');
      if (ordersScreen) {
        ordersScreen.classList.add('screen-hidden');
        ordersScreen.classList.remove('screen-visible');
        
        // Eliminar event listeners de todos los botones dentro de ordersScreen
        const buttons = ordersScreen.querySelectorAll('button');
        buttons.forEach(button => {
          const newButton = button.cloneNode(true);
          button.parentNode.replaceChild(newButton, button);
        });
        
        // Eliminar completamente el elemento ordersScreen
        setTimeout(() => {
          if (ordersScreen.parentNode) {
            ordersScreen.parentNode.removeChild(ordersScreen);
          }
        }, 300);
      }
      
      // Asegurarse de que la pantalla principal esté visible
      const mainContentScreen = document.querySelector('.main-content-screen');
      if (mainContentScreen) {
        mainContentScreen.classList.remove('screen-hidden');
        mainContentScreen.classList.add('screen-visible');
      }
      
      // Restablecer el estado de visualización de historial
      this.isShowingHistory = false;
      
      // Cargar el contenido de la categoría anterior
      if (this.previousCategory) {
        await AppInit.loadContent(this.previousCategory);
      } else {
        await AppInit.loadContent('cocteles'); // Valor predeterminado si no hay categoría anterior
      }
      
      // Mostrar el botón de hamburguesa nuevamente
      const hamburgerBtn = document.getElementById('hamburger-btn');
      if (hamburgerBtn) {
        hamburgerBtn.className = 'hamburger-btn';
      }
      
      // Mostrar el contenedor de contenido
      const contentContainer = document.getElementById('content-container');
      if (contentContainer) {
        contentContainer.className = 'content-container';
      }
    } catch (error) {
      console.error('Error al ocultar la pantalla de órdenes:', error);
      // Mostrar pantalla principal como fallback
      const mainContentScreen = document.querySelector('.main-content-screen');
      if (mainContentScreen) {
        mainContentScreen.classList.remove('screen-hidden');
        mainContentScreen.classList.add('screen-visible');
      }
    }
  }

  _populateOrdersList(containerOrId, storageKey, emptyMessage, includeDeleteButton) {
    const container = typeof containerOrId === 'string' ? document.getElementById(containerOrId) : containerOrId;
    // Limpiar el contenedor antes de agregar órdenes para evitar duplicación
    container.innerHTML = '';
    const orders = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    if (orders.length === 0) {
      container.appendChild(this._createEmptyMessage(emptyMessage));
      return;
    }
    
    orders.forEach((order, index) => {
      container.appendChild(this._createOrderElement(order, index, includeDeleteButton));
    });
  }

  _createEmptyMessage(message) {
    const element = this._createElement('div');
    Object.assign(element.style, {
      gridColumn: '1 / -1',
      textAlign: 'center',
      padding: '50px',
      color: 'var(--primary-color)'
    });
    element.textContent = message;
    return element;
  }

  _createOrderElement(order, index, includeDeleteButton) {
    const orderElement = document.createElement('div');
    orderElement.className = 'saved-order';

    const orderHeader = document.createElement('h3');
    const headerLabel = document.createElement('span');
    headerLabel.className = 'title-text';
    headerLabel.textContent = 'ORDEN';
    const headerKey = `ui-label_${simpleHash('ORDEN')}`;
    headerLabel.setAttribute('data-translate', headerKey);
    headerLabel.setAttribute('data-namespace', 'ui');
    headerLabel.setAttribute('data-original-text', 'ORDEN');
    orderHeader.appendChild(headerLabel);
    orderHeader.appendChild(document.createTextNode(` ${index + 1} - ${order.date}`));
    orderElement.appendChild(orderHeader);

    const orderItemsList = document.createElement('div');
    orderItemsList.className = 'saved-order-items';

    order.items.forEach(item => {
      const itemElement = document.createElement('div');
      itemElement.className = 'saved-order-item';

      const itemName = document.createElement('div');
      itemName.className = 'saved-order-item-name';
      itemName.textContent = item.name;
      const savedNameKey = `product-name_${simpleHash((item.name || '').trim())}`;
      itemName.setAttribute('data-translate', savedNameKey);
      itemName.setAttribute('data-namespace', 'products');
      itemName.setAttribute('data-original-text', item.name || '');

      const itemPrice = document.createElement('div');
      itemPrice.className = 'saved-order-item-price';
      itemPrice.textContent = formatPrice(item.price);

      itemElement.appendChild(itemName);
      itemElement.appendChild(itemPrice);

      if (item.customizations && item.customizations.length > 0) {
        item.customizations.forEach(customization => {
          const customElem = document.createElement('div');
          customElem.className = 'saved-order-item-customization';
          customElem.textContent = customization;
          const savedOptKey = `product-option_${simpleHash((customization || '').trim())}`;
          customElem.setAttribute('data-translate', savedOptKey);
          customElem.setAttribute('data-namespace', 'products');
          customElem.setAttribute('data-original-text', customization || '');
          itemElement.appendChild(customElem);
        });
      }
      orderItemsList.appendChild(itemElement);
    });
    orderElement.appendChild(orderItemsList);

    const orderTotal = document.createElement('div');
    orderTotal.className = 'saved-order-total';
    const totalLabel = document.createElement('span');
    totalLabel.className = 'title-text';
    totalLabel.textContent = 'Total:';
    const totalKey = `ui-label_${simpleHash('Total:')}`;
    totalLabel.setAttribute('data-translate', totalKey);
    totalLabel.setAttribute('data-namespace', 'ui');
    totalLabel.setAttribute('data-original-text', 'Total:');
    orderTotal.appendChild(totalLabel);
    orderTotal.appendChild(document.createTextNode(` ${formatPrice(order.total)}`));
    orderElement.appendChild(orderTotal);

    if (includeDeleteButton) {
      const deleteButton = document.createElement('button');
      deleteButton.className = 'nav-button delete-order-btn';
      deleteButton.textContent = 'Eliminar Orden';
      // Determinar si estamos en historial o en órdenes activas
      if (this.isShowingHistory) {
        deleteButton.addEventListener('click', () => this.deleteFromHistory(order.id));
      } else {
        deleteButton.addEventListener('click', () => this.deleteOrder(order.id));
      }
      orderElement.appendChild(deleteButton);
    }

    return orderElement;
  }
  
  deleteFromHistory(orderId) {
    this._showConfirmationModal(
      '¿Está seguro de que desea eliminar esta orden del historial?',
      'Esta acción eliminará permanentemente la orden del historial.',
      () => {
        // Solo eliminar del historial, NO afectar órdenes activas
        const orderHistory = JSON.parse(localStorage.getItem('orderHistory') || '[]');
        const updatedHistory = orderHistory.filter(order => order.id !== orderId);
        localStorage.setItem('orderHistory', JSON.stringify(updatedHistory));
        
        // Actualizar solo la vista del historial
        const historyContainer = document.querySelector('.order-history-container');
        if (historyContainer) {
          this.populateOrderHistoryScreen(historyContainer);
        }
      }
    );
  }

  promptClearHistory(historyContainer) {
    this._showConfirmationModal(
      '¿Está seguro de que desea limpiar el historial?',
      'Esta acción no se puede deshacer.',
      () => {
        // Solo limpiar el historial, NO las órdenes activas
        localStorage.setItem('orderHistory', JSON.stringify([]));
        
        // Limpiar solo el contenedor del historial
        if (historyContainer) {
          historyContainer.innerHTML = '';
          historyContainer.appendChild(this._createEmptyMessage('El historial ha sido limpiado.'));
        }
        
        // NO afectar las órdenes activas - mantener localStorage 'orders' intacto
        // Las órdenes activas deben permanecer en su interfaz
      }
    );
  }

  _showConfirmationModal(title, message, onConfirm) {
    const modalBackdrop = this._createElement('div', 'modal-backdrop');
    const modalContent = this._createElement('div', 'modal-content');
    
    const modalTitle = this._createElement('h3');
    modalTitle.textContent = title;
    
    const modalMessage = this._createElement('p');
    modalMessage.textContent = message;
    Object.assign(modalMessage.style, {
      textAlign: 'center',
      marginBottom: '20px',
      color: 'var(--text-color)'
    });
    
    const modalActions = this._createElement('div', 'modal-actions');
    const buttons = [
      { text: 'Aceptar', handler: () => { onConfirm(); this._removeModal(modalBackdrop); } },
      { text: 'Cancelar', handler: () => this._removeModal(modalBackdrop) }
    ];
    
    buttons.forEach(({ text, handler }) => {
      const btn = this._createElement('button', 'nav-button');
      btn.textContent = text;
      btn.addEventListener('click', handler);
      modalActions.appendChild(btn);
    });
    
    [modalTitle, modalMessage, modalActions].forEach(el => modalContent.appendChild(el));
    modalBackdrop.appendChild(modalContent);
    document.body.appendChild(modalBackdrop);
  }

  _removeModal(modalBackdrop) {
    document.body.removeChild(modalBackdrop);
  }

  async hideOrdersScreen() {
    console.log("desmontado"); // Log para validar el desmontaje
    
    Logger.debug('🔄 Ocultando pantalla de órdenes - Estado DOM antes:', {
      mainScreen: !!document.getElementById('main-screen'),
      contentContainer: !!document.getElementById('content-container'),
      ordersBox: !!document.getElementById('orders-box'),
      previousCategory: this.previousCategory,
      url: window.location.href
    });
    
    const elements = {
      contentContainer: document.getElementById('content-container'),
      ordersScreen: document.querySelector('.orders-screen'),
      hamburgerBtn: document.getElementById('hamburger-btn'),
      mainContentScreen: document.querySelector('.main-content-screen')
    };
    
    // Mostrar botón hamburguesa y ocultar pantalla de órdenes
    elements.hamburgerBtn.classList.add('hamburger-visible');
    elements.hamburgerBtn.classList.remove('hamburger-hidden');
    
    // Limpiar y remover event listeners de la pantalla de órdenes
    if (elements.ordersScreen) {
      // Remover todos los event listeners hijos
      const buttons = elements.ordersScreen.querySelectorAll('button');
      buttons.forEach(button => {
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
      });
      
      // Eliminar la pantalla de órdenes del DOM para una limpieza completa
      if (elements.ordersScreen.parentNode) {
        elements.ordersScreen.parentNode.removeChild(elements.ordersScreen);
      }
    }
    
    // Mostrar contenedor de contenido
    elements.contentContainer.classList.add('content-visible');
    elements.contentContainer.classList.remove('content-hidden');
    
    // Asegurar que mainContentScreen sea visible
    if (elements.mainContentScreen) {
      elements.mainContentScreen.classList.add('screen-visible');
      elements.mainContentScreen.classList.remove('screen-hidden');
    }
    
    // Resetear estado local
    this.isShowingHistory = false;
    
    // Cargar el contenido anterior
    if (this.previousCategory && window.AppInit) {
      Logger.debug('📞 Llamando a AppInit.loadContent con categoría:', this.previousCategory);
      try {
        await window.AppInit.loadContent(this.previousCategory);
        
        // Log DOM state after loadContent
        setTimeout(() => {
          Logger.debug('📊 Estado DOM después de loadContent:', {
            mainScreen: !!document.getElementById('main-screen'),
            contentContainer: !!document.getElementById('content-container'),
            ordersBox: !!document.getElementById('orders-box'),
            mainScreenVisible: document.getElementById('main-screen') ? !document.getElementById('main-screen').classList.contains('screen-hidden') : false
          });
        }, 100);
      } catch (error) {
        Logger.error('❌ Error al cargar contenido anterior:', error);
        // Fallback: Mostrar la pantalla principal
        if (elements.mainContentScreen) {
          elements.mainContentScreen.classList.add('screen-visible');
          elements.mainContentScreen.classList.remove('screen-hidden');
        }
      }
    }
  }
}

// Wait for AppInit to be ready before initializing OrderSystem
let orderSystemInitialized = false;

function initializeOrderSystem() {
  if (orderSystemInitialized) {
    Logger.info('OrderSystem already initialized, skipping...');
    return;
  }
  
  // Log DOM state before initialization
  const mainScreen = document.getElementById('main-screen');
  const contentContainer = document.getElementById('content-container');
  const ordersBox = document.getElementById('orders-box');
  
  Logger.debug('🔧 Inicializando OrderSystem - Estado DOM:', {
    mainScreen: !!mainScreen,
    contentContainer: !!contentContainer,
    ordersBox: !!ordersBox,
    mainScreenVisible: mainScreen ? !mainScreen.classList.contains('screen-hidden') : false,
    mainScreenClasses: mainScreen ? Array.from(mainScreen.classList) : [],
    url: window.location.href
  });
  
  try {
    const orderSystem = new OrderSystem();
    orderSystem.initialize();
    orderSystemInitialized = true;
    
    // Log DOM state after initialization
    setTimeout(() => {
      const afterMainScreen = document.getElementById('main-screen');
      const afterContentContainer = document.getElementById('content-container');
      const afterOrdersBox = document.getElementById('orders-box');
      
      Logger.debug('✅ OrderSystem inicializado - Estado DOM después:', {
        mainScreen: !!afterMainScreen,
        contentContainer: !!afterContentContainer,
        ordersBox: !!afterOrdersBox,
        mainScreenVisible: afterMainScreen ? !afterMainScreen.classList.contains('screen-hidden') : false,
        mainScreenClasses: afterMainScreen ? Array.from(afterMainScreen.classList) : []
      });
    }, 50);
    
    Logger.info('OrderSystem initialized successfully');
  } catch (error) {
    Logger.error('Failed to initialize OrderSystem:', error);
    // Retry after a short delay
    setTimeout(initializeOrderSystem, 100);
  }
}

// Check if AppInit is already available, otherwise wait for it
if (window.AppInit && window.DIContainer) {
  initializeOrderSystem();
} else {
  // Listen for AppInit completion
  document.addEventListener('app-init-complete', initializeOrderSystem);
  
  // Listen for content ready events to ensure DOM elements are available
  document.addEventListener('app-content-ready', function() {
    // Ensure OrderSystem is initialized when content is ready
    if (!orderSystemInitialized) {
      initializeOrderSystem();
    }
  });
  
  // Fallback: try after DOMContentLoaded with a delay
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initializeOrderSystem, 500);
  });
}