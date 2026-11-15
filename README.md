# DOXIS AI

Presentación interactiva de **DOXIS AI**, un asistente virtual inteligente controlado por voz.
La página habla (voz de mujer, en español o inglés) y responde preguntas sobre el proyecto.

## Archivos

| Archivo | Para qué sirve |
| --- | --- |
| `index.html` | Página principal |
| `styles.css` | Estilos |
| `script.js` | Lógica: esfera animada, voz y respuestas |
| `standalone.html` | La misma página en un solo archivo (todo incluido) |
| `favicon.svg` | Ícono de la pestaña |
| `robots.txt` y `sitemap.xml` | Para buscadores |
| `vercel.json` | Configuración de Vercel |

## Publicar en Vercel con GitHub

1. Sube todos los archivos a la **raíz** de un repositorio de GitHub.
2. En vercel.com: **Add New → Project**, elige el repositorio y pulsa **Deploy**.
3. No necesita instalar nada ni configurar un comando de compilación.

## Antes de publicar

Cambia `https://doxis-ai.vercel.app/` por tu dirección real en `sitemap.xml` y `robots.txt`.

## Notas

- La voz depende de las voces instaladas en el dispositivo; el programa elige una de mujer automáticamente.
- Para cambiar textos y respuestas, edita el objeto `T` en `script.js`.
