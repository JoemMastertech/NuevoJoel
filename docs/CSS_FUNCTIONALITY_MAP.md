# Mapa de Funcionalidades Críticas - CSS

**Fecha:** $(Get-Date)  
**Propósito:** Documentar todas las funcionalidades que DEBEN preservarse durante la limpieza

## 🎯 FUNCIONALIDADES QUE FUNCIONAN PERFECTAMENTE (NO TOCAR)

### ✅ Vista Grid
- **Estado:** Funciona perfectamente
- **Ubicación:** `.product-grid`, `.category-grid`
- **Características:**
  - Responsive en todos los dispositivos
  - Transiciones suaves
  - Layout adaptativo

### ✅ Portrait Mode (Móvil + Tablet)
- **Estado:** Configurado como se desea
- **Componentes críticos:**
  - Sidebar fijo en parte inferior
  - Scroll invertido del sidebar
  - Tamaño fijo para no cubrir toda la pantalla
  - Modales de acompañamientos funcionando

### ✅ Coexistencia Sidebar + Contenedor Padre en Landscape
- **Estado:** Perfecto, debe preservarse
- **Comportamiento:**
  - Sidebar se posiciona al costado derecho
  - Contenedor padre se recorre a la izquierda
  - Sin superposición
  - Sidebar mantiene posición fija durante scroll

## 🚨 PROBLEMAS IDENTIFICADOS (REQUIEREN ATENCIÓN)

### ❌ Problema 1: Modo Tabla en Landscape
- **Ubicación:** `.product-table` en media queries landscape
- **Síntomas:** Layout se rompe al intentar modificaciones
- **Líneas críticas:** 2460-2520, 2788-2830

### ❌ Problema 2: Modales de Acompañamientos
- **Tipos problemáticos:**
  - Modales de botellas (con contadores)
  - Modales de litros y copas (sin contadores)
- **Conflicto:** Modificar uno afecta al otro
- **Líneas críticas:** 2564-2580, 1077, 2024, 2201, 2533

## 📋 ESTRUCTURA DE COMPONENTES CRÍTICOS

### 1. Sistema de Modales
```css
/* Estructura base - NO MODIFICAR */
.modal-backdrop, .modal { /* Línea 972 */ }
.modal-content { /* Línea 992 */ }

/* Modales específicos - REVISAR CUIDADOSAMENTE */
#drink-options-modal.modal-flex .options-grid { /* Línea 2564 */ }
.modal-content.image-modal.video-modal { /* Líneas 1077, 2024, 2201, 2533 */ }
```

### 2. Sistema Sidebar + Contenedor
```css
/* Variables críticas - NO TOCAR */
--sidebar-width-mobile: 140px; /* Línea 23 */
--sidebar-height-portrait: 180px; /* Línea 24 */

/* Coexistencia landscape - PRESERVAR */
.content-wrapper.order-active #content-container { /* Línea 2335 */
  margin-right: clamp(220px, 27vw, 300px); /* CRÍTICO */
}

#order-sidebar { /* Múltiples ubicaciones */
  /* Posicionamiento fijo en landscape */
}
```

### 3. Sistema Dual Vista (Tabla/Grid)
```css
/* Grid - FUNCIONA PERFECTO, NO TOCAR */
.product-grid { /* Múltiples ubicaciones */ }

/* Tabla - PROBLEMÁTICA EN LANDSCAPE */
.product-table { /* Líneas problemáticas: 2460+, 2788+ */ }
```

## 🔍 ANÁLISIS DE CONFLICTOS

### Conflicto Principal: !important en Media Queries
- **Ubicación:** Líneas 1885-3789
- **Problema:** 175 instancias rompen cascada natural
- **Impacto:** Imposible hacer modificaciones quirúrgicas

### Conflicto Secundario: Especificidad Alta
- **Selectores problemáticos:**
  - `.modal-content.image-modal.video-modal` (especificidad 0,0,3,0)
  - Selectores con múltiples clases encadenadas

### Conflicto Terciario: Media Queries Fragmentadas
- **Problema:** 28 media queries dispersas
- **Impacto:** Lógica responsive duplicada y conflictiva

## 🎯 ESTRATEGIA DE LIMPIEZA QUIRÚRGICA

### Fase 1: Mapeo de Dependencias
1. **Identificar todas las reglas** que afectan componentes críticos
2. **Documentar interacciones** entre modales y sidebar
3. **Crear matriz de dependencias** antes de cualquier cambio

### Fase 2: Eliminación Selectiva de !important
1. **Comenzar con reglas aisladas** (scrollbar, animaciones)
2. **Evitar completamente** reglas de sidebar y modales
3. **Probar cada eliminación** inmediatamente

### Fase 3: Consolidación de Media Queries
1. **Agrupar por componente**, no por breakpoint
2. **Mantener lógica existente** de portrait/landscape
3. **Preservar breakpoints críticos:** 480px, 768px, 1024px

## ⚠️ REGLAS DE SEGURIDAD

### 🚫 NUNCA TOCAR
- Variables CSS de sidebar (líneas 22-27)
- Reglas de coexistencia sidebar + contenedor (líneas 2335-2340)
- Sistema de grid completo
- Configuración portrait (funciona perfecto)

### ⚠️ MODIFICAR CON EXTREMA PRECAUCIÓN
- Cualquier regla con `#order-sidebar`
- Modales con `#drink-options-modal`
- Media queries landscape
- Reglas con `!important` en sidebar

### ✅ SEGURO PARA MODIFICAR
- Scrollbar styles (líneas 3800+)
- Animaciones aisladas
- Variables de color
- Reglas sin `!important` que no afecten layout

## 📊 MÉTRICAS DE RIESGO

| Componente | Riesgo | Líneas Críticas | Acción |
|------------|--------|-----------------|---------|
| Sidebar Portrait | 🔴 Alto | 2891-2930 | NO TOCAR |
| Sidebar Landscape | 🔴 Alto | 2350-2380 | NO TOCAR |
| Modales Acompañamientos | 🟡 Medio | 2564-2580 | REVISAR |
| Tabla Landscape | 🟡 Medio | 2460-2520 | ARREGLAR |
| Grid System | 🟢 Bajo | Múltiples | PRESERVAR |

## 🎯 PRÓXIMOS PASOS SEGUROS

1. **Comenzar con líneas 3800-3843** (scrollbar - bajo riesgo)
2. **Eliminar !important** en animaciones aisladas
3. **Consolidar variables** no utilizadas
4. **Documentar cada cambio** antes de proceder

---

**RECORDATORIO CRÍTICO:** El objetivo es limpiar el código SIN romper funcionalidades existentes. Priorizar estabilidad sobre perfección.