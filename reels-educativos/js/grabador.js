/* Grabador: captura el lienzo y mezcla música, narración y micrófono.
   Usa MediaRecorder; intenta MP4 (H.264/AAC) y cae a WebM si hace falta. */
(function (global) {
  'use strict';

  var TIPOS = [
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
    'video/mp4;codecs=avc1.4D401F,mp4a.40.2',
    'video/mp4;codecs=avc1',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm'
  ];

  function limitar(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function esperar(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function mimeSoportado() {
    if (typeof global.MediaRecorder === 'undefined') return '';
    for (var i = 0; i < TIPOS.length; i++) {
      try {
        if (global.MediaRecorder.isTypeSupported(TIPOS[i])) return TIPOS[i];
      } catch (e) { /* seguir */ }
    }
    return '';
  }

  function soporte() {
    var mime = mimeSoportado();
    var puede = typeof global.MediaRecorder !== 'undefined' && mime !== '' &&
      typeof HTMLCanvasElement !== 'undefined' && !!HTMLCanvasElement.prototype.captureStream;
    var etiqueta = mime.indexOf('mp4') >= 0 ? 'MP4' : (mime.indexOf('webm') >= 0 ? 'WebM' : '—');
    return {
      ok: puede,
      mime: mime,
      etiqueta: etiqueta,
      extension: mime.indexOf('mp4') >= 0 ? 'mp4' : 'webm'
    };
  }

  function leerArchivo(file) {
    return new Promise(function (res, rej) {
      var fr = new FileReader();
      fr.onload = function () { res(fr.result); };
      fr.onerror = function () { rej(fr.error || new Error('No se pudo leer el archivo')); };
      fr.readAsArrayBuffer(file);
    });
  }

  function decodificar(ac, file) {
    return leerArchivo(file).then(function (buffer) {
      return new Promise(function (res, rej) {
        try {
          var p = ac.decodeAudioData(buffer, res, function (e) { rej(e || new Error('Audio no válido')); });
          if (p && typeof p.then === 'function') p.then(res).catch(rej);
        } catch (e) { rej(e); }
      });
    });
  }

  async function prepararAudio(opciones) {
    var AC = global.AudioContext || global.webkitAudioContext;
    var audio = {
      stream: null,
      iniciar: function () {},
      cerrar: function () {}
    };
    if (!AC) return audio;

    var ac = new AC();
    var nodos = [];
    var pistasMic = [];
    var arranques = [];
    var abierto = true;

    try { await ac.resume(); } catch (e) { /* en algunos navegadores ya está activo */ }

    var destino = ac.createMediaStreamDestination();
    audio.stream = destino.stream;

    var osc = ac.createOscillator();
    var gOsc = ac.createGain();
    gOsc.gain.value = 0.0001;
    osc.type = 'sine';
    osc.frequency.value = 220;
    osc.connect(gOsc);
    gOsc.connect(destino);
    try { osc.start(); } catch (e) { /* ignorar */ }
    nodos.push(osc);

    var conMic = !!opciones.microfono;

    if (opciones.musica) {
      try {
        var bufMusica = await decodificar(ac, opciones.musica);
        var srcMusica = ac.createBufferSource();
        srcMusica.buffer = bufMusica;
        srcMusica.loop = true;
        var gMusica = ac.createGain();
        gMusica.gain.value = limitar(Number(opciones.volumen) || 0.35, 0, 1);
        srcMusica.connect(gMusica);
        gMusica.connect(destino);
        if (!conMic) {
          var monitor = ac.createGain();
          monitor.gain.value = 0.55;
          gMusica.connect(monitor);
          monitor.connect(ac.destination);
          nodos.push(monitor);
        }
        arranques.push(function () { srcMusica.start(); });
        nodos.push(srcMusica);
      } catch (e) {
        console.warn('Música no válida:', e);
        if (opciones.alAviso) opciones.alAviso('No se pudo leer la música; el video se grabará sin ella.');
      }
    }

    if (opciones.narracion) {
      try {
        var bufNar = await decodificar(ac, opciones.narracion);
        var srcNar = ac.createBufferSource();
        srcNar.buffer = bufNar;
        var gNar = ac.createGain();
        gNar.gain.value = 1;
        srcNar.connect(gNar);
        gNar.connect(destino);
        arranques.push(function () { srcNar.start(); });
        nodos.push(srcNar);
      } catch (e) {
        console.warn('Narración no válida:', e);
        if (opciones.alAviso) opciones.alAviso('No se pudo leer la narración; el video se grabará sin ella.');
      }
    }

    if (conMic) {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Tu navegador no permite usar el micrófono.');
      }
      var mic;
      try {
        mic = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
        });
      } catch (e) {
        throw new Error('No se pudo activar el micrófono. Revisa el permiso o desactívalo.');
      }
      pistasMic = mic.getTracks();
      var fuenteMic = ac.createMediaStreamSource(mic);
      var gMic = ac.createGain();
      gMic.gain.value = 1;
      fuenteMic.connect(gMic);
      gMic.connect(destino);
    }

    audio.iniciar = function () {
      arranques.forEach(function (fn) {
        try { fn(); } catch (e) { /* ignorar */ }
      });
      arranques = [];
    };

    audio.cerrar = function () {
      if (!abierto) return;
      abierto = false;
      nodos.forEach(function (n) {
        try { if (n.stop) n.stop(); } catch (e) { /* ignorar */ }
        try { if (n.disconnect) n.disconnect(); } catch (e) { /* ignorar */ }
      });
      pistasMic.forEach(function (t) { try { t.stop(); } catch (e) { /* ignorar */ } });
      try { ac.close(); } catch (e) { /* ignorar */ }
    };

    return audio;
  }

  function errorCancelado() {
    var e = new Error('Grabación cancelada');
    e.cancelado = true;
    return e;
  }

  async function grabar(canvas, opciones) {
    opciones = opciones || {};
    var senal = opciones.senal || { cancelado: false };
    var info = soporte();

    if (!info.ok) {
      throw new Error('Este navegador no puede grabar video. Prueba con Chrome o Safari actualizados.');
    }
    if (!canvas.captureStream) {
      throw new Error('El navegador no permite capturar el lienzo.');
    }

    var fps = opciones.fps || 30;
    var streamVideo = canvas.captureStream(fps);
    var stream = new MediaStream();
    streamVideo.getVideoTracks().forEach(function (t) { stream.addTrack(t); });

    var audio = null;
    var despertar = null;
    var grabador = null;
    var trozos = [];
    var mime = info.mime;
    var terminado = null;
    var finalizado = false;

    function limpiar() {
      if (finalizado) return;
      finalizado = true;
      try {
        streamVideo.getTracks().forEach(function (t) { t.stop(); });
      } catch (e) { /* ignorar */ }
      if (audio) { try { audio.cerrar(); } catch (e) { /* ignorar */ } }
      if (despertar) { try { despertar.release(); } catch (e) { /* ignorar */ } }
    }

    try {
      audio = await prepararAudio(opciones);
      audio.stream.getAudioTracks().forEach(function (t) { stream.addTrack(t); });

      if (global.navigator && navigator.wakeLock && navigator.wakeLock.request) {
        try { despertar = await navigator.wakeLock.request('screen'); } catch (e) { /* opcional */ }
      }

      for (var n = 3; n >= 1; n--) {
        if (senal.cancelado) throw errorCancelado();
        if (opciones.alCuenta) opciones.alCuenta(n);
        await esperar(720);
      }
      if (senal.cancelado) throw errorCancelado();
      if (opciones.alCuenta) opciones.alCuenta(0);
      if (opciones.alEstado) opciones.alEstado('Grabando… mantén la pantalla encendida');

      var bitrate = opciones.bitrate || (opciones.calidad >= 1080 ? 10000000 : 5500000);
      try {
        grabador = new MediaRecorder(stream, {
          mimeType: mime,
          videoBitsPerSecond: bitrate,
          audioBitsPerSecond: 128000
        });
      } catch (e) {
        grabador = new MediaRecorder(stream);
        mime = grabador.mimeType || mime;
      }

      grabador.ondataavailable = function (ev) {
        if (ev.data && ev.data.size) trozos.push(ev.data);
      };
      terminado = new Promise(function (res, rej) {
        grabador.onstop = function () { res(); };
        grabador.onerror = function (ev) {
          rej((ev && ev.error) || new Error('Falló la grabación en el navegador.'));
        };
      });

      if (opciones.alFrame) opciones.alFrame(0);
      grabador.start(500);
      audio.iniciar();

      var inicio = performance.now();
      var duracion = Math.max(0.5, Number(opciones.duracion) || 1);
      var canceladoDurante = false;

      await new Promise(function (resolver) {
        function bucle() {
          if (senal.cancelado) {
            canceladoDurante = true;
            try { if (grabador.state !== 'inactive') grabador.stop(); } catch (e) { /* ignorar */ }
            resolver();
            return;
          }
          var t = (performance.now() - inicio) / 1000;
          if (t >= duracion + 0.18) {
            try { if (grabador.state !== 'inactive') grabador.stop(); } catch (e) { /* ignorar */ }
            resolver();
            return;
          }
          var tt = Math.min(t, duracion);
          if (opciones.alFrame) opciones.alFrame(tt);
          if (opciones.alProgreso) opciones.alProgreso(limitar(tt / duracion, 0, 1));
          global.requestAnimationFrame(bucle);
        }
        global.requestAnimationFrame(bucle);
      });

      await terminado;
      if (audio) audio.cerrar();
      limpiar();

      if (canceladoDurante) throw errorCancelado();

      var tipo = (mime || info.mime || 'video/webm').split(';')[0];
      var blob = new Blob(trozos, { type: tipo });
      if (!blob.size) throw new Error('El video salió vacío. Intenta de nuevo.');

      return {
        blob: blob,
        mime: tipo,
        mimeCompleto: mime,
        extension: tipo.indexOf('mp4') >= 0 ? 'mp4' : 'webm',
        duracion: duracion,
        bytes: blob.size
      };
    } catch (e) {
      limpiar();
      throw e;
    }
  }

  global.Grabador = {
    soporte: soporte,
    mimeSoportado: mimeSoportado,
    grabar: grabar
  };
})(window);
