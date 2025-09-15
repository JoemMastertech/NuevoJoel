// Script para analizar reglas CSS que afectan los modales de acompañamientos
// Específicamente para litros y copas de las 10 subcategorías de licores

function analyzeModalCSS() {
    console.log('=== ANÁLISIS DE REGLAS CSS PARA MODALES DE ACOMPAÑAMIENTOS ===');
    
    // Elementos a analizar
    const modal = document.getElementById('drink-options-modal');
    const optionsGrid = modal?.querySelector('.options-grid');
    
    if (!modal || !optionsGrid) {
        console.log('❌ Modal o grid de opciones no encontrado');
        return;
    }
    
    console.log('\n📱 ORIENTACIÓN ACTUAL:', window.innerHeight > window.innerWidth ? 'Portrait' : 'Landscape');
    console.log('📐 DIMENSIONES:', `${window.innerWidth}x${window.innerHeight}`);
    
    // Función para obtener todas las reglas CSS aplicadas
    function getAppliedRules(element, property) {
        const computedStyle = getComputedStyle(element);
        const rules = [];
        
        // Obtener todas las hojas de estilo
        for (let sheet of document.styleSheets) {
            try {
                for (let rule of sheet.cssRules || sheet.rules) {
                    if (rule.type === CSSRule.STYLE_RULE) {
                        // Verificar si la regla se aplica al elemento
                        if (element.matches && element.matches(rule.selectorText)) {
                            const ruleStyle = rule.style;
                            if (ruleStyle[property]) {
                                rules.push({
                                    selector: rule.selectorText,
                                    property: property,
                                    value: ruleStyle[property],
                                    specificity: getSpecificity(rule.selectorText),
                                    mediaQuery: getMediaQuery(rule)
                                });
                            }
                        }
                    }
                }
            } catch (e) {
                // Ignorar errores de CORS
            }
        }
        
        return rules.sort((a, b) => b.specificity - a.specificity);
    }
    
    // Calcular especificidad CSS
    function getSpecificity(selector) {
        const ids = (selector.match(/#/g) || []).length * 100;
        const classes = (selector.match(/\./g) || []).length * 10;
        const elements = (selector.match(/[a-zA-Z]/g) || []).length;
        return ids + classes + elements;
    }
    
    // Obtener media query de una regla
    function getMediaQuery(rule) {
        let parent = rule.parentRule;
        while (parent) {
            if (parent.type === CSSRule.MEDIA_RULE) {
                return parent.conditionText || parent.media.mediaText;
            }
            parent = parent.parentRule;
        }
        return 'none';
    }
    
    // Analizar propiedades críticas
    const criticalProperties = [
        'display',
        'grid-template-columns',
        'justify-content',
        'align-items',
        'flex-direction',
        'gap',
        'padding',
        'margin',
        'width',
        'max-width'
    ];
    
    console.log('\n🔍 ANÁLISIS DEL MODAL PRINCIPAL:');
    console.log('Selector:', '#drink-options-modal');
    
    criticalProperties.forEach(prop => {
        const rules = getAppliedRules(modal, prop);
        const computedValue = getComputedStyle(modal)[prop];
        
        if (rules.length > 0 || computedValue !== 'auto' && computedValue !== 'normal' && computedValue !== '') {
            console.log(`\n  ${prop.toUpperCase()}:`);
            console.log(`    Valor computado: ${computedValue}`);
            
            rules.forEach((rule, index) => {
                console.log(`    ${index + 1}. ${rule.selector}`);
                console.log(`       Valor: ${rule.value}`);
                console.log(`       Especificidad: ${rule.specificity}`);
                console.log(`       Media Query: ${rule.mediaQuery}`);
            });
        }
    });
    
    console.log('\n🔍 ANÁLISIS DEL GRID DE OPCIONES:');
    console.log('Selector:', '.options-grid');
    
    criticalProperties.forEach(prop => {
        const rules = getAppliedRules(optionsGrid, prop);
        const computedValue = getComputedStyle(optionsGrid)[prop];
        
        if (rules.length > 0 || computedValue !== 'auto' && computedValue !== 'normal' && computedValue !== '') {
            console.log(`\n  ${prop.toUpperCase()}:`);
            console.log(`    Valor computado: ${computedValue}`);
            
            rules.forEach((rule, index) => {
                console.log(`    ${index + 1}. ${rule.selector}`);
                console.log(`       Valor: ${rule.value}`);
                console.log(`       Especificidad: ${rule.specificity}`);
                console.log(`       Media Query: ${rule.mediaQuery}`);
            });
        }
    });
    
    // Analizar media queries activas
    console.log('\n📱 MEDIA QUERIES ACTIVAS:');
    const mediaQueries = [
        '(max-width: 480px)',
        '(max-width: 750px)',
        '(max-width: 900px)',
        '(orientation: landscape)',
        '(orientation: portrait)',
        '(max-width: 900px) and (orientation: landscape)',
        '(max-width: 750px) and (orientation: landscape)'
    ];
    
    mediaQueries.forEach(mq => {
        if (window.matchMedia(mq).matches) {
            console.log(`  ✅ ${mq}`);
        } else {
            console.log(`  ❌ ${mq}`);
        }
    });
    
    // Verificar elementos hijos del grid
    const gridChildren = optionsGrid.children;
    console.log(`\n👶 ELEMENTOS HIJOS DEL GRID: ${gridChildren.length}`);
    
    if (gridChildren.length > 0) {
        const firstChild = gridChildren[0];
        console.log('\n🔍 ANÁLISIS DEL PRIMER ELEMENTO HIJO:');
        console.log('Clases:', firstChild.className);
        
        ['display', 'flex-direction', 'justify-content', 'align-items', 'width', 'min-width', 'max-width'].forEach(prop => {
            const value = getComputedStyle(firstChild)[prop];
            if (value !== 'auto' && value !== 'normal' && value !== '') {
                console.log(`  ${prop}: ${value}`);
            }
        });
    }
    
    // Detectar problemas comunes
    console.log('\n🚨 DIAGNÓSTICO DE PROBLEMAS:');
    
    const gridDisplay = getComputedStyle(optionsGrid).display;
    const gridJustifyContent = getComputedStyle(optionsGrid).justifyContent;
    const gridTemplateColumns = getComputedStyle(optionsGrid).gridTemplateColumns;
    
    if (gridDisplay !== 'grid') {
        console.log('  ❌ PROBLEMA: display no es "grid":', gridDisplay);
    }
    
    if (gridJustifyContent === 'flex-start' || gridJustifyContent === 'start') {
        console.log('  ⚠️  POSIBLE PROBLEMA: justify-content alineado a la izquierda:', gridJustifyContent);
    }
    
    if (gridTemplateColumns === 'none') {
        console.log('  ❌ PROBLEMA: grid-template-columns no definido');
    }
    
    console.log('\n=== FIN DEL ANÁLISIS ===');
}

// Función para simular cambio de orientación
function simulateOrientationChange() {
    console.log('\n🔄 SIMULANDO CAMBIO DE ORIENTACIÓN...');
    
    // Guardar dimensiones originales
    const originalWidth = window.innerWidth;
    const originalHeight = window.innerHeight;
    
    console.log('\n📱 ANÁLISIS EN PORTRAIT (simulado):');
    // Simular portrait
    Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 667, configurable: true });
    analyzeModalCSS();
    
    console.log('\n📱 ANÁLISIS EN LANDSCAPE (simulado):');
    // Simular landscape
    Object.defineProperty(window, 'innerWidth', { value: 667, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 375, configurable: true });
    analyzeModalCSS();
    
    // Restaurar dimensiones originales
    Object.defineProperty(window, 'innerWidth', { value: originalWidth, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: originalHeight, configurable: true });
}

// Ejecutar análisis
console.clear();
analyzeModalCSS();

// Agregar botón para ejecutar análisis completo
if (!document.getElementById('debug-button')) {
    const button = document.createElement('button');
    button.id = 'debug-button';
    button.textContent = 'Analizar CSS Modal';
    button.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        z-index: 10000;
        padding: 10px;
        background: #ff4444;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
    `;
    button.onclick = () => {
        console.clear();
        analyzeModalCSS();
    };
    document.body.appendChild(button);
}

console.log('\n💡 INSTRUCCIONES:');
console.log('1. Abre un modal de acompañamientos (litro o copa)');
console.log('2. Haz clic en el botón "Analizar CSS Modal" (esquina superior derecha)');
console.log('3. Revisa la consola para ver el análisis detallado');
console.log('4. Cambia la orientación del dispositivo y repite el análisis');