// ProductData is now accessed through DI Container
// Import shared utilities
import { getProductRepository } from '../../../../Shared/utils/diUtils.js';
import { setSafeInnerHTML } from '../../../../Shared/utils/domUtils.js';
import { logError, logWarning } from '../../../../Shared/utils/errorHandler.js';
import Logger from '../../../../Shared/utils/logger.js';

// Caché de videos recientes en memoria
const videoCache = new Map();
const MAX_CACHE_SIZE = 5; // Número máximo de videos a mantener en caché

// Función para verificar si el navegador soporta Service Worker
function supportServiceWorker() {
  return 'serviceWorker' in navigator && 'CacheStorage' in window;
}

// Función para verificar el tipo de conexión
function getNetworkType() {
  if ('connection' in navigator) {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return connection.effectiveType || 'unknown';
  }
  return 'unknown';
}

// Precachear videos recientes (si es posible)
async function precacheVideo(videoUrl) {
  if (!supportServiceWorker()) return;
  
  try {
    // Solo precachear en conexiones WiFi para evitar consumir datos móviles
    const networkType = getNetworkType();
    if (networkType.includes('2g') || networkType.includes('3g')) return;
    
    // No precachear si el video ya está en caché
    if (videoCache.has(videoUrl)) return;
    
    // Realizar una solicitud para precachear el video
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // Timeout de 5 segundos
    
    await fetch(videoUrl, {
      method: 'GET',
      cache: 'force-cache',
      signal: controller.signal,
      headers: {
        'Range': 'bytes=0-499999' // Solo precargar los primeros 500KB
      }
    });
    
    clearTimeout(timeoutId);
    Logger.info('Video precacheado parcialmente:', videoUrl);
    
    // Agregar a la caché de memoria
    addToMemoryCache(videoUrl);
  } catch (error) {
    logWarning('Error al precachear video:', error);
  }
}

// Agregar video a la caché de memoria
function addToMemoryCache(videoUrl) {
  // Eliminar el video más antiguo si se excede el tamaño máximo
  if (videoCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = videoCache.keys().next().value;
    videoCache.delete(oldestKey);
  }
  
  // Guardar con timestamp para futura gestión
  videoCache.set(videoUrl, {
    timestamp: Date.now(),
    lastAccessed: Date.now()
  });
}

// Actualizar el timestamp de acceso de un video
function updateCacheAccess(videoUrl) {
  if (videoCache.has(videoUrl)) {
    videoCache.set(videoUrl, {
      ...videoCache.get(videoUrl),
      lastAccessed: Date.now()
    });
  }
}

