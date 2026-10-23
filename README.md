# Pétalo & Musgo · web interactiva 3D (concepto)

Web de una floristería **ficticia** en Mérida (Badajoz). Es una demo de la tarifa *Web interactiva 3D (desde 1.690 €)* del [portfolio](https://danielduranmoya-spec.github.io/): una peonía 3D que se abre al entrar, una corriente de pétalos que viaja hacia la cámara al hacer scroll, un diseñador de ramos en 3D con precio y pedido por WhatsApp y un vídeo interactivo que se controla arrastrando.

Web publicada: https://danielduranmoya-spec.github.io/web-demo-floristeria/

```
web-demo-floristeria/
├── index.html        ← estructura, textos, SEO (meta, Open Graph, schema.org Florist y FAQ)
├── style.css         ← estilos: colores y tipografías al principio, en :root
├── script.js         ← menú, títulos letra a letra, diseñador (precios en CONFIG), vídeo, temporada, horario, cookies
├── escena.js         ← escenas 3D con three.js: inicio (peonía + pétalos) y ramo del diseñador
├── flores.js         ← flores 3D hechas con código: peonía, rosa, tulipán y anémona; ramo con papel y lazo
├── video/
│   ├── asi-nace.webm / .mp4   ← vídeo del apartado «Así nace un ramo» (8 s, sin sonido)
│   ├── asi-nace.jpg           ← fotograma de portada
│   └── generar.html           ← herramienta para volver a generar el vídeo con las flores 3D
├── img/og.jpg        ← imagen para compartir en redes
├── aviso-legal.html  ← plantilla: completa los campos [PENDIENTE]
├── privacidad.html   ← plantilla: completa los campos [PENDIENTE]
├── cookies.html
├── robots.txt · sitemap.xml · favicon.svg
```

## Diseño

- **Tipografías**: Gloock (títulos) y Figtree (texto), de Google Fonts.
- **Paleta**: rosa peonía `#E8A0B4`, musgo profundo `#22382B`, crema nata `#FBF4EA` y amarillo polen `#F4C542`.
- **Animación**: inspirada en *Aetheris Voyage* de [motionsites.ai](https://motionsites.ai/): pétalos 3D que flotan en profundidad y avanzan hacia la cámara con parallax del ratón (o de la inclinación del móvil), y títulos que aparecen letra a letra pasando de desenfocados a nítidos.

## Qué hace el 3D

1. **Inicio**: la peonía se abre en tres segundos desde el capullo y después «respira». Al bajar, los pétalos aceleran y la cámara avanza entre ellos.
2. **Diseñador**: flor (peonía, rosa, tulipán o anémona), color, tamaño (7, 11 o 17 flores), papel (kraft, nata y rosa o verde musgo), entrega y tarjeta. Cada cambio reconstruye el ramo con una pequeña animación; se gira arrastrando en horizontal (el scroll vertical del móvil sigue funcionando). El botón prepara el pedido completo en un mensaje de WhatsApp.
3. **Vídeo interactivo**: se reproduce solo al verlo, y se puede arrastrar sobre él para mover el tiempo, saltar por capítulos o usar la barra. Cada capítulo muestra una nota y el último lleva al diseñador.

No se descarga ningún modelo: pétalos, hojas, tallos, papel y lazo se generan con código (`flores.js`), así que la web pesa poco y se puede cambiar cualquier color desde el código. En móvil baja el número de pétalos y la resolución; las escenas solo se dibujan cuando se ven en pantalla, y con «reducir movimiento» activado todo queda quieto.

## Cambiar precios y datos

- Precios por flor, tamaños, papeles y envío: `CONFIG` al principio de `script.js`. Los ramos del día y los capítulos del vídeo también están ahí.
- Teléfono de WhatsApp: `WHATSAPP` en `script.js` y los enlaces `wa.me` de `index.html`.
- Horario: `HORARIO` en `script.js`, la tabla de `index.html` y `openingHoursSpecification` del bloque schema.org.

## Volver a generar el vídeo

Abre `video/generar.html` con un servidor local y llama a `cuadro(segundos)` para cada fotograma (30 por segundo, 8 segundos). Se capturó cada fotograma del lienzo y se codificó con ffmpeg en WebM (VP9) y MP4 (H.264).

## Privacidad y cookies

- El mapa de OpenStreetMap solo se carga si se acepta en el aviso o se pulsa «Cargar mapa». La elección se guarda en `localStorage` (`pm-consent`).
- Servicios externos: three.js desde jsDelivr (versión fijada 0.186.1) y las tipografías desde Google Fonts.

## Pasar a web real

Quitar la barra «Concepto» (`.concepto`), cambiar las reseñas, cifras, dirección y teléfono de ejemplo, y completar los textos legales.

## Publicar cambios

GitHub Pages desde la rama `main` (carpeta raíz). Cada `git push` a `main` actualiza la web en uno o dos minutos.
