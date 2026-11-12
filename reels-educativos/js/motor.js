/* Motor: convierte el guion en escenas y dibuja cada cuadro del video. */
(function (global) {
  'use strict';

  var FUENTE = (global.Dibujos && global.Dibujos.FUENTE) ||
    '"Segoe UI", "Roboto", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif';

  var VISUALES = [
    { id: 'personaje', etiqueta: 'Personaje', prefijo: '#personaje', ayuda: 'Personaje grande con globo de diálogo' },
    { id: 'idea', etiqueta: 'Idea', prefijo: '#idea', ayuda: 'Bombilla que se enciende' },
    { id: 'flecha', etiqueta: 'Conexión', prefijo: '#flecha', ayuda: 'Flecha que une dos ideas' },
    { id: 'pasos', etiqueta: 'Paso a paso', prefijo: '#pasos', ayuda: 'Tres pasos en línea' },
    { id: 'ciclo', etiqueta: 'Ciclo', prefijo: '#ciclo', ayuda: 'Proceso que se repite' },
    { id: 'comparar', etiqueta: 'Comparación', prefijo: '#comparar', ayuda: 'Dos círculos que se cruzan' },
    { id: 'grafico', etiqueta: 'Datos', prefijo: '#grafico', ayuda: 'Barras que crecen' },
    { id: 'numero', etiqueta: 'Dato', prefijo: '#numero', ayuda: 'Número grande' },
    { id: 'check', etiqueta: 'Conclusión', prefijo: '#check', ayuda: 'Marca de verificación' },
    { id: 'formula', etiqueta: 'Fórmula', prefijo: '#formula', ayuda: 'Ecuación por bloques' },
    { id: 'circulo', etiqueta: 'Concepto', prefijo: '#circulo', ayuda: 'Círculos concéntricos' },
    { id: 'subrayado', etiqueta: 'Clave', prefijo: '#subrayado', ayuda: 'Texto resaltado' },
    { id: 'precio', etiqueta: 'Precio', prefijo: '#precio', ayuda: 'Cartel grande con el precio' },
    { id: 'oferta', etiqueta: 'Oferta', prefijo: '#oferta', ayuda: 'Sello brillante de descuento' },
    { id: 'servicio', etiqueta: 'Servicios', prefijo: '#servicio', ayuda: 'Lista de servicios con visto' },
    { id: 'horario', etiqueta: 'Horario', prefijo: '#horario', ayuda: 'Reloj con tu horario' },
    { id: 'contacto', etiqueta: 'Contacto', prefijo: '#contacto', ayuda: 'Teléfono con ondas' },
    { id: 'ubicacion', etiqueta: 'Ubicación', prefijo: '#ubicacion', ayuda: 'Pin de mapa animado' },
    { id: 'cta', etiqueta: 'Llamada', prefijo: '#cta', ayuda: 'Botón grande para reservar o comprar' }
  ];

  var MAPA = {};
  VISUALES.forEach(function (v) { MAPA[v.id] = v; });

  var AUTO = ['idea', 'flecha', 'circulo', 'subrayado', 'check', 'grafico'];
  var STOP = ('para por que con como los las del una uno unos unas este esta esto estos estas ' +
    'sobre entre desde hasta cuando donde porque tambien también cada todo toda todos todas ' +
    'muy mas más pero sino aunque mientras desde hace son está están era eran ser sea ' +
    'the and that with your from into').split(/\s+/);

  var TRANSICION = 0.32;
  var lienzoMedida = document.createElement('canvas');
  var ctxMedida = lienzoMedida.getContext('2d');

  var cacheLayout = new WeakMap();

  function limitar(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function redondear(v) { return Math.round(v); }

  function limpiarPalabra(t) {
    return String(t).replace(/[.,;:!?¡¿"«»()\[\]]/g, '');
  }

  function elegirClaves(texto) {
    var palabras = String(texto).split(/\s+/).map(limpiarPalabra).filter(function (p) {
      return p.length >= 5 && STOP.indexOf(p.toLowerCase()) === -1 && !/^\d+$/.test(p);
    });
    var unicas = [];
    var vistos = {};
    palabras.forEach(function (p) {
      var k = p.toLowerCase();
      if (!vistos[k]) { vistos[k] = 1; unicas.push(p); }
    });
    unicas.sort(function (a, b) { return b.length - a.length; });
    var claves = unicas.slice(0, 2).filter(function (p) { return p.length >= 7; });
    if (!claves.length && unicas.length) claves = unicas.slice(0, 1);
    return claves;
  }

  function autoVisual(texto, rotacion) {
    var t = texto.toLowerCase();

    /* Anuncios y negocios: se detectan antes que las formas educativas. */
    if (/%|\b(oferta|ofertas|descuento|rebaja|liquidaci[oó]n|promo|promoci[oó]n)\b/.test(t)) return 'oferta';
    if (/\b(2\s*[xX]\s*1|3\s*[xX]\s*2|2 por 1|3 por 2|mitad de precio)\b/.test(t)) return 'oferta';
    if (/(?:US\$|\$|€|£)\s*\d|\d[\d.,]*\s*(?:usd|eur|bs\.?|soles|pesos|mxn|ars|clp|d[oó]lares|euros)\b|\b(precio|cuesta|desde)\b/.test(t)) return 'precio';
    if (/\b(whatsapp|wsp|tel[eé]fono|celular|ll[aá]manos|escr[ií]benos|cont[aá]ctanos|contacto|instagram|facebook)\b|@[a-z0-9_.]{3,}/.test(t)) return 'contacto';
    if (/\b(av\.?|avenida|calle|local|direcci[oó]n|ubicaci[oó]n|estamos en|frente al?|esquina|a una cuadra)\b/.test(t)) return 'ubicacion';
    if (/\b(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo|horario|abierto|abrimos|atendemos|de \d{1,2} a \d{1,2})\b/.test(t)) return 'horario';
    if (/\b(reserva|reservas|compra|comprar|pide|pida|agenda|vis[ií]tanos|s[ií]guenos|inscr[ií]bete)\b/.test(t)) return 'cta';
    if (/\b(servicios?|env[ií]os?|instalaci[oó]n|reparaci[oó]n|dise[nñ]o|mantenimiento|atenci[oó]n|delivery)\b/.test(t)) return 'servicio';

    if (/^\s*[-–•]?\s*\d/.test(texto)) return 'numero';
    if (/\bvs\.?\b|\bversus\b|\bfrente a\b|\bcontra\b/.test(t)) return 'comparar';
    if (/\?$/.test(texto.trim())) return 'idea';
    if (/\b(porque|entonces|por eso|así que|asi que|por lo tanto)\b/.test(t)) return 'flecha';
    var comas = (texto.match(/,/g) || []).length;
    if (comas >= 2) return 'pasos';
    return AUTO[rotacion % AUTO.length];
  }

  function partirItems(texto) {
    var partes = String(texto).split(/\s*[|;·→]\s*|\s+\/\s+/).map(function (p) { return p.trim(); }).filter(Boolean);
    if (partes.length < 2) {
      partes = String(texto).split(/\s*,\s*/).map(function (p) { return p.trim(); }).filter(Boolean);
    }
    if (partes.length < 2) partes = [];
    return partes.slice(0, 3);
  }

  function extrasDe(texto, visual, indice) {
    var extra = {};
    if (visual === 'pasos' || visual === 'servicio') {
      extra.items = partirItems(texto);
    }
    if (visual === 'comparar') {
      var m = texto.split(/\s+(?:vs\.?|versus|frente a|contra)\s+/i);
      if (m.length < 2) m = texto.split(/\s+y\s+/i);
      extra.a = (m[0] || 'A').trim();
      extra.b = (m[1] || 'B').trim();
      if (extra.a.length > 18) extra.a = extra.a.slice(0, 18);
      if (extra.b.length > 18) extra.b = extra.b.slice(0, 18);
    }
    if (visual === 'numero') {
      var n = String(texto).match(/-?\d+(?:[.,]\d+)?/);
      extra.numero = n ? n[0] : String(indice + 1);
    }
    if (visual === 'precio') {
      var p = String(texto).match(/(?:US\$|\$|€|£)\s*\d[\d.,]*|\d[\d.,]*\s*(?:USD|EUR|Bs\.?|soles|pesos|MXN|ARS|CLP|dólares|dolares|euros)/i) ||
        String(texto).match(/\d[\d.,]*/);
      extra.precio = p ? p[0].replace(/\s+/g, ' ').trim() : '$';
    }
    if (visual === 'oferta') {
      var o = String(texto).match(/\d+\s*%|\d+\s*[xX]\s*\d+|\b2 por 1\b|\b3 por 2\b/i);
      extra.oferta = o ? o[0].replace(/\s*[xX]\s*/, '×').toUpperCase() : 'OFERTA';
    }
    if (visual === 'personaje') {
      extra.frase = String(texto).slice(0, 90);
    }
    return extra;
  }

  function parsear(texto, opciones) {
    opciones = opciones || {};
    var velocidad = Number(opciones.ritmo) || 1;
    if (velocidad < 0.5) velocidad = 0.5;
    if (velocidad > 2) velocidad = 2;

    var lineas = String(texto || '').split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean);
    var escenas = [];
    var rotacion = 0;

    lineas.forEach(function (linea) {
      var resto = linea;
      var visual = null;
      var m = resto.match(/^#([a-záéíóúüñ]+)\s*/i);
      if (m) {
        var clave = m[1].toLowerCase();
        if (MAPA[clave]) visual = clave;
        resto = resto.slice(m[0].length).trim();
      }
      if (!resto) return;

      if (!visual) { visual = autoVisual(resto, rotacion); rotacion++; }

      var palabras = resto.split(/\s+/).filter(Boolean).length;
      var dur = 1.15 + palabras / (2.5 * velocidad);
      dur = limitar(dur, 2.4, 9.5);

      /* Si la voz natural ya se descargó, manda su duración real. */
      var durVoz = opciones.duraciones && opciones.duraciones[escenas.length];
      if (durVoz != null && isFinite(durVoz) && Number(durVoz) > 0.4) {
        dur = Number(durVoz);
      }

      escenas.push({
        texto: resto,
        visual: visual,
        etiqueta: (MAPA[visual] && MAPA[visual].etiqueta) || 'Idea',
        extra: extrasDe(resto, visual, escenas.length),
        duracion: dur,
        inicio: 0,
        fin: 0
      });
    });

    var total = 0;
    escenas.forEach(function (e) {
      e.inicio = total;
      total += e.duracion;
      e.fin = total;
    });

    return { escenas: escenas, duracion: total };
  }

  function crearEstado(texto, opciones) {
    opciones = opciones || {};
    var datos = parsear(texto, opciones);
    return {
      escenas: datos.escenas,
      duracion: datos.duracion,
      opciones: {
        formato: opciones.formato || '9:16',
        calidad: Number(opciones.calidad) || 720,
        paleta: opciones.paleta || 'pizarra',
        personaje: opciones.personaje || 'buho',
        ritmo: Number(opciones.ritmo) || 1,
        marca: (opciones.marca || '').trim(),
        progreso: opciones.progreso !== false
      }
    };
  }

  function dimensiones(formato, calidad) {
    var base = Number(calidad) >= 1080 ? 1080 : 720;
    var W, H;
    if (formato === '1:1') { W = base; H = base; }
    else if (formato === '16:9') { W = redondear(base * 16 / 9); H = base; }
    else { W = base; H = redondear(base * 16 / 9); }
    return { W: W - (W % 2), H: H - (H % 2) };
  }

  function formatearTiempo(seg) {
    seg = Math.max(0, Math.round(seg || 0));
    var m = Math.floor(seg / 60);
    var s = seg % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function envolver(texto, maxAncho, tam, claves) {
    ctxMedida.font = '800 ' + tam + 'px ' + FUENTE;
    var palabras = String(texto).split(/\s+/).filter(Boolean);
    var espacio = ctxMedida.measureText(' ').width;
    var lineas = [];
    var actual = { palabras: [], ancho: 0 };

    palabras.forEach(function (palabra) {
      var ancho = ctxMedida.measureText(palabra).width;
      var suma = (actual.palabras.length ? espacio : 0) + ancho;
      if (actual.palabras.length && actual.ancho + suma > maxAncho) {
        lineas.push(actual);
        actual = { palabras: [], ancho: 0 };
        suma = ancho;
      }
      var esClave = claves.some(function (c) { return c.toLowerCase() === limpiarPalabra(palabra).toLowerCase(); });
      actual.palabras.push({ txt: palabra, ancho: ancho, clave: esClave });
      actual.ancho += suma;
    });
    if (actual.palabras.length) lineas.push(actual);

    lineas.forEach(function (l) {
      l.ancho = l.palabras.reduce(function (a, p, i) { return a + p.ancho + (i ? espacio : 0); }, 0);
    });
    return { lineas: lineas, espacio: espacio };
  }

  function layoutTexto(escena, W, H) {
    var clave = W + 'x' + H;
    var guardado = cacheLayout.get(escena);
    if (guardado && guardado.clave === clave) return guardado;

    var S = Math.min(W, H);
    var maxAncho = W * 0.85;
    var tam = S * 0.079;
    var claves = elegirClaves(escena.texto);
    var resultado = null;
    var maxLineas = H > W * 1.2 ? 4 : 3;
    var anchoLimite = maxAncho * 1.02;

    for (var i = 0; i < 14; i++) {
      resultado = envolver(escena.texto, maxAncho, tam, claves);
      var alto = resultado.lineas.length * tam * 1.17;
      var sePasa = resultado.lineas.some(function (l) { return l.ancho > anchoLimite; });
      var demasiado = resultado.lineas.length > maxLineas || alto > H * 0.30 || sePasa;
      if (!demasiado) break;
      tam *= 0.93;
      if (tam < S * 0.042) { tam = S * 0.042; break; }
    }
    if (!resultado) resultado = envolver(escena.texto, maxAncho, tam, claves);

    var datos = {
      clave: clave,
      tam: tam,
      interlineado: tam * 1.17,
      lineas: resultado.lineas,
      espacio: resultado.espacio,
      claves: claves,
      alto: resultado.lineas.length * tam * 1.17
    };
    cacheLayout.set(escena, datos);
    return datos;
  }

  function dibujarTexto(ctx, W, H, escena, p, pal, layout) {
    var totalPalabras = 0;
    layout.lineas.forEach(function (l) { totalPalabras += l.palabras.length; });
    var revelado = limitar((p - 0.12) / 0.46, 0, 1) * totalPalabras;

    var yCentro = H * 0.745;
    var inicio = yCentro - layout.alto / 2 + layout.interlineado / 2;
    var xBase = W / 2;
    var idx = 0;

    ctx.save();
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.font = '800 ' + layout.tam + 'px ' + FUENTE;
    if (pal.sombra) {
      ctx.shadowColor = pal.sombra;
      ctx.shadowBlur = layout.tam * 0.45;
      ctx.shadowOffsetY = layout.tam * 0.05;
    }

    layout.lineas.forEach(function (linea, li) {
      var x = xBase - linea.ancho / 2;
      var y = inicio + li * layout.interlineado;
      linea.palabras.forEach(function (palabra) {
        var visible = idx < revelado;
        var aparece = visible ? 1 : 0.13;
        var color = palabra.clave ? pal.acento : pal.tinta;
        ctx.globalAlpha = aparece;
        ctx.fillStyle = color;
        var dy = visible ? 0 : layout.tam * 0.12;
        ctx.fillText(palabra.txt, x, y + dy);
        if (palabra.clave && visible) {
          ctx.globalAlpha = 0.42;
          ctx.fillStyle = pal.acento2;
          var sub = layout.tam * 0.13;
          ctx.beginPath();
          if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(x, y + layout.tam * 0.40, palabra.ancho, sub, sub / 2);
          } else {
            ctx.rect(x, y + layout.tam * 0.40, palabra.ancho, sub);
          }
          ctx.fill();
        }
        x += palabra.ancho + layout.espacio;
        idx++;
      });
    });
    ctx.restore();
  }

  function dibujarKicker(ctx, W, H, escena, indice, total, pal) {
    var S = Math.min(W, H);
    var y = H * 0.108;
    var x = W * 0.085;

    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = pal.kicker || pal.acento;
    ctx.beginPath();
    ctx.arc(x + S * 0.008, y, S * 0.008, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '700 ' + Math.round(S * 0.027) + 'px ' + FUENTE;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = pal.kicker || pal.acento;
    ctx.fillText(escena.etiqueta.toUpperCase(), x + S * 0.026, y);

    ctx.textAlign = 'right';
    ctx.fillStyle = pal.kickerSuave || pal.suave;
    ctx.globalAlpha = 0.75;
    var num = String(indice + 1).padStart(2, '0') + ' / ' + String(total).padStart(2, '0');
    ctx.fillText(num, W - W * 0.085, y);
    ctx.restore();
  }

  function dibujarBarra(ctx, W, H, progreso, opciones, pal) {
    if (opciones.progreso) {
      var S = Math.min(W, H);
      var ancho = W * 0.30;
      var alto = Math.max(3, S * 0.0075);
      var x = (W - ancho) / 2;
      var y = H - H * 0.048;

      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = pal.tenue;
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(x, y, ancho, alto, alto / 2);
      } else {
        ctx.rect(x, y, ancho, alto);
      }
      ctx.fill();

      ctx.globalAlpha = 1;
      ctx.fillStyle = pal.acento;
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(x, y, Math.max(alto, ancho * limitar(progreso, 0, 1)), alto, alto / 2);
      } else {
        ctx.rect(x, y, Math.max(alto, ancho * limitar(progreso, 0, 1)), alto);
      }
      ctx.fill();
      ctx.restore();
    }

    if (opciones.marca) {
      ctx.save();
      ctx.globalAlpha = 0.72;
      ctx.fillStyle = pal.suave;
      ctx.font = '600 ' + Math.round(Math.min(W, H) * 0.029) + 'px ' + FUENTE;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(opciones.marca, W / 2, H - H * 0.080);
      ctx.restore();
    }
  }

  function dibujarContenido(ctx, W, H, escena, p, alfa, desplazamiento, paleta, tiempo, personaje) {
    var pal = (global.Dibujos && global.Dibujos.PALETAS[paleta]) || { tinta: '#fff', acento: '#4cc9f0', acento2: '#f72585', suave: '#9fb' };
    var layout = layoutTexto(escena, W, H);
    var usaGlobo = escena.visual === 'personaje' && personaje !== 'ninguno';

    ctx.save();
    ctx.globalAlpha *= alfa;
    ctx.translate(0, desplazamiento);
    if (global.Dibujos) global.Dibujos.pintar(ctx, W, H, escena, p, paleta, tiempo, personaje);
    if (!usaGlobo && escena.visual !== 'cta') dibujarTexto(ctx, W, H, escena, p, pal, layout);
    ctx.restore();
  }

  function renderCuadro(ctx, W, H, estado, tiempo, paleta) {
    var escenas = estado.escenas;
    var opciones = estado.opciones || {};
    var palNombre = paleta || opciones.paleta || 'pizarra';
    var pal = (global.Dibujos && global.Dibujos.PALETAS[palNombre]) || {
      tinta: '#eef4ff', acento: '#4cc9f0', acento2: '#f72585', suave: '#8095c2', tenue: 'rgba(255,255,255,0.15)'
    };

    ctx.clearRect(0, 0, W, H);

    if (global.Dibujos) global.Dibujos.fondo(ctx, W, H, palNombre, tiempo);

    if (!escenas || !escenas.length) {
      ctx.save();
      ctx.fillStyle = pal.suave;
      ctx.font = '700 ' + Math.round(Math.min(W, H) * 0.05) + 'px ' + FUENTE;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Escribe tu guion para empezar', W / 2, H / 2);
      ctx.restore();
      return;
    }

    var t = limitar(tiempo, 0, estado.duracion);
    var idx = 0;
    for (var i = 0; i < escenas.length; i++) {
      if (t < escenas[i].fin) { idx = i; break; }
      idx = i;
    }
    var actual = escenas[idx];
    var local = t - actual.inicio;
    var p = limitar(local / actual.duracion, 0, 1);
    var personaje = opciones.personaje || 'buho';

    if (idx > 0 && local < TRANSICION) {
      var k = limitar(local / TRANSICION, 0, 1);
      var anterior = escenas[idx - 1];
      dibujarContenido(ctx, W, H, anterior, 1, 1 - k, -H * 0.035 * k, palNombre, tiempo, personaje);
      dibujarContenido(ctx, W, H, actual, p, k, H * 0.035 * (1 - k), palNombre, tiempo, personaje);
    } else {
      dibujarContenido(ctx, W, H, actual, p, 1, 0, palNombre, tiempo, personaje);
    }

    dibujarKicker(ctx, W, H, actual, idx, escenas.length, pal);
    dibujarBarra(ctx, W, H, estado.duracion ? t / estado.duracion : 0, opciones, pal);
  }

  function nombreArchivo(texto) {
    var base = String(texto || '').replace(/#[a-záéíóúüñ]+/gi, ' ').replace(/[^\p{L}\p{N} ]/gu, ' ')
      .trim().split(/\s+/).slice(0, 5).join('-').toLowerCase();
    if (!base) base = 'reel-educativo';
    if (base.length > 48) base = base.slice(0, 48);
    var d = new Date();
    var sello = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
    return base + '-' + sello;
  }

  global.Motor = {
    VISUALES: VISUALES,
    MAPA: MAPA,
    TRANSICION: TRANSICION,
    parsear: parsear,
    crearEstado: crearEstado,
    dimensiones: dimensiones,
    formatearTiempo: formatearTiempo,
    renderCuadro: renderCuadro,
    nombreArchivo: nombreArchivo
  };
})(window);
