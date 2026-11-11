# Reels Educativos · formas que explican

App web instalable para crear **videos verticales educativos** con dibujos y formas animadas, directamente desde el celular. No necesita PC, no necesita cuenta y **no sube nada a internet**.

---

## 1. Cómo abrirla

### Ya está publicada (lo más rápido)

**Enlace:** https://joselu497.github.io/reels-educativos/

Abre ese enlace en el móvil o escanea `qr-reels.png`. Está alojada gratis en GitHub Pages, así que el enlace es fijo y no depende de ningún PC encendido.

### Opción A · Instalarla como app (recomendada)

La app necesita abrirse desde una dirección `https://` para poder instalarse, usar el micrófono y funcionar sin internet. Si algún día quieres publicarla en otro sitio, esta carpeta funciona tal cual en:

- **GitHub Pages** — sube la carpeta a un repositorio y activa Pages en *Settings → Pages*.
- **Netlify** — arrastra la carpeta en `app.netlify.com`.
- **Cloudflare Pages** — crea un proyecto y sube la carpeta.
- **Vercel** — importa el repositorio o arrastra la carpeta.

Luego, en el celular:

1. Abre el enlace en **Chrome (Android)** o **Safari (iPhone)**.
2. Toca el botón **Instalar** (o el menú → *Añadir a pantalla de inicio*).
3. La app queda como un icono más y funciona **sin internet**.

### Opción B · Probarla en la PC

```bash
cd reels-movil
python -m http.server 8899
```

Abre `http://localhost:8899` en Chrome. El micrófono funciona en `localhost`, pero la instalación como app requiere `https://`.

### Opción C · Un solo archivo

```bash
cd reels-movil
python herramientas/empaquetar.py
```

Genera `reel-educativo.html`, que puedes abrir directamente o enviar por WhatsApp. Sirve para probar y grabar, pero **sin instalación ni service worker**; para el micrófono conviene abrirlo desde `https://` o `localhost`.

---

## 2. Uso rápido

1. Escribe **una idea por línea** en el cuadro de guion.
2. Opcional: empieza la línea con una forma (`#idea`, `#pasos`, `#ciclo`…).
3. Elige **formato** (9:16, 1:1, 16:9), **calidad**, **paleta**, **personaje** y **ritmo**.
4. Pulsa **Generar video**.
5. Cuenta regresiva de 3 segundos → la animación corre en tiempo real y se graba.
6. Al terminar: **Compartir** (TikTok, Instagram, WhatsApp…) o **Descargar**.

> Duración del video = duración de la animación. Si tienes 7 escenas, el video durará aproximadamente 20–25 segundos (según el ritmo).

### Formas disponibles

| Prefijo | Dibujo | Úsalo para |
|---|---|---|
| `#personaje` | Personaje grande con globo de diálogo | Saludar, explicar o cerrar hablando |
| `#idea` | Bombilla que se enciende | Presentar un concepto |
| `#flecha` | Flecha que conecta | Causa → consecuencia |
| `#pasos` | Tres pasos en línea | Procesos (`|` separa los pasos) |
| `#ciclo` | Círculo con flecha | Ciclos que se repiten |
| `#comparar` | Dos círculos que se cruzan | “A vs B” |
| `#grafico` | Barras que crecen | Datos y magnitudes |
| `#numero` | Número grande en un aro | Cifras importantes |
| `#check` | Marca de verificación | Conclusión o cierre |
| `#formula` | Ecuación por bloques | Matemáticas, química |
| `#circulo` | Círculos concéntricos | Ideas que giran alrededor de otra |
| `#subrayado` | Texto resaltado | Frases clave |

Si no pones prefijo, la app elige una forma según el contenido (números → `#numero`, “vs” → `#comparar`, listas con comas → `#pasos`, etc.).

### Ejemplo listo para probar

Pulsa **Usar ejemplo** dentro de la app:

```
#personaje ¡Hola! Hoy veremos la fotosíntesis
#idea La fotosíntesis
#flecha Las plantas usan luz, agua y CO2
#pasos Absorben agua | Capturan la luz | Liberan oxígeno
#grafico Así crece su energía
#numero 6 CO2 + 6 H2O
#formula 6CO2 + 6H2O = C6H12O6 + 6O2
#check Por eso limpian el aire
#personaje ¡Tú puedes! Cuida las plantas
```

### Personajes animados

En **Formato y estilo → Personaje** eliges quién acompaña el video:

| Personaje | Estilo |
|---|---|
| **Búho** | Búho redondo y simpático (predeterminado) |
| **Gatito** | Gato naranja con bigotes y cola |
| **Robot** | Robot azul con pantalla y antena |
| **Plantita** | Flor con maceta y hojas |
| **Nubecita** | Nube esponjosa con bracitos |
| **Sin personaje** | Solo las formas y el texto |

El personaje aparece como **mascota pequeña** en la esquina inferior derecha de cada escena. Reacciona a lo que se dibuja: levanta la mano al señalar (`#flecha`, `#pasos`…), celebra en `#check` y se asombra con `#idea`. También parpadea y se mueve suavemente.

Con `#personaje` el personaje sale **grande y centrado**, saluda y dice tu texto en un **globo de diálogo**. Ideal para una intro y un cierre:

