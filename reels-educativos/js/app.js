/* App: conecta la interfaz con el motor y el grabador. */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var CLAVE = 'reels-educativos-v1';

  var el = {
    marco: $('marco'),
    lienzo: $('lienzo'),
    guion: $('guion'),
    contador: $('contador'),
    chips: $('chips-visuales'),
    tematicas: $('tematicas'),
    formato: $('formato'),
    calidad: $('calidad'),
    paleta: $('paleta'),
    personaje: $('personaje'),
    ritmo: $('ritmo'),
    ritmoValor: $('ritmo-valor'),
    marca: $('marca'),
    progreso: $('progreso'),
    musica: $('musica'),
    narracion: $('narracion'),
    volumen: $('volumen'),
    volumenValor: $('volumen-valor'),
    voz: $('voz'),
    btnProbarVoz: $('btn-probar-voz'),
    notaVoz: $('nota-voz'),
    btnPlay: $('btn-play'),
    btnEjemplo: $('btn-ejemplo'),
    btnGenerar: $('btn-generar'),
    btnCancelar: $('btn-cancelar'),
    btnAyuda: $('btn-ayuda'),
    btnInstalar: $('btn-instalar'),
    capaGrabacion: $('capa-grabacion'),
    cuenta: $('cuenta'),
    estadoGrabacion: $('estado-grabacion'),
    barraGrabacion: $('barra-grabacion-relleno'),
    tiempo: $('tiempo'),
    etiquetaMime: $('etiqueta-mime'),
    hojaResultado: $('hoja-resultado'),
    videoResultado: $('video-resultado'),
    infoResultado: $('info-resultado'),
    notaResultado: $('nota-resultado'),
    btnCompartir: $('btn-compartir'),
    btnDescargar: $('btn-descargar'),
    btnCerrarResultado: $('btn-cerrar-resultado'),
    btnOtro: $('btn-otro'),
    hojaAyuda: $('hoja-ayuda'),
    btnCerrarAyuda: $('btn-cerrar-ayuda'),
    btnCerrarAyuda2: $('btn-cerrar-ayuda-2'),
    listaVisuales: $('lista-visuales'),
    fondoHoja: $('fondo-hoja'),
    aviso: $('aviso'),
    notaSoporte: $('nota-soporte')
  };

  var ctx = el.lienzo.getContext('2d');

  var estado = {
    guion: '',
    formato: '9:16',
    calidad: '720',
    paleta: 'pizarra',
    personaje: 'buho',
    ritmo: 1,
    marca: '',
    progreso: true,
    volumen: 0.35,
    voz: 'ninguna',
    tematica: 'educativo'
  };

  var archivos = { musica: null, narracion: null };
  var videoEstado = null;
  var tPreview = 0;
  var reproduciendo = true;
  var grabando = false;
  var sucio = true;
  var resultado = null;
  var resultadoUrl = null;
  var senal = null;
  var ultimoFrame = performance.now();
  var promptInstalar = null;
  var avisoTimer = null;

  var EJEMPLO = [
    '#personaje ¡Hola! Hoy veremos la fotosíntesis',
    '#idea La fotosíntesis',
    '#flecha Las plantas usan luz, agua y CO2',
    '#pasos Absorben agua | Capturan la luz | Liberan oxígeno',
    '#grafico Así crece su energía',
    '#numero 6 CO2 + 6 H2O',
    '#formula 6CO2 + 6H2O = C6H12O6 + 6O2',
    '#check Por eso limpian el aire',
    '#personaje ¡Tú puedes! Cuida las plantas'
  ].join('\n');

  var TEMATICAS = [
    {
      id: 'educativo',
      nombre: 'Educativo',
      paleta: 'pizarra',
      personaje: 'buho',
      ritmo: 1,
      voz: 'ninguna',
      guion: EJEMPLO
    },
    {
      id: 'anuncio',
      nombre: 'Anuncio',
      paleta: 'aero',
      personaje: 'nube',
      ritmo: 1,
      voz: 'natural',
      guion: [
        '#personaje ¡Tu negocio merece brillar!',
        '#servicio Diseño | Instalación | Mantenimiento',
        '#oferta 20% de descuento esta semana',
        '#precio Desde $49',
        '#horario De lunes a sábado, de 9 a 19',
        '#contacto WhatsApp 555 123 4567',
        '#ubicacion Av. Central 123, frente al parque',
        '#cta ¡Escríbenos y reserva hoy!'
      ].join('\n')
    },
    {
      id: 'omnibus',
      nombre: 'Agencia de buses',
      paleta: 'aero',
      personaje: 'buho',
      ritmo: 1.05,
      voz: 'natural',
      guion: [
        '#personaje ¡Viaja cómodo y seguro!',
        '#servicio Salidas diarias | Asientos reclinables | Wi-Fi a bordo',
        '#horario Salidas cada hora, de 6 a 22',
        '#precio Pasaje desde $8',
        '#oferta 2x1 los martes',
        '#ubicacion Terminal Central, Av. Libertad 450',
        '#contacto Reservas al WhatsApp 555 987 654',
        '#cta ¡Compra tu boleto hoy!'
      ].join('\n')
    },
    {
      id: 'tienda',
      nombre: 'Tienda de decoración',
      paleta: 'aero',
      personaje: 'planta',
      ritmo: 0.95,
      voz: 'natural',
      guion: [
        '#personaje ¡Dale vida a tu hogar!',
        '#servicio Lámparas | Cojines | Cuadros | Plantas',
        '#precio Desde $12',
        '#oferta 25% en toda la tienda',
        '#horario Abierto de 10 a 20, todos los días',
        '#ubicacion Calle Flores 78, local 3',
        '#contacto WhatsApp 555 222 3333',
        '#cta ¡Ven a decorar con nosotros!'
      ].join('\n')
    },
    {
      id: 'oferta',
      nombre: 'Oferta relámpago',
      paleta: 'neon',
      personaje: 'gato',
      ritmo: 1.1,
      voz: 'natural',
      guion: [
        '#personaje ¡Solo por hoy!',
        '#oferta 50% de descuento',
        '#precio Todo desde $5',
        '#servicio Envío gratis | Pago seguro | Cambios sin costo',
        '#horario Hasta las 10 de la noche',
        '#cta Pide ya por WhatsApp'
      ].join('\n')
    },
    {
      id: 'evento',
      nombre: 'Evento',
      paleta: 'papel',
      personaje: 'gato',
      ritmo: 1,
      voz: 'natural',
      guion: [
        '#personaje ¡Te esperamos!',
        '#idea Feria de emprendedores',
        '#horario Sábado 15, de 10 a 18',
        '#ubicacion Plaza Mayor, entrada libre',
        '#servicio Comida | Música | Artesanías',
        '#cta ¡Invita a tus amigos!'
      ].join('\n')
    }
  ];

  /* ---------- utilidades ---------- */

  function avisar(txt, ms) {
    clearTimeout(avisoTimer);
    el.aviso.textContent = txt;
    el.aviso.hidden = false;
    avisoTimer = setTimeout(function () { el.aviso.hidden = true; }, ms || 3400);
  }

  function guardar() {
    try {
      localStorage.setItem(CLAVE, JSON.stringify({
        guion: estado.guion,
        formato: estado.formato,
        calidad: estado.calidad,
        paleta: estado.paleta,
        personaje: estado.personaje,
        ritmo: estado.ritmo,
        marca: estado.marca,
        progreso: estado.progreso,
        volumen: estado.volumen,
        voz: estado.voz,
        tematica: estado.tematica
      }));
    } catch (e) { /* almacenamiento no disponible */ }
  }

  function recuperar() {
    try {
      var crudo = localStorage.getItem(CLAVE);
      if (!crudo) return;
      var datos = JSON.parse(crudo);
      if (!datos || typeof datos !== 'object') return;
      ['guion', 'formato', 'calidad', 'paleta', 'personaje', 'marca'].forEach(function (k) {
        if (typeof datos[k] === 'string') estado[k] = datos[k];
      });
      var personajes = (window.Dibujos && window.Dibujos.PERSONAJES) || [];
      if (!personajes.some(function (p) { return p.id === estado.personaje; })) {
        estado.personaje = 'buho';
      }
      if (Number(datos.ritmo)) estado.ritmo = Number(datos.ritmo);
      if (Number(datos.volumen) >= 0) estado.volumen = Number(datos.volumen);
      if (typeof datos.progreso === 'boolean') estado.progreso = datos.progreso;
      var vocesValidas = ['ninguna', 'natural', 'natural-mx', 'mic'];
      if (typeof datos.voz === 'string' && vocesValidas.indexOf(datos.voz) >= 0) {
        estado.voz = datos.voz;
      } else if (datos.microfono === true) {
        estado.voz = 'mic';
      }
      if (typeof datos.tematica === 'string' && TEMATICAS.some(function (t) { return t.id === datos.tematica; })) {
        estado.tematica = datos.tematica;
      }
    } catch (e) { /* ignorar */ }
  }

  function tamanoPeso(bytes) {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  /* ---------- estado visual ---------- */

  function aplicarControles() {
    el.guion.value = estado.guion;
    el.formato.value = estado.formato;
    el.calidad.value = estado.calidad;
    el.paleta.value = estado.paleta;
    if (el.personaje) el.personaje.value = estado.personaje;
    el.ritmo.value = estado.ritmo;
    el.ritmoValor.textContent = Number(estado.ritmo).toFixed(2).replace(/0$/, '') + '×';
    el.marca.value = estado.marca;
    el.progreso.checked = estado.progreso;
    el.volumen.value = estado.volumen;
    el.volumenValor.textContent = Math.round(estado.volumen * 100) + '%';
    if (el.voz) el.voz.value = estado.voz;
    actualizarVozUI();
  }

  function opciones() {
    return {
      formato: estado.formato,
      calidad: Number(estado.calidad),
      paleta: estado.paleta,
      personaje: estado.personaje,
      ritmo: Number(estado.ritmo),
      marca: estado.marca,
      progreso: estado.progreso
    };
  }

  function redimensionar() {
    var dim = Motor.dimensiones(estado.formato, estado.calidad);
    if (el.lienzo.width !== dim.W || el.lienzo.height !== dim.H) {
      el.lienzo.width = dim.W;
      el.lienzo.height = dim.H;
    }
    el.marco.style.aspectRatio = dim.W + ' / ' + dim.H;
    el.marco.style.setProperty('--ratio', String(dim.W / dim.H));
    el.marco.style.background = (Dibujos.PALETAS[estado.paleta] || Dibujos.PALETAS.pizarra).fondo;
    sucio = true;
  }

  function reanalizar() {
    videoEstado = Motor.crearEstado(estado.guion, opciones());
    var n = videoEstado.escenas.length;
    el.contador.textContent = n + (n === 1 ? ' escena · ' : ' escenas · ') + Motor.formatearTiempo(videoEstado.duracion);
    if (tPreview > videoEstado.duracion) tPreview = 0;
    actualizarTiempo(tPreview);
    sucio = true;
  }

  function actualizarTiempo(t) {
    var dur = videoEstado ? videoEstado.duracion : 0;
    var txt = Motor.formatearTiempo(t) + ' / ' + Motor.formatearTiempo(dur);
    if (txt !== el.tiempo.textContent) el.tiempo.textContent = txt;
  }

  function dibujar(t) {
    if (!videoEstado) return;
    var W = el.lienzo.width;
    var H = el.lienzo.height;
    Motor.renderCuadro(ctx, W, H, videoEstado, t, estado.paleta);
    actualizarTiempo(t);
  }

  function bucle(ahora) {
    var dt = (ahora - ultimoFrame) / 1000;
    if (dt > 0.25) dt = 0.25;
    ultimoFrame = ahora;

    if (!grabando && videoEstado) {
      if (reproduciendo && videoEstado.escenas.length) {
        tPreview += dt;
        if (tPreview >= videoEstado.duracion) tPreview = 0;
        dibujar(tPreview);
      } else if (sucio) {
        dibujar(Math.min(tPreview, videoEstado.duracion));
        sucio = false;
      }
    }
    requestAnimationFrame(bucle);
  }

  function actualizarBotonPlay() {
    el.btnPlay.classList.toggle('reproduciendo', reproduciendo);
    el.btnPlay.setAttribute('aria-label', reproduciendo ? 'Pausar' : 'Reproducir');
  }

  /* ---------- guion ---------- */

  function entradaGuion() {
    estado.guion = el.guion.value;
    guardar();
    reanalizar();
    var coincide = null;
    TEMATICAS.forEach(function (t) {
      if (t.guion.trim() === estado.guion.trim()) coincide = t.id;
    });
    marcarTematica(coincide);
  }

  function insertarPrefijo(prefijo) {
    var ta = el.guion;
    var valor = ta.value;
    var inicioSel = ta.selectionStart == null ? valor.length : ta.selectionStart;
    var inicioLinea = valor.lastIndexOf('\n', Math.max(0, inicioSel - 1)) + 1;
    var finLinea = valor.indexOf('\n', inicioSel);
    if (finLinea < 0) finLinea = valor.length;
    var linea = valor.slice(inicioLinea, finLinea);
    var limpia = linea.replace(/^#[a-záéíóúüñ]+\s*/i, '').trim();
    var nueva = prefijo + (limpia ? ' ' + limpia : '');
    ta.value = valor.slice(0, inicioLinea) + nueva + valor.slice(finLinea);
    var pos = inicioLinea + nueva.length;
    ta.focus();
    try { ta.setSelectionRange(pos, pos); } catch (e) { /* ignorar */ }
    entradaGuion();
  }

  function idiomaVoz() {
    return estado.voz === 'natural-mx' ? 'es-mx' : 'es';
  }

  function actualizarVozUI() {
    if (!el.voz) return;
    var natural = estado.voz === 'natural' || estado.voz === 'natural-mx';
    if (el.btnProbarVoz) el.btnProbarVoz.hidden = !natural;
    if (!el.notaVoz) return;
    if (natural) {
      el.notaVoz.textContent = 'Voz de Google, gratis. Se descarga una vez por frase y queda guardada en tu teléfono. Necesita internet al generar.';
    } else if (estado.voz === 'mic') {
      el.notaVoz.textContent = 'Narra mientras corre la animación. El navegador pedirá permiso para el micrófono al generar.';
    } else {
      el.notaVoz.textContent = 'Sin voz. Puedes añadir música de fondo o una narración grabada.';
    }
  }

  function marcarTematica(id) {
    if (!el.tematicas) return;
    Array.prototype.forEach.call(el.tematicas.children, function (b) {
      b.classList.toggle('activo', b.getAttribute('data-id') === id);
    });
    if (id) estado.tematica = id;
  }

  function aplicarTematica(t) {
    if (estado.guion.trim() && estado.guion.trim() !== t.guion.trim()) {
      if (!window.confirm('¿Reemplazar el guion actual por la temática «' + t.nombre + '»?')) return;
    }
    estado.guion = t.guion;
    estado.paleta = t.paleta;
    estado.personaje = t.personaje;
    estado.ritmo = t.ritmo;
    estado.voz = t.voz;
    estado.tematica = t.id;
    guardar();
    aplicarControles();
    redimensionar();
    reanalizar();
    marcarTematica(t.id);
    el.guion.scrollTop = 0;
    avisar('Temática «' + t.nombre + '» lista. Pulsa Generar video.');
  }

  function crearTematicas() {
    if (!el.tematicas) return;
    TEMATICAS.forEach(function (t) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip tematica';
      b.setAttribute('data-id', t.id);
      b.textContent = t.nombre;
      b.addEventListener('click', function () { aplicarTematica(t); });
      el.tematicas.appendChild(b);
    });
    marcarTematica(estado.tematica);
  }

  function probarVoz() {
    if (!window.Voz) {
      avisar('La voz natural no está disponible en este navegador.');
      return;
    }
    var texto = (videoEstado && videoEstado.escenas[0] && videoEstado.escenas[0].texto) ||
      'Hola, esta es una prueba de voz natural para tus videos.';
    el.btnProbarVoz.disabled = true;
    var original = el.btnProbarVoz.textContent;
    el.btnProbarVoz.textContent = 'Descargando voz…';

    Voz.probar(texto, { idioma: idiomaVoz() }).then(function (blob) {
      var url = URL.createObjectURL(blob);
      var audio = new Audio(url);
      audio.onended = function () {
        try { URL.revokeObjectURL(url); } catch (e) { /* ignorar */ }
      };
      audio.onerror = function () {
        try { URL.revokeObjectURL(url); } catch (e) { /* ignorar */ }
      };
      return audio.play();
    }).catch(function (e) {
      console.warn('Prueba de voz:', e);
      avisar('No se pudo descargar la voz. Revisa tu conexión e inténtalo otra vez.', 6200);
    }).then(function () {
      el.btnProbarVoz.disabled = false;
      el.btnProbarVoz.textContent = original;
    });
  }

  function crearOpcionesPersonaje() {
    if (!el.personaje || el.personaje.options.length) return;
    (Dibujos.PERSONAJES || []).forEach(function (p) {
      var o = document.createElement('option');
      o.value = p.id;
      o.textContent = p.nombre;
      el.personaje.appendChild(o);
    });
  }

  function crearChips() {
    Motor.VISUALES.forEach(function (v) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.title = v.ayuda;
      b.innerHTML = '<span class="chip-prefijo">' + v.prefijo + '</span>' + v.etiqueta;
      b.addEventListener('click', function () { insertarPrefijo(v.prefijo); });
      el.chips.appendChild(b);
    });
  }

  function crearAyuda() {
    Motor.VISUALES.forEach(function (v) {
      var li = document.createElement('li');
      li.innerHTML = '<code>' + v.prefijo + '</code>' + v.ayuda;
      el.listaVisuales.appendChild(li);
    });
  }

  /* ---------- hojas ---------- */

  function abrirHoja(hoja) {
    el.hojaResultado.hidden = true;
    el.hojaAyuda.hidden = true;
    el.fondoHoja.hidden = false;
    hoja.hidden = false;
    if (hoja === el.hojaResultado) {
      el.videoResultado.play().catch(function () { /* requiere toque */ });
    }
  }

  function cerrarHojas() {
    el.hojaResultado.hidden = true;
    el.hojaAyuda.hidden = true;
    el.fondoHoja.hidden = true;
    try { el.videoResultado.pause(); } catch (e) { /* ignorar */ }
    if (resultadoUrl) {
      try { URL.revokeObjectURL(resultadoUrl); } catch (e) { /* ignorar */ }
      resultadoUrl = null;
    }
    resultado = null;
    try {
      el.videoResultado.removeAttribute('src');
      el.videoResultado.load();
    } catch (e) { /* ignorar */ }
  }

  function mostrarResultado(res) {
    resultado = res;
    if (resultadoUrl) { try { URL.revokeObjectURL(resultadoUrl); } catch (e) { /* ignorar */ } }
    resultadoUrl = URL.createObjectURL(res.blob);
    el.videoResultado.src = resultadoUrl;
    var W = el.lienzo.width;
    var H = el.lienzo.height;
    el.infoResultado.textContent = W + '×' + H + ' · ' + Motor.formatearTiempo(res.duracion) + ' · ' + tamanoPeso(res.bytes) + ' · ' + res.extension.toUpperCase();
    el.notaResultado.textContent = res.extension === 'mp4'
      ? 'Formato MP4 listo para TikTok, Instagram, YouTube o WhatsApp.'
      : 'Tu navegador grabó en WebM. TikTok, Instagram y Chrome suelen aceptarlo; si una app no lo abre, compártelo desde aquí.';
    abrirHoja(el.hojaResultado);
  }

  function nombreVideo() {
    return Motor.nombreArchivo(estado.guion) + '.' + (resultado ? resultado.extension : 'mp4');
  }

  async function compartir() {
    if (!resultado) return;
    var file;
    try {
      file = new File([resultado.blob], nombreVideo(), { type: resultado.blob.type });
    } catch (e) {
      avisar('No se pudo preparar el archivo para compartir. Usa Descargar.');
      return;
    }
    var puede = false;
    try {
      puede = !!(navigator.canShare && navigator.share && navigator.canShare({ files: [file] }));
    } catch (e) { puede = false; }
    if (puede) {
      try {
        await navigator.share({ files: [file], title: 'Mi reel educativo' });
        return;
      } catch (e) {
        if (e && e.name === 'AbortError') return;
      }
    }
    avisar('Este navegador no comparte archivos. Usa el botón Descargar.');
  }

  function descargar() {
    if (!resultado) return;
    var a = document.createElement('a');
    var url = URL.createObjectURL(resultado.blob);
    a.href = url;
    a.download = nombreVideo();
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(url);
      a.remove();
    }, 4000);
    avisar('Guardando el video en tu dispositivo…');
  }

  /* ---------- grabar ---------- */

  function alCuenta(n) {
    if (n > 0) {
      el.cuenta.hidden = false;
      el.cuenta.textContent = String(n);
      el.cuenta.classList.remove('pulso');
      void el.cuenta.offsetWidth;
      el.cuenta.classList.add('pulso');
      el.estadoGrabacion.textContent = 'Prepárate para narrar';
      el.capaGrabacion.classList.remove('grabando');
    } else {
      el.cuenta.textContent = '';
      el.cuenta.hidden = true;
      el.estadoGrabacion.textContent = '● Grabando…';
      el.capaGrabacion.classList.add('grabando');
      el.btnCancelar.hidden = false;
    }
  }

  async function generar() {
    if (grabando) return;
    reanalizar();

    if (!videoEstado.escenas.length) {
      avisar('Escribe al menos una línea de guion.');
      el.guion.focus();
      return;
    }

    var soporte = Grabador.soporte();
    if (!soporte.ok) {
      avisar('Tu navegador no puede grabar video. Prueba con Chrome actualizado.');
      return;
    }

    grabando = true;
    senal = { cancelado: false };
    reproduciendo = false;
    actualizarBotonPlay();

    el.capaGrabacion.hidden = false;
    el.capaGrabacion.classList.remove('grabando');
    el.cuenta.hidden = true;
    el.cuenta.textContent = '';
    el.cuenta.classList.remove('pulso');
    el.estadoGrabacion.textContent = 'Preparando audio…';
    el.btnCancelar.hidden = false;
    el.barraGrabacion.style.width = '0%';
    el.btnGenerar.disabled = true;
    el.btnPlay.hidden = true;

    try {
      var vozNatural = estado.voz === 'natural' || estado.voz === 'natural-mx';
      var vozData = null;

      if (vozNatural) {
        if (!window.Voz) {
          avisar('La voz natural no está disponible; el video se grabará sin voz.', 6000);
        } else {
          el.estadoGrabacion.textContent = 'Descargando la voz natural…';
          try {
            vozData = await Voz.paraEscenas(videoEstado.escenas, {
              idioma: idiomaVoz(),
              velocidad: estado.ritmo,
              senal: senal,
              limiteMs: 40000,
              alEstado: function (txt) { el.estadoGrabacion.textContent = txt; },
              alProgreso: function (f) { el.barraGrabacion.style.width = (f * 100).toFixed(1) + '%'; }
            });
            videoEstado = Motor.crearEstado(estado.guion, Object.assign({}, opciones(), {
              duraciones: vozData.duraciones
            }));
            tPreview = 0;
            dibujar(0);
            el.barraGrabacion.style.width = '0%';
          } catch (e) {
            if (senal.cancelado) throw e;
            console.warn('Voz natural:', e);
            vozData = null;
            avisar('La voz natural no se pudo descargar a tiempo. El video se grabará sin voz; puedes intentarlo otra vez.', 6500);
          }
        }
      }

      var voces = null;
      if (vozData && vozData.voces) {
        voces = vozData.voces.map(function (v, i) {
          return {
            trozos: v.trozos,
            tasa: v.tasa,
            inicio: videoEstado.escenas[i] ? videoEstado.escenas[i].inicio : 0
          };
        });
      }

      var res = await Grabador.grabar(el.lienzo, {
        duracion: videoEstado.duracion,
        calidad: videoEstado.opciones.calidad,
        musica: archivos.musica,
        narracion: archivos.narracion,
        microfono: estado.voz === 'mic',
        voces: voces,
        volumen: estado.volumen,
        senal: senal,
        alCuenta: alCuenta,
        alAviso: function (txt) { avisar(txt, 5200); },
        alEstado: function (txt) { el.estadoGrabacion.textContent = txt; },
        alFrame: function (t) {
          tPreview = t;
          dibujar(t);
        },
        alProgreso: function (f) {
          el.barraGrabacion.style.width = (f * 100).toFixed(1) + '%';
        }
      });
      mostrarResultado(res);
    } catch (e) {
      if (e && e.cancelado) {
        avisar('Grabación cancelada.');
      } else {
        console.error(e);
        avisar((e && e.message) || 'No se pudo generar el video.');
      }
    } finally {
      grabando = false;
      senal = null;
      el.capaGrabacion.hidden = true;
      el.capaGrabacion.classList.remove('grabando');
      el.cuenta.hidden = false;
      el.cuenta.textContent = '';
      el.estadoGrabacion.textContent = '';
      el.btnCancelar.hidden = true;
      el.btnGenerar.disabled = false;
      el.btnPlay.hidden = false;
      tPreview = 0;
      reproduciendo = true;
      actualizarBotonPlay();
      sucio = true;
    }
  }

  /* ---------- soporte y PWA ---------- */

  function revisarSoporte() {
    var s = Grabador.soporte();
    el.etiquetaMime.textContent = s.etiqueta;
    var partes = [];
    if (!s.ok) {
      partes.push('Este navegador no puede grabar video. Abre la app en Chrome (Android) o Safari (iPhone) actualizado.');
    } else {
      partes.push('Se grabará en ' + s.etiqueta + ' directamente en tu teléfono.');
    }
    if (!window.isSecureContext && location.protocol !== 'file:') {
      partes.push('Para micrófono e instalación, abre la app con https:// o en localhost.');
    }
    if (location.protocol === 'file:') {
      partes.push('Modo archivo local: el micrófono puede funcionar, pero la instalación como app requiere https://.');
    }
    if (window.Voz) {
      partes.push('La voz natural usa internet solo al generar y queda guardada para la próxima vez.');
    }
    el.notaSoporte.textContent = partes.join(' ');
  }

  function iniciarPWA() {
    if ('serviceWorker' in navigator && !window.__REEL_UNICO__ && /^https?:$/.test(location.protocol)) {
      navigator.serviceWorker.register('sw.js').catch(function (e) {
        console.warn('Service worker no registrado:', e);
      });
    }

    var autonomo = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
    if (autonomo) {
      el.btnInstalar.hidden = true;
      return;
    }

    var esIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (esIOS) el.btnInstalar.hidden = false;

    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      promptInstalar = e;
      el.btnInstalar.hidden = false;
    });

    el.btnInstalar.addEventListener('click', async function () {
      if (!promptInstalar) {
        avisar('En iPhone: toca Compartir y luego "Añadir a pantalla de inicio".');
        return;
      }
      promptInstalar.prompt();
      try { await promptInstalar.userChoice; } catch (e) { /* ignorar */ }
      promptInstalar = null;
      el.btnInstalar.hidden = true;
    });

    window.addEventListener('appinstalled', function () {
      el.btnInstalar.hidden = true;
      avisar('¡App instalada! Ya puedes usarla sin internet.');
    });
  }

  /* ---------- eventos ---------- */

  function conectarEventos() {
    el.guion.addEventListener('input', entradaGuion);

    el.formato.addEventListener('change', function () {
      estado.formato = el.formato.value;
      guardar();
      redimensionar();
      reanalizar();
    });

    el.calidad.addEventListener('change', function () {
      estado.calidad = el.calidad.value;
      guardar();
      redimensionar();
      reanalizar();
    });

    el.paleta.addEventListener('change', function () {
      estado.paleta = el.paleta.value;
      guardar();
      redimensionar();
      sucio = true;
    });

    if (el.personaje) {
      el.personaje.addEventListener('change', function () {
        estado.personaje = el.personaje.value;
        guardar();
        reanalizar();
      });
    }

    el.ritmo.addEventListener('input', function () {
      estado.ritmo = Number(el.ritmo.value) || 1;
      el.ritmoValor.textContent = estado.ritmo.toFixed(2).replace(/0$/, '') + '×';
      guardar();
      reanalizar();
    });

    el.marca.addEventListener('input', function () {
      estado.marca = el.marca.value;
      guardar();
      sucio = true;
    });

    el.progreso.addEventListener('change', function () {
      estado.progreso = el.progreso.checked;
      guardar();
      sucio = true;
    });

    el.volumen.addEventListener('input', function () {
      estado.volumen = Number(el.volumen.value);
      el.volumenValor.textContent = Math.round(estado.volumen * 100) + '%';
      guardar();
    });

    if (el.voz) {
      el.voz.addEventListener('change', function () {
        estado.voz = el.voz.value;
        guardar();
        actualizarVozUI();
        if (estado.voz === 'mic') {
          avisar('El micrófono se pedirá al generar. Narra durante la animación.');
        } else if (estado.voz.indexOf('natural') === 0) {
          avisar('Voz natural activada. Se descargará al generar el video.', 4200);
        }
      });
    }

    if (el.btnProbarVoz) el.btnProbarVoz.addEventListener('click', probarVoz);

    el.musica.addEventListener('change', function () {
      archivos.musica = el.musica.files && el.musica.files[0] ? el.musica.files[0] : null;
      if (archivos.musica) avisar('Música cargada: ' + archivos.musica.name);
    });

    el.narracion.addEventListener('change', function () {
      archivos.narracion = el.narracion.files && el.narracion.files[0] ? el.narracion.files[0] : null;
      if (archivos.narracion) avisar('Narración cargada: ' + archivos.narracion.name);
    });

    el.btnPlay.addEventListener('click', function () {
      if (!videoEstado || !videoEstado.escenas.length) {
        avisar('Escribe tu guion para ver la animación.');
        return;
      }
      reproduciendo = !reproduciendo;
      actualizarBotonPlay();
      sucio = true;
    });

    el.btnEjemplo.addEventListener('click', function () {
      if (el.guion.value.trim() && el.guion.value.trim() !== EJEMPLO.trim()) {
        if (!window.confirm('¿Reemplazar el guion actual por el ejemplo?')) return;
      }
      el.guion.value = EJEMPLO;
      entradaGuion();
      avisar('Ejemplo cargado. Pulsa Generar video para grabarlo.');
    });

    el.btnGenerar.addEventListener('click', generar);

    el.btnCancelar.addEventListener('click', function () {
      if (senal) senal.cancelado = true;
      el.estadoGrabacion.textContent = 'Cancelando…';
      el.btnCancelar.hidden = true;
    });

    el.btnAyuda.addEventListener('click', function () { abrirHoja(el.hojaAyuda); });
    el.btnCerrarAyuda.addEventListener('click', cerrarHojas);
    el.btnCerrarAyuda2.addEventListener('click', cerrarHojas);
    el.btnCerrarResultado.addEventListener('click', cerrarHojas);
    el.fondoHoja.addEventListener('click', cerrarHojas);

    el.btnOtro.addEventListener('click', function () {
      cerrarHojas();
      tPreview = 0;
      reproduciendo = true;
      actualizarBotonPlay();
      sucio = true;
      el.guion.focus();
    });

    el.btnCompartir.addEventListener('click', compartir);
    el.btnDescargar.addEventListener('click', descargar);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') cerrarHojas();
    });

    document.addEventListener('visibilitychange', function () {
      ultimoFrame = performance.now();
    });

    window.addEventListener('beforeunload', function () {
      if (resultadoUrl) { try { URL.revokeObjectURL(resultadoUrl); } catch (e) { /* ignorar */ } }
    });
  }

  /* ---------- arranque ---------- */

  function iniciar() {
    crearOpcionesPersonaje();
    recuperar();
    aplicarControles();
    crearChips();
    crearTematicas();
    crearAyuda();
    redimensionar();
    try {
      var params = new URLSearchParams(location.search);
      if (params.get('crear') === '1' && !estado.guion.trim()) {
        el.guion.value = EJEMPLO;
        estado.guion = EJEMPLO;
      }
    } catch (e) { /* URLSearchParams no disponible */ }
    reanalizar();
    conectarEventos();
    revisarSoporte();
    iniciarPWA();
    actualizarBotonPlay();
    requestAnimationFrame(bucle);
    if (estado.guion.trim()) {
      setTimeout(function () { avisar('Guion recuperado. Pulsa Generar video cuando estés listo.', 2800); }, 700);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
