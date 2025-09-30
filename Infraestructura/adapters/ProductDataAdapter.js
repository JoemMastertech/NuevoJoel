import ProductData from '../data-providers/product-data.js';
import BaseAdapter from './BaseAdapter.js';
import AppConfig from '../../Shared/core/AppConfig.js';
import { formatPrice, formatProductName } from '../../Shared/utils/formatters.js';
import DataSyncService from '../../Shared/services/DataSyncService.js';
import { SYNC_CONFIG } from '../../Shared/config/constants.js';
import Logger from '../../Shared/utils/logger.js';

/**
 * Product Data Adapter - Infrastructure implementation of ProductRepositoryPort
 * Adapts the existing ProductData to the domain port interface
 * Part of Hexagonal Architecture - Infrastructure layer adapter
 */
class ProductDataAdapter extends BaseAdapter {
  constructor() {
    super();
    this.productData = ProductData;
    
    // Initialize Supabase configuration
    this.supabaseUrl = AppConfig.get('database.supabaseUrl');
    this.supabaseKey = AppConfig.get('database.supabaseKey');
    
    // Initialize sync service
    this.syncService = new DataSyncService(this);
    
    // Start auto-sync if enabled
    if (SYNC_CONFIG.AUTO_UPDATE_ENABLED) {
      this.syncService.startAutoSync();
    }
  }

  /**
   * Fetch data from Supabase table with immediate local data return
   * @param {string} tableName - Name of the Supabase table
   * @returns {Promise<Array>} Array of records from the table
   * @private
   */
  async _fetchFromSupabase(tableName) {
    // Return local data immediately for instant UX
    const localData = this.productData[tableName] || [];
    
    // Start background sync without blocking
    this._updateFromSupabaseBackground(tableName);
    
    return localData;
  }

