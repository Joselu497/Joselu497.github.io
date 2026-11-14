# Reels Aero · anuncios que hablan

App web instalable para crear **videos verticales de anuncios** con dibujos animados, un señor (o una mascota) que habla y voz de locutor incluida. Funciona desde el celular, **sin cuenta, sin pagar y sin internet**.

---

## 1. Cómo abrirla

### Ya está publicada

**Enlace:** https://joselu497.github.io/reels-educativos/

Ábrelo en el móvil o escanea `qr-reels.png`. Está alojada gratis en GitHub Pages, así que el enlace es fijo.

### Instalarla como app

1. Abre el enlace en **Chrome (Android)** o **Safari (iPhone)**.
2. Toca **Instalar** (o el menú → *Añadir a pantalla de inicio*).
3. Queda como un icono más y funciona **sin internet**.

### Probarla en la PC

```bash
cd reels-movil
python -m http.server 8899
```

Abre `http://localhost:8899`. El micrófono funciona en `localhost`, pero instalar la app requiere `https://`.

### Un solo archivo

```bash
cd reels-movil
python herramientas/empaquetar.py
```

Genera `reel-aero.html`, que puedes abrir o enviar por WhatsApp. **Sin service worker** y **sin voz clásica**: el motor de voz necesita cargar sus archivos aparte, así que para anuncios con voz usa la versión publicada.

---

## 2. Uso rápido

1. Elige una **temática** para empezar con guion, paleta, personaje y voz ya configurados.
2. Escribe **una idea por línea** en el cuadro de guion.
3. Opcional: empieza la línea con una forma (`#personaje`, `#oferta`, `#precio`…).
4. Elige **formato**, **calidad**, **paleta**, **personaje** y **ritmo**.
5. Pulsa **Generar video**.
6. Cuenta regresiva de 3 segundos → la animación corre y se graba, con el personaje hablando.
7. Al terminar: **Compartir** (TikTok, Instagram, WhatsApp…) o **Descargar**.

> La duración del video es la de la animación. Con voz clásica, cada escena dura lo que dura su audio más un margen.

### Temáticas listas

Los botones sobre el guion cambian todo de una vez. Si ya escribiste algo, la app pide confirmación antes de reemplazarlo.

| Temática | Para qué sirve | Paleta |
|---|---|---|
| **Anuncio** | Promocionar un negocio o servicio | Frutiger Aero |
| **Servicios** | Lista de lo que ofreces | Frutiger Aero |
| **Agencia de buses** | Rutas, horarios, pasajes y reservas | Frutiger Aero |
| **Tienda de decoración** | Productos, precios y dirección | Frutiger Aero |
| **Oferta relámpago** | Descuentos y ventas por tiempo limitado | Neón |
| **Evento** | Fechas, lugar e invitación | Papel y tinta |

### Formas disponibles

| Prefijo | Dibujo | Úsalo para |
|---|---|---|
| `#personaje` | Personaje grande con globo de diálogo | Saludar, explicar o cerrar hablando |
| `#idea` | Bombilla que se enciende | Presentar una idea |
| `#flecha` | Flecha que conecta | Causa → consecuencia |
| `#pasos` | Tres pasos en línea | Procesos (`|` separa los pasos) |
| `#ciclo` | Círculo con flecha | Cosas que se repiten |
| `#comparar` | Dos círculos que se cruzan | “A vs B” |
| `#grafico` | Barras que crecen | Datos y magnitudes |
| `#numero` | Número grande en un aro | Cifras importantes |
| `#check` | Marca de verificación | Ventajas o cierre |
| `#formula` | Ecuación por bloques | Precios compuestos, cálculos |
| `#circulo` | Círculos concéntricos | Ideas alrededor de una |
| `#subrayado` | Texto resaltado | Frases clave |
| `#precio` | Cartel grande con el precio | Mostrar cuánto cuesta |
| `#oferta` | Sello brillante de descuento | Porcentajes y 2×1 |
| `#servicio` | Lista de servicios con visto | Qué ofreces (`|` separa) |
| `#horario` | Reloj con tu horario | Días y horas de atención |
| `#contacto` | Teléfono con ondas | WhatsApp, celular, redes |
| `#ubicacion` | Pin de mapa animado | Dirección o local |
| `#cta` | Botón grande de acción | “Reserva”, “compra”, “escríbenos” |