```
#personaje ¡Hola! Hoy veremos la fotosíntesis
...tus escenas...
#personaje ¡Tú puedes! Cuida las plantas
```

> El globo muestra hasta 4 líneas; si el texto es muy largo, la app reduce la letra y recorta el resto. Para que se lea bien, usa frases cortas (menos de 90 caracteres).

### Escenas con varios elementos

- **Pasos:** separa con `|`, `;` o `·`:
  `#pasos Absorben agua | Capturan la luz | Liberan oxígeno`
- **Comparación:** usa `vs`, `versus`, `frente a` o `contra`:
  `#comparar Mitosis vs Meiosis`
- **Número:** la app toma la primera cifra del texto:
  `#numero 71% del planeta es agua`
- **Fórmula:** escribe la ecuación completa:
  `#formula E = mc²`
- **Personaje hablando:** escribe la frase que dirá en el globo:
  `#personaje ¡Hola! Hoy veremos algo increíble`

---

## 3. Audio

- **Música de fondo:** elige un archivo MP3/M4A/OGG. Se repite en bucle y se mezcla con el video.
- **Narración grabada:** elige un audio ya grabado (nota de voz, etc.). Se reproduce una vez desde el inicio.
- **Micrófono:** activa la opción y narra en vivo durante la cuenta regresiva y la animación. El navegador pedirá permiso la primera vez.
- **Volumen de la música:** se mezcla aparte de la voz.

El video siempre incluye una pista de audio (aunque esté en silencio) para que las redes sociales lo acepten.

> **Voz IA:** el navegador no permite capturar la voz del sistema dentro de la grabación. Por eso la voz debe ser tuya (micrófono) o un archivo de audio importado. Si quieres voz IA, puedes generarla en otra app y luego importarla como narración.

---

## 4. Consejos para grabar

- Usa la **calidad 720p** en celulares modestos; 1080p tarda más y puede bajar los FPS.
- Graba en **silencio** y con el celular estable.
- Mantén la app en primer plano y la pantalla encendida (la app pide *wake lock* mientras graba).
- Para narrar: primero escribe el guion, ensaya con **play**, y luego graba.
- El video se genera en tiempo real: no cierres la app ni bloquees el teléfono durante la grabación.
- TikTok e Instagram aceptan MP4 directamente. Si tu navegador grabó en WebM, usa **Compartir** desde la app o conviértelo después.

---

## 5. Privacidad

Todo ocurre en tu dispositivo:

- El guion se guarda solo en `localStorage` de tu navegador.
- La música, la narración y el micrófono se procesan con Web Audio en memoria.
- El video se graba con `MediaRecorder` y no sale del teléfono.
- No hay servidor, cuentas, analíticas ni límite de videos.

---

## 6. Estructura del proyecto

```
reels-movil/
├── index.html                 Interfaz
├── css/estilos.css            Estilos móviles y de escritorio
├── js/dibujos.js              Paletas, formas y personajes animados (Canvas 2D)
├── js/motor.js                Guion → escenas, textos y cuadros
├── js/grabador.js             MediaRecorder + mezcla de audio
├── js/app.js                  Interfaz, vista previa, PWA
├── sw.js                      Service worker (modo offline)
├── manifest.webmanifest       Manifest de instalación
├── iconos/                    Iconos 192/512/maskable/apple
├── herramientas/
│   ├── hacer_iconos.py        Regenera los iconos (Pillow)
│   └── empaquetar.py          Genera reel-educativo.html
└── LEEME.md
```

---

## 7. Personalizar

- **Paletas:** `js/dibujos.js` → objeto `PALETAS`. Cambia `fondo`, `acento`, `acento2`, `tinta`.
- **Personajes:** `js/dibujos.js` → `PERSONAJES` (lista y nombres) y `COLORES_PERSONAJE` (colores de cada personaje). Cada personaje tiene su función `dibujarBuho`, `dibujarGato`, etc.; recibe `(ctx, colores, pose, tiempo)`.
- **Formas:** en `js/dibujos.js`, cada función `dibujar…` recibe `(ctx, R, progreso, colores, escena, tiempo)`. Puedes ajustar tamaños y tiempos.
- **Duración por escena:** `js/motor.js` → `1.15 + palabras / (2.5 * velocidad)`, con límites `2.4`–`9.5` segundos.
- **Transiciones:** `js/motor.js` → constante `TRANSICION` (0.32 s).
- **Estilos:** `css/estilos.css` usa variables CSS al inicio del archivo.
- **Iconos:** edita y ejecuta `python herramientas/hacer_iconos.py`.

Después de cambiar archivos, sube la versión del caché en `sw.js` (`reels-educativos-v5` → `v6`) y haz `git push` para que los dispositivos instalados reciban los cambios.

---

## 8. Compatibilidad

| Navegador | Grabar | Micrófono | Instalar |
|---|---|---|---|
| Chrome Android (actual) | MP4 | Sí | Sí |
| Safari iPhone 16+ | MP4 | Sí | Sí |
| Chrome/Edge escritorio | MP4 | Sí | Sí |
| Firefox | WebM | Sí | Limitado |

Si un navegador no soporta `MediaRecorder` o `canvas.captureStream`, la app avisa en la parte inferior del editor.

---

Hecho para clases cortas: una idea, una forma, un video.