const ProductRenderer = {
  // Current view mode: 'table' or 'grid'
  currentViewMode: 'table',
  
  // Phase 3: Event delegation system
  eventDelegationInitialized: false,
  boundDelegatedHandler: null,
  
  // Toggle between table and grid view
  toggleViewMode: async function() {
    this.currentViewMode = this.currentViewMode === 'table' ? 'grid' : 'table';
    Logger.info('View mode toggled to:', this.currentViewMode);
    
    // Update toggle button text
    const toggleBtn = document.querySelector('.view-toggle-btn');
    if (toggleBtn) {
      toggleBtn.textContent = this.currentViewMode === 'table' ? '🔲' : '📋';
      toggleBtn.classList.toggle('active', this.currentViewMode === 'grid');
    }
    
    // Refresh the current view to apply the new mode
    const container = document.getElementById('content-container');
    if (container) {
      await this.refreshCurrentView(container);
    }
    
    return this.currentViewMode;
  },
  
  // Phase 3: Initialize intelligent event delegation
  initEventDelegation: function() {
    if (this.eventDelegationInitialized) return;
    
    this.boundDelegatedHandler = this.handleDelegatedEvent.bind(this);
    document.addEventListener('click', this.boundDelegatedHandler);
    this.eventDelegationInitialized = true;
    
    Logger.info('Event delegation system initialized for ProductRenderer');
  },
  
  // Phase 3: Centralized event handler
  handleDelegatedEvent: function(e) {
    const target = e.target;
    
    // Handle view toggle buttons
    if (target.classList && target.classList.contains('view-toggle-btn')) {
      e.preventDefault();
      this.toggleViewMode().then(() => {
        // Refresh the current view to apply the new mode
        const container = document.getElementById('content-container');
        if (container) {
          return this.refreshCurrentView(container);
        }
      }).catch(err => {
        Logger.error('Error in view toggle:', err);
      });
      return;
    }
    
    // Handle back buttons (both floating and top nav)
    if (target.classList && (target.classList.contains('back-button') || target.classList.contains('top-back-btn'))) {
      e.preventDefault();
      const container = target.closest('.content-wrapper') || document.querySelector('.content-wrapper');
      if (container) this.handleBackButton(target);
      return;
    }
    
    // Handle price buttons
    if (target.classList && target.classList.contains('price-button')) {
      e.preventDefault();
      this.handlePriceButtonClick(target, e);
      return;
    }
    
    // Handle video thumbnails
    if ((target.classList && target.classList.contains('video-thumb')) || (target.classList && target.classList.contains('video-thumbnail'))) {
      e.preventDefault();
      this.handleVideoClick(target);
      return;
    }
    
    // Handle product images
    if (target.classList && target.classList.contains('product-image')) {
      e.preventDefault();
      this.handleImageClick(target);
      return;
    }
    
    // Handle product cards (grid view)
    if (target.classList && target.classList.contains('product-card')) {
      e.preventDefault();
      this.handleCardClick(target, e);
      return;
    }
    
    // Handle category cards
    if ((target.classList && target.classList.contains('category-card')) || target.closest('.category-card')) {
      e.preventDefault();
      this.handleCategoryCardClick(target);
      return;
    }
    
    // Handle modal close buttons
    if (target.classList && target.classList.contains('modal-close-btn')) {
      e.preventDefault();
      this.handleModalClose(target);
      return;
    }
    
    // Handle modal backdrop clicks
    if ((target.classList && target.classList.contains('modal-backdrop')) || 
        (target.classList && target.classList.contains('video-modal-backdrop')) || 
        (target.classList && target.classList.contains('image-modal-backdrop'))) {
      this.handleModalBackdropClick(target, e);
      return;
    }
  },
  
  // Phase 3: Cleanup event delegation
  destroyEventDelegation: function() {
    if (this.boundDelegatedHandler) {
      document.removeEventListener('click', this.boundDelegatedHandler);
      this.boundDelegatedHandler = null;
      this.eventDelegationInitialized = false;
      Logger.info('Event delegation system destroyed');
    }
  },
  
  // Create view toggle button (optimized)
  createViewToggle: function(container) {
    // Initialize event delegation if not already done
    this.initEventDelegation();
    
    const toggleContainer = document.createElement('div');
    toggleContainer.className = 'view-toggle-container';
    
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'view-toggle-btn';
    toggleBtn.textContent = this.currentViewMode === 'table' ? '🔲' : '📋';
    toggleBtn.classList.toggle('active', this.currentViewMode === 'grid');
    
    // No individual event listener needed - handled by delegation
    toggleContainer.appendChild(toggleBtn);
    return toggleContainer;
  },
  
  // Refresh current view with new mode
  refreshCurrentView: async function(container) {
    const viewData = this._extractViewData(container);
    if (!viewData) return;
    
    const backButtonHTML = this._preserveBackButton(container);
    const targetContainer = this._clearAndRestoreContainer(container, backButtonHTML);
    await this._renderCategoryView(targetContainer, viewData.category);
  },

  _extractViewData: function(container) {
    const existingTable = container.querySelector('table, .product-grid');
    if (!existingTable) return null;
    
    const category = existingTable.dataset.category;
    if (!category) return null;
    
    return { category };
  },

  _preserveBackButton: function(container) {
    const backButtonContainer = container.querySelector('.back-button-container');
    return backButtonContainer ? backButtonContainer.outerHTML : null;
  },

  _clearAndRestoreContainer: function(container, backButtonHTML) {
    // Get or create content container without destroying sidebar structure
    let targetContainer = document.getElementById('content-container');
    if (!targetContainer) {
      // Find the content-container-flex to maintain proper structure
      const flexContainer = document.querySelector('.content-container-flex');
      if (flexContainer) {
        targetContainer = document.createElement('div');
        targetContainer.id = 'content-container';
        // Insert before the sidebar to maintain proper order
        const existingSidebar = flexContainer.querySelector('#order-sidebar');
        if (existingSidebar) {
          flexContainer.insertBefore(targetContainer, existingSidebar);
        } else {
          flexContainer.appendChild(targetContainer);
        }
      } else {
        // Fallback: create in the provided container
        targetContainer = document.createElement('div');
        targetContainer.id = 'content-container';
        container.appendChild(targetContainer);
      }
    } else {
      // Clear only the content container, leaving sidebar untouched
      targetContainer.innerHTML = '';
    }
    
    if (backButtonHTML) {
      this._restoreBackButton(targetContainer, backButtonHTML);
    }
    
    return targetContainer;
  },

  _restoreBackButton: function(container, backButtonHTML) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = backButtonHTML;
    const restoredBackButton = tempDiv.firstChild;
    
    // No need to add individual event listener - handled by delegation
    container.appendChild(restoredBackButton);
  },
  
  // Phase 3: Specific event handlers
  handleCategoryCardClick: function(target) {
    const categoryCard = target.closest('.category-card') || target;
    const category = categoryCard.dataset.category;
    
    Logger.info(`🎯 Clic en categoría de licor: ${category}`);
    
    // Log current DOM state before navigation
    const currentMainScreen = document.getElementById('main-screen');
    const currentContentContainer = document.getElementById('content-container');
    const currentOrdersBox = document.getElementById('orders-box');
    
    Logger.debug('📊 Estado DOM antes de clic en categoría:', {
      category: category,
      mainScreen: !!currentMainScreen,
      contentContainer: !!currentContentContainer,
      ordersBox: !!currentOrdersBox,
      mainScreenVisible: currentMainScreen ? !currentMainScreen.classList.contains('hidden') : false,
      mainScreenClasses: currentMainScreen ? Array.from(currentMainScreen.classList) : []
    });
    
    if (category) {
      const container = categoryCard.closest('.content-wrapper') || document.querySelector('.content-wrapper');
      if (container) {
        Logger.debug(`📦 Container encontrado para categoría ${category}`);
        this.renderLicorSubcategory(container, category);
      } else {
        Logger.error(`❌ No se encontró container para categoría ${category}`);
      }
    } else {
      Logger.warn('⚠️ No se encontró categoría en el elemento clickeado');
    }
  },
  
  handleModalClose: function(target) {
    const modal = target.closest('.modal-backdrop');
    if (modal) {
      modal.remove();
    }
  },
  
  handleModalBackdropClick: function(target, event) {
    // Only close if clicking directly on the backdrop, not on modal content
    if (event.target === target) {
      target.remove();
    }
  },
  
  handlePriceButtonClick: function(target, event) {
    if (target.disabled || (target.classList && target.classList.contains('non-selectable'))) {
      return;
    }
    
    const row = target.closest('tr');
    const card = target.closest('.product-card');
    
    if (row) {
      // Table view handling
      const nameCell = row.querySelector('.product-name');
      const priceText = target.textContent;
      const productName = nameCell.textContent;
      
      if (window.OrderSystem && window.OrderSystem.handleProductSelection) {
        window.OrderSystem.handleProductSelection(productName, priceText, row, event);
      }
    } else if (card) {
      // Grid view handling
      const productName = target.dataset.productName;
      const priceText = target.textContent;
      
      Logger.debug('[GRID DEBUG] Price button clicked:', {
        productName,
        priceText,
        field: target.dataset.field,
        orderSystemExists: !!window.OrderSystem,
        isOrderMode: window.OrderSystem?.isOrderMode
      });
      
      if (window.OrderSystem && window.OrderSystem.handleProductSelection) {
        window.OrderSystem.handleProductSelection(productName, priceText, card, event);
      }
    }
  },
  
  handleVideoClick: function(target) {
    const videoUrl = target.dataset.videoUrl || target.src;
    const productName = target.alt?.replace('Ver video de ', '') || target.alt?.replace('Video de ', '') || 'Producto';
    const categoryElement = target.closest('table, .product-grid');
    const category = categoryElement?.dataset.category;
    
    const liquorCategories = ['whisky', 'tequila', 'ron', 'vodka', 'ginebra', 'mezcal', 'cognac', 'brandy', 'digestivos', 'espumosos'];
    const modalCategory = (category === 'cervezas' || category === 'refrescos' || liquorCategories.includes(category)) ? category : null;
    
    // Actualizar el acceso a la caché para este video
    updateCacheAccess(videoUrl);
    
    // Intentar precachear videos relacionados que puedan ser necesarios próximamente
    this.precacheRelatedVideos(categoryElement);
    
    // Mostrar el modal del video con optimizaciones para dispositivos móviles
    this.showVideoModal(videoUrl, productName, modalCategory);
  },
  
  // Precachear videos relacionados que puedan ser vistos próximamente
  precacheRelatedVideos: function(categoryElement) {
    if (!categoryElement) return;
    
    try {
      // Obtener los videos visibles en la página actual
      const visibleVideos = Array.from(categoryElement.querySelectorAll('video[data-src], .video-thumb[data-video-url]'));
      
      // Obtener los URLs de los primeros 3 videos que no estén en caché
      const videosToPrecache = visibleVideos
        .slice(0, 3) // Solo los primeros 3
        .map(video => video.dataset.src || video.dataset.videoUrl)
        .filter(url => url && !videoCache.has(url));
      
      // Precachear cada video en paralelo
      videosToPrecache.forEach(videoUrl => {
        precacheVideo(videoUrl);
      });
    } catch (error) {
      logWarning('Error al intentar precachear videos relacionados:', error);
    }
  },
  
  handleImageClick: function(target) {
    const mediaUrl = target.src;
    const productName = target.alt || 'Producto';
    const categoryElement = target.closest('table, .product-grid');
    const category = categoryElement?.dataset.category;
    
    const liquorCategories = ['whisky', 'tequila', 'ron', 'vodka', 'ginebra', 'mezcal', 'cognac', 'brandy', 'digestivos', 'espumosos'];
    const isLiquorSubcategory = category && liquorCategories.includes(category);
    
    // For liquor subcategories, check if it's a video
    if (isLiquorSubcategory && this.isVideoUrl(mediaUrl)) {
      const modalCategory = category;
      this.showVideoModal(mediaUrl, productName, modalCategory);
    } else {
      const modalCategory = (category === 'cervezas' || category === 'refrescos') ? category : null;
      this.showImageModal(mediaUrl, productName, modalCategory);
    }
  },
  
  handleCardClick: function(target, event) {
    // Handle card clicks if needed for future functionality
    Logger.debug('Product card clicked:', target);
  },
  
  handleBackButton: function(target) {
    // Handle back button navigation based on context
    const wrapper = target.closest('.content-wrapper') || document.querySelector('.content-wrapper');
    
    if (wrapper) {
      // Check if we're in a liquor subcategory and need to go back to licores
      if (target.title === 'Volver a Licores' || target.dataset.action === 'back-to-licores') {
        Logger.info('🔄 Navegando de vuelta a Licores desde subcategoría');
        
        // Log current DOM state before manipulation
        const currentMainScreen = document.getElementById('main-screen');
        const currentContentContainer = document.getElementById('content-container');
        const currentOrdersBox = document.getElementById('orders-box');
        
        Logger.debug('📊 Estado DOM antes de volver a Licores:', {
          mainScreen: !!currentMainScreen,
          contentContainer: !!currentContentContainer,
          ordersBox: !!currentOrdersBox,
          mainScreenVisible: currentMainScreen ? !currentMainScreen.classList.contains('hidden') : false
        });
        
        // Get or create content container for rendering
        let container = wrapper.querySelector('#content-container');
        if (!container) {
          Logger.warn('⚠️ Content container no encontrado, creando uno nuevo');
          container = document.createElement('div');
          container.id = 'content-container';
          const flexContainer = wrapper.querySelector('.content-container-flex');
          if (flexContainer) {
            flexContainer.insertBefore(container, flexContainer.firstChild);
            Logger.debug('✅ Container insertado en flex container');
          } else {
            wrapper.appendChild(container);
            Logger.debug('✅ Container agregado al wrapper');
          }
        } else {
          Logger.debug('✅ Content container encontrado, limpiando contenido');
          // Clear only the content container, preserving sidebar
          container.innerHTML = '';
        }
        
        Logger.info('🍷 Renderizando vista de Licores');
        this.renderLicores(container);
        
        // Ocultar botón de back en la barra superior y limpiar título
        const topBackBtn = document.getElementById('top-back-btn');
        const navTitle = document.getElementById('nav-title');
        
        if (topBackBtn) {
          topBackBtn.classList.add('back-btn-hidden');
          topBackBtn.removeAttribute('data-action');
          topBackBtn.removeAttribute('title');
          
          // Limpiar event listener específico
          if (this._topBackBtnHandler) {
            topBackBtn.removeEventListener('click', this._topBackBtnHandler);
            this._topBackBtnHandler = null;
          }
        }
        
        if (navTitle) {
          navTitle.textContent = '';
        }
        
        // Log DOM state after rendering
        setTimeout(() => {
          const afterMainScreen = document.getElementById('main-screen');
          const afterContentContainer = document.getElementById('content-container');
          const afterOrdersBox = document.getElementById('orders-box');
          
          Logger.debug('📊 Estado DOM después de renderizar Licores:', {
            mainScreen: !!afterMainScreen,
            contentContainer: !!afterContentContainer,
            ordersBox: !!afterOrdersBox,
            mainScreenVisible: afterMainScreen ? !afterMainScreen.classList.contains('hidden') : false
          });
        }, 100);
      } else {
        // Generic back navigation - could be extended for other contexts
        Logger.debug('Back button clicked - implement specific navigation logic');
      }
    }
  },

  _renderCategoryView: async function(container, category) {
    const categoryRenderers = this._getCategoryRenderers();
    const renderer = categoryRenderers[category];
    
    if (renderer) {
      await renderer(container);
    } else {
      Logger.warn('Unknown category for refresh:', category);
    }
  },

  _getCategoryRenderers: function() {
    return {
      'cocteleria': (container) => this.renderCocktails(container),
      'pizzas': (container) => this.renderPizzas(container),
      'alitas': (container) => this.renderAlitas(container),
      'sopas': (container) => this.renderSopas(container),
      'ensaladas': (container) => this.renderEnsaladas(container),
      'carnes': (container) => this.renderCarnes(container),
      'cafe': (container) => this.renderCafe(container),
      'postres': (container) => this.renderPostres(container),
      'refrescos': (container) => this.renderRefrescos(container),
      'cervezas': (container) => this.renderCervezas(container),
      'tequila': (container) => this.renderTequila(container),
      'whisky': (container) => this.renderWhisky(container),
      'ron': (container) => this.renderRon(container),
      'vodka': (container) => this.renderVodka(container),
      'ginebra': (container) => this.renderGinebra(container),
      'mezcal': (container) => this.renderMezcal(container),
      'cognac': (container) => this.renderCognac(container),
      'brandy': (container) => this.renderBrandy(container),
      'digestivos': (container) => this.renderDigestivos(container),
      'espumosos': (container) => this.renderEspumosos(container)
    };
  },

  createProductTable: function(container, headers, data, fields, tableClass, categoryTitle) {
    const table = this._createTableElement(tableClass, categoryTitle);
    const titleRow = this._createTitleRow(categoryTitle, headers.length);
    const tableHead = this._createTableHeader(headers, titleRow);
    const tbody = this._createTableBody(data, fields, categoryTitle);
    
    table.appendChild(tableHead);
    table.appendChild(tbody);
    container.appendChild(table);
  },

  _createTableElement: function(tableClass, categoryTitle) {
    const table = document.createElement('table');
    table.className = tableClass;
    
    const normalizedCategory = this._normalizeCategory(categoryTitle);
    table.dataset.category = normalizedCategory;
    table.dataset.productType = this._determineProductType(normalizedCategory, tableClass, categoryTitle);
    
    return table;
  },

  _normalizeCategory: function(categoryTitle) {
    return categoryTitle
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  },

  _determineProductType: function(normalizedCategory, tableClass, categoryTitle) {
    const foodCategories = ['pizzas', 'alitas', 'sopas', 'ensaladas', 'carnes'];
    const beverageCategories = ['cocteleria', 'refrescos', 'cervezas', 'cafe', 'postres'];

    if (foodCategories.includes(normalizedCategory)) {
      return 'food';
    } else if (beverageCategories.includes(normalizedCategory)) {
      return 'beverage';
    } else if (tableClass === 'liquor-table' || normalizedCategory === 'licores') {
      return 'liquor';
    } else {
      logWarning(`Unknown product type for category: ${categoryTitle} (normalized: ${normalizedCategory})`);
      return 'unknown';
    }
  },

  _createTitleRow: function(categoryTitle, headerLength) {
    const titleRow = document.createElement('tr');
    titleRow.className = 'title-row';
    const titleCell = document.createElement('td');
    titleCell.colSpan = headerLength;
    const titleElement = document.createElement('h2');
    titleElement.className = 'page-title';
    titleElement.textContent = categoryTitle;
    titleCell.appendChild(titleElement);
    titleRow.appendChild(titleCell);
    return titleRow;
  },

  _createTableHeader: function(headers, titleRow) {
    const tableHead = document.createElement('thead');
    tableHead.appendChild(titleRow);
    
    const headerRow = document.createElement('tr');
    headerRow.setAttribute('data-nombre-column', 'true');
    
    headers.forEach(header => {
      const th = document.createElement('th');
      th.textContent = header;
      if (header === 'NOMBRE') {
        th.setAttribute('data-nombre-header', 'true');
      }
      headerRow.appendChild(th);
    });
    
    tableHead.appendChild(headerRow);
    return tableHead;
  },

  _createTableBody: function(data, fields, categoryTitle) {
    const tbody = document.createElement('tbody');
    
    data.forEach(item => {
      const row = this._createTableRow(item, fields, categoryTitle);
      tbody.appendChild(row);
    });
    
    return tbody;
  },

  _createTableRow: function(item, fields, categoryTitle) {
    const row = document.createElement('tr');
    
    fields.forEach(field => {
      const td = this._createTableCell(item, field, categoryTitle);
      row.appendChild(td);
    });
    
    return row;
  },

  _createTableCell: function(item, field, categoryTitle) {
    const td = document.createElement('td');
    
    if (field === 'nombre') {
      this._createNameCell(td, item[field]);
    } else if (field === 'ingredientes') {
      this._createIngredientsCell(td, item[field]);
    } else if (this._isPriceField(field)) {
      this._createPriceCell(td, item, field);
    } else if (field === 'video') {
      this._createVideoCell(td, item, categoryTitle);
    } else if (field === 'imagen' || field === 'ruta_archivo') {
      this._createImageCell(td, item, field, categoryTitle);
    } else {
      td.textContent = item[field] || '';
    }
    
    return td;
  },

  _createNameCell: function(td, nombre) {
    td.className = 'product-name';
    td.textContent = nombre;
  },

  _createIngredientsCell: function(td, ingredientes) {
    td.className = 'product-ingredients';
    td.textContent = ingredientes || '';
  },

  _isPriceField: function(field) {
    return field.includes('precio') || field === 'precioBotella' || field === 'precioLitro' || field === 'precioCopa';
  },

  _formatPriceForLiquor: function(priceValue) {
    // Check if price already has $ symbol
    if (typeof priceValue === 'string' && priceValue.includes('$')) {
      return priceValue;
    }
    
    // Add $ symbol for liquor prices
    return `$${priceValue}`;
  },

  _createPriceCell: function(td, item, field) {
    td.className = 'product-price';
    const priceButton = document.createElement('button');
    
    const priceValue = item[field];
    if (!priceValue || priceValue === '--') {
      priceButton.textContent = '--';
      priceButton.className = 'price-button non-selectable';
      priceButton.disabled = true;
    } else {
      priceButton.className = 'price-button';
      // Add $ symbol for liquor subcategories
      const formattedPrice = this._formatPriceForLiquor(priceValue);
      priceButton.textContent = formattedPrice;
      priceButton.dataset.productName = item.nombre;
      priceButton.dataset.priceType = field;
    }
    
    td.appendChild(priceButton);
  },

  _createVideoCell: function(td, item, categoryTitle) {
    td.className = 'video-icon';
    
    if (item.video) {
      const thumbnailUrl = this.getThumbnailUrl(item.video, item.nombre, '');
      const thumbnailImg = document.createElement('img');
      thumbnailImg.className = 'video-thumb';
      thumbnailImg.src = thumbnailUrl;
      thumbnailImg.alt = `Ver video de ${item.nombre}`;
      thumbnailImg.dataset.videoUrl = item.video;
      
      td.appendChild(thumbnailImg);
    } else {
      td.textContent = '--';
    }
  },

  // Helper function to detect if a URL is a video
  isVideoUrl: function(url) {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
    const lowerUrl = url.toLowerCase();
    return videoExtensions.some(ext => lowerUrl.endsWith(ext));
  },
  
  // Helper function to create a video element for thumbnails
  _createVideoThumbnail: function(item, field, categoryTitle) {
    const videoUrl = item[field];
    const video = document.createElement('video');
    
    // Configurar para autoplay en loop sin controles
    video.src = videoUrl; // Cargar directamente sin lazy loading para autoplay
    video.className = 'product-image product-video-thumbnail';
    video.loop = true;
    video.muted = true;
    video.autoplay = true;
    video.playsInline = true;
    video.controls = false; // Sin controles visibles
    video.style.objectFit = 'contain';
    video.style.opacity = '0';
    video.style.transition = 'opacity 0.3s ease-in-out';
    
    // Apply same styling as images
    const liquorCategories = ['whisky', 'tequila', 'ron', 'vodka', 'ginebra', 'mezcal', 'cognac', 'brandy', 'digestivos', 'espumosos'];
    const isBeverage = categoryTitle && (categoryTitle.toLowerCase() === 'cervezas' || categoryTitle.toLowerCase() === 'refrescos');
    const isLiquorSubcategory = categoryTitle && liquorCategories.includes(categoryTitle.toLowerCase());
    
    if (isBeverage || isLiquorSubcategory) {
      video.classList.add('product-image-large');
    } else {
      video.classList.add('product-image-small');
    }
    
    // Add loading state y autoplay
    video.onloadeddata = function() {
      video.style.opacity = '1';
      // Asegurar que el video se reproduzca automáticamente
      video.play().catch(e => {
        console.log('Autoplay prevented:', e);
        // Si autoplay falla, intentar reproducir cuando el usuario interactúe
        video.addEventListener('click', () => video.play(), { once: true });
      });
    };
    
    // Manejo de errores
    video.onerror = function() {
      logWarning('Error loading video thumbnail:', { videoUrl });
      // Crear imagen de respaldo si el video falla
      const img = document.createElement('img');
      const parent = video.parentElement;
      if (parent) {
        this._loadImageOptimized(img, item.imagen || item.ruta_archivo || this.getThumbnailUrl(videoUrl), item.nombre, video.className);
        parent.replaceChild(img, video);
      }
    };
    
    // Preload metadata para mejor rendimiento
    video.setAttribute('preload', 'metadata');
    
    return video;
  },
  
  // Cargar imagen con optimizaciones de lazy loading y placeholders
  _loadImageOptimized: function(img, src, alt, className) {
    // Detectar si es un dispositivo móvil
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Para imágenes críticas (licores, cervezas, etc.), cargar directamente
    const isCriticalImage = className.includes('product-image-large') || 
                           className.includes('video-thumbnail') || 
                           className.includes('category-image') ||
                           className.includes('product-image');
    
    if (isCriticalImage) {
      // Carga directa para imágenes críticas
      img.style.opacity = '0';
      img.style.transition = 'opacity 0.3s ease-in-out';
      img.src = src;
      img.alt = alt;
      img.className = className;
      
      // Evento de carga completada
      img.onload = function() {
        img.style.opacity = '1';
      };
      
      // Manejo de errores
      img.onerror = function() {
        logWarning('Error loading image:', { src });
        img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23fee"/%3E%3Ctext x="10" y="50" font-family="Arial" font-size="12" fill="%23900"%3EFallo al cargar%3C/text%3E%3C/svg%3E';
        img.style.opacity = '1';
      };
    } else {
      // Lazy loading para imágenes no críticas
      img.style.opacity = '0';
      img.style.transition = 'opacity 0.3s ease-in-out';
      img.dataset.src = src;
      img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23f0f0f0"/%3E%3C/svg%3E';
      img.alt = alt;
      img.className = className + ' lazy-load';
      
      // En dispositivos móviles, reducir prioridad de carga de imágenes no esenciales
      if (isMobile) {
        img.loading = 'lazy';
      }
      
      // Evento de carga completada
      img.onload = function() {
        img.style.opacity = '1';
        img.classList.remove('lazy-load');
      };
      
      // Manejo de errores
      img.onerror = function() {
        logWarning('Error loading image:', { src });
        img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23fee"/%3E%3Ctext x="10" y="50" font-family="Arial" font-size="12" fill="%23900"%3EFallo al cargar%3C/text%3E%3C/svg%3E';
        img.style.opacity = '1';
      };
    }
  },
  
  // Cargar recursos multimedia con estrategias basadas en dispositivo y red
  _loadMediaResource: function(element) {
    const isVideo = element.tagName === 'VIDEO';
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const networkType = getNetworkType();
    
    if (isVideo) {
      const video = element;
      
      // Configurar atributos optimizados para videos
      video.preload = networkType.includes('2g') || networkType.includes('3g') ? 'metadata' : 'auto';
      video.autoplay = false; // No autoplay en miniaturas para ahorrar recursos
      
      // Cargar el video
      video.src = video.dataset.src;
      video.load();
      
      // En caso de videos en miniaturas, intentar reproducir silenciosamente
      if (video.classList.contains('video-thumbnail') && !video.classList.contains('video-modal')) {
        video.muted = true;
        video.loop = true;
        
        // Intentar reproducir con manejador de errores
        video.onloadeddata = function() {
          this.style.opacity = '1';
          this.classList.remove('lazy-load');
          
          // Solo intentar reproducir en redes no 2G
          if (!networkType.includes('2g')) {
            this.play().catch(e => {
              logWarning('Failed to autoplay video thumbnail:', e);
              // En caso de fallo, mostrar el primer frame como imagen
              this.poster = this.currentSrc + '#t=0.1';
            });
          }
        };
      } else {
        // Para videos no miniaturas, solo cargar el poster
        video.onloadeddata = function() {
          this.style.opacity = '1';
          this.classList.remove('lazy-load');
        };
      }
      
      // Manejar errores de carga
      video.onerror = function() {
        logWarning('Failed to load video:', { src: this.dataset.src });
        // Mostrar imagen de respaldo si el video falla
        if (this.parentElement) {
          const img = document.createElement('img');
          img.src = this.currentSrc ? this.currentSrc + '#t=0.1' : '';
          img.alt = this.alt || 'Video no disponible';
          img.className = this.className.replace('video', 'image').replace('lazy-load', '');
          img.style.opacity = '1';
          this.parentElement.replaceChild(img, this);
        }
      };
    } else {
      // Cargar imagen
      const img = element;
      img.src = img.dataset.src;
      
      // Mostrar imagen cuando se carga
      img.onload = function() {
        this.style.opacity = '1';
        this.classList.remove('lazy-load');
      };
      
      // Manejar errores de carga
      img.onerror = function() {
        logWarning('Failed to load image:', { src: this.dataset.src });
        // Imagen de respaldo
        this.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23fee"/%3E%3Ctext x="10" y="50" font-family="Arial" font-size="12" fill="%23900"%3EFallo al cargar%3C/text%3E%3C/svg%3E';
        this.style.opacity = '1';
        this.classList.remove('lazy-load');
      };
    }
  },
  
  // Inicializar lazy loading para imágenes y videos con optimizaciones para móviles
  _initLazyLoading: function() {
    // Detectar si es un dispositivo móvil y el tipo de conexión
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const networkType = getNetworkType();
    
    // Configurar opciones de observador según el dispositivo y red
    const observerOptions = {
      rootMargin: isMobile ? '100px 0px' : '300px 0px', // Menor margen en móviles
      threshold: 0.1
    };
    
    const lazyImages = document.querySelectorAll('img.lazy-load');
    const lazyVideos = document.querySelectorAll('video.lazy-load');
    
    const lazyLoadObserver = new IntersectionObserver(function(entries, observer) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          const element = entry.target;
          
          if (element.tagName === 'IMG') {
            const src = element.dataset.src;
            if (src) {
              // En redes lentas, retrasar carga de imágenes no esenciales
              if (isMobile && networkType.includes('2g') && !element.classList.contains('category-image')) {
                setTimeout(() => {
                  element.src = src;
                }, 500);
              } else {
                element.src = src;
              }
            }
          } else if (element.tagName === 'VIDEO') {
            const src = element.dataset.src;
            if (src) {
              // Priorizar videos en caché
              if (typeof videoCache !== 'undefined' && videoCache.has(src)) {
                // Video está en caché, cargar inmediatamente
                element.src = src;
                element.load();
              } else if (isMobile) {
                // En móviles, manejar según tipo de conexión
                if (networkType.includes('2g')) {
                  // En 2G, no cargar automáticamente videos, solo mostar poster
                  if (typeof getThumbnailUrl === 'function') {
                    element.poster = getThumbnailUrl(src);
                  } else {
                    element.poster = src + '#t=0.1';
                  }
                  element.style.opacity = '1';
                  element.classList.remove('lazy-load');
                } else {
                  // En redes más rápidas, cargar con un pequeño retraso
                  setTimeout(() => {
                    element.src = src;
                    element.load();
                  }, 300);
                }
              } else {
                // En desktop, cargar normalmente
                element.src = src;
                element.load();
              }
            }
          }
          
          observer.unobserve(element);
        }
      });
    }, observerOptions);
    
    lazyImages.forEach(function(img) {
      lazyLoadObserver.observe(img);
    });
    
    lazyVideos.forEach(function(video) {
      lazyLoadObserver.observe(video);
    });
  },
  
  _createImageCell: function(td, item, field, categoryTitle) {
    td.className = 'image-icon';
    if (item[field]) {
      const liquorCategories = ['whisky', 'tequila', 'ron', 'vodka', 'ginebra', 'mezcal', 'cognac', 'brandy', 'digestivos', 'espumosos'];
      const isLiquorSubcategory = categoryTitle && liquorCategories.includes(categoryTitle.toLowerCase());
      
      // For liquor subcategories, check if it's a video
      if (isLiquorSubcategory && this.isVideoUrl(item[field])) {
        const video = this._createVideoThumbnail(item, field, categoryTitle);
        td.appendChild(video);
      } else {
        const img = document.createElement('img');
        const isBeverage = categoryTitle && (categoryTitle.toLowerCase() === 'cervezas' || categoryTitle.toLowerCase() === 'refrescos');
        
        let className = 'product-image';
        if (isBeverage || isLiquorSubcategory) {
          className += ' product-image-large';
        } else {
          className += ' product-image-small';
        }
        
        this._loadImageOptimized(img, item[field], item.nombre, className);
        td.appendChild(img);
      }
    } else {
      td.textContent = '--';
    }
    
    // Inicializar lazy loading después de agregar las imágenes
    setTimeout(() => this._initLazyLoading(), 100);
  },

  _getCategoryForModal: function(categoryTitle) {
    return categoryTitle && (categoryTitle.toLowerCase() === 'cervezas' || categoryTitle.toLowerCase() === 'refrescos') ? categoryTitle.toLowerCase() : null;
  },
  
  // Create product grid view
  createProductGrid: function(container, data, fields, categoryTitle) {
    const grid = document.createElement('div');
    grid.className = 'product-grid';
    
    // Normalize categoryTitle for data-attribute
    const normalizedCategory = categoryTitle
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    grid.dataset.category = normalizedCategory;
    
    // Determine productType based on category
    let productType;
    const foodCategories = ['pizzas', 'alitas', 'sopas', 'ensaladas', 'carnes'];
    const beverageCategories = ['cocteleria', 'refrescos', 'cervezas', 'cafe', 'postres'];
    
    if (foodCategories.includes(normalizedCategory)) {
      productType = 'food';
    } else if (beverageCategories.includes(normalizedCategory)) {
      productType = 'beverage';
    } else {
      productType = 'unknown';
    }
    grid.dataset.productType = productType;
    
    // Add title
    const titleElement = document.createElement('h2');
    titleElement.className = 'page-title';
    titleElement.textContent = categoryTitle;
    grid.appendChild(titleElement);
    
    // Create product cards
    // Check if this is a liquor subcategory (declared outside the loop for reuse)
    const liquorCategories = ['whisky', 'tequila', 'ron', 'vodka', 'ginebra', 'mezcal', 'cognac', 'brandy', 'digestivos', 'espumosos'];
    const isLiquorCategory = liquorCategories.includes(normalizedCategory);
    
    data.forEach(item => {
      const card = document.createElement('div');
      card.className = 'product-card';
      
      // Product name
      const nameElement = document.createElement('div');
      nameElement.className = 'product-name';
      nameElement.textContent = item.nombre;
      card.appendChild(nameElement);
      
      // Product ingredients (if available)
      if (item.ingredientes) {
        const ingredientsElement = document.createElement('div');
        ingredientsElement.className = 'product-ingredients';
        ingredientsElement.textContent = item.ingredientes;
        card.appendChild(ingredientsElement);
      }
      
      // Media container (video or image)
      const mediaContainer = document.createElement('div');
      mediaContainer.className = 'product-media';
      
      // Reuse liquorCategories and isLiquorCategory variables declared outside the loop
      
      if (item.video) {
        const videoThumbnail = document.createElement('img');
        this._loadImageOptimized(videoThumbnail, this.getThumbnailUrl(item.video), `Video de ${item.nombre}`, 'video-thumbnail');
        videoThumbnail.dataset.videoUrl = item.video;
        // No individual event listener - handled by delegation
        mediaContainer.appendChild(videoThumbnail);
      } else if (item.imagen || item.ruta_archivo) {
        const mediaUrl = item.imagen || item.ruta_archivo;
        
        // For liquor subcategories, check if it's a video
        if (isLiquorCategory && this.isVideoUrl(mediaUrl)) {
          const video = document.createElement('video');
          video.src = mediaUrl; // Cargar directamente sin lazy loading para autoplay
          video.alt = item.nombre;
          video.className = 'product-image product-video-thumbnail';
          video.loop = true;
          video.muted = true;
          video.autoplay = true; // Autoplay para subcategorías de licores
          video.controls = false; // Sin controles visibles
          video.playsInline = true;
          video.style.objectFit = 'contain';
          video.style.opacity = '0';
          video.style.transition = 'opacity 0.3s ease-in-out';
          video.setAttribute('preload', 'auto'); // Cargar completamente para mejor loop
          
          // Manejo de carga y errores con autoplay
          video.onloadeddata = function() {
            video.style.opacity = '1';
            // Asegurar que el video se reproduzca automáticamente
            video.play().catch(e => {
              console.log('Autoplay prevented in grid:', e);
              // Si autoplay falla, intentar reproducir cuando el usuario interactúe
              video.addEventListener('click', () => video.play(), { once: true });
            });
          };
          
          video.onerror = function() {
            logWarning('Error loading video:', { mediaUrl });
            // Crear imagen de respaldo si el video falla
            const img = document.createElement('img');
            const parent = video.parentElement;
            if (parent) {
              this._loadImageOptimized(img, item.imagen || item.ruta_archivo, item.nombre, video.className);
              parent.replaceChild(img, video);
            }
          }.bind(this);
          
          // Add video to container
          mediaContainer.appendChild(video);
        } else {
          const image = document.createElement('img');
          this._loadImageOptimized(image, mediaUrl, item.nombre, 'product-image');
          // No individual event listener - handled by delegation
          mediaContainer.appendChild(image);
        }
      }
      
      // Inicializar lazy loading después de agregar los medios
      setTimeout(() => this._initLazyLoading(), 100);
      
      card.appendChild(mediaContainer);
      
      // Prices container
      const pricesContainer = document.createElement('div');
      pricesContainer.className = 'product-prices';
      
      // Reuse liquorCategories and isLiquorCategory variables declared outside the loop
      
      if (isLiquorCategory) {
        card.classList.add('liquor-card');
        card.dataset.productType = 'liquor';
        card.dataset.category = normalizedCategory;
      }
      
      // Price labels mapping for liquors
      const priceLabels = {
        'precioBotella': 'Botella',
        'precioLitro': 'Litro', 
        'precioCopa': 'Copa'
      };
      
      // Add price buttons based on available fields
      fields.forEach(field => {
        if (field.includes('precio') || field === 'precioBotella' || field === 'precioLitro' || field === 'precioCopa') {
          const priceValue = item[field];
          if (priceValue && priceValue !== '--') {
            if (isLiquorCategory && priceLabels[field]) {
              // Create price item container for liquors
              const priceItem = document.createElement('div');
              priceItem.className = 'price-item';
              
              // Create price label
              const priceLabel = document.createElement('span');
              priceLabel.className = 'price-label';
              priceLabel.textContent = priceLabels[field] + ':';
              priceItem.appendChild(priceLabel);
              
              // Create price button
              const priceButton = document.createElement('button');
              priceButton.className = 'price-button';
              // Add $ symbol for liquor subcategories
              const formattedPrice = this._formatPriceForLiquor(priceValue);
              priceButton.textContent = formattedPrice;
              priceButton.dataset.productName = item.nombre;
              priceButton.dataset.price = priceValue;
              priceButton.dataset.field = field;
              
              // No individual event listener - handled by delegation
              
              priceItem.appendChild(priceButton);
              pricesContainer.appendChild(priceItem);
            } else {
              // Regular price button for non-liquor categories
              const priceButton = document.createElement('button');
              priceButton.className = 'price-button';
              priceButton.textContent = priceValue;
              priceButton.dataset.productName = item.nombre;
              priceButton.dataset.price = priceValue;
              priceButton.dataset.field = field;
              
              // No individual event listener - handled by delegation
              
              pricesContainer.appendChild(priceButton);
            }
          }
        }
      });
      
      card.appendChild(pricesContainer);
      grid.appendChild(card);
    });
    
    container.appendChild(grid);
    
    // Apply intelligent text truncation after grid is rendered
    this.applyIntelligentTruncation(grid);
  },
  
  // Apply intelligent text truncation to product cards
  applyIntelligentTruncation: function(gridContainer) {
    // Wait for the DOM to be fully rendered
    setTimeout(() => {
      const productCards = gridContainer.querySelectorAll('.product-card');
      
      productCards.forEach(card => {
        // Skip product names - no truncation for titles
        const nameElement = card.querySelector('.product-name');
        if (nameElement) {
          // Remove any previous truncation attributes
          nameElement.removeAttribute('data-truncated');
          nameElement.classList.remove('height-auto', 'min-height-auto');
        }
        
        // Handle product ingredients only
        const ingredientsElement = card.querySelector('.product-ingredients');
        if (ingredientsElement) {
          this.handleTextOverflow(ingredientsElement, 3); // 3 lines for ingredients
        }
      });
    }, 50); // Small delay to ensure rendering is complete
  },
  
  // Handle text overflow for individual elements
  handleTextOverflow: function(element, maxLines) {
    if (!element || !element.textContent) return;
    
    const originalText = element.textContent.trim();
    if (!originalText) return;
    
    // Reset any previous modifications
    element.textContent = originalText;
    element.removeAttribute('data-truncated');
    element.classList.remove('height-auto', 'min-height-auto');
    
    // Force a reflow to get accurate measurements
    element.offsetHeight;
    
    // Get the computed dimensions after CSS has been applied
    const computedStyle = window.getComputedStyle(element);
    const elementHeight = parseFloat(computedStyle.height);
    const lineHeight = parseFloat(computedStyle.lineHeight);
    
    // Check if content overflows the CSS-defined space
    // Add a small tolerance to account for rounding errors
    const tolerance = 2;
    const actualScrollHeight = element.scrollHeight;
    
    if (actualScrollHeight > (elementHeight + tolerance) && elementHeight > 0) {
      // Content overflows - apply JavaScript truncation as fallback
      let start = 0;
      let end = originalText.length;
      let bestFit = originalText;
      let iterations = 0;
      const maxIterations = 15;
      
      while (start <= end && iterations < maxIterations) {
        const mid = Math.floor((start + end) / 2);
        const testText = originalText.substring(0, mid) + '...';
        element.textContent = testText;
        
        // Force reflow for accurate measurement
        element.offsetHeight;
        
        if (element.scrollHeight <= (elementHeight + tolerance)) {
          bestFit = testText;
          start = mid + 1;
        } else {
          end = mid - 1;
        }
        iterations++;
      }
      
      element.textContent = bestFit;
      
      // Mark as truncated for CSS pseudo-element
      if (bestFit !== originalText) {
        element.setAttribute('data-truncated', 'true');
      }
    }
    
    // Let CSS handle all sizing - don't override heights
  },

  getThumbnailUrl: function(videoUrl, productName, category) {
    // Extract category from video URL
    let extractedCategory = '';
    if (videoUrl.includes('/cocteleria/')) {
      extractedCategory = 'cocteleria';
    } else if (videoUrl.includes('/pizzas/')) {
      extractedCategory = 'pizzas';
    } else if (videoUrl.includes('/alitas/')) {
      extractedCategory = 'alitas';
    } else if (videoUrl.includes('/ensaladas/')) {
      extractedCategory = 'ensaladas';
    } else if (videoUrl.includes('/sopas/')) {
      extractedCategory = 'sopas';
    } else if (videoUrl.includes('/carnes/')) {
      extractedCategory = 'carnes';
    } else if (videoUrl.includes('/cafe/')) {
      extractedCategory = 'cafes';
    } else if (videoUrl.includes('/postres/')) {
      extractedCategory = 'postres';
    }
    
    // Extract video filename without extension
    const videoFilename = videoUrl.split('/').pop().replace('.mp4', '');
    
    // Special cases mapping for incorrect thumbnail URLs
    const specialCases = {
      'bufanda-negra': 'bufanda',
      'cantarito-fresa': 'Cantarito fresa',
      'martini-bealys': 'martini-baileys',
      'mojito-frutos-rojos': 'mojito-frutos-rojo',
      'alitas- habanero': 'alitas-habanero',
      'cafe-express': 'cafe-expess',
      'ensalada-mixta-con-pollo-parrilla': 'ensalada-mixta-con-pollo'
    };
    
    // Use special case mapping if available, otherwise use the original filename
    const thumbnailFilename = specialCases[videoFilename] || videoFilename;
    
    // Construct thumbnail URL
    return `https://udtlqjmrtbcpdqknwuro.supabase.co/storage/v1/object/public/productos/imagenes/bebidas/mini-${extractedCategory}/${thumbnailFilename}.webp`;
  },

  showVideoModal: function(videoUrl, title, category = null) {
    // Validar que la URL del video sea válida
    if (!videoUrl || !this.isVideoUrl(videoUrl)) {
      logWarning('Invalid video URL provided:', videoUrl);
      this.showImageModal(videoUrl, title, category); // Fallback a imagen
      return;
    }
    
    // Detectar si es un dispositivo móvil
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Create modal backdrop
    const modalBackdrop = document.createElement('div');
    modalBackdrop.className = 'modal-backdrop';
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content image-modal video-modal';
    if (category) {
      modalContent.setAttribute('data-category', category);
    }
    
    // Add title
    const modalTitle = document.createElement('h3');
    modalTitle.textContent = title;
    modalContent.appendChild(modalTitle);
    
    // Crear contenedor de video simplificado
    const videoContainer = document.createElement('div');
    videoContainer.className = 'video-container';
    videoContainer.style.position = 'relative';
    videoContainer.style.display = 'flex';
    videoContainer.style.justifyContent = 'center';
    videoContainer.style.alignItems = 'center';
    videoContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    videoContainer.style.borderRadius = '8px';
    videoContainer.style.overflow = 'hidden';
    
    // Add video con configuración para loop sin controles
    const video = document.createElement('video');
    video.src = videoUrl;
    
    // Detectar si es una subcategoría de licores para configuración especial
    const liquorCategories = ['whisky', 'tequila', 'ron', 'vodka', 'ginebra', 'mezcal', 'cognac', 'brandy', 'digestivos', 'espumosos'];
    const isLiquorCategory = category && liquorCategories.includes(category.toLowerCase());
    
    if (isLiquorCategory) {
      // Para subcategorías de licores: loop sin controles
      video.controls = false; // Sin controles visibles
      video.loop = true;
      video.muted = true; // Silenciado para permitir autoplay
      video.autoplay = true;
      video.playsInline = true;
      video.preload = 'auto'; // Cargar completamente para mejor loop
    } else {
      // Para otras categorías: controles normales
      video.controls = true; // Usar controles nativos del navegador
      video.loop = true;
      video.muted = false; // Permitir audio
      video.playsInline = true;
      video.preload = 'metadata'; // Cargar solo metadatos inicialmente
      
      // Configuración básica para móviles
      if (isMobile) {
        video.autoplay = false;
        video.muted = true; // Silenciar en móviles para permitir autoplay
      } else {
        video.autoplay = false; // No autoplay automático
      }
    }
    
    // Ensure video maintains aspect ratio
    video.style.maxWidth = '100%';
    video.style.maxHeight = '70vh';
    video.style.objectFit = 'contain';
    video.style.width = '100%';
    
    // Manejo de errores simplificado
    video.addEventListener('error', (e) => {
      console.warn('Video loading error:', e);
      
      // Crear mensaje de error más informativo
      const errorMessage = document.createElement('div');
      errorMessage.style.color = 'white';
      errorMessage.style.textAlign = 'center';
      errorMessage.style.padding = '40px 20px';
      errorMessage.style.fontSize = '16px';
      errorMessage.innerHTML = `
        <p>⚠️ Video no disponible</p>
        <p style="font-size: 14px; opacity: 0.8;">El video no se pudo cargar en este momento</p>
      `;
      
      // Reemplazar el video con el mensaje de error
      video.style.display = 'none';
      videoContainer.appendChild(errorMessage);
    });
    
    // Evento cuando el video está listo para reproducir
    video.addEventListener('loadedmetadata', () => {
      console.log('Video metadata loaded successfully');
    });
    
    videoContainer.appendChild(video);
    modalContent.appendChild(videoContainer);
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Cerrar';
    closeButton.className = 'nav-button modal-close-btn';
    closeButton.dataset.modalId = 'video-modal';
    modalContent.appendChild(closeButton);
    
    // Add modal to body
    modalBackdrop.className += ' video-modal-backdrop';
    modalBackdrop.appendChild(modalContent);
    document.body.appendChild(modalBackdrop);
  },

  showImageModal: function(imageUrl, title, category = null) {
    // Create modal backdrop
    const modalBackdrop = document.createElement('div');
    modalBackdrop.className = 'modal-backdrop';
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content image-modal';
    
    // Add title
    const modalTitle = document.createElement('h3');
    modalTitle.textContent = title;
    modalContent.appendChild(modalTitle);
    
    // Add image with standardized size
    const image = document.createElement('img');
    image.src = imageUrl;
    image.alt = title;
    modalContent.appendChild(image);
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Cerrar';
    closeButton.className = 'nav-button modal-close-btn';
    closeButton.dataset.modalId = 'image-modal';
    // No individual event listener - handled by delegation
    modalContent.appendChild(closeButton);
    
    // Add modal to body
    modalBackdrop.className += ' image-modal-backdrop';
    modalBackdrop.appendChild(modalContent);
    document.body.appendChild(modalBackdrop);
  },

  renderLicores: async function(container) {
    // Ensure we're working with the correct content container, not destroying the sidebar
    let targetContainer = container;
    
    // If container is not the specific content-container, find or create it
    if (container.id !== 'content-container') {
      targetContainer = document.getElementById('content-container');
      if (!targetContainer) {
        // Create content-container within the flex structure
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
          // Fallback: use the provided container but preserve sidebar
          const sidebar = document.getElementById('order-sidebar');
          const sidebarHTML = sidebar ? sidebar.outerHTML : null;
          targetContainer = container;
          if (sidebarHTML && !container.querySelector('#order-sidebar')) {
            container.insertAdjacentHTML('beforeend', sidebarHTML);
          }
        }
      }
    }
    
    const licoresHTML = `
      <div class="category-grid" data-product-type="liquor" data-category="licores">
        <h2 class="page-title">Licores</h2>
        ${this.createLicoresCategories()}
        <div class="subcategory-prompt">
          <h3>Elige una categoría</h3>
        </div>
      </div>
    `;
    
    // Contenido dinámico: HTML generado con datos internos de ProductData.licoresCategories
    // Aunque los datos son controlados, se usa sanitización como medida preventiva
    setSafeInnerHTML(targetContainer, licoresHTML);
    
    // No individual event listeners needed - handled by delegation
    // Category cards will be handled by the centralized event system
  },

  createLicoresCategories: function() {
    const productRepository = getProductRepository();
    const licoresCategories = productRepository.getLicoresCategories();
    
    const html = licoresCategories.map(category => `
      <div class="category-card" data-category="${category.nombre.toLowerCase()}">
        <img src="${category.icono}" alt="${category.nombre}" class="category-image">
        <h3 class="category-name">${category.nombre}</h3>
      </div>
    `).join('');
    
    return html;
  },

  renderLicorSubcategory: async function(container, category) {
    Logger.info(`🍾 Navegando hacia subcategoría de licores: ${category}`);
    
    // Log current DOM state before manipulation
    const currentMainScreen = document.getElementById('main-screen');
    const currentContentContainer = document.getElementById('content-container');
    const currentOrdersBox = document.getElementById('orders-box');
    
    Logger.debug('📊 Estado DOM antes de renderizar subcategoría:', {
      category: category,
      mainScreen: !!currentMainScreen,
      contentContainer: !!currentContentContainer,
      ordersBox: !!currentOrdersBox,
      mainScreenVisible: currentMainScreen ? !currentMainScreen.classList.contains('hidden') : false,
      mainScreenClasses: currentMainScreen ? Array.from(currentMainScreen.classList) : []
    });
    
    // Preserve the sidebar before clearing content
    // Look for sidebar in the correct location within the DOM structure
    const sidebar = document.getElementById('order-sidebar');
    let sidebarHTML = null;
    if (sidebar) {
      sidebarHTML = sidebar.outerHTML;
      Logger.debug('💾 Sidebar preservado para subcategoría');
    } else {
      Logger.warn('⚠️ No se encontró sidebar para preservar');
      Logger.debug('🔍 Buscando sidebar en DOM completo:', {
        sidebarInDocument: !!document.getElementById('order-sidebar'),
        contentContainerFlex: !!document.querySelector('.content-container-flex'),
        containerType: container.className || container.tagName
      });
    }
    
    // Get or create content container without destroying sidebar
    let targetContainer = document.getElementById('content-container');
    if (targetContainer) {
      // Simply clear the content container, leaving sidebar untouched
      targetContainer.innerHTML = '';
      Logger.debug('🧹 Content container limpiado, sidebar intacto');
    } else {
      Logger.warn('⚠️ No se encontró content-container, creando uno nuevo');
      // Find the content-container-flex to maintain proper structure
      const flexContainer = document.querySelector('.content-container-flex');
      if (flexContainer) {
        targetContainer = document.createElement('div');
        targetContainer.id = 'content-container';
        // Insert before the sidebar to maintain proper order
        const existingSidebar = flexContainer.querySelector('#order-sidebar');
        if (existingSidebar) {
          flexContainer.insertBefore(targetContainer, existingSidebar);
        } else {
          flexContainer.appendChild(targetContainer);
        }
        Logger.debug('🆕 Content container creado en estructura flex');
      } else {
        Logger.error('❌ No se encontró content-container-flex, estructura DOM comprometida');
        return;
      }
    }
    
    // Mostrar barra superior y botón de back
    const topNavBar = document.getElementById('top-nav-bar');
    const topBackBtn = document.getElementById('top-back-btn');
    const navTitle = document.getElementById('nav-title');
    
    // Mostrar la barra superior
    if (topNavBar) {
      topNavBar.classList.remove('top-nav-hidden');
      topNavBar.classList.add('top-nav-visible');
    }
    
    // Mostrar botón de back
    if (topBackBtn) {
      topBackBtn.classList.remove('back-btn-hidden');
      topBackBtn.dataset.action = 'back-to-licores';
      topBackBtn.title = 'Volver a Licores';
      
      // Agregar event listener específico para el botón de back
      // Remover listener anterior si existe
      if (this._topBackBtnHandler) {
        topBackBtn.removeEventListener('click', this._topBackBtnHandler);
      }
      
      // Crear y agregar nuevo listener
      this._topBackBtnHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        Logger.info('🔙 Botón de back clickeado - navegando a licores');
        this.handleBackButton(topBackBtn);
      };
      
      topBackBtn.addEventListener('click', this._topBackBtnHandler);
    }
    
    // ELIMINADO: No mostrar el título de la subcategoría en la barra superior
    // ya que el título aparece en el contenedor padre
    // if (navTitle) {
    //   const categoryTitle = category.charAt(0).toUpperCase() + category.slice(1);
    //   navTitle.textContent = categoryTitle;
    // }

    // Update the title for all subcategory renderings
    const categoryTitle = category.charAt(0).toUpperCase() + category.slice(1);
    
    // Load specific subcategory
    switch(category) {
      case 'whisky':
        await this.renderWhisky(targetContainer, categoryTitle);
        break;
      case 'tequila':
        await this.renderTequila(targetContainer, categoryTitle);
        break;
      case 'ron':
        await this.renderRon(targetContainer, categoryTitle);
        break;
      case 'vodka':
        await this.renderVodka(targetContainer, categoryTitle);
        break;
      case 'brandy':
        await this.renderBrandy(targetContainer, categoryTitle);
        break;
      case 'ginebra':
        await this.renderGinebra(targetContainer, categoryTitle);
        break;
      case 'mezcal':
        await this.renderMezcal(targetContainer, categoryTitle);
        break;
      case 'cognac':
        await this.renderCognac(targetContainer, categoryTitle);
        break;
      case 'digestivos':
        await this.renderDigestivos(targetContainer, categoryTitle);
        break;
      case 'espumosos':
        await this.renderEspumosos(targetContainer, categoryTitle);
        break;
      default:
        // Asignación segura: cadena estática sin riesgo XSS
        targetContainer.innerHTML += '<p>Categoría no disponible</p>';
    }
    
    // Log DOM state after rendering subcategory
    setTimeout(() => {
      const afterMainScreen = document.getElementById('main-screen');
      const afterContentContainer = document.getElementById('content-container');
      const afterOrdersBox = document.getElementById('orders-box');
      
      Logger.debug('📊 Estado DOM después de renderizar subcategoría:', {
        category: category,
        mainScreen: !!afterMainScreen,
        contentContainer: !!afterContentContainer,
        ordersBox: !!afterOrdersBox,
        mainScreenVisible: afterMainScreen ? !afterMainScreen.classList.contains('hidden') : false,
        mainScreenClasses: afterMainScreen ? Array.from(afterMainScreen.classList) : []
      });
      
      Logger.info(`✅ Subcategoría ${category} renderizada completamente`);
    }, 100);
  },

  // Generic liquor renderer - eliminates code duplication
  renderLiquorCategory: async function(container, subcategory, title) {
    const productRepository = getProductRepository();
    
    // Add view toggle button - DISABLED: Using top nav button instead
    // const toggleElement = this.createViewToggle(container);
    // container.appendChild(toggleElement);
    
    const liquorFields = ['nombre', 'imagen', 'precioBotella', 'precioLitro', 'precioCopa'];
    const liquorHeaders = ['NOMBRE', 'IMAGEN', 'PRECIO BOTELLA', 'PRECIO LITRO', 'PRECIO COPA'];
    
    try {
      const data = await productRepository.getLiquorSubcategory(subcategory);
      
      if (this.currentViewMode === 'grid') {
        this.createProductGrid(container, 
          data, 
          liquorFields,
          title
        );
      } else {
        this.createProductTable(container, 
          liquorHeaders, 
          data, 
          liquorFields,
          'liquor-table',
          title
        );
      }
    } catch (error) {
      logError(`Error rendering ${title}:`, error);
      container.innerHTML += `<p>Error cargando ${title}. Por favor, intente de nuevo.</p>`;
    }
  },

  // Optimized render methods using generic function
  renderWhisky: async function(container, title = 'Whisky') {
    await this.renderLiquorCategory(container, 'whisky', title);
  },

  renderTequila: async function(container, title = 'Tequila') {
    await this.renderLiquorCategory(container, 'tequila', title);
  },

  renderRon: async function(container, title = 'Ron') {
    await this.renderLiquorCategory(container, 'ron', title);
  },

  renderVodka: async function(container, title = 'Vodka') {
    await this.renderLiquorCategory(container, 'vodka', title);
  },

  renderGinebra: async function(container, title = 'Ginebra') {
    await this.renderLiquorCategory(container, 'ginebra', title);
  },

  renderMezcal: async function(container, title = 'Mezcal') {
    await this.renderLiquorCategory(container, 'mezcal', title);
  },

  renderCognac: async function(container, title = 'Cognac') {
    await this.renderLiquorCategory(container, 'cognac', title);
  },

  renderBrandy: async function(container, title = 'Brandy') {
    await this.renderLiquorCategory(container, 'brandy', title);
  },

  renderDigestivos: async function(container, title = 'Digestivos') {
    const productRepository = getProductRepository();
    
    // Add view toggle button - DISABLED: Using top nav button instead
    // const toggleElement = this.createViewToggle(container);
    // container.appendChild(toggleElement);
    
    try {
      const data = await productRepository.getLiquorSubcategory('digestivos');
      
      if (this.currentViewMode === 'grid') {
        this.createProductGrid(container, 
          data, 
          ['nombre', 'imagen', 'precioBotella', 'precioLitro', 'precioCopa'],
          title
        );
      } else {
        this.createProductTable(container, 
          ['NOMBRE', 'IMAGEN', 'PRECIO BOTELLA', 'PRECIO LITRO', 'PRECIO COPA'], 
          data, 
          ['nombre', 'imagen', 'precioBotella', 'precioLitro', 'precioCopa'],
          'liquor-table',
          title
        );
      }
    } catch (error) {
      logError(`Error rendering ${title}:`, error);
      container.innerHTML += `<p>Error cargando ${title}. Por favor, intente de nuevo.</p>`;
    }
  },

  renderEspumosos: async function(container, title = 'Espumosos') {
    await this.renderLiquorCategory(container, 'espumosos', title);
  },

  renderCervezas: async function(container) {
    const productRepository = getProductRepository();
    
    try {
      const data = await productRepository.getCervezas();
      
      // Organizar productos en 3 bloques
      const cervezasEnBotella = [];
      const tarros = [];
      const vasos = [];
      
      data.forEach(product => {
        const nombre = product.nombre.toUpperCase();
        
        if (nombre.startsWith('TARRO')) {
          tarros.push(product);
        } else if (nombre.startsWith('VASO')) {
          vasos.push(product);
        } else {
          cervezasEnBotella.push(product);
        }
      });
      
      // Ordenar alfabéticamente cada bloque
      const sortByName = (a, b) => a.nombre.localeCompare(b.nombre);
      cervezasEnBotella.sort(sortByName);
      tarros.sort(sortByName);
      vasos.sort(sortByName);
      
      // Limpiar contenedor
      container.innerHTML = '';
      
      // Renderizar cada bloque
      if (cervezasEnBotella.length > 0) {
        const cervezasContainer = document.createElement('div');
        cervezasContainer.className = 'cervezas-botella-section';
        
        if (this.currentViewMode === 'grid') {
          this.createProductGrid(cervezasContainer, 
            cervezasEnBotella, 
            ['nombre', 'ruta_archivo', 'precio'],
            'Cervezas en botella'
          );
          // Asegurar que el grid tenga el atributo data-category
          const productGrid = cervezasContainer.querySelector('.product-grid');
          if (productGrid) {
            productGrid.setAttribute('data-category', 'cervezas');
          }
        } else {
          this.createProductTable(cervezasContainer, 
            ['NOMBRE', 'IMAGEN', 'PRECIO'], 
            cervezasEnBotella, 
            ['nombre', 'ruta_archivo', 'precio'],
            'product-table',
            'Cervezas en botella'
          );
          // Asegurar que la tabla tenga el atributo data-category
          const productTable = cervezasContainer.querySelector('table');
          if (productTable) {
            productTable.setAttribute('data-category', 'cervezas');
          }
        }
        container.appendChild(cervezasContainer);
      }
      
      if (tarros.length > 0) {
        const tarrosContainer = document.createElement('div');
        tarrosContainer.className = 'tarros-section';
        
        if (this.currentViewMode === 'grid') {
          this.createProductGrid(tarrosContainer, 
            tarros, 
            ['nombre', 'ruta_archivo', 'precio'],
            'Tarros'
          );
          // Asegurar que el grid tenga el atributo data-category
          const productGrid = tarrosContainer.querySelector('.product-grid');
          if (productGrid) {
            productGrid.setAttribute('data-category', 'cervezas');
          }
        } else {
          this.createProductTable(tarrosContainer, 
            ['NOMBRE', 'IMAGEN', 'PRECIO'], 
            tarros, 
            ['nombre', 'ruta_archivo', 'precio'],
            'product-table',
            'Tarros'
          );
          // Asegurar que la tabla tenga el atributo data-category
          const productTable = tarrosContainer.querySelector('table');
          if (productTable) {
            productTable.setAttribute('data-category', 'cervezas');
          }
        }
        container.appendChild(tarrosContainer);
      }
      
      if (vasos.length > 0) {
        const vasosContainer = document.createElement('div');
        vasosContainer.className = 'vasos-cerveza-section';
        
        if (this.currentViewMode === 'grid') {
          this.createProductGrid(vasosContainer, 
            vasos, 
            ['nombre', 'ruta_archivo', 'precio'],
            'Vasos'
          );
          // Asegurar que el grid tenga el atributo data-category
          const productGrid = vasosContainer.querySelector('.product-grid');
          if (productGrid) {
            productGrid.setAttribute('data-category', 'cervezas');
          }
        } else {
          this.createProductTable(vasosContainer, 
            ['NOMBRE', 'IMAGEN', 'PRECIO'], 
            vasos, 
            ['nombre', 'ruta_archivo', 'precio'],
            'product-table',
            'Vasos'
          );
          // Asegurar que la tabla tenga el atributo data-category
          const productTable = vasosContainer.querySelector('table');
          if (productTable) {
            productTable.setAttribute('data-category', 'cervezas');
          }
        }
        container.appendChild(vasosContainer);
      }
      
      // Ajustes específicos para dispositivos móviles en portrait
      // Esto solucionará el problema de tamaño y alineación de imágenes
      setTimeout(() => {
        if (window.innerWidth <= 768 && window.innerHeight > window.innerWidth) {
          const images = container.querySelectorAll('img');
          images.forEach(img => {
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            img.style.objectFit = 'contain';
            img.style.display = 'block';
            img.style.margin = '0 auto';
          });
          
          // Ajustar alineación de columnas - SOLO para celdas de imagen
          const imageCells = container.querySelectorAll('td.image-icon, .product-image');
          imageCells.forEach(cell => {
            cell.style.textAlign = 'center';
            cell.style.verticalAlign = 'middle';
          });
        }
      }, 100);
      
    } catch (error) {
      logError('Error rendering Cervezas:', error);
      container.innerHTML = '<p>Error cargando Cervezas. Por favor, intente de nuevo.</p>';
    }
  },

  renderPizzas: async function(container) {
    const productRepository = getProductRepository();
    
    // Add view toggle button - DISABLED: Using top nav button instead
    // const toggleElement = this.createViewToggle(container);
    // container.appendChild(toggleElement);
    
    try {
      const data = await productRepository.getPizzas();
      
      if (this.currentViewMode === 'grid') {
        this.createProductGrid(container, 
          data, 
          ['nombre', 'ingredientes', 'video', 'precio'],
          'Pizzas'
        );
      } else {
        this.createProductTable(container, 
          ['NOMBRE', 'INGREDIENTES', 'VIDEO', 'PRECIO'], 
          data, 
          ['nombre', 'ingredientes', 'video', 'precio'],
          'product-table',
          'Pizzas'
        );
      }
    } catch (error) {
      logError('Error rendering Pizzas:', error);
      // Preserve sidebar when showing error
      const targetContainer = container.id === 'content-container' ? container : document.getElementById('content-container') || container;
      targetContainer.innerHTML = '<p>Error cargando Pizzas. Por favor, intente de nuevo.</p>';
    }
  },

  // Generic food/beverage renderer - eliminates code duplication
  renderFoodCategory: async function(container, methodName, title, fields = null, headers = null) {
    const productRepository = getProductRepository();
    
    // Add view toggle button - DISABLED: Using top nav button instead
    // const toggleElement = this.createViewToggle(container);
    // container.appendChild(toggleElement);
    
    // Default fields and headers for food items
    const defaultFields = ['nombre', 'ingredientes', 'video', 'precio'];
    const defaultHeaders = ['NOMBRE', 'INGREDIENTES', 'VIDEO', 'PRECIO'];
    
    const finalFields = fields || defaultFields;
    const finalHeaders = headers || defaultHeaders;
    
    try {
      const data = await productRepository[methodName]();
      
      if (this.currentViewMode === 'grid') {
        this.createProductGrid(container, 
          data, 
          finalFields,
          title
        );
      } else {
        this.createProductTable(container, 
          finalHeaders, 
          data, 
          finalFields,
          'product-table',
          title
        );
      }
    } catch (error) {
      logError(`Error rendering ${title}:`, error);
      container.innerHTML = `<p>Error cargando ${title}. Por favor, intente de nuevo.</p>`;
    }
  },

  // Optimized render methods using generic function
  renderAlitas: async function(container) {
    await this.renderFoodCategory(container, 'getAlitas', 'Alitas');
  },

  renderSopas: async function(container) {
    await this.renderFoodCategory(container, 'getSopas', 'Sopas');
  },

  renderEnsaladas: async function(container) {
    await this.renderFoodCategory(container, 'getEnsaladas', 'Ensaladas');
  },

  renderCarnes: async function(container) {
    await this.renderFoodCategory(container, 'getCarnes', 'Carnes');
  },

  renderCafe: async function(container) {
    await this.renderFoodCategory(container, 'getCafe', 'Café');
  },

  renderPostres: async function(container) {
    await this.renderFoodCategory(container, 'getPostres', 'Postres');
  },

  renderRefrescos: async function(container) {
    const productRepository = getProductRepository();
    
    try {
      const data = await productRepository.getRefrescos();
      
      // Organizar productos en 3 bloques
      const refrescos = [];
      const jarrasDeJugo = [];
      const vasosDeJugo = [];
      
      data.forEach(product => {
        const nombre = product.nombre.toUpperCase();
        
        if (nombre.startsWith('JARRA')) {
          jarrasDeJugo.push(product);
        } else if (nombre.startsWith('VASO DE JUGO')) {
          vasosDeJugo.push(product);
        } else {
          refrescos.push(product);
        }
      });
      
      // Ordenar alfabéticamente cada bloque
      const sortByName = (a, b) => a.nombre.localeCompare(b.nombre);
      refrescos.sort(sortByName);
      jarrasDeJugo.sort(sortByName);
      vasosDeJugo.sort(sortByName);
      
      // Limpiar contenedor
      container.innerHTML = '';
      
      // Renderizar cada bloque
      if (refrescos.length > 0) {
        const refrescosContainer = document.createElement('div');
        refrescosContainer.className = 'refrescos-section';
        
        if (this.currentViewMode === 'grid') {
          this.createProductGrid(refrescosContainer, 
            refrescos, 
            ['nombre', 'ruta_archivo', 'precio'],
            'Refrescos'
          );
        } else {
          this.createProductTable(refrescosContainer, 
            ['NOMBRE', 'IMAGEN', 'PRECIO'], 
            refrescos, 
            ['nombre', 'ruta_archivo', 'precio'],
            'product-table',
            'Refrescos'
          );
        }
        container.appendChild(refrescosContainer);
      }
      
      if (jarrasDeJugo.length > 0) {
        const jarrasContainer = document.createElement('div');
        jarrasContainer.className = 'jarras-section';
        
        if (this.currentViewMode === 'grid') {
          this.createProductGrid(jarrasContainer, 
            jarrasDeJugo, 
            ['nombre', 'ruta_archivo', 'precio'],
            'Jarras de jugo'
          );
        } else {
          this.createProductTable(jarrasContainer, 
            ['NOMBRE', 'IMAGEN', 'PRECIO'], 
            jarrasDeJugo, 
            ['nombre', 'ruta_archivo', 'precio'],
            'product-table',
            'Jarras de jugo'
          );
        }
        container.appendChild(jarrasContainer);
      }
      
      if (vasosDeJugo.length > 0) {
        const vasosContainer = document.createElement('div');
        vasosContainer.className = 'vasos-section';
        
        if (this.currentViewMode === 'grid') {
          this.createProductGrid(vasosContainer, 
            vasosDeJugo, 
            ['nombre', 'ruta_archivo', 'precio'],
            'Vasos de jugo'
          );
        } else {
          this.createProductTable(vasosContainer, 
            ['NOMBRE', 'IMAGEN', 'PRECIO'], 
            vasosDeJugo, 
            ['nombre', 'ruta_archivo', 'precio'],
            'product-table',
            'Vasos de jugo'
          );
        }
        container.appendChild(vasosContainer);
      }
      
    } catch (error) {
      logError('Error rendering Refrescos:', error);
      container.innerHTML = '<p>Error cargando Refrescos. Por favor, intente de nuevo.</p>';
    }
  },

  renderCocktails: async function(container) {
    await this.renderFoodCategory(container, 'getCocteles', 'Coctelería');
  },
};

// Make ProductRenderer globally available for legacy compatibility
window.ProductRenderer = ProductRenderer;

export default ProductRenderer;