Si no pones prefijo, la app elige una forma según el contenido: precios → `#precio`, descuentos → `#oferta`, WhatsApp → `#contacto`, direcciones → `#ubicacion`, días y horas → `#horario`, servicios → `#servicio`, números → `#numero`, “vs” → `#comparar`, listas con comas → `#pasos`, y así.

### Ejemplo listo para probar

Pulsa **Usar ejemplo** dentro de la app:

```
#personaje ¡Muy buenas! Soy don Ramón
#servicio Reparamos celulares | Tablets | Computadoras
#check Diagnóstico gratis en el acto
#precio Desde $25 con garantía
#oferta 20% de descuento esta semana
#horario De lunes a sábado, de 9 a 19
#ubicacion Av. Central 123, frente al parque
#contacto WhatsApp 555 123 4567
#cta ¡Escríbenos y te atendemos hoy!
```

### Personajes

En **Formato y estilo → Personaje** eliges quién acompaña el video. Cada uno tiene **su propio tono de voz**:

| Personaje | Estilo | Voz |
|---|---|---|
| **Señor** (predeterminado) | Señor con traje, canas, bigote y gafas; abre y cierra la boca al hablar | Grave y cálida |
| **Perrito** | Perro de orejas caídas y lengua fuera | Ronca |
| **Gatito** | Gato naranja con bigotes y cola | Aguda y juguetona |
| **Conejito** | Conejo blanco de orejas largas y dientes | Muy aguda |
| **Zorrito** | Zorro naranja con cola de punta blanca | Pícara |
| **Ranita** | Rana verde de ojos saltones | Muy grave |
| **Lorito** | Loro verde con cresta y pico curvo | Aguda y rápida |
| **Búho** | Búho redondo | Media |
| **Robot** | Robot azul con pantalla y antena | Neutra |
| **Plantita** | Flor con maceta y hojas | Suave |
| **Nubecita** | Nube esponjosa con bracitos | Suave y aguda |
| **Sin personaje** | Solo las formas y el texto | — |

El personaje aparece como **mascota pequeña** en la esquina inferior derecha de cada escena. Reacciona a lo que se dibuja: levanta la mano al señalar, celebra en `#check` y se asombra con `#idea`. También parpadea y se mueve suavemente.

Con `#personaje` sale **grande y centrado**, saluda y dice tu texto en un **globo de diálogo**:

```
#personaje ¡Hola! Soy don Ramón, tu técnico de confianza
...tus escenas...
#personaje ¡Te esperamos! Pregunta por WhatsApp
```

> El globo muestra hasta 4 líneas; si el texto es muy largo, la app reduce la letra y recorta el resto. Para que se lea bien, usa frases cortas (menos de 90 caracteres).

### Escenas con varios elementos

- **Pasos:** separa con `|`, `;` o `·`:
  `#pasos Diagnóstico | Reparación | Garantía`
- **Comparación:** usa `vs`, `versus`, `frente a` o `contra`:
  `#comparar Reparar vs Comprar`
- **Número:** la app toma la primera cifra del texto:
  `#numero 20% de descuento`
- **Servicios:** separa con `|`:
  `#servicio Celulares | Tablets | Computadoras`

---

### Paletas

| Paleta | Estilo |
|---|---|
| **Pizarra azul** | Fondo azul profundo con acentos celestes |
| **Pizarra verde** | Verde pizarra con detalles cálidos |
| **Papel y tinta** | Claro, tipo cuaderno |
| **Neón** | Violeta y cian brillantes |
| **Frutiger Aero** | Cielo y agua brillantes, colina verde, cristal y burbujas |

Frutiger Aero es la paleta pensada para anuncios: fondo luminoso y texto con sombra para que se lea sobre el agua.

---

## 3. Audio

- **Voz clásica de locutor (incluida):** lee el guion con una voz masculina de estilo Loquendo, **sin internet y sin límite**. Es la opción predeterminada.
- **Voz clásica latina:** igual, con acento latino.
- **Voz natural:** voz de Google (necesita internet al generar). Se descarga una vez por frase y queda guardada.
- **Música de fondo:** MP3/M4A/OGG en bucle. Baja automáticamente cuando hay voz.
- **Narración grabada:** un audio ya grabado, una sola vez desde el inicio.
- **Mi voz con el micrófono:** narra en vivo durante la animación. El navegador pide permiso.
- **Volumen de la música:** se mezcla aparte de la voz.

### Cómo funciona la voz clásica

