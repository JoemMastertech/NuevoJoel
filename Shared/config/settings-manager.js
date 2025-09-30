/**
 * Settings Manager - Handles the settings menu functionality
 * 
 * This module manages the settings menu interactions, including:
 * - Toggling the settings menu open and closed
 * - Navigating between different settings panels
 * - Changing the language of the application
 * - Changing the theme and background video
 */

class SettingsManager {
  constructor() {
    // DOM elements
    this.settingsBtn = document.getElementById('settings-btn');
    this.settingsMenu = document.getElementById('settings-menu');
    this.settingsOverlay = document.getElementById('settings-overlay');
    
    // Panels
    this.mainPanel = document.getElementById('main-settings-panel');
    this.languagesPanel = document.getElementById('languages-panel');
    this.darkModePanel = document.getElementById('dark-mode-panel');
    this.lightModePanel = document.getElementById('light-mode-panel');
    
    // Navigation buttons
    this.settingsBackBtn = document.getElementById('settings-back-btn');
    this.languagesOption = document.getElementById('languages-option');
    this.darkModeOption = document.getElementById('dark-mode-option');
    this.lightModeOption = document.getElementById('light-mode-option');
    
    // Back buttons
    this.backToMainBtn = document.getElementById('back-to-main');
    this.backFromDarkBtn = document.getElementById('back-from-dark');
    this.backFromLightBtn = document.getElementById('back-from-light');
    
    // Theme and language buttons
    this.languageBtns = document.querySelectorAll('.language-btn');
    this.themeBtns = document.querySelectorAll('.theme-btn');
    
    // Background video
    this.backgroundVideo = document.getElementById('background-video');
    
    // Initialize event listeners
    this.initListeners();
  }
  
