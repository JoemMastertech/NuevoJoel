import { createClient } from '@supabase/supabase-js';
import AppConfig from '../core/AppConfig.js';
import Logger from '../utils/logger.js';

/**
 * Translation Service
 * Manages dynamic page translations using Google Translate API and Supabase storage
 * Implements caching strategy to minimize API calls and improve performance
 */
class TranslationService {
  constructor() {
    this.config = AppConfig;
    this.appConfig = this.config.getAll();
    
    // Initialize Supabase client
    this.supabase = createClient(
      this.appConfig.database.supabaseUrl,
      this.appConfig.database.supabaseKey
    );
    
    // Translation cache for current session
    this.translationCache = new Map();
    
    // Current language
    this.currentLanguage = 'es'; // Spanish as base language
    
    // Supported languages
    this.supportedLanguages = {
      'es': 'Español',
      'en': 'English', 
      'fr': 'Français',
      'it': 'Italiano',
      'zh': '中文'
    };
    
    Logger.info('TranslationService: Initialized');
  }

  /**
   * Get translation for a specific text
   * @param {string} textKey - Unique identifier for the text
   * @param {string} sourceText - Original text in Spanish
   * @param {string} targetLanguage - Target language code
   * @param {string} namespace - Context namespace (default: 'general')
   * @returns {Promise<string>} Translated text
   */
  async getTranslation(textKey, sourceText, targetLanguage, namespace = 'general') {
    try {
      // If target language is Spanish (base language), return original text
      if (targetLanguage === 'es') {
        return sourceText;
      }

      // Check cache first
      const cacheKey = `${textKey}_${namespace}_${targetLanguage}`;
      if (this.translationCache.has(cacheKey)) {
        Logger.debug(`Translation cache hit for: ${cacheKey}`);
        return this.translationCache.get(cacheKey);
      }

      // Check Supabase for existing translation
      const existingTranslation = await this.getFromSupabase(textKey, targetLanguage, namespace);
      if (existingTranslation) {
        this.translationCache.set(cacheKey, existingTranslation);
        Logger.debug(`Translation loaded from Supabase: ${textKey} -> ${targetLanguage}`);
        return existingTranslation;
      }

      // If not found, respect feature flag for Google Translate
      const googleEnabled = this.config.isFeatureEnabled('googleTranslateEnabled');
      if (!googleEnabled) {
        Logger.info('Google Translate disabled by config; returning source text');
        return sourceText;
      }

      // If not found and enabled, request new translation from Google Translate API
      const newTranslation = await this.requestTranslation(sourceText, targetLanguage);
      
      // Save to Supabase for future use
      await this.saveToSupabase(textKey, sourceText, newTranslation, targetLanguage, namespace);
      
      // Cache the translation
      this.translationCache.set(cacheKey, newTranslation);
      
      Logger.info(`New translation created: ${textKey} (${targetLanguage})`);
      return newTranslation;

    } catch (error) {
      Logger.error(`Translation error for ${textKey}:`, error);
      // Fallback to original text if translation fails
      return sourceText;
    }
  }

  /**
   * Get translation from Supabase
   * @param {string} textKey - Text identifier
   * @param {string} targetLanguage - Target language
   * @param {string} namespace - Context namespace
   * @returns {Promise<string|null>} Translated text or null if not found
   */
  async getFromSupabase(textKey, targetLanguage, namespace) {
    try {
      const query = this.supabase
        .from('translations')
        .select('translated_text')
        .eq('text_key', textKey)
        .eq('target_language', targetLanguage)
        .eq('namespace', namespace);

      // Prefer .maybeSingle() to avoid 406 when no rows exist
      const result = (typeof query.maybeSingle === 'function')
        ? await query.maybeSingle()
        : await query.single();

      const { data, error, status } = result;

      if (error) {
        // Treat 406 (no rows) or PGRST116 as 'not found' without logging noise
        if (status === 406 || error.code === 'PGRST116') {
          return null;
        }
        Logger.error('Supabase translation query error:', error);
        return null;
      }

      return data?.translated_text || null;
    } catch (error) {
      Logger.error('Error fetching translation from Supabase:', error);
      return null;
    }
  }

