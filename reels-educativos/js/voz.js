/* Voz: convierte el texto del guion en voz hablada natural, gratis y sin cuentas.
   Ruta principal: Google Translate TTS (voz de Google) copiada con un proxy CORS
   público. Respaldo: API de Sound of Text con los mismos proxies.
   Todo se guarda en el teléfono para no descargarlo dos veces. */
(function (global) {
  'use strict';

  var MAX = 170;
  var CACHE = 'reels-voz-v1';
  var TIEMPO_MAX = 7000;
  var CONCURRENCIA = 4;

  var PROXIES = [
    function (u) { return 'https://proxy.corsfix.com/?' + u; },
    function (u) { return 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u); },
    function (u) { return 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(u); },
    function (u) { return 'https://api.cors.lol/?url=' + encodeURIComponent(u); },
    function (u) { return 'https://api.allorigins.win/get?url=' + encodeURIComponent(u); }
  ];

  var ac = null;

  function limitar(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function esperar(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function cancelado() {
    var e = new Error('Grabación cancelada');
    e.cancelado = true;
    return e;
  }

  function contexto() {
    if (ac) return ac;
    var AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) return null;
    try { ac = new AC(); } catch (e) { ac = null; }
    return ac;
  }

  /* ---------- texto ---------- */

  function normalizar(t) {
    return String(t || '')
      .replace(/#[a-záéíóúüñ]+/gi, ' ')
      .replace(/[|·→]/g, ', ')
      .replace(/(\d)\s*[xX]\s*(\d)/g, '$1 por $2')
      .replace(/&/g, ' y ')
      .replace(/\s*%/g, ' por ciento')
      .replace(/\s*[-–—]{2,}\s*/g, ', ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function partirPorPalabras(frase) {
    var salida = [];
    var actual = '';
    String(frase).split(/\s+/).forEach(function (p) {
      if (!p) return;
      if (actual && actual.length + 1 + p.length > MAX) {
        salida.push(actual);
        actual = p;
      } else {
        actual = actual ? actual + ' ' + p : p;
      }
    });
    if (actual) salida.push(actual);
    return salida;
  }

  function partirOracion(oracion) {
    if (oracion.length <= MAX) return [oracion];
    var piezas = oracion.split(/,(?=\s)/);
    var salida = [];
    var buf = '';
    piezas.forEach(function (pz, i) {
      var trozo = pz + (i < piezas.length - 1 ? ',' : '');
      if ((buf + ' ' + trozo).trim().length <= MAX) {
        buf = (buf ? buf + ' ' : '') + trozo;
      } else {
        if (buf) salida.push.apply(salida, partirPorPalabras(buf));
        buf = trozo;
      }
    });
    if (buf) salida.push.apply(salida, partirPorPalabras(buf));
    return salida.filter(Boolean);
  }

  function trocear(texto) {
    var t = normalizar(texto);
    if (!t) return [];
    var oraciones = [];
    var acum = '';
    for (var i = 0; i < t.length; i++) {
      var ch = t.charAt(i);
      acum += ch;
      var corte = '.!?;:'.indexOf(ch) >= 0 && (i + 1 >= t.length || t.charAt(i + 1) === ' ');
      if (corte) { oraciones.push(acum.trim()); acum = ''; }
    }
    if (acum.trim()) oraciones.push(acum.trim());

    var trozos = [];
    oraciones.forEach(function (o) {
      if (!o) return;
      trozos.push.apply(trozos, partirOracion(o));
    });
    return trozos.filter(Boolean).slice(0, 24);
  }

  /* ---------- red ---------- */

  function conTiempo(promesa, ms) {
    return new Promise(function (res, rej) {
      var listo = false;
      var t = setTimeout(function () {
        if (listo) return;
        listo = true;
        rej(new Error('tiempo agotado'));
      }, ms);
      promesa.then(function (v) {
        if (listo) return;
        listo = true;
        clearTimeout(t);
        res(v);
      }, function (e) {
        if (listo) return;
        listo = true;
        clearTimeout(t);
        rej(e);
      });
    });
  }

  function base64ABytes(b64) {
    var limpio = String(b64).replace(/^data:[^,]*,/, '').replace(/\s+/g, '');
    var bin = global.atob(limpio);
    var out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out.buffer;
  }

  function esAudio(bytes) {
    if (!bytes || bytes.byteLength < 1200) return false;
    var v = new Uint8Array(bytes, 0, 3);
    return (v[0] === 0xFF && (v[1] & 0xE0) === 0xE0) ||
      (v[0] === 0x49 && v[1] === 0x44 && v[2] === 0x33) || // ID3
      (v[0] === 0x52 && v[1] === 0x49 && v[2] === 0x46); // RIFF
  }

  async function abrirCache() {
    if (!global.caches) return null;
    try { return await global.caches.open(CACHE); } catch (e) { return null; }
  }

  async function delCache(llave) {
    var cache = await abrirCache();
    if (!cache) return null;
    try {
      var r = await cache.match(llave);
      if (!r) return null;
      var ab = await r.arrayBuffer();
      return esAudio(ab) ? ab : null;
    } catch (e) { return null; }
  }

  async function aCache(llave, bytes) {
    var cache = await abrirCache();
    if (!cache) return;
    try {
      await cache.put(llave, new Response(bytes.slice(0), { headers: { 'Content-Type': 'audio/mpeg' } }));
    } catch (e) { /* sin espacio o sin permiso */ }
  }

  async function intentar(proxyUrl) {
    var respuesta = await conTiempo(global.fetch(proxyUrl, { cache: 'no-store' }), TIEMPO_MAX);
    if (!respuesta || !respuesta.ok) throw new Error('HTTP ' + (respuesta && respuesta.status));
    var tipo = (respuesta.headers.get('content-type') || '').toLowerCase();

    if (tipo.indexOf('json') >= 0) {
      var datos = await respuesta.json();
      if (!datos || !datos.contents) throw new Error('respuesta vacía');
      return base64ABytes(datos.contents);
    }

    var ab = await respuesta.arrayBuffer();
    if (esAudio(ab)) return ab;
    if (ab.byteLength < 600000) {
      try {
        var j = JSON.parse(new TextDecoder().decode(ab));
        if (j && j.contents) return base64ABytes(j.contents);
      } catch (e) { /* no era JSON */ }
    }
    throw new Error('no es audio');
  }

  /* Lanza varios proxies a la vez y devuelve el primero que entregue audio. */
  function primeroQueSirva(urls) {
    return new Promise(function (res, rej) {
      var pendientes = urls.length;
      var listo = false;
      var ultimo = null;
      urls.forEach(function (u) {
        intentar(u).then(function (v) {
          if (listo) return;
          if (esAudio(v)) { listo = true; res(v); }
          else { ultimo = new Error('no es audio'); if (--pendientes === 0) { listo = true; rej(ultimo); } }
        }).catch(function (e) {
          ultimo = e;
          if (--pendientes === 0 && !listo) { listo = true; rej(ultimo); }
        });
      });
    });
  }

  async function porProxies(url, senal) {
    var candidatos = PROXIES.map(function (f) { return f(url); });
    var ultimo = null;

    /* El proxy rápido, solo: si responde no se lanza nada más. */
    if (senal && senal.cancelado) throw cancelado();
    try {
      var primero = await conTiempo(intentar(candidatos[0]), 5000);
      if (esAudio(primero)) return primero;
    } catch (e) { ultimo = e; }

    /* Respaldo: varios proxies en paralelo por lotes. */
    var resto = candidatos.slice(1);
    for (var i = 0; i < resto.length; i += 2) {
      var lote = resto.slice(i, i + 2);
      if (!lote.length) continue;
      if (senal && senal.cancelado) throw cancelado();
      try {
        var bytes = await conTiempo(primeroQueSirva(lote), 7000);
        if (esAudio(bytes)) return bytes;
      } catch (e) { ultimo = e; }
    }
    var err = new Error('El proxy no respondió');
    err.detalle = ultimo && ultimo.message;
    throw err;
  }

  /* ---------- proveedores ---------- */

  function urlGoogle(texto, idioma) {
    return 'https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=' + (idioma || 'es') +
      '&ttsspeed=1&textlen=' + texto.length + '&q=' + encodeURIComponent(texto);
  }

  async function porSoundOfText(texto, idioma, senal) {
    var voz = idioma === 'es-mx' ? 'es-MX' : 'es-ES';
    var r1 = await conTiempo(global.fetch('https://api.soundoftext.com/sounds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ engine: 'Google', data: { text: texto, voice: voz } })
    }), 15000);
    if (!r1.ok) throw new Error('HTTP ' + r1.status);
    var datos = await r1.json();
    if (!datos || !datos.id) throw new Error('sin identificador');

    var ubicacion = null;
    for (var i = 0; i < 14; i++) {
      if (senal && senal.cancelado) throw cancelado();
      var r2 = await conTiempo(global.fetch('https://api.soundoftext.com/sounds/' + datos.id + '?n=' + i), 12000);
      if (!r2.ok) throw new Error('HTTP ' + r2.status);
      var estado = await r2.json();
      if (estado && estado.status === 'Done' && estado.location) { ubicacion = estado.location; break; }
      await esperar(500);
    }
    if (!ubicacion) throw new Error('la voz no estuvo lista');
    return porProxies(ubicacion, senal);
  }

  async function porGoogle(texto, idioma, senal) {
    return porProxies(urlGoogle(texto, idioma === 'es-mx' ? 'es-mx' : 'es'), senal);
  }

  async function obtenerTrozo(texto, idioma, senal) {
    var llave = 'https://reels.local/voz/' + encodeURIComponent(idioma) + '/' +
      encodeURIComponent(texto).slice(0, 180) + '-' + texto.length;
    var guardado = await delCache(llave);
    if (guardado) return guardado;

    var errores = [];
    var rutas = [porGoogle, porSoundOfText];
    for (var i = 0; i < rutas.length; i++) {
      if (senal && senal.cancelado) throw cancelado();
      try {
        var bytes = await rutas[i](texto, idioma, senal);
        if (esAudio(bytes)) {
          await aCache(llave, bytes);
          return bytes;
        }
      } catch (e) {
        if (e && e.cancelado) throw e;
        errores.push((e && e.message) || 'error');
      }
    }
    var err = new Error('No se pudo descargar la voz. Revisa tu conexión e inténtalo otra vez.');
    err.detalle = errores.join(' | ');
    throw err;
  }

  /* ---------- audio ---------- */

  function decodificar(bytes) {
    return new Promise(function (res, rej) {
      var c = contexto();
      if (!c) { rej(new Error('Este navegador no puede procesar audio.')); return; }
      var copia = bytes.slice(0);
      var p;
      try {
        p = c.decodeAudioData(copia, res, function () {
          rej(new Error('La voz llegó dañada. Inténtalo otra vez.'));
        });
      } catch (e) { rej(e); return; }
      if (p && typeof p.then === 'function') p.then(res).catch(rej);
    });
  }

  async function sintetizar(texto, opciones) {
    opciones = opciones || {};
    var idioma = opciones.idioma === 'es-mx' ? 'es-mx' : 'es';
    var trozos = trocear(texto);
    if (!trozos.length) return { trozos: [], duracion: 0 };

    var bytes = new Array(trozos.length);
    var pendientes = trozos.length;
    var siguiente = 0;
    var error = null;

    async function trabajador() {
      while (siguiente < trozos.length) {
        var i = siguiente++;
        if (error) return;
        if (opciones.senal && opciones.senal.cancelado) { error = cancelado(); return; }
        try {
          bytes[i] = await obtenerTrozo(trozos[i], idioma, opciones.senal);
        } catch (e) {
          error = error || e;
          return;
        }
        pendientes--;
      }
    }

    var trabajadores = [];
    for (var w = 0; w < Math.min(CONCURRENCIA, trozos.length); w++) trabajadores.push(trabajador());
    await Promise.all(trabajadores);
    if (error) throw error;

    var salida = [];
    var total = 0;
    for (var k = 0; k < trozos.length; k++) {
      var buffer = await decodificar(bytes[k]);
      salida.push({ bytes: bytes[k], duracion: buffer.duration });
      total += buffer.duration;
    }
    return { trozos: salida, duracion: total };
  }

  /* ---------- API para la app ---------- */

  async function paraEscenas(escenas, opciones) {
    opciones = opciones || {};
    var senal = opciones.senal || { cancelado: false };
    var tasa = limitar(Number(opciones.velocidad) || 1, 0.75, 1.35);
    var limite = Number(opciones.limiteMs) || 40000;
    var total = escenas.length;
    var voces = new Array(total);
    var duraciones = new Array(total);
    var hechos = 0;
    var siguiente = 0;
    var error = null;

    async function trabajador() {
      while (siguiente < total) {
        var i = siguiente++;
        if (error) return;
        if (senal.cancelado) { error = cancelado(); return; }
        if (opciones.alEstado) opciones.alEstado('Generando voz ' + (hechos + 1) + ' de ' + total + '…');
        try {
          var r = await sintetizar(escenas[i].texto, { idioma: opciones.idioma, senal: senal });
          if (!r.trozos.length) {
            voces[i] = { trozos: [], tasa: tasa };
            duraciones[i] = 2.2;
          } else {
            voces[i] = { trozos: r.trozos, tasa: tasa };
            duraciones[i] = Math.max(2.1, r.duracion / tasa + 1.0);
          }
          hechos++;
          if (opciones.alProgreso) opciones.alProgreso(hechos / total);
        } catch (e) {
          error = error || e;
          return;
        }
      }
    }

    var trabajadores = [];
    for (var w = 0; w < Math.min(CONCURRENCIA, total); w++) trabajadores.push(trabajador());
    var todos = Promise.all(trabajadores);
    todos.catch(function () { /* el fallo ya se informa abajo */ });
    var fin = await Promise.race([
      todos.then(function () { return 'listo'; }),
      esperar(limite).then(function () { return 'tiempo'; })
    ]);
    if (fin !== 'listo') {
      if (senal.cancelado) throw cancelado();
      var lento = new Error('La voz tardó demasiado en descargarse.');
      lento.detalle = error && error.message;
      throw lento;
    }
    if (error) throw error;

    return { voces: voces, duraciones: duraciones };
  }

  async function probar(texto, opciones) {
    var r = await sintetizar(texto, opciones || {});
    var partes = r.trozos.map(function (t) { return t.bytes; });
    if (!partes.length) throw new Error('No hay texto para escuchar.');
    return new Blob(partes, { type: 'audio/mpeg' });
  }

  global.Voz = {
    trocear: trocear,
    normalizar: normalizar,
    sintetizar: sintetizar,
    paraEscenas: paraEscenas,
    probar: probar
  };
})(window);
