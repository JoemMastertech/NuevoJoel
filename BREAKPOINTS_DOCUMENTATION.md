# Sistema de Breakpoints Consolidado

## Resumen

Este documento describe el sistema de breakpoints consolidado implementado en la aplicación. Se han unificado los breakpoints para simplificar el mantenimiento y mejorar la consistencia del diseño responsivo.

## Breakpoints Estándar

### 1. Móvil (≤ 480px)
- **Uso**: Dispositivos móviles pequeños
- **Media Query**: `@media (max-width: 480px)`
- **Características**:
  - Diseño de una sola columna
  - Navegación colapsada
  - Texto y elementos optimizados para pantallas pequeñas

### 2. Tablet (481px - 768px)
- **Uso**: Tablets y dispositivos móviles grandes
- **Media Query**: `@media (max-width: 768px)`
- **Características**:
  - Sidebar inferior en orientación portrait
  - Ancho completo para contenido principal
  - Elementos adaptados para touch

### 3. Desktop Pequeño (769px - 1024px)
- **Uso**: Laptops y monitores pequeños
- **Media Query**: `@media (max-width: 1024px)`
- **Características**:
  - Sidebar lateral
  - Diseño de múltiples columnas
  - Elementos optimizados para mouse/trackpad

### 4. Desktop Grande (> 1200px)
- **Uso**: Monitores grandes y pantallas de alta resolución
- **Media Query**: `@media (min-width: 1200px)`
- **Características**:
  - Máximo aprovechamiento del espacio
  - Elementos con mayor padding y spacing
  - Diseño expandido

## Breakpoints Especiales

### Orientación Landscape
- **Media Query**: `@media (max-width: 768px) and (orientation: landscape)`
- **Uso**: Ajustes específicos para dispositivos en orientación horizontal
- **Aplicaciones**:
  - Reducción de padding vertical
  - Optimización de altura de elementos
  - Ajustes de modal y contenido

### Orientación Portrait
- **Media Query**: `@media (max-width: 480px) and (orientation: portrait)`
- **Uso**: Ajustes específicos para móviles en orientación vertical
- **Aplicaciones**:
  - Optimización de tablas
  - Ajustes de formularios
  - Elementos de navegación

## Cambios Realizados

### Consolidaciones Principales

1. **375px → 480px**: Los breakpoints de 375px se consolidaron a 480px para simplificar el sistema
2. **750px → 768px**: El breakpoint de 750px se unificó con el estándar de tablet (768px)
3. **900px → 1024px**: Los breakpoints de 900px se consolidaron al estándar de desktop pequeño (1024px)
4. **1200px**: Se mantuvo como breakpoint estándar para desktop grande

### Beneficios de la Consolidación

- **Mantenimiento simplificado**: Menos breakpoints = menos código duplicado
- **Consistencia mejorada**: Uso de breakpoints estándar de la industria
- **Mejor rendimiento**: Menos media queries = CSS más eficiente
- **Facilidad de desarrollo**: Sistema más predecible y fácil de recordar

## Implementación

### Estructura de Media Queries

```css
/* Móvil */
@media (max-width: 480px) {
    /* Estilos para móvil */
}

/* Tablet */
@media (max-width: 768px) {
    /* Estilos para tablet */
}

/* Desktop Pequeño */
@media (max-width: 1024px) {
    /* Estilos para desktop pequeño */
}

/* Desktop Grande */
@media (min-width: 1200px) {
    /* Estilos para desktop grande */
}
```

### Orientación Específica

```css
/* Landscape en tablet/móvil */
@media (max-width: 768px) and (orientation: landscape) {
    /* Ajustes para landscape */
}

/* Portrait en móvil */
@media (max-width: 480px) and (orientation: portrait) {
    /* Ajustes para portrait móvil */
}
```

## Verificación

El sistema ha sido verificado en las siguientes resoluciones:
- ✅ Desktop: 1200x800px
- ✅ Tablet: 768x600px  
- ✅ Móvil: 480x600px

Todas las resoluciones muestran el diseño correcto y la funcionalidad esperada.

## Notas de Desarrollo

- Los breakpoints siguen el enfoque "mobile-first" con `max-width`
- Se mantiene compatibilidad con navegadores modernos
- Los valores son consistentes con frameworks populares como Bootstrap
- El sistema es escalable para futuras adiciones

---

*Última actualización: Enero 2025*
*Sistema implementado y verificado en main.css*