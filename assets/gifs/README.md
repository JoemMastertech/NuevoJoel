# 📁 Carpeta de GIFs

Esta carpeta está destinada para almacenar archivos GIF del proyecto.

## 📝 Convención de nombres

Para mantener el orden y facilitar la búsqueda, nombra tus GIFs siguiendo estas reglas:

- Usa nombres descriptivos en minúsculas
- Separa palabras con guiones (`-`) en lugar de espacios
- Incluye información relevante en el nombre
- Evita caracteres especiales

**Ejemplos:**
- ✅ `animacion-boton-enviar.gif`
- ✅ `loading-spinner-azul.gif`
- ✅ `menu-hamburguesa-abrir.gif`
- ❌ `gif1.gif`
- ❌ `Mi Animación!.gif`

## 📤 Cómo subir archivos

### Opción 1: Interfaz web de GitHub

1. Navega a esta carpeta en GitHub
2. Haz clic en el botón **"Add file"** → **"Upload files"**
3. Arrastra tus GIFs o haz clic para seleccionarlos
4. Añade un mensaje de commit descriptivo
5. Haz clic en **"Commit changes"**

### Opción 2: Git desde la línea de comandos

```bash
# Clona el repositorio si aún no lo has hecho
git clone https://github.com/JoemMastertech/NuevoJoel.git
cd NuevoJoel

# Copia tus GIFs a esta carpeta
cp /ruta/a/tu/archivo.gif assets/gifs/

# Añade y confirma los cambios
git add assets/gifs/
git commit -m "Añadir nuevo GIF: nombre-descriptivo"
git push origin main
```

## 🔗 Obtener URLs públicas

Una vez subidos, tus GIFs tendrán URLs públicas que puedes usar en tu proyecto:

**Formato de URL:**
```
https://raw.githubusercontent.com/JoemMastertech/NuevoJoel/main/assets/gifs/nombre-archivo.gif
```

**Para usar en Markdown:**
```markdown
![Descripción](https://raw.githubusercontent.com/JoemMastertech/NuevoJoel/main/assets/gifs/nombre-archivo.gif)
```

**Para usar en HTML:**
```html
<img src="https://raw.githubusercontent.com/JoemMastertech/NuevoJoel/main/assets/gifs/nombre-archivo.gif" alt="Descripción">
```

## 💡 Consejos

- Optimiza tus GIFs antes de subirlos para reducir el tamaño del repositorio
- Herramientas recomendadas: [ezgif.com](https://ezgif.com/optimize), [gifsicle](https://www.lcdf.org/gifsicle/)
- GitHub tiene un límite de 100 MB por archivo
- Considera usar GIFs de menos de 5 MB para mejor rendimiento

---

*Carpeta creada el 22 de octubre de 2025*