  /**
   * Initialize all event listeners for the settings menu
   */
  initListeners() {
    // Toggle settings menu
    this.settingsBtn.addEventListener('click', () => {
      this.toggleSettingsMenu();
    });
    
    // Close settings menu when clicking overlay
    this.settingsOverlay.addEventListener('click', () => {
      this.closeSettingsMenu();
    });
    
    // Close settings menu when clicking back button
    this.settingsBackBtn.addEventListener('click', () => {
      this.closeSettingsMenu();
    });
    
    // Navigate to different panels
    this.languagesOption.addEventListener('click', () => {
      this.showPanel(this.languagesPanel);
    });
    
    this.darkModeOption.addEventListener('click', () => {
      this.showPanel(this.darkModePanel);
    });
    
    this.lightModeOption.addEventListener('click', () => {
      this.showPanel(this.lightModePanel);
    });
    
    // Back to main panel
    this.backToMainBtn.addEventListener('click', () => {
      this.showPanel(this.mainPanel);
    });
    
    this.backFromDarkBtn.addEventListener('click', () => {
      this.showPanel(this.mainPanel);
    });
    
    this.backFromLightBtn.addEventListener('click', () => {
      this.showPanel(this.mainPanel);
    });
    
    // Language selection
    this.languageBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const language = btn.getAttribute('data-lang');
        this.changeLanguage(language);
      });
    });
    
    // Theme selection
    this.themeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const theme = btn.getAttribute('data-theme');
        const videoUrl = btn.getAttribute('data-video');
        this.changeTheme(theme, videoUrl);
      });
    });
  }
  
  /**
   * Toggle the settings menu open/closed
   */
  toggleSettingsMenu() {
    this.settingsMenu.classList.toggle('open');
    this.settingsOverlay.classList.toggle('active');
    
    // If opening the menu, show the main panel
    if (this.settingsMenu.classList.contains('open')) {
      this.showPanel(this.mainPanel);
    }
  }
  
  /**
   * Close the settings menu
   */
  closeSettingsMenu() {
    this.settingsMenu.classList.remove('open');
    this.settingsOverlay.classList.remove('active');
  }
  
  /**
   * Show a specific settings panel and hide others
   * @param {HTMLElement} panel - The panel to show
   */
  showPanel(panel) {
    // Hide all panels
    const allPanels = document.querySelectorAll('.settings-panel');
    allPanels.forEach(p => {
      p.classList.add('screen-hidden');
    });
    
    // Show the selected panel
    panel.classList.remove('screen-hidden');
    
    // Add animation class
    panel.classList.add('fade-in');
    setTimeout(() => {
      panel.classList.remove('fade-in');
    }, 300);
  }
  
  /**
   * Change the language of the application
   * @param {string} language - The language code to switch to
   */
  changeLanguage(language) {
    console.log(`Changing language to: ${language}`);
    
    // For now, we'll just show a console message as the actual implementation
    // would require translation files and modifying text throughout the app
    
    // Highlight the selected language button
    this.languageBtns.forEach(btn => {
      if (btn.getAttribute('data-lang') === language) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    
    // Store the selected language in localStorage
    try {
      localStorage.setItem('selectedLanguage', language);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  }
  
  /**
   * Change the theme and background video
   * @param {string} theme - The theme to apply
   * @param {string} videoUrl - The URL of the background video
   */
  changeTheme(theme, videoUrl) {
    console.log(`Changing theme to: ${theme}`);
    
    // Update data-theme attribute on body
    document.body.setAttribute('data-theme', theme);
    
    // Change background video if a URL is provided
    if (videoUrl && this.backgroundVideo) {
      // Create a new source element
      const newSource = document.createElement('source');
      newSource.src = videoUrl;
      newSource.type = 'video/mp4';
      
      // Clear existing sources
      while (this.backgroundVideo.firstChild) {
        this.backgroundVideo.removeChild(this.backgroundVideo.firstChild);
      }
      
      // Add the new source
      this.backgroundVideo.appendChild(newSource);
      
      // Reload and play the video
      this.backgroundVideo.load();
      
      // Ensure the video is muted and loops
      this.backgroundVideo.muted = true;
      this.backgroundVideo.loop = true;
    }
    
    // Handle white theme which doesn't have a video
    if (theme === 'light-white' && this.backgroundVideo) {
      // Pause and hide the video
      this.backgroundVideo.pause();
      this.backgroundVideo.style.display = 'none';
    } else if (this.backgroundVideo) {
      // Show the video for other themes
      this.backgroundVideo.style.display = 'block';
    }
    
    // Remove inline background color to allow CSS variables to take effect
    document.body.style.backgroundColor = '';
    
    // Highlight the selected theme button
    this.themeBtns.forEach(btn => {
      if (btn.getAttribute('data-theme') === theme) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    
    // Store the selected theme in localStorage
    try {
      localStorage.setItem('selectedTheme', theme);
      if (videoUrl) {
        localStorage.setItem('selectedVideoUrl', videoUrl);
      }
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  }
  
  /**
   * Apply saved preferences on page load
   */
  applySavedPreferences() {
    try {
      // Apply saved language
      const savedLanguage = localStorage.getItem('selectedLanguage');
      if (savedLanguage) {
        const languageBtn = document.querySelector(`.language-btn[data-lang="${savedLanguage}"]`);
        if (languageBtn) {
          this.changeLanguage(savedLanguage);
        }
      }
      
      // Apply saved theme
    const savedTheme = localStorage.getItem('selectedTheme');
    const savedVideoUrl = localStorage.getItem('selectedVideoUrl');
    if (savedTheme) {
      // Set data-theme attribute directly to ensure immediate visual feedback
      document.body.setAttribute('data-theme', savedTheme);
      
      const themeBtn = document.querySelector(`.theme-btn[data-theme="${savedTheme}"]`);
      if (themeBtn) {
        this.changeTheme(savedTheme, savedVideoUrl);
      }
    } else {
      // Set default theme if none is saved
      document.body.setAttribute('data-theme', 'dark-blue');
    }
    } catch (error) {
      console.error('Error applying saved preferences:', error);
    }
  }
}

// Initialize the SettingsManager when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Wait a little to ensure other elements are loaded
  setTimeout(() => {
    const settingsManager = new SettingsManager();
    // Apply saved preferences
    settingsManager.applySavedPreferences();
    
    // Make settingsManager available globally
    window.SettingsManager = settingsManager;
  }, 100);
});