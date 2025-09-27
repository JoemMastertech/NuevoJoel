# Optimización de Carga de Imágenes y Videos

## Descripción
Este documento describe las optimizaciones realizadas en la carga de recursos multimedia (imágenes y videos) en el proyecto, con el objetivo de mejorar la velocidad de carga y la experiencia del usuario.

## Optimizaciones Implementadas

### 1. Lazy Loading con Intersection Observer
- Implementado **lazy loading** para imágenes y videos usando la API `IntersectionObserver`
- Los recursos solo se cargan cuando están a punto de entrar en el viewport (con un margen configurable según dispositivo)
- Esto reduce significativamente el ancho de banda utilizado al inicio de la página

### 2. Placeholders SVG
- Se muestran placeholders temporales (imágenes SVG) mientras se cargan los recursos reales
- Los placeholders son livianos y se muestran instantáneamente
- Se utilizan placeholders diferentes para el estado de carga y para errores

### 3. Transiciones Suaves
- Añadidas transiciones CSS suaves (0.3s) para el cambio de opacidad al cargar recursos
- Mejora la experiencia visual al evitar saltos bruscos en la interfaz

### 4. Manejo de Errores Mejorado
- Implementado manejo de errores para recursos que fallan al cargar
- En caso de error, se muestra un mensaje o imagen de respaldo en lugar de un icono roto
- Se registran advertencias en el log para facilitar la depuración

### 5. Optimización de Carga de Videos
- Desactivado el autoplay automático para videos en miniaturas
- Los videos ahora solo se reproducen automáticamente cuando son visibles para el usuario
- Configurado `preload="metadata"` para videos, lo que significa que solo se cargan los metadatos inicialmente (dimensiones, duración, etc.)
- Se proporciona un fallback a imágenes en caso de que los videos fallen al cargar

### 6. Optimización Específica para Dispositivos Móviles
-** Detección automática de dispositivos móviles** mediante análisis del agente de usuario
- **Ajustes dinámicos de carga** según el tipo de dispositivo (móvil o desktop)
- **Priorización de recursos** en función de la importancia visual (ej: videos y categorías primero)
- **Uso de atributo `loading="lazy"`** para imágenes no esenciales en dispositivos móviles
- **Reducción del margen de precarga** para dispositivos móviles (100px vs 300px en desktop)

### 7. Adaptabilidad según el Tipo de Red
-** Detección del tipo de conexión de red** (2G, 3G, 4G, WiFi)
- **Estrategias de carga inteligentes**: 
  - En redes lentas (2G): No cargar videos automáticamente, solo mostrar posters
  - En redes medianas (3G): Cargar solo metadatos de videos
  - En redes rápidas (4G, WiFi): Cargar recursos completos
- **Retraso controlado en carga** de recursos no esenciales en redes lentas

### 8. Integración con Sistema de Caché de Videos
- **Priorización de videos en caché** para una reproducción más rápida
- Al detectar un video que ya está en caché, se carga de forma instantánea
- Se evita la recarga innecesaria de videos previamente vistos

## Funciones Nuevas

### `_loadImageOptimized(img, src, alt, className)`
- Carga imágenes con lazy loading y placeholders
- Configura eventos de carga y error
- Implementa optimizaciones específicas para dispositivos móviles
- Parámetros:
  - `img`: Elemento de imagen a configurar
  - `src`: URL de la imagen a cargar
  - `alt`: Texto alternativo para la imagen
  - `className`: Clases CSS para aplicar

### `_initLazyLoading()`
- Inicializa el Intersection Observer para detectar recursos cerca del viewport
- Carga imágenes y videos cuando son visibles
- Configura un margen de anticipación adaptable según el dispositivo
- Implementa estrategias de carga inteligentes basadas en el tipo de dispositivo y red

### `_loadMediaResource(element)`
- Función avanzada para cargar recursos multimedia (imágenes y videos)
- Aplica estrategias de carga específicas según el tipo de dispositivo y red
- Optimiza la reproducción de videos y maneja errores con fallbacks
- Parámetros:
  - `element`: Elemento multimedia (imagen o video) a cargar

## Modificaciones a Funciones Existentes

### `_createVideoThumbnail(item, field, categoryTitle)`
- Ahora utiliza lazy loading para los videos
- Desactiva el autoplay inicial
- Añade manejo de errores y fallback a imágenes

### `_createImageCell(td, item, field, categoryTitle)`
- Utiliza `_loadImageOptimized` para cargar imágenes
- Inicializa lazy loading después de agregar las imágenes

### `createProductGrid(container, data, fields, categoryTitle)`
- Optimiza la carga de miniaturas de video y otras imágenes
- Inicializa lazy loading después de construir la cuadrícula

## Beneficios Esperados
- **Mejora en el tiempo de carga inicial** de las páginas, especialmente en dispositivos móviles
- **Reducción del consumo de datos** para usuarios con conexiones limitadas, especialmente en redes móviles
- **Experiencia de usuario más fluida** con transiciones suaves y placeholders
- **Mayor tolerancia a fallos** con manejadores de errores y fallback a imágenes
- **Menor uso de CPU y memoria** al no cargar y reproducir videos que no son visibles
- **Reproducción de videos más fluida en dispositivos móviles** con menor probabilidad de bloqueos
- **Adaptabilidad inteligente** a diferentes tipos de dispositivos y conexiones de red
- **Uso óptimo de la caché** de videos, evitando recargas innecesarias

## Consideraciones Adicionales
- Estas optimizaciones son especialmente beneficiosas para categorías con muchos recursos multimedia, como las subcategorías de licores
- Se recomienda monitorizar el rendimiento en diferentes dispositivos móviles y conexiones de red
- En futuras iteraciones, se podría considerar implementar un sistema de CDN (Content Delivery Network) para servir recursos multimedia desde ubicaciones geográficas más cercanas
- Para dispositivos móviles con conexiones 2G, es posible que los videos no se reproduzcan automáticamente para ahorrar datos, pero se muestran los posters correspondientes
- Las optimizaciones para dispositivos móviles se basan en detección de agente de usuario, lo que puede tener limitaciones en casos especiales
- En casos de dispositivos móviles con recursos limitados, la experiencia seguirá siendo mejorada gracias a la reducción en la carga de recursos no esenciales