  /**
   * Save translation to Supabase
   * @param {string} textKey - Text identifier
   * @param {string} sourceText - Original text
   * @param {string} translatedText - Translated text
   * @param {string} targetLanguage - Target language
   * @param {string} namespace - Context namespace
   */
  async saveToSupabase(textKey, sourceText, translatedText, targetLanguage, namespace) {
    try {
      const { error } = await this.supabase
        .from('translations')
        .upsert({
          text_key: textKey,
          namespace: namespace,
          source_language: 'es',
          target_language: targetLanguage,
          source_text: sourceText,
          translated_text: translatedText
        }, { onConflict: 'text_key,namespace,target_language' });

      if (error) {
        Logger.error('Error saving translation to Supabase:', error);
      } else {
        Logger.debug(`Translation saved to Supabase: ${textKey} -> ${targetLanguage}`);
      }
    } catch (error) {
      Logger.error('Error saving translation to Supabase:', error);
    }
  }

  /**
   * Request translation from Google Translate API
   * @param {string} text - Text to translate
   * @param {string} targetLanguage - Target language code
   * @returns {Promise<string>} Translated text
   */
  async requestTranslation(text, targetLanguage) {
    try {
      // Respect feature flag to avoid calling external API when disabled
      const googleEnabled = this.config.isFeatureEnabled('googleTranslateEnabled');
      if (!googleEnabled) {
        return text;
      }

      // This will be implemented as a secure API endpoint
      // For now, we'll create a placeholder that calls our translation API
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          targetLanguage: targetLanguage,
          sourceLanguage: 'es'
        })
      });

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`);
      }

      const result = await response.json();
      return result.translatedText;

    } catch (error) {
      Logger.error('Google Translate API error:', error);
      // Fallback: return original text if API fails
      return text;
    }
  }

  /**
   * Translate entire page to target language
   * @param {string} targetLanguage - Target language code
   */
  async translatePage(targetLanguage) {
    try {
      Logger.info(`Starting page translation to: ${targetLanguage}`);
      
      // Update current language
      this.currentLanguage = targetLanguage;
      
      // Find all elements with data-translate attribute
      const translatableElements = document.querySelectorAll('[data-translate]');
      
      const translationPromises = Array.from(translatableElements).map(async (element) => {
        const textKey = element.getAttribute('data-translate');
        const namespace = element.getAttribute('data-namespace') || 'general';
        const originalText = element.getAttribute('data-original-text') || element.textContent.trim();
        
        // Store original text if not already stored
        if (!element.getAttribute('data-original-text')) {
          element.setAttribute('data-original-text', originalText);
        }
        
        // Get translation
        const translatedText = await this.getTranslation(textKey, originalText, targetLanguage, namespace);
        
        // Update element content
        element.textContent = translatedText;
        
        return { textKey, translatedText };
      });
      
      // Wait for all translations to complete
      const results = await Promise.all(translationPromises);
      
      Logger.info(`Page translation completed. Translated ${results.length} elements to ${targetLanguage}`);
      
      // Dispatch custom event for other components to react
      window.dispatchEvent(new CustomEvent('languageChanged', {
        detail: { language: targetLanguage, translations: results }
      }));
      
    } catch (error) {
      Logger.error('Error translating page:', error);
    }
  }

  /**
   * Get current language
   * @returns {string} Current language code
   */
  getCurrentLanguage() {
    return this.currentLanguage;
  }

  /**
   * Get supported languages
   * @returns {Object} Supported languages object
   */
  getSupportedLanguages() {
    return this.supportedLanguages;
  }

  /**
   * Clear translation cache
   */
  clearCache() {
    this.translationCache.clear();
    Logger.info('Translation cache cleared');
  }

  /**
   * Preload translations for specific elements
   * @param {Array} textKeys - Array of text keys to preload
   * @param {string} targetLanguage - Target language
   * @param {string} namespace - Namespace
   */
  async preloadTranslations(textKeys, targetLanguage, namespace = 'general') {
    try {
      const preloadPromises = textKeys.map(async (textKey) => {
        const element = document.querySelector(`[data-translate="${textKey}"]`);
        if (element) {
          const originalText = element.textContent.trim();
          return this.getTranslation(textKey, originalText, targetLanguage, namespace);
        }
      });

      await Promise.all(preloadPromises);
      Logger.info(`Preloaded ${textKeys.length} translations for ${targetLanguage}`);
    } catch (error) {
      Logger.error('Error preloading translations:', error);
    }
  }
}

// Export singleton instance
export default new TranslationService();