1. La app lleva dentro un motor de voz libre (**meSpeak/eSpeak**) con las voces `es` y `es-la`; no hay que instalar ni descargar nada.
2. Al pulsar **Generar video**, divide el guion en frases y sintetiza cada una en el dispositivo.
3. El audio pasa por una cadena de locutor (cuerpo en los graves, menos dureza, compresión y volumen parejo) para que suene más natural que el robot clásico.
4. Cada escena dura lo que dura su voz más un margen; el personaje mueve la boca mientras habla.
5. En la primera generación tarda un segundo en cargar el motor; después es inmediato.

Puedes escuchar una muestra con **Escuchar prueba de voz**, que usa el tono del personaje elegido.

El video siempre incluye una pista de audio (aunque esté en silencio) para que las redes sociales lo acepten.

---

## 4. Consejos para grabar

- Usa **calidad 720p** en celulares modestos; 1080p tarda más y puede bajar los FPS.
- Graba en **silencio** y con el celular estable.
- Mantén la app en primer plano y la pantalla encendida (la app pide *wake lock* mientras graba).
- El video se genera en tiempo real: no cierres la app ni bloquees el teléfono durante la grabación.
- TikTok e Instagram aceptan MP4 directamente. Si tu navegador grabó en WebM, usa **Compartir** desde la app o conviértelo después.

---

## 5. Privacidad

Todo ocurre en tu dispositivo. La voz clásica se genera localmente, así que **no se envía el guion a ningún servidor**.

- El guion se guarda solo en `localStorage` de tu navegador.
- La música, la narración, la voz y el micrófono se procesan con Web Audio en memoria.
- El video se graba con `MediaRecorder` y no sale del teléfono.
- Solo si eliges **voz natural** el texto de cada frase viaja a Google Translate TTS. Con **voz clásica**, **sin voz**, **micrófono** o **narración importada** no se envía nada.
- No hay servidor propio, cuentas, analíticas ni límite de videos.

---

## 6. Estructura del proyecto

```
reels-movil/
├── index.html                 Interfaz
├── css/estilos.css            Estilos móviles y de escritorio
├── js/dibujos.js              Paletas, formas y personajes animados (Canvas 2D)
├── js/motor.js                Guion → escenas, textos y cuadros
├── js/voz.js                  Voz clásica (meSpeak), pulido y voz natural
├── js/grabador.js             MediaRecorder + mezcla de audio
├── js/app.js                  Interfaz, vista previa, PWA
├── js/mespeak/                Motor de voz libre y voces es / es-la
├── sw.js                      Service worker (modo offline)
├── manifest.webmanifest       Manifest de instalación
├── iconos/                    Iconos 192/512/maskable/apple
├── herramientas/
│   ├── hacer_iconos.py        Regenera los iconos (Pillow)
│   └── empaquetar.py          Genera reel-aero.html
└── LEEME.md
```

---

## 7. Personalizar

- **Paletas:** `js/dibujos.js` → objeto `PALETAS`.
- **Personajes:** `js/dibujos.js` → `PERSONAJES` (nombre y voz), `COLORES_PERSONAJE` (colores) y una función `dibujar…` por personaje, que recibe `(ctx, colores, pose, tiempo)`.
- **Tono de voz:** en `PERSONAJES`, cada entrada tiene `voz: { pitch, speed }`. `pitch` va de 20 a 80 y `speed` de 135 a 190.
- **Pulido de la voz:** `js/voz.js` → `pulirVoz()`, con los filtros y el compresor.
- **Formas:** cada función `dibujar…` de `js/dibujos.js` recibe `(ctx, R, progreso, colores, escena, tiempo)`.
- **Duración por escena:** `js/motor.js` → `1.15 + palabras / (2.5 * velocidad)`, con límites `2.4`–`9.5` segundos.
- **Estilos:** `css/estilos.css` usa variables CSS al inicio del archivo.

Después de cambiar archivos, sube la versión del caché en `sw.js` (`reels-aero-v15` → `v16`) y haz `git push` para que los dispositivos instalados reciban los cambios.

---

## 8. Compatibilidad

| Navegador | Grabar | Micrófono | Voz clásica | Instalar |
|---|---|---|---|---|
| Chrome Android (actual) | MP4 | Sí | Sí | Sí |
| Safari iPhone 16+ | MP4 | Sí | Sí | Sí |
| Chrome/Edge escritorio | MP4 | Sí | Sí | Sí |
| Firefox | WebM | Sí | Sí | Limitado |

Si un navegador no soporta `MediaRecorder` o `canvas.captureStream`, la app avisa en la parte inferior del editor.

---

Hecho para anuncios cortos: un negocio, una idea, un video que habla.
