/**
 * Viewport Handler - Maneja dinámicamente la altura del viewport en móviles
 * Soluciona el problema de vh en landscape donde las barras del navegador afectan el cálculo
 */
class ViewportHandler {
    constructor() {
        this.init();
    }

    init() {
        // Establecer altura inicial
        this.setViewportHeight();
        
        // Escuchar cambios de orientación y resize
        window.addEventListener('orientationchange', () => {
            // Pequeño delay para que el navegador termine la transición
            setTimeout(() => {
                this.setViewportHeight();
                this.adjustModalHeight();
            }, 100);
        });
        
        window.addEventListener('resize', () => {
            this.setViewportHeight();
            this.adjustModalHeight();
        });
    }

    setViewportHeight() {
        // Obtener la altura real del viewport
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }

    adjustModalHeight() {
        const modal = document.getElementById('drink-options-modal');
        if (!modal || modal.classList.contains('modal-hidden')) return;

        const modalContent = modal.querySelector('.modal-content');
        if (!modalContent) return;

        // En landscape, usar altura calculada dinámicamente
        if (window.innerHeight < window.innerWidth) {
            const availableHeight = window.innerHeight - 40; // 20px padding top/bottom
            modalContent.style.maxHeight = `${Math.min(availableHeight, window.innerHeight * 0.9)}px`;
        } else {
            // En portrait, usar vh normal
            modalContent.style.maxHeight = '85vh';
        }
    }

    // Método público para ajustar modal cuando se abre
    onModalOpen() {
        setTimeout(() => {
            this.adjustModalHeight();
        }, 50);
    }
}

// Inicializar el handler
const viewportHandler = new ViewportHandler();

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ViewportHandler;
}

// Hacer disponible globalmente
window.ViewportHandler = ViewportHandler;
window.viewportHandler = viewportHandler;