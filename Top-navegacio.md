/* =================================================================
   TOP NAVIGATION BAR - ISOLATED STYLES
   ================================================================= */

/* Top Navigation Variables - Using Unified Variables */
/* Variables are now imported from _variables-unified.css */

/* =================================================================
   BARRA SUPERIOR GLOBAL
   ================================================================= */
#top-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: var(--size-full);
  height: var(--top-nav-height);
  min-height: var(--top-nav-height);
  max-height: var(--top-nav-height);
  background: var(--top-nav-bg);
  border-bottom: var(--border-width-sm) solid var(--accent-border);
  backdrop-filter: blur(var(--blur-sm));
  z-index: var(--z-nav);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-md);
  box-shadow: var(--glow-shadow);
  /* Ocultar inicialmente hasta que termine la inicialización */
  opacity: var(--opacity-hidden);
  transform: translateY(-100%);
  transition: opacity var(--transition-slow) ease, transform var(--transition-slow) ease;
  /* Prevent content from affecting the navbar size */
  flex-shrink: 0;
  flex-grow: 0;
  overflow: hidden;
}

/* Mostrar la barra superior cuando la app esté lista */
#top-nav.show {
  opacity: var(--opacity-full);
  transform: translateY(0);
}

.nav-left,
.nav-center,
.nav-right {
  display: flex;
  align-items: center;
  flex: 1;
  height: var(--size-full);
  min-height: var(--top-nav-height);
  max-height: var(--top-nav-height);
  overflow: hidden;
}

.nav-center {
  justify-content: center;
}

.nav-right {
  justify-content: flex-end;
}.nav-title {
  color: var(--accent-color);
  font-size: var(--font-size-lg);
  font-weight: bold;
  text-shadow: var(--text-glow);
  line-height: var(--opacity-100);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-height: var(--height-sm);
  display: flex;
  align-items: center;
}

.top-nav-btn {
  background: var(--card-bg);
  border: var(--border-width-md) solid white;
  color: var(--text-color);
  font-size: var(--font-size-lg);
  width: var(--height-sm);
  height: var(--height-sm);
  min-width: var(--height-sm);
  min-height: var(--height-sm);
  max-width: var(--height-sm);
  max-height: var(--height-sm);
  border-radius: var(--border-radius-lg);
  cursor: pointer;
  transition: all var(--transition-time) ease;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 var(--spacing-xs);
  backdrop-filter: blur(var(--blur-xs));
  flex-shrink: 0;
  flex-grow: 0;
  overflow: hidden;
  line-height: var(--opacity-100);
  box-shadow: var(--shadow-sm);
}

.top-nav-btn:hover, .top-nav-btn.active {
  background-color: transparent;
  transform: scale(var(--scale-hover));
  border-color: var(--price-color);
  box-shadow: var(--price-glow);
}.top-hamburger-btn.active {
  color: var(--text-color); /* Mantener color original del símbolo */
}.top-nav-btn:not(.top-hamburger-btn).active {
  color: var(--price-color);
}

.top-nav-btn:active {
  transform: scale(var(--scale-active));
}

/* BEM Modifier for hidden state */
.top-nav-btn--hidden {
  display: none;
}

/* Ajustes para el contenido principal */
body {
  padding-top: 0;
  transition: padding-top var(--transition-slow) ease;
}

/* Agregar padding cuando la barra superior esté visible */
body.top-nav-visible {
  padding-top: var(--top-nav-height);
}.app {
  padding-top: 0;
}

/* =================================================================
   RESPONSIVE DESIGN - TOP NAVIGATION
   ================================================================= */

/* Desktop */
@media (min-width: 1024px) {.top-nav {
  height: var(--top-nav-height);
    min-height: var(--top-nav-height);
    max-height: var(--top-nav-height);
}
  
  body.top-nav-visible {
    padding-top: var(--top-nav-height);
  }
}

/* Tablet */
@media (min-width: 768px) and (max-width: 1024px) {
  :root {
    --top-nav-height-tablet: var(--nav-height-tablet);
  }.top-nav {
  height: var(--top-nav-height);
    min-height: var(--top-nav-height);
    max-height: var(--top-nav-height);
    background: var(--top-nav-bg);
    border-bottom: var(--border-width-sm) solid var(--top-nav-border);
}
  
  body.top-nav-visible {
    padding-top: var(--top-nav-height);
  }
}

/* Mobile */
@media (max-width: 768px) {
  :root {
    --top-nav-height-mobile: var(--nav-height-mobile);
  }.top-nav {
  height: var(--top-nav-height) !important;
    min-height: var(--top-nav-height) !important;
    max-height: var(--top-nav-height) !important;
    background: var(--top-nav-bg);
    border-bottom: var(--border-width-thin) solid var(--top-nav-border);
}
  
  body.top-nav-visible {
    padding-top: var(--top-nav-height) !important;
  }
}
