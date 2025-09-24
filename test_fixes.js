// Script para probar los arreglos de alineación en móvil portrait
const puppeteer = require('puppeteer');

async function testFixes() {
  try {
    // Lanzar el navegador
    const browser = await puppeteer.launch({
      headless: false,
      args: ['--window-size=360,800'] // Tamaño típico de móvil en portrait
    });
    
    // Crear una página
    const page = await browser.newPage();
    
    // Configurar el viewport en portrait
    await page.setViewport({
      width: 360,
      height: 800,
      isMobile: true,
      hasTouch: true
    });
    
    console.log('Navegando a la página principal...');
    await page.goto('http://localhost:3000');
    
    // Verificar que se haya cargado css_fixes.css
    console.log('Verificando carga de css_fixes.css...');
    const cssLoaded = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
      return links.some(link => link.href.includes('css_fixes.css'));
    });
    
    if (cssLoaded) {
      console.log('✅ Archivo css_fixes.css se está cargando correctamente');
    } else {
      console.log('❌ Archivo css_fixes.css no se encuentra en la página');
      // Si no se encuentra, intentamos inyectarlo manualmente para probar
      await page.addStyleTag({ path: './css_fixes.css' });
      console.log('Se ha inyectado manualmente el archivo css_fixes.css');
    }
    
    // Navegar a la sección de cervezas
    console.log('Navegando a la sección de cervezas...');
    await page.evaluate(() => {
      if (window.AppInit && typeof window.AppInit.loadContent === 'function') {
        window.AppInit.loadContent('cervezas');
      }
    });
    
    await page.waitForTimeout(1500); // Esperar a que se cargue el contenido
    
    // Verificar alineación en cervezas
    console.log('Verificando alineación en sección de cervezas...');
    const cervezasAlignment = await page.evaluate(() => {
      const nameCells = document.querySelectorAll('.product-table td.product-name');
      const ingredientsCells = document.querySelectorAll('.product-table td.product-ingredients');
      const imageCells = document.querySelectorAll('.product-table[data-category="cervezas"] td.image-icon');
      
      const allNameAlignedLeft = Array.from(nameCells).every(cell => 
        window.getComputedStyle(cell).textAlign === 'left'
      );
      
      const allIngredientsAlignedLeft = Array.from(ingredientsCells).every(cell => 
        window.getComputedStyle(cell).textAlign === 'left'
      );
      
      const allImagesCentered = Array.from(imageCells).every(cell => {
        const display = window.getComputedStyle(cell).display;
        const justifyContent = window.getComputedStyle(cell).justifyContent;
        const alignItems = window.getComputedStyle(cell).alignItems;
        return display === 'flex' && justifyContent === 'center' && alignItems === 'center';
      });
      
      return {
        allNameAlignedLeft,
        allIngredientsAlignedLeft,
        allImagesCentered,
        nameCellsCount: nameCells.length,
        ingredientsCellsCount: ingredientsCells.length,
        imageCellsCount: imageCells.length
      };
    });
    
    console.log('Resultados en sección de cervezas:');
    console.log(`- Nombres alineados a la izquierda: ${cervezasAlignment.allNameAlignedLeft ? '✅' : '❌'} (${cervezasAlignment.nameCellsCount} celdas)`);
    console.log(`- Ingredientes alineados a la izquierda: ${cervezasAlignment.allIngredientsAlignedLeft ? '✅' : '❌'} (${cervezasAlignment.ingredientsCellsCount} celdas)`);
    console.log(`- Imágenes centradas: ${cervezasAlignment.allImagesCentered ? '✅' : '❌'} (${cervezasAlignment.imageCellsCount} celdas)`);
    
    // Navegar a la sección de refrescos
    console.log('Navegando a la sección de refrescos...');
    await page.evaluate(() => {
      if (window.AppInit && typeof window.AppInit.loadContent === 'function') {
        window.AppInit.loadContent('refrescos');
      }
    });
    
    await page.waitForTimeout(1500); // Esperar a que se cargue el contenido
    
    // Verificar alineación en refrescos
    console.log('Verificando alineación en sección de refrescos...');
    const refrescosAlignment = await page.evaluate(() => {
      const nameCells = document.querySelectorAll('.product-table td.product-name');
      const ingredientsCells = document.querySelectorAll('.product-table td.product-ingredients');
      const imageCells = document.querySelectorAll('.product-table[data-category="refrescos"] td.image-icon');
      
      const allNameAlignedLeft = Array.from(nameCells).every(cell => 
        window.getComputedStyle(cell).textAlign === 'left'
      );
      
      const allIngredientsAlignedLeft = Array.from(ingredientsCells).every(cell => 
        window.getComputedStyle(cell).textAlign === 'left'
      );
      
      const allImagesCentered = Array.from(imageCells).every(cell => {
        const display = window.getComputedStyle(cell).display;
        const justifyContent = window.getComputedStyle(cell).justifyContent;
        const alignItems = window.getComputedStyle(cell).alignItems;
        return display === 'flex' && justifyContent === 'center' && alignItems === 'center';
      });
      
      return {
        allNameAlignedLeft,
        allIngredientsAlignedLeft,
        allImagesCentered,
        nameCellsCount: nameCells.length,
        ingredientsCellsCount: ingredientsCells.length,
        imageCellsCount: imageCells.length
      };
    });
    
    console.log('Resultados en sección de refrescos:');
    console.log(`- Nombres alineados a la izquierda: ${refrescosAlignment.allNameAlignedLeft ? '✅' : '❌'} (${refrescosAlignment.nameCellsCount} celdas)`);
    console.log(`- Ingredientes alineados a la izquierda: ${refrescosAlignment.allIngredientsAlignedLeft ? '✅' : '❌'} (${refrescosAlignment.ingredientsCellsCount} celdas)`);
    console.log(`- Imágenes centradas: ${refrescosAlignment.allImagesCentered ? '✅' : '❌'} (${refrescosAlignment.imageCellsCount} celdas)`);
    
    // Tomar capturas de pantalla para verificación visual
    await page.screenshot({ path: 'screenshot_cervezas.png' });
    console.log('Captura de pantalla de la sección de cervezas guardada como screenshot_cervezas.png');
    
    await page.evaluate(() => {
      if (window.AppInit && typeof window.AppInit.loadContent === 'function') {
        window.AppInit.loadContent('refrescos');
      }
    });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'screenshot_refrescos.png' });
    console.log('Captura de pantalla de la sección de refrescos guardada como screenshot_refrescos.png');
    
    // Cerrar el navegador
    await browser.close();
    console.log('Prueba completada');
    
  } catch (error) {
    console.error('Error durante la prueba:', error);
  }
}

testFixes();