  /**
   * Update data from Supabase in background without blocking UI
   * @param {string} tableName - Name of the Supabase table
   * @private
   */
  async _updateFromSupabaseBackground(tableName) {
    try {
      const response = await fetch(`${this.supabaseUrl}/rest/v1/${tableName}`, {
        method: 'GET',
        headers: {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 404) {
        Logger.debug(`Tabla '${tableName}' no encontrada en Supabase. Manteniendo datos locales.`);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      Logger.info(`Datos actualizados en background desde Supabase tabla '${tableName}': ${data.length} registros`);
      
      // Normalize and cache the fresh data
      const normalizedData = this._normalizeSupabaseData(data, tableName);
      if (normalizedData && normalizedData.length > 0) {
        // Update local data for next immediate load
        this.productData[tableName] = normalizedData;
        
        // Cache for persistence
        const SimpleCache = (await import('../../Shared/utils/simpleCache.js')).default;
        SimpleCache.set(`supabase_${tableName}`, normalizedData, 3600000); // 1 hour cache
        
        Logger.info(`Cache actualizado para tabla '${tableName}'`);
      }
    } catch (error) {
      Logger.debug(`Background sync failed for ${tableName}:`, error.message);
      // Silent failure - doesn't affect user experience
    }
  }

  /**
   * Normalize Supabase data to match manual data structure
   * @param {Array} data - Raw data from Supabase
   * @param {string} tableName - Name of the table
   * @returns {Array} Normalized data
   * @private
   */
  _normalizeSupabaseData(data, tableName) {
    if (!Array.isArray(data)) return [];
    
    // List of liquor tables that need price normalization
    const liquorTables = ['vodka', 'whisky', 'tequila', 'ron', 'brandy', 'cognac', 'digestivos', 'ginebra', 'mezcal', 'licores'];
    
    return data.map(item => {
      const normalizedItem = { ...item };
      
      // Ensure ID is string for consistency
      if (normalizedItem.id !== undefined) {
        normalizedItem.id = String(normalizedItem.id);
      }
      
      // Normalize image fields - ensure 'ruta_archivo' is available for cervezas and refrescos
      if ((tableName === 'cervezas' || tableName === 'refrescos') && item.imagen && !item.ruta_archivo) {
        normalizedItem.ruta_archivo = item.imagen;
      } else if ((tableName === 'cervezas' || tableName === 'refrescos') && item.ruta_archivo && !item.imagen) {
        normalizedItem.imagen = item.ruta_archivo;
      }
      
      // Normalize price fields for liquor tables
      if (liquorTables.includes(tableName)) {
        // Handle different possible field names from Supabase
        const priceFields = {
          'precioBotella': ['precioBotella', 'precio_botella', 'precioBottle', 'bottle_price'],
          'precioLitro': ['precioLitro', 'precio_litro', 'precioLiter', 'liter_price'],
          'precioCopa': ['precioCopa', 'precio_copa', 'precioCup', 'cup_price']
        };
        
        Object.keys(priceFields).forEach(standardField => {
          const possibleFields = priceFields[standardField];
          let foundValue = null;
          
          // Look for the field in different possible names
          for (const fieldName of possibleFields) {
            if (item[fieldName] !== undefined && item[fieldName] !== null) {
              foundValue = item[fieldName];
              break;
            }
          }
          
          // Set the standardized field
          if (foundValue !== null && foundValue !== undefined) {
            // Store price as number or clean string without currency symbol
            if (typeof foundValue === 'number') {
              normalizedItem[standardField] = foundValue.toFixed(2);
            } else if (typeof foundValue === 'string' && foundValue.trim() !== '') {
              // Clean price string by removing any existing $ symbol
              const cleanPrice = foundValue.trim().replace('$', '');
              normalizedItem[standardField] = cleanPrice;
            } else {
              normalizedItem[standardField] = '--';
            }
          } else {
            normalizedItem[standardField] = '--';
          }
        });
      } else {
        // For non-liquor tables, normalize the precio field using unified formatter
        if (item.precio !== undefined && item.precio !== null) {
          normalizedItem.precio = formatPrice(item.precio);
        }
      }
      
      // Log image fields for cervezas and refrescos to debug
      if (tableName === 'cervezas' || tableName === 'refrescos') {
        Logger.debug(`Normalized ${tableName} item:`, {
          id: normalizedItem.id,
          nombre: normalizedItem.nombre,
          imagen: normalizedItem.imagen,
          ruta_archivo: normalizedItem.ruta_archivo,
          precio: normalizedItem.precio
        });
      } else {
        Logger.debug(`Normalized ${tableName} item:`, {
          id: normalizedItem.id,
          nombre: normalizedItem.nombre,
          precioBotella: normalizedItem.precioBotella,
          precioLitro: normalizedItem.precioLitro,
          precioCopa: normalizedItem.precioCopa,
          precio: normalizedItem.precio
        });
      }
      
      return normalizedItem;
    });
  }

  /**
   * Get all cocktails (async with Supabase)
   * @returns {Promise<Array>} Array of cocktail objects
   */
  async getCocteles() {
    try {
      const data = await this._fetchFromSupabase('cocteleria');
      return data.length > 0 ? data : this.productData.cocteles || [];
    } catch (error) {
      Logger.error('Error in getCocteles:', error);
      return this.productData.cocteles || [];
    }
  }

  /**
   * Get all beverages (refrescos) (async with Supabase)
   * @returns {Promise<Array>} Array of beverage objects
   */
  async getRefrescos() {
    try {
      const data = await this._fetchFromSupabase('refrescos');
      return data.length > 0 ? data : this.productData.refrescos || [];
    } catch (error) {
      Logger.error('Error in getRefrescos:', error);
      return this.productData.refrescos || [];
    }
  }

  /**
   * Get all liquors (async with Supabase)
   * @returns {Promise<Array>} Array of liquor objects
   */
  async getLicores() {
    try {
      // Fetch from multiple liquor tables and combine them
      const [vodka, whisky, tequila, ron, brandy, cognac, digestivos, ginebra, mezcal, licores] = await Promise.all([
        this._fetchFromSupabase('vodka'),
        this._fetchFromSupabase('whisky'),
        this._fetchFromSupabase('tequila'),
        this._fetchFromSupabase('ron'),
        this._fetchFromSupabase('brandy'),
        this._fetchFromSupabase('cognac'),
        this._fetchFromSupabase('digestivos'),
        this._fetchFromSupabase('ginebra'),
        this._fetchFromSupabase('mezcal'),
        this._fetchFromSupabase('licores')
      ]);
      
      const allLiquors = [...vodka, ...whisky, ...tequila, ...ron, ...brandy, ...cognac, ...digestivos, ...ginebra, ...mezcal, ...licores];
      return allLiquors.length > 0 ? allLiquors : this.productData.licores || [];
    } catch (error) {
      Logger.error('Error in getLicores:', error);
      return this.productData.licores || [];
    }
  }



  /**
   * Get all beers (async with Supabase)
   * @returns {Promise<Array>} Array of beer objects
   */
  async getCervezas() {
    try {
      const data = await this._fetchFromSupabase('cervezas');
      return data.length > 0 ? data : this.productData.cervezas || [];
    } catch (error) {
      Logger.error('Error in getCervezas:', error);
      return this.productData.cervezas || [];
    }
  }

  /**
   * Get all pizzas (async with Supabase)
   * @returns {Promise<Array>} Array of pizza objects
   */
  async getPizzas() {
    try {
      const data = await this._fetchFromSupabase('pizzas');
      return data.length > 0 ? data : this.productData.pizzas || [];
    } catch (error) {
      Logger.error('Error in getPizzas:', error);
      return this.productData.pizzas || [];
    }
  }

  /**
   * Get all wings (alitas) (async with Supabase)
   * @returns {Promise<Array>} Array of wing objects
   */
  async getAlitas() {
    try {
      const data = await this._fetchFromSupabase('alitas');
      return data.length > 0 ? data : this.productData.alitas || [];
    } catch (error) {
      Logger.error('Error in getAlitas:', error);
      return this.productData.alitas || [];
    }
  }

  /**
   * Get all soups (async with Supabase)
   * @returns {Promise<Array>} Array of soup objects
   */
  async getSopas() {
    try {
      const data = await this._fetchFromSupabase('sopas');
      return data.length > 0 ? data : this.productData.sopas || [];
    } catch (error) {
      Logger.error('Error in getSopas:', error);
      return this.productData.sopas || [];
    }
  }

  /**
   * Get all salads (async with Supabase)
   * @returns {Promise<Array>} Array of salad objects
   */
  async getEnsaladas() {
    try {
      const data = await this._fetchFromSupabase('ensaladas');
      return data.length > 0 ? data : this.productData.ensaladas || [];
    } catch (error) {
      Logger.error('Error in getEnsaladas:', error);
      return this.productData.ensaladas || [];
    }
  }

  /**
   * Get all meats (async with Supabase)
   * @returns {Promise<Array>} Array of meat objects
   */
  async getCarnes() {
    try {
      const data = await this._fetchFromSupabase('carnes');
      return data.length > 0 ? data : this.productData.carnes || [];
    } catch (error) {
      Logger.error('Error in getCarnes:', error);
      return this.productData.carnes || [];
    }
  }

  /**
   * Get all coffee products (async with Supabase)
   * @returns {Promise<Array>} Array of coffee objects
   */
  async getCafe() {
    try {
      const data = await this._fetchFromSupabase('cafe');
      return data.length > 0 ? data : this.productData.cafes || [];
    } catch (error) {
      Logger.error('Error in getCafe:', error);
      return this.productData.cafes || [];
    }
  }

  /**
   * Get all sparkling wines (async with Supabase)
   * @returns {Promise<Array>} Array of sparkling wine objects
   */
  async getEspumosos() {
    try {
      const data = await this._fetchFromSupabase('espumosos');
      return data.length > 0 ? data : this.productData.espumosos || [];
    } catch (error) {
      Logger.error('Error in getEspumosos:', error);
      return this.productData.espumosos || [];
    }
  }

  /**
   * Get all desserts (async with Supabase)
   * @returns {Promise<Array>} Array of dessert objects
   */
  async getPostres() {
    try {
      const data = await this._fetchFromSupabase('postres');
      return data.length > 0 ? data : this.productData.postres || [];
    } catch (error) {
      Logger.error('Error in getPostres:', error);
      return this.productData.postres || [];
    }
  }

  /**
   * Get product by ID
   * @param {string} id - Product identifier
   * @returns {Object|null} Product object or null if not found
   */
  getProductById(id) {
    // Search across all categories
    const categories = [
      'cocteles', 'refrescos', 'licores', 'cervezas',
      'pizzas', 'alitas', 'sopas', 'ensaladas', 'carnes',
      'cafes', 'postres'
    ];

    for (const category of categories) {
      const products = this.productData[category] || [];
      const product = products.find(p => p.id === id);
      if (product) {
        return product;
      }
    }

    return null;
  }

  /**
   * Get products by category (async with Supabase)
   * @param {string} category - Product category
   * @returns {Promise<Array>} Array of products in the category
   */
  async getProductsByCategory(category) {
    const normalizedCategory = category.toLowerCase();
    
    // Map category to appropriate method
    const categoryMethods = {
      'cocteles': () => this.getCocteles(),
      'cocteleria': () => this.getCocteles(),
      'refrescos': () => this.getRefrescos(),
      'licores': () => this.getLicores(),
      'vodka': () => this.getLiquorSubcategory('vodka'),
      'vodkas': () => this.getLiquorSubcategory('vodka'),
      'whisky': () => this.getLiquorSubcategory('whisky'),
      'whiskies': () => this.getLiquorSubcategory('whisky'),
      'tequila': () => this.getLiquorSubcategory('tequila'),
      'tequilas': () => this.getLiquorSubcategory('tequila'),
      'ron': () => this.getLiquorSubcategory('ron'),
      'rones': () => this.getLiquorSubcategory('ron'),
      'brandy': () => this.getLiquorSubcategory('brandy'),
      'brandies': () => this.getLiquorSubcategory('brandy'),
      'cognac': () => this.getLiquorSubcategory('cognac'),
      'cognacs': () => this.getLiquorSubcategory('cognac'),
      'digestivos': () => this.getLiquorSubcategory('digestivos'),
      'ginebra': () => this.getLiquorSubcategory('ginebra'),
      'ginebras': () => this.getLiquorSubcategory('ginebra'),
      'mezcal': () => this.getLiquorSubcategory('mezcal'),
      'mezcales': () => this.getLiquorSubcategory('mezcal'),
      'cervezas': () => this.getCervezas(),
      'espumosos': () => this.getEspumosos(),
      'pizzas': () => this.getPizzas(),
      'alitas': () => this.getAlitas(),
      'sopas': () => this.getSopas(),
      'ensaladas': () => this.getEnsaladas(),
      'carnes': () => this.getCarnes(),
      'cafe': () => this.getCafe(),
      'café': () => this.getCafe(),
      'postres': () => this.getPostres()
    };
    
    if (categoryMethods[normalizedCategory]) {
      return await categoryMethods[normalizedCategory]();
    }
    
    // Fallback to direct Supabase query if no specific method exists
    try {
       const data = await this._fetchFromSupabase(normalizedCategory);
       return data.length > 0 ? data : this.productData[normalizedCategory] || [];
     } catch (error) {
       Logger.error(`Error in getProductsByCategory for ${category}:`, error);
       return [];
     }
  }

  /**
   * Search products by name or ingredients
   * @param {string} query - Search query
   * @returns {Array} Array of matching products
   */
  searchProducts(query) {
    if (!query || typeof query !== 'string') {
      return [];
    }

    const searchTerm = query.toLowerCase();
    const results = [];

    const categories = [
      'cocteles', 'refrescos', 'licores', 'cervezas',
      'pizzas', 'alitas', 'sopas', 'ensaladas', 'carnes',
      'cafes', 'postres'
    ];

    for (const category of categories) {
      const products = this.productData[category] || [];
      const matches = products.filter(product => {
        const nameMatch = product.nombre && product.nombre.toLowerCase().includes(searchTerm);
        const ingredientsMatch = product.ingredientes && product.ingredientes.toLowerCase().includes(searchTerm);
        return nameMatch || ingredientsMatch;
      });
      results.push(...matches);
    }

    return results;
  }

  /**
   * Get all available categories
   * @returns {Array} Array of category names
   */
  getAvailableCategories() {
    return this.getStandardCategories();
  }

  /**
   * Get total count of products across all categories
   * @returns {number} Total number of products
   */
  getTotalProductCount() {
    const categories = this.getAvailableCategories();
    return categories.reduce((total, category) => {
      const products = this.productData[category] || [];
      return total + products.length;
    }, 0);
  }

  /**
   * Get liquor categories for navigation (async with Supabase)
   * @returns {Promise<Array>} Array of liquor category objects
   */
  async getLicoresCategories() {
    try {
      const data = await this._fetchFromSupabase('licores');
      return data.length > 0 ? data : this.productData.licoresCategories || [];
    } catch (error) {
      Logger.error('Error in getLicoresCategories:', error);
      return this.productData.licoresCategories || [];
    }
  }

  /**
   * Get products by liquor subcategory (async with Supabase)
   * @param {string} subcategory - Liquor subcategory (whiskies, tequilas, etc.)
   * @returns {Promise<Array>} Array of products in the subcategory
   */
  async getLiquorSubcategory(subcategory) {
    try {
       const data = await this._fetchFromSupabase(subcategory);
       return data.length > 0 ? data : this.productData[subcategory] || [];
     } catch (error) {
       Logger.error(`Error in getLiquorSubcategory for ${subcategory}:`, error);
       return [];
     }
  }

  /**
   * Force immediate synchronization of all data
   * @returns {Promise<void>}
   */
  async forceSyncNow() {
    if (this.syncService) {
      await this.syncService.forceSyncNow();
    }
  }

  /**
   * Get synchronization status
   * @returns {Object} Sync status information
   */
  getSyncStatus() {
    return this.syncService ? this.syncService.getSyncStatus() : {
      isRunning: false,
      lastSyncTime: null,
      autoUpdateEnabled: false
    };
  }

  /**
   * Start automatic synchronization
   */
  startAutoSync() {
    if (this.syncService) {
      this.syncService.startAutoSync();
    }
  }

  /**
   * Stop automatic synchronization
   */
  stopAutoSync() {
    if (this.syncService) {
      this.syncService.stopAutoSync();
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.syncService) {
      this.syncService.destroy();
    }
  }

}

export default ProductDataAdapter;