/* Dibujos y formas animadas para los reels educativos.
   Todo se dibuja con Canvas 2D, sin dependencias. */
(function (global) {
  'use strict';

  var TAU = Math.PI * 2;
  var FUENTE = '"Segoe UI", "Roboto", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif';

  function limitar(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function suave(t) { t = limitar(t, 0, 1); return 1 - Math.pow(1 - t, 3); }
  function suaveIO(t) {
    t = limitar(t, 0, 1);
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  var PALETAS = {
    pizarra: {
      nombre: 'Pizarra azul',
      fondo: '#0a1228', fondo2: '#0d1c3c', panel: '#14264f',
      tinta: '#eef4ff', acento: '#4cc9f0', acento2: '#ff4d9d',
      suave: '#8095c2', tenue: 'rgba(238,244,255,0.16)', oscuro: true
    },
    menta: {
      nombre: 'Pizarra verde',
      fondo: '#06231c', fondo2: '#0a3328', panel: '#103c31',
      tinta: '#e9fff8', acento: '#3ddc97', acento2: '#ffd166',
      suave: '#82aa9c', tenue: 'rgba(233,255,248,0.16)', oscuro: true
    },
    papel: {
      nombre: 'Papel y tinta',
      fondo: '#f3eadb', fondo2: '#fffaf0', panel: '#fffdf8',
      tinta: '#1c2433', acento: '#d1495b', acento2: '#2a6f97',
      suave: '#8a8071', tenue: 'rgba(28,36,51,0.15)', oscuro: false
    },
    neon: {
      nombre: 'Neón',
      fondo: '#0a0618', fondo2: '#170b31', panel: '#1e1142',
      tinta: '#f4eeff', acento: '#b388ff', acento2: '#00e5ff',
      suave: '#937fc0', tenue: 'rgba(244,238,255,0.16)', oscuro: true
    },
    aero: {
      nombre: 'Frutiger Aero',
      fondo: '#cfeeff', fondo2: '#05406d', panel: '#0a4a74',
      tinta: '#f4fdff', acento: '#9cf3ff', acento2: '#6cf7a6',
      suave: '#cdefff', tenue: 'rgba(255,255,255,0.24)', oscuro: true,
      aero: true, kicker: '#075a88', kickerSuave: '#0a527d',
      sombra: 'rgba(3,45,75,0.55)'
    }
  };

  /* ---------- utilidades de dibujo ---------- */

  function rotulo(ctx, txt, x, y, tam, color, peso, alineacion) {
    ctx.save();
    ctx.font = (peso || '800') + ' ' + tam + 'px ' + FUENTE;
    ctx.textAlign = alineacion || 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(txt, x, y);
    ctx.restore();
  }

  function caja(ctx, x, y, w, h, r, relleno, borde, grosor) {
    ctx.save();
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2));
    } else {
      var rr = Math.min(r, w / 2, h / 2);
      ctx.moveTo(x + rr, y);
      ctx.arcTo(x + w, y, x + w, y + h, rr);
      ctx.arcTo(x + w, y + h, x, y + h, rr);
      ctx.arcTo(x, y + h, x, y, rr);
      ctx.arcTo(x, y, x + w, y, rr);
      ctx.closePath();
    }
    if (relleno) { ctx.fillStyle = relleno; ctx.fill(); }
    if (borde) { ctx.strokeStyle = borde; ctx.lineWidth = grosor || 2; ctx.stroke(); }
    ctx.restore();
  }

  function trazo(ctx, color, grosor, p, construir) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = grosor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    construir(ctx);
    ctx.setLineDash([30000, 30000]);
    ctx.lineDashOffset = 30000 * (1 - limitar(p, 0, 1));
    ctx.stroke();
    ctx.restore();
  }

  function circuloTrazo(ctx, x, y, r, color, grosor, p, desde, hasta) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = grosor;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(x, y, r, desde == null ? -Math.PI / 2 : desde, hasta == null ? -Math.PI / 2 + TAU : hasta);
    ctx.setLineDash([30000, 30000]);
    ctx.lineDashOffset = 30000 * (1 - limitar(p, 0, 1));
    ctx.stroke();
    ctx.restore();
  }

  function puntosBezier(p0, p1, p2, n) {
    var pts = [];
    for (var i = 0; i <= n; i++) {
      var t = i / n;
      var mt = 1 - t;
      pts.push({
        x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
        y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y
      });
    }
    return pts;
  }

  /* ---------- fondo ---------- */

  var cacheFondo = new Map();

  function crearFondo(W, H, pal) {
    var cv = document.createElement('canvas');
    cv.width = W;
    cv.height = H;
    var g = cv.getContext('2d');
    var S = Math.min(W, H);

    var grad = g.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, pal.fondo);
    grad.addColorStop(1, pal.fondo2);
    g.fillStyle = grad;
    g.fillRect(0, 0, W, H);

    var brillo = g.createRadialGradient(W * 0.2, H * 0.12, 0, W * 0.2, H * 0.12, Math.max(W, H) * 0.75);
    brillo.addColorStop(0, pal.acento);
    brillo.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = pal.oscuro ? 0.14 : 0.10;
    g.fillStyle = brillo;
    g.fillRect(0, 0, W, H);

    var brillo2 = g.createRadialGradient(W * 0.9, H * 0.85, 0, W * 0.9, H * 0.85, Math.max(W, H) * 0.7);
    brillo2.addColorStop(0, pal.acento2);
    brillo2.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = pal.oscuro ? 0.10 : 0.07;
    g.fillStyle = brillo2;
    g.fillRect(0, 0, W, H);

    g.globalAlpha = 1;
    var paso = S * 0.058;
    g.fillStyle = pal.tinta;
    g.globalAlpha = pal.oscuro ? 0.055 : 0.07;
    for (var y = paso / 2; y < H; y += paso) {
      for (var x = paso / 2; x < W; x += paso) {
        g.beginPath();
        g.arc(x, y, Math.max(1, S * 0.0018), 0, TAU);
        g.fill();
      }
    }
    g.globalAlpha = 1;

    if (!pal.oscuro) {
      g.strokeStyle = 'rgba(28,36,51,0.05)';
      g.lineWidth = Math.max(1, S * 0.0015);
      g.beginPath();
      g.moveTo(0, H * 0.955);
      g.lineTo(W, H * 0.955);
      g.stroke();
    }
    return cv;
  }

  /* Burbuja glossy: burbuja de jabón con brillo y borde de cristal. */
  function burbuja(g, x, y, r, alfa) {
    if (r < 0.6) return;
    var gr = g.createRadialGradient(x - r * 0.34, y - r * 0.40, r * 0.04, x, y, r);
    gr.addColorStop(0, 'rgba(255,255,255,0.92)');
    gr.addColorStop(0.28, 'rgba(255,255,255,0.16)');
    gr.addColorStop(0.68, 'rgba(150,235,255,0.10)');
    gr.addColorStop(1, 'rgba(255,255,255,0.38)');

    g.save();
    g.globalAlpha = alfa;
    g.fillStyle = gr;
    g.beginPath();
    g.arc(x, y, r, 0, TAU);
    g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.55)';
    g.lineWidth = Math.max(0.8, r * 0.055);
    g.stroke();

    g.globalAlpha = alfa * 0.9;
    g.fillStyle = 'rgba(255,255,255,0.85)';
    g.beginPath();
    g.ellipse(x - r * 0.32, y - r * 0.38, r * 0.20, r * 0.12, -0.5, 0, TAU);
    g.fill();
    g.restore();
  }

  /* Fondo Frutiger Aero: cielo y agua brillantes, horizonte, cristal y burbujas. */
  function crearFondoAero(W, H, pal) {
    var cv = document.createElement('canvas');
    cv.width = W;
    cv.height = H;
    var g = cv.getContext('2d');
    var S = Math.min(W, H);

    var cielo = g.createLinearGradient(0, 0, 0, H);
    cielo.addColorStop(0, '#e2f9ff');
    cielo.addColorStop(0.16, '#a9e9ff');
    cielo.addColorStop(0.34, '#6bd2f4');
    cielo.addColorStop(0.47, '#33b0e2');
    cielo.addColorStop(0.52, '#1c93cb');
    cielo.addColorStop(0.53, '#117fb8');
    cielo.addColorStop(0.74, '#0a639c');
    cielo.addColorStop(0.90, '#074d7f');
    cielo.addColorStop(1, '#043458');
    g.fillStyle = cielo;
    g.fillRect(0, 0, W, H);

    var sol = g.createRadialGradient(W * 0.28, H * 0.06, 0, W * 0.28, H * 0.06, Math.max(W, H) * 0.72);
    sol.addColorStop(0, 'rgba(255,255,255,0.95)');
    sol.addColorStop(0.28, 'rgba(255,255,255,0.42)');
    sol.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = sol;
    g.fillRect(0, 0, W, H);

    /* Colina verde brillante en el horizonte. */
    var yHorizonte = H * 0.505;
    var colina = g.createLinearGradient(0, yHorizonte - H * 0.06, 0, H * 0.62);
    colina.addColorStop(0, 'rgba(190,255,214,0.92)');
    colina.addColorStop(0.45, 'rgba(104,230,150,0.86)');
    colina.addColorStop(1, 'rgba(32,150,96,0.55)');
    g.beginPath();
    g.moveTo(0, H * 0.56);
    g.bezierCurveTo(W * 0.18, H * 0.49, W * 0.36, H * 0.52, W * 0.52, H * 0.545);
    g.bezierCurveTo(W * 0.70, H * 0.57, W * 0.84, H * 0.515, W, H * 0.535);
    g.lineTo(W, H * 0.63);
    g.lineTo(0, H * 0.63);
    g.closePath();
    g.fillStyle = colina;
    g.fill();

    /* Brillo de agua y reflejos horizontales. */
    var agua = g.createLinearGradient(0, H * 0.55, 0, H);
    agua.addColorStop(0, 'rgba(255,255,255,0.20)');
    agua.addColorStop(0.18, 'rgba(180,245,255,0.06)');
    agua.addColorStop(1, 'rgba(0,32,64,0.35)');
    g.fillStyle = agua;
    g.fillRect(0, H * 0.55, W, H * 0.45);

    g.save();
    g.globalAlpha = 0.22;
    g.strokeStyle = '#ffffff';
    g.lineWidth = Math.max(1, S * 0.0022);
    for (var r = 0; r < 9; r++) {
      var ry = H * (0.575 + r * 0.043);
      var ancho = W * (0.10 + (r % 4) * 0.085);
      var bx = W * (0.16 + ((r * 0.23) % 0.66));
      g.beginPath();
      g.moveTo(bx - ancho / 2, ry);
      g.lineTo(bx + ancho / 2, ry);
      g.stroke();
    }
    g.restore();

    /* Franjas de cristal inclinadas. */
    g.save();
    g.globalAlpha = 0.16;
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.moveTo(W * 0.02, -H * 0.05);
    g.lineTo(W * 0.30, -H * 0.05);
    g.lineTo(W * 0.06, H * 0.55);
    g.lineTo(-W * 0.16, H * 0.55);
    g.closePath();
    g.fill();
    g.globalAlpha = 0.09;
    g.beginPath();
    g.moveTo(W * 0.38, -H * 0.05);
    g.lineTo(W * 0.48, -H * 0.05);
    g.lineTo(W * 0.26, H * 0.46);
    g.lineTo(W * 0.16, H * 0.46);
    g.closePath();
    g.fill();
    g.restore();

    /* Burbujas fijas. */
    var burbujas = [
      [0.11, 0.24, 0.030, 0.55], [0.82, 0.17, 0.045, 0.42], [0.68, 0.36, 0.020, 0.55],
      [0.24, 0.44, 0.022, 0.45], [0.90, 0.42, 0.026, 0.40], [0.52, 0.14, 0.016, 0.50],
      [0.16, 0.62, 0.034, 0.32], [0.76, 0.66, 0.022, 0.30], [0.42, 0.70, 0.018, 0.28],
      [0.88, 0.80, 0.028, 0.24], [0.09, 0.86, 0.020, 0.22], [0.60, 0.90, 0.034, 0.20]
    ];
    burbujas.forEach(function (b) {
      burbuja(g, W * b[0], H * b[1], S * b[2], b[3]);
    });

    return cv;
  }

  function fondo(ctx, W, H, nombre, tiempo) {
    var pal = PALETAS[nombre] || PALETAS.pizarra;
    var llave = W + 'x' + H + '-' + nombre;
    var cv = cacheFondo.get(llave);
    if (!cv) {
      if (cacheFondo.size > 6) { cacheFondo.clear(); }
      cv = pal.aero ? crearFondoAero(W, H, pal) : crearFondo(W, H, pal);
      cacheFondo.set(llave, cv);
    }
    ctx.drawImage(cv, 0, 0, W, H);

    var S = Math.min(W, H);
    var t = tiempo || 0;

    if (pal.aero) {
      ctx.save();
      for (var b = 0; b < 10; b++) {
        var vel = 0.012 + (b % 3) * 0.006;
        var subida = (t * vel + b * 0.107) % 1;
        var by = H * (0.98 - subida * 0.94);
        var bx = W * (0.08 + ((b * 0.173 + Math.sin(t * 0.12 + b) * 0.018) % 0.84));
        var r = S * (0.008 + (b % 4) * 0.006);
        burbuja(ctx, bx, by, r, 0.30 + (b % 3) * 0.10);
      }
      ctx.globalAlpha = 0.10;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(1, S * 0.003);
      for (var i = 0; i < 2; i++) {
        var yy = H * (0.30 + 0.36 * i) + Math.sin(t * 0.10 + i * 1.7) * S * 0.01;
        ctx.beginPath();
        ctx.moveTo(W * 0.10, yy);
        ctx.bezierCurveTo(W * 0.34, yy - S * 0.02, W * 0.66, yy + S * 0.02, W * 0.90, yy);
        ctx.stroke();
      }
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.globalAlpha = pal.oscuro ? 0.055 : 0.05;
    ctx.strokeStyle = pal.acento;
    ctx.lineWidth = Math.max(1.2, S * 0.0022);
    for (var i = 0; i < 3; i++) {
      var r = S * (0.30 + i * 0.17);
      ctx.beginPath();
      ctx.arc(W * (0.5 + 0.16 * Math.sin(t * 0.05 + i)), H * (0.42 + 0.06 * Math.cos(t * 0.04 + i * 2)), r, 0, TAU);
      ctx.stroke();
    }
    ctx.globalAlpha = pal.oscuro ? 0.5 : 0.35;
    for (var j = 0; j < 7; j++) {
      var ang = t * 0.18 + j * 1.37;
      var rr = S * (0.24 + (j % 3) * 0.15);
      ctx.fillStyle = j % 2 ? pal.acento2 : pal.acento;
      ctx.beginPath();
      ctx.arc(W * 0.5 + Math.cos(ang) * rr * 1.15, H * 0.34 + Math.sin(ang) * rr * 0.8, Math.max(1.5, S * 0.004), 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  /* ---------- formas ---------- */

  function dibujarIdea(ctx, R, p, c, escena, tiempo) {
    var e = suave(p);
    var cx = 0, cy = -R * 0.10;

    ctx.save();
    var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.78);
    g.addColorStop(0, c.acento);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = 0.22 * e;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.78, 0, TAU);
    ctx.fill();
    ctx.restore();

    var rayos = 8;
    for (var i = 0; i < rayos; i++) {
      var ang = -Math.PI / 2 + (i / rayos) * TAU;
      if (Math.abs(ang - Math.PI / 2) < 0.35) continue;
      var pr = limitar((e - i * 0.045) * 2.2, 0, 1);
      var r1 = R * 0.46, r2 = R * (0.52 + 0.13 * suave(pr));
      ctx.save();
      ctx.globalAlpha = pr;
      ctx.strokeStyle = i % 3 === 0 ? c.acento2 : c.acento;
      ctx.lineWidth = R * 0.035;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1);
      ctx.lineTo(cx + Math.cos(ang) * r2, cy + Math.sin(ang) * r2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = c.panel;
    ctx.beginPath();
    ctx.arc(cx, cy - R * 0.04, R * 0.37, 0, TAU);
    ctx.fill();
    ctx.restore();

    circuloTrazo(ctx, cx, cy - R * 0.04, R * 0.37, c.acento, R * 0.055, limitar(e * 1.12, 0, 1), Math.PI * 0.75, Math.PI * 0.75 + TAU);

    var z = limitar((e - 0.35) * 1.9, 0, 1);
    trazo(ctx, c.acento2, R * 0.045, z, function (x) {
      x.moveTo(cx - R * 0.11, cy + R * 0.02);
      x.lineTo(cx - R * 0.03, cy + R * 0.15);
      x.lineTo(cx + R * 0.09, cy - R * 0.14);
      x.lineTo(cx + R * 0.02, cy + R * 0.15);
      x.lineTo(cx + R * 0.13, cy - R * 0.03);
    });

    var base = limitar((e - 0.55) * 2.2, 0, 1);
    ctx.save();
    ctx.globalAlpha = base;
    ctx.strokeStyle = c.suave;
    ctx.lineWidth = R * 0.038;
    ctx.lineCap = 'round';
    var anchos = [0.34, 0.24, 0.15];
    for (var k = 0; k < 3; k++) {
      var y = cy + R * (0.38 + k * 0.09);
      ctx.beginPath();
      ctx.moveTo(cx - R * anchos[k] / 2, y);
      ctx.lineTo(cx + R * anchos[k] / 2, y);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = limitar((e - 0.7) * 2.5, 0, 1);
    ctx.fillStyle = c.acento;
    for (var s = 0; s < 3; s++) {
      var a = tiempo * 0.8 + s * 2.1;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * R * 0.62, cy - R * 0.15 + Math.sin(a) * R * 0.3, R * 0.018, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function dibujarFlecha(ctx, R, p, c, escena, tiempo) {
    var e = suave(p);
    var p0 = { x: -R * 0.86, y: R * 0.30 };
    var p1 = { x: -R * 0.05, y: -R * 0.95 };
    var p2 = { x: R * 0.78, y: R * 0.02 };

    ctx.save();
    ctx.globalAlpha = 0.25 * e;
    ctx.fillStyle = c.acento;
    ctx.beginPath();
    ctx.ellipse(0, R * 0.48, R * 0.85, R * 0.10, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    trazo(ctx, c.acento, R * 0.085, e, function (x) {
      x.moveTo(p0.x, p0.y);
      x.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y);
    });

    var pts = puntosBezier(p0, p1, p2, 30);
    var visibles = Math.floor(pts.length * e);
    for (var i = 0; i < 3; i++) {
      var idx = Math.floor(pts.length * (0.22 + i * 0.26));
      if (idx > visibles) continue;
      ctx.save();
      ctx.globalAlpha = limitar((e - idx / pts.length) * 6, 0, 1);
      ctx.fillStyle = i === 1 ? c.acento2 : c.tinta;
      ctx.beginPath();
      ctx.arc(pts[idx].x, pts[idx].y, R * 0.028, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    var ang = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    var cab = limitar((e - 0.72) * 3.4, 0, 1);
    ctx.save();
    ctx.translate(p2.x, p2.y);
    ctx.rotate(ang);
    ctx.globalAlpha = cab;
    ctx.strokeStyle = c.acento;
    ctx.lineWidth = R * 0.085;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-R * 0.22, -R * 0.20);
    ctx.lineTo(0, 0);
    ctx.lineTo(-R * 0.22, R * 0.20);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = limitar((e - 0.6) * 2.5, 0, 1);
    ctx.strokeStyle = c.acento2;
    ctx.lineWidth = R * 0.03;
    ctx.setLineDash([R * 0.05, R * 0.09]);
    ctx.lineDashOffset = -tiempo * R * 0.08;
    ctx.beginPath();
    ctx.moveTo(-R * 0.72, R * 0.52);
    ctx.lineTo(R * 0.72, R * 0.52);
    ctx.stroke();
    ctx.restore();
  }

  function dibujarPasos(ctx, R, p, c, escena, tiempo) {
    var e = suave(p);
    var total = 3;
    var xs = [-R * 0.64, 0, R * 0.64];
    var y = R * 0.02;
    var items = (escena.extra && escena.extra.items) || [];

    ctx.save();
    ctx.strokeStyle = c.tenue;
    ctx.lineWidth = R * 0.04;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(xs[0], y);
    ctx.lineTo(xs[total - 1], y);
    ctx.stroke();
    ctx.restore();

    var avance = limitar(e * 1.2, 0, 1);
    ctx.save();
    ctx.strokeStyle = c.acento;
    ctx.lineWidth = R * 0.045;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(xs[0], y);
    ctx.lineTo(xs[0] + (xs[total - 1] - xs[0]) * avance, y);
    ctx.stroke();
    ctx.restore();

    for (var i = 0; i < total; i++) {
      var pi = limitar((e - i * 0.16) * 3, 0, 1);
      if (pi <= 0) continue;
      var activo = avance >= i / (total - 1) - 0.02;
      ctx.save();
      ctx.globalAlpha = pi;
      var esc = 0.7 + 0.3 * suave(pi);
      ctx.translate(xs[i], y);
      ctx.scale(esc, esc);
      ctx.fillStyle = activo ? c.acento : c.panel;
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.17, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = activo ? c.acento : c.tenue;
      ctx.lineWidth = R * 0.03;
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = pi;
      var colorNum = activo ? (c.oscuro ? '#07101f' : '#fffdf8') : c.suave;
      rotulo(ctx, String(i + 1), xs[i], y + R * 0.008, R * 0.16, colorNum, '800');
      ctx.restore();

      if (items[i]) {
        ctx.save();
        ctx.globalAlpha = limitar((e - i * 0.16 - 0.12) * 3, 0, 1);
        rotulo(ctx, recortar(items[i], 11), xs[i], y + R * 0.34, R * 0.092, c.tinta, '700');
        ctx.restore();
      }
    }

    var px = xs[0] + (xs[total - 1] - xs[0]) * avance;
    ctx.save();
    ctx.globalAlpha = limitar(e * 2, 0, 1);
    ctx.fillStyle = c.acento2;
    ctx.beginPath();
    ctx.arc(px, y - R * 0.27, R * 0.045, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(px, y - R * 0.27, R * 0.09, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function dibujarCiclo(ctx, R, p, c, escena, tiempo) {
    var e = suave(p);
    var r = R * 0.56;
    var inicio = -Math.PI / 2;
    var fin = inicio + TAU * 0.82;

    circuloTrazo(ctx, 0, 0, r, c.tenue, R * 0.035, 1, inicio, inicio + TAU);
    circuloTrazo(ctx, 0, 0, r, c.acento, R * 0.055, e, inicio, fin);

    var ang = fin;
    var hx = Math.cos(ang) * r, hy = Math.sin(ang) * r;
    var cab = limitar((e - 0.8) * 4, 0, 1);
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(ang + Math.PI / 2);
    ctx.globalAlpha = cab;
    ctx.strokeStyle = c.acento;
    ctx.lineWidth = R * 0.05;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-R * 0.11, -R * 0.10);
    ctx.lineTo(0, 0);
    ctx.lineTo(R * 0.11, -R * 0.10);
    ctx.stroke();
    ctx.restore();

    for (var i = 0; i < 3; i++) {
      var pi = limitar((e - i * 0.14) * 3, 0, 1);
      var a = inicio + (i / 3) * TAU + tiempo * 0.25;
      var x = Math.cos(a) * r, y = Math.sin(a) * r;
      ctx.save();
      ctx.globalAlpha = pi;
      ctx.fillStyle = c.panel;
      ctx.beginPath();
      ctx.arc(x, y, R * 0.115, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = i === 1 ? c.acento2 : c.acento;
      ctx.lineWidth = R * 0.03;
      ctx.stroke();
      ctx.fillStyle = i === 1 ? c.acento2 : c.acento;
      ctx.beginPath();
      ctx.arc(x, y, R * 0.035, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = c.panel;
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.27, 0, TAU);
    ctx.fill();
    ctx.restore();
    rotulo(ctx, '↻', 0, -R * 0.015, R * 0.42, c.tinta, '600');
  }

  function dibujarComparar(ctx, R, p, c, escena, tiempo) {
    var e = suave(p);
    var r = R * 0.46;
    var dx = R * 0.27;
    var extra = escena.extra || {};

    ctx.save();
    ctx.globalAlpha = 0.10 * e;
    ctx.fillStyle = c.acento;
    ctx.beginPath();
    ctx.arc(-dx, 0, r, 0, TAU);
    ctx.fill();
    ctx.fillStyle = c.acento2;
    ctx.beginPath();
    ctx.arc(dx, 0, r, 0, TAU);
    ctx.fill();
    if (e > 0.35) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(-dx, 0, r, 0, TAU);
      ctx.clip();
      ctx.globalAlpha = 0.20 * limitar((e - 0.35) * 3, 0, 1);
      ctx.fillStyle = c.acento2;
      ctx.beginPath();
      ctx.arc(dx, 0, r, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    circuloTrazo(ctx, -dx, 0, r, c.acento, R * 0.035, limitar(e * 1.15, 0, 1));
    circuloTrazo(ctx, dx, 0, r, c.acento2, R * 0.035, limitar((e - 0.12) * 1.15, 0, 1));

    ctx.save();
    ctx.globalAlpha = limitar((e - 0.3) * 2.5, 0, 1);
    rotulo(ctx, recortar(extra.a || 'A', 9).toUpperCase(), -dx - R * 0.13, -R * 0.01, R * 0.14, c.acento, '800');
    rotulo(ctx, recortar(extra.b || 'B', 9).toUpperCase(), dx + R * 0.13, -R * 0.01, R * 0.14, c.acento2, '800');
    rotulo(ctx, 'vs', 0, R * 0.02, R * 0.11, c.suave, '800');
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = limitar((e - 0.55) * 2, 0, 1);
    ctx.strokeStyle = c.tinta;
    ctx.lineWidth = R * 0.02;
    ctx.setLineDash([R * 0.03, R * 0.05]);
    ctx.beginPath();
    ctx.moveTo(-R * 0.06, R * 0.55);
    ctx.lineTo(R * 0.06, R * 0.55);
    ctx.stroke();
    ctx.restore();
  }

  function dibujarGrafico(ctx, R, p, c, escena, tiempo) {
    var e = suave(p);
    var baseY = R * 0.62;
    var izq = -R * 0.82;
    var der = R * 0.82;

    ctx.save();
    ctx.strokeStyle = c.tenue;
    ctx.lineWidth = R * 0.015;
    for (var g = 0; g < 3; g++) {
      var gy = baseY - R * 0.38 * g;
      ctx.beginPath();
      ctx.moveTo(izq, gy);
      ctx.lineTo(der, gy);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(izq, baseY);
    ctx.lineTo(der, baseY);
    ctx.stroke();
    ctx.restore();

    var alturas = [0.42, 0.72, 0.56, 1.0];
    var ancho = R * 0.20;
    var sep = (der - izq) / 4;
    var tops = [];
    for (var i = 0; i < 4; i++) {
      var pi = limitar((e - i * 0.11) * 2.2, 0, 1);
      var h = alturas[i] * R * 0.62 * suaveIO(pi);
      var x = izq + sep * (i + 0.5);
      var col = i === 3 ? c.acento2 : c.acento;
      var alfa = i === 3 ? 1 : 0.78;
      ctx.save();
      ctx.globalAlpha = alfa * limitar(pi * 2, 0, 1);
      var grad = ctx.createLinearGradient(0, baseY, 0, baseY - h);
      grad.addColorStop(0, col);
      grad.addColorStop(1, col);
      ctx.fillStyle = grad;
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(x - ancho / 2, baseY - h, ancho, h, [ancho * 0.32, ancho * 0.32, 2, 2]);
      } else {
        ctx.rect(x - ancho / 2, baseY - h, ancho, h);
      }
      ctx.fill();
      ctx.restore();
      tops.push({ x: x, y: baseY - h, listo: pi > 0.95 });
    }

    var pl = limitar((e - 0.55) * 2.4, 0, 1);
    if (pl > 0) {
      ctx.save();
      ctx.strokeStyle = c.tinta;
      ctx.globalAlpha = 0.65;
      ctx.lineWidth = R * 0.022;
      ctx.lineCap = 'round';
      ctx.beginPath();
      var hasta = Math.max(1, Math.floor(tops.length * pl));
      for (var k = 0; k < hasta; k++) {
        if (k === 0) ctx.moveTo(tops[k].x, tops[k].y);
        else ctx.lineTo(tops[k].x, tops[k].y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = c.acento2;
      for (var d = 0; d < hasta; d++) {
        ctx.beginPath();
        ctx.arc(tops[d].x, tops[d].y, R * 0.028, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = limitar((e - 0.3) * 2, 0, 1);
    ctx.fillStyle = c.suave;
    for (var t = 0; t < 4; t++) {
      var tx = izq + sep * (t + 0.5);
      ctx.beginPath();
      ctx.arc(tx, baseY + R * 0.13, R * 0.018, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function dibujarNumero(ctx, R, p, c, escena, tiempo) {
    var e = suave(p);
    var r = R * 0.56;
    var texto = (escena.extra && escena.extra.numero) || '1';

    ctx.save();
    ctx.globalAlpha = 0.12 * e;
    ctx.fillStyle = c.acento;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();
    ctx.restore();

    circuloTrazo(ctx, 0, 0, r, c.tenue, R * 0.03, 1);
    var ang = -Math.PI / 2 + TAU * 0.82 * e;
    circuloTrazo(ctx, 0, 0, r, c.acento, R * 0.055, e, -Math.PI / 2, -Math.PI / 2 + TAU * 0.82);

    var esc = 0.82 + 0.18 * suave(limitar(e * 1.4, 0, 1));
    ctx.save();
    ctx.translate(Math.cos(ang) * r, Math.sin(ang) * r);
    ctx.globalAlpha = limitar((e - 0.05) * 3, 0, 1);
    ctx.fillStyle = c.acento2;
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.055, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(0, R * 0.02);
    ctx.scale(esc, esc);
    var tam = R * 0.56;
    if (String(texto).length > 3) tam = R * 0.42;
    rotulo(ctx, String(texto), 0, 0, tam, c.tinta, '800');
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = limitar((e - 0.4) * 2, 0, 1);
    ctx.strokeStyle = c.acento2;
    ctx.lineWidth = R * 0.03;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-R * 0.20, R * 0.72);
    ctx.lineTo(R * 0.20, R * 0.72);
    ctx.stroke();
    ctx.restore();
  }

  function dibujarCheck(ctx, R, p, c, escena, tiempo) {
    var e = suave(p);
    var r = R * 0.54;

    ctx.save();
    ctx.globalAlpha = 0.10 * e;
    ctx.fillStyle = c.acento;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();
    ctx.restore();

    circuloTrazo(ctx, 0, 0, r, c.acento, R * 0.05, limitar(e * 1.2, 0, 1));

    var pc = limitar((e - 0.28) * 2.1, 0, 1);
    trazo(ctx, c.tinta, R * 0.075, pc, function (x) {
      x.moveTo(-R * 0.26, R * 0.02);
      x.lineTo(-R * 0.06, R * 0.22);
      x.lineTo(R * 0.30, -R * 0.24);
    });

    var pb = limitar((e - 0.55) * 2.6, 0, 1);
    for (var i = 0; i < 8; i++) {
      var ang = (i / 8) * TAU + Math.PI / 8;
      var r1 = r * 1.12, r2 = r * (1.12 + 0.12 * pb);
      ctx.save();
      ctx.globalAlpha = pb;
      ctx.strokeStyle = i % 2 ? c.acento2 : c.acento;
      ctx.lineWidth = R * 0.028;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang) * r1, Math.sin(ang) * r1);
      ctx.lineTo(Math.cos(ang) * r2, Math.sin(ang) * r2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function dibujarFormula(ctx, R, p, c, escena, tiempo) {
    var e = suave(p);
    var texto = escena.texto || 'a + b = c';
    var tokens = texto.replace(/=/g, ' = ').replace(/→/g, ' → ').split(/\s+/).filter(Boolean).slice(0, 7);

    var tam = R * 0.17;
    ctx.save();
    ctx.font = '800 ' + tam + 'px ' + FUENTE;
    var anchos = tokens.map(function (tk) {
      var operador = /^(=|→|\+|-|×|÷)$/.test(tk);
      return operador ? ctx.measureText(tk).width + R * 0.08 : Math.max(R * 0.22, ctx.measureText(tk).width + R * 0.16);
    });
    var total = anchos.reduce(function (a, b) { return a + b; }, 0) + R * 0.06 * (tokens.length - 1);
    var escala = Math.min(1, (R * 1.9) / Math.max(1, total));
    ctx.restore();

    ctx.save();
    ctx.scale(escala, escala);
    var x = -total / 2;
    for (var i = 0; i < tokens.length; i++) {
      var tk = tokens[i];
      var operador = /^(=|→|\+|-|×|÷)$/.test(tk);
      var pi = limitar((e - i * 0.1) * 2.4, 0, 1);
      if (pi > 0) {
        ctx.save();
        ctx.globalAlpha = pi;
        ctx.translate(0, (1 - suave(pi)) * R * 0.08);
        var w = anchos[i];
        if (!operador) {
          caja(ctx, x, -R * 0.16, w, R * 0.32, R * 0.06, c.panel, c.tenue, R * 0.012);
          rotulo(ctx, tk, x + w / 2, R * 0.005, tam, i === tokens.length - 1 ? c.acento2 : c.tinta, '800');
        } else {
          rotulo(ctx, tk, x + w / 2, R * 0.005, tam, c.acento, '700');
        }
        ctx.restore();
      }
      x += anchos[i] + R * 0.06;
    }
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = limitar((e - 0.6) * 2, 0, 1);
    ctx.strokeStyle = c.acento2;
    ctx.lineWidth = R * 0.03;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-R * 0.36, R * 0.36);
    ctx.lineTo(-R * 0.36 + R * 0.72 * limitar((e - 0.6) * 2, 0, 1), R * 0.36);
    ctx.stroke();
    ctx.restore();
  }

  function dibujarCirculoForma(ctx, R, p, c, escena, tiempo) {
    var e = suave(p);
    var radios = [0.24, 0.42, 0.60];
    var colores = [c.acento2, c.acento, c.tenue];

    for (var i = 0; i < radios.length; i++) {
      var pi = limitar((e - i * 0.12) * 2.1, 0, 1);
      if (pi <= 0) continue;
      var r = R * radios[i];
      circuloTrazo(ctx, 0, 0, r, colores[i], R * (i === 1 ? 0.045 : 0.028), pi);
      if (i === 2) {
        ctx.save();
        ctx.globalAlpha = pi * 0.7;
        ctx.strokeStyle = c.tenue;
        ctx.lineWidth = R * 0.02;
        for (var k = 0; k < 12; k++) {
          var a = (k / 12) * TAU;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * (r + R * 0.03), Math.sin(a) * (r + R * 0.03));
          ctx.lineTo(Math.cos(a) * (r + R * 0.08), Math.sin(a) * (r + R * 0.08));
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    var ang = tiempo * 1.25;
    var orb = R * 0.42;
    ctx.save();
    ctx.globalAlpha = limitar((e - 0.3) * 2.5, 0, 1);
    ctx.fillStyle = c.acento;
    ctx.beginPath();
    ctx.arc(Math.cos(ang) * orb, Math.sin(ang) * orb, R * 0.052, 0, TAU);
    ctx.fill();
    ctx.globalAlpha *= 0.3;
    ctx.beginPath();
    ctx.arc(Math.cos(ang) * orb, Math.sin(ang) * orb, R * 0.11, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = limitar((e - 0.15) * 3, 0, 1);
    ctx.fillStyle = c.acento2;
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.075, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function dibujarSubrayado(ctx, R, p, c, escena, tiempo) {
    var e = suave(p);
    var filas = [
      { ancho: 0.98, y: -0.22, alfa: 0.20 },
      { ancho: 0.76, y: 0.04, alfa: 0.14 },
      { ancho: 0.52, y: 0.30, alfa: 0.10 }
    ];

    for (var i = 0; i < filas.length; i++) {
      var pi = limitar((e - i * 0.1) * 2.4, 0, 1);
      var f = filas[i];
      var w = R * f.ancho * suave(pi);
      ctx.save();
      ctx.globalAlpha = f.alfa * pi;
      ctx.fillStyle = c.tinta;
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(-R * f.ancho / 2, R * f.y - R * 0.055, w, R * 0.11, R * 0.055);
      } else {
        ctx.rect(-R * f.ancho / 2, R * f.y - R * 0.055, w, R * 0.11);
      }
      ctx.fill();
      ctx.restore();
    }

    var ph = limitar((e - 0.35) * 2, 0, 1);
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = c.acento2;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(-R * 0.47, R * 0.015, R * 0.94 * suave(ph), R * 0.09, R * 0.045);
    } else {
      ctx.rect(-R * 0.47, R * 0.015, R * 0.94 * suave(ph), R * 0.09);
    }
    ctx.fill();
    ctx.restore();

    var ps = limitar((e - 0.5) * 1.9, 0, 1);
    ctx.save();
    ctx.strokeStyle = c.acento;
    ctx.lineWidth = R * 0.045;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-R * 0.49, R * 0.48);
    ctx.lineTo(-R * 0.49 + R * 0.98 * suave(ps), R * 0.48);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = limitar((e - 0.75) * 3, 0, 1);
    ctx.fillStyle = c.acento2;
    ctx.beginPath();
    ctx.arc(R * 0.55, R * 0.48, R * 0.035, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function recortar(txt, max) {
    txt = String(txt || '').trim();
    if (txt.length <= max) return txt;
    return txt.slice(0, max - 1).trim() + '…';
  }

  /* ---------- personajes ---------- */

  var PERSONAJES = [
    { id: 'buho', nombre: 'Búho' },
    { id: 'gato', nombre: 'Gatito' },
    { id: 'robot', nombre: 'Robot' },
    { id: 'planta', nombre: 'Plantita' },
    { id: 'nube', nombre: 'Nubecita' },
    { id: 'ninguno', nombre: 'Sin personaje' }
  ];

  var COLORES_PERSONAJE = {
    buho: {
      cuerpo: '#f6b93d', cuerpo2: '#e09a1f', panza: '#ffe8ac',
      borde: '#8a5712', pico: '#ff8a3d', pupila: '#2b1b0a',
      blanco: '#fffdf5', mejilla: 'rgba(255,120,120,0.45)', boca: '#b5405c'
    },
    gato: {
      cuerpo: '#ff9d63', cuerpo2: '#ef8348', panza: '#ffe6d4',
      borde: '#9c4e24', pupila: '#3b2114', blanco: '#fffaf4',
      mejilla: 'rgba(255,120,150,0.42)', boca: '#b5405c'
    },
    robot: {
      cuerpo: '#9bd9f5', cuerpo2: '#6fc3e8', panza: '#eafaff',
      borde: '#2b6d8f', pupila: '#38e8ff', blanco: '#ffffff',
      pantalla: '#15233d', mejilla: 'rgba(56,232,255,0.30)', boca: '#b5405c'
    },
    planta: {
      cuerpo: '#5fd18b', cuerpo2: '#3fb56e', panza: '#e6fff0',
      borde: '#2b7a4c', pupila: '#234532', blanco: '#fffdf5',
      petalo: '#ff8fb1', centro: '#ffe08a', maceta: '#e2725b',
      maceta2: '#c85a45', mejilla: 'rgba(255,120,150,0.42)', boca: '#b5405c'
    },
    nube: {
      cuerpo: '#e9f5ff', cuerpo2: '#c9e7fb', panza: '#ffffff',
      borde: '#5f9dbf', pupila: '#2c4a63', blanco: '#ffffff',
      mejilla: 'rgba(120,170,255,0.35)', boca: '#b5405c'
    }
  };

  function coloresDe(tipo) {
    return COLORES_PERSONAJE[tipo] || COLORES_PERSONAJE.buho;
  }

  function elip(ctx, x, y, rx, ry, relleno, borde, grosor, rot) {
    ctx.save();
    ctx.translate(x, y);
    if (rot) ctx.rotate(rot);
    ctx.beginPath();
    ctx.ellipse(0, 0, Math.max(0.001, rx), Math.max(0.001, ry), 0, 0, TAU);
    if (relleno) { ctx.fillStyle = relleno; ctx.fill(); }
    if (borde) { ctx.strokeStyle = borde; ctx.lineWidth = grosor || 0.02; ctx.stroke(); }
    ctx.restore();
  }

  function corazon(ctx, x, y, tam, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(tam, tam);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, 0.35);
    ctx.bezierCurveTo(-0.62, -0.15, -0.38, -0.68, 0, -0.30);
    ctx.bezierCurveTo(0.38, -0.68, 0.62, -0.15, 0, 0.35);
    ctx.fill();
    ctx.restore();
  }

  function brazoUnit(ctx, x0, y0, cx, cy, x1, y1, color, ancho) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = ancho;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(cx, cy, x1, y1);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x1, y1, ancho * 0.60, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function brazosCaricatura(ctx, col, pose, t, y, sep, ancho) {
    var color = col.cuerpo2 || col.cuerpo;
    var g = {
      idle: { lx: -sep - 0.10, ly: y + 0.34, rx: sep + 0.10, ry: y + 0.34 },
      idea: { lx: -sep - 0.10, ly: y + 0.34, rx: sep + 0.16, ry: y - 0.54 },
      point: { lx: -sep - 0.58, ly: y + 0.04, rx: sep + 0.10, ry: y + 0.34 },
      celebrate: { lx: -sep - 0.22, ly: y - 0.48, rx: sep + 0.22, ry: y - 0.48 },
      wave: { lx: -sep - 0.10, ly: y + 0.34, rx: sep + 0.24, ry: y - 0.56 }
    }[pose] || { lx: -sep - 0.10, ly: y + 0.34, rx: sep + 0.10, ry: y + 0.34 };
    var rx = g.rx, ry = g.ry;
    if (pose === 'wave') {
      rx += Math.sin(t * 9) * 0.05;
      ry += Math.cos(t * 9) * 0.02;
    }
    brazoUnit(ctx, -sep, y, -sep - 0.08, y + 0.16, g.lx, g.ly, color, ancho);
    brazoUnit(ctx, sep, y, sep + 0.08, y + 0.16, rx, ry, color, ancho);
  }

  function ojoCaricatura(ctx, x, y, r, col, modo, parpadeo, mirada) {
    if (modo === 'feliz') {
      ctx.save();
      ctx.strokeStyle = col.pupila;
      ctx.lineWidth = Math.max(0.018, r * 0.28);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(x, y + r * 0.22, r * 0.62, Math.PI * 1.12, Math.PI * 1.88);
      ctx.stroke();
      ctx.restore();
      return;
    }
    if (parpadeo) {
      ctx.save();
      ctx.strokeStyle = col.pupila;
      ctx.lineWidth = Math.max(0.016, r * 0.22);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x - r * 0.7, y);
      ctx.lineTo(x + r * 0.7, y);
      ctx.stroke();
      ctx.restore();
      return;
    }
    var altoOjo = modo === 'asombrado' ? 1.06 : 0.98;
    elip(ctx, x, y, r, r * altoOjo, col.blanco, col.borde, Math.max(0.012, r * 0.12));
    var dx = (mirada || 0) * r * 0.24;
    var dy = modo === 'asombrado' ? -r * 0.06 : 0;
    elip(ctx, x + dx, y + dy + r * 0.02, r * 0.44, r * (modo === 'asombrado' ? 0.52 : 0.46), col.pupila, null, 0);
    elip(ctx, x + dx - r * 0.15, y + dy - r * 0.14, r * 0.16, r * 0.16, 'rgba(255,255,255,0.92)', null, 0);
  }

  function bocaCaricatura(ctx, x, y, r, col, tipo) {
    ctx.save();
    ctx.strokeStyle = col.pupila;
    ctx.fillStyle = col.pupila;
    ctx.lineWidth = Math.max(0.015, r * 0.22);
    ctx.lineCap = 'round';
    if (tipo === 'abierta') {
      ctx.beginPath();
      ctx.ellipse(x, y, r * 0.55, r * 0.64, 0, 0, TAU);
      ctx.fillStyle = col.boca || '#b5405c';
      ctx.fill();
      ctx.strokeStyle = col.pupila;
      ctx.stroke();
    } else if (tipo === 'o') {
      ctx.beginPath();
      ctx.ellipse(x, y, r * 0.30, r * 0.40, 0, 0, TAU);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(x, y - r * 0.20, r * 0.62, Math.PI * 0.14, Math.PI * 0.86);
      ctx.stroke();
    }
    ctx.restore();
  }

  function mejillas(ctx, x, y, r, color) {
    elip(ctx, -x, y, r, r * 0.62, color, null, 0);
    elip(ctx, x, y, r, r * 0.62, color, null, 0);
  }

  function dibujarBuho(ctx, col, pose, t) {
    var parp = (t % 4.6) < 0.10;
    var mir = pose === 'point' ? -1 : 0;
    var modo = pose === 'celebrate' ? 'feliz' : (pose === 'idea' ? 'asombrado' : 'normal');

    elip(ctx, 0, 1.08, 0.58, 0.10, 'rgba(0,0,0,0.20)', null, 0);

    ctx.save();
    ctx.fillStyle = col.cuerpo2;
    ctx.strokeStyle = col.borde;
    ctx.lineWidth = 0.035;
    [-1, 1].forEach(function (s) {
      ctx.beginPath();
      ctx.moveTo(s * 0.55, -0.42);
      ctx.lineTo(s * 0.72, -0.94);
      ctx.lineTo(s * 0.22, -0.70);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });
    ctx.restore();

    elip(ctx, 0, 0.14, 0.60, 0.86, col.cuerpo, col.borde, 0.045);
    elip(ctx, 0, 0.40, 0.38, 0.47, col.panza, 'rgba(0,0,0,0.05)', 0.015);
    elip(ctx, -0.23, 1.03, 0.15, 0.075, col.pico, col.borde, 0.02);
    elip(ctx, 0.23, 1.03, 0.15, 0.075, col.pico, col.borde, 0.02);

    ojoCaricatura(ctx, -0.25, -0.20, 0.25, col, modo, parp, mir);
    ojoCaricatura(ctx, 0.25, -0.20, 0.25, col, modo, parp, mir);

    ctx.save();
    ctx.fillStyle = col.pico;
    ctx.strokeStyle = col.borde;
    ctx.lineWidth = 0.028;
    ctx.beginPath();
    ctx.moveTo(-0.11, 0.03);
    ctx.lineTo(0.11, 0.03);
    ctx.lineTo(0, 0.19);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    mejillas(ctx, 0.45, 0.11, 0.11, col.mejilla);
    brazosCaricatura(ctx, col, pose, t, 0.24, 0.55, 0.15);
  }

  function dibujarGato(ctx, col, pose, t) {
    var parp = (t % 4.1) < 0.11;
    var mir = pose === 'point' ? -1 : 0;
    var modo = pose === 'celebrate' ? 'feliz' : (pose === 'idea' ? 'asombrado' : 'normal');

    ctx.save();
    ctx.strokeStyle = col.cuerpo2;
    ctx.lineWidth = 0.15;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0.44, 0.62);
    ctx.quadraticCurveTo(1.02, 0.68, 0.88, 0.10);
    ctx.stroke();
    ctx.strokeStyle = col.panza;
    ctx.lineWidth = 0.09;
    ctx.beginPath();
    ctx.moveTo(0.96, 0.38);
    ctx.lineTo(0.90, 0.12);
    ctx.stroke();
    ctx.restore();

    elip(ctx, 0, 1.08, 0.50, 0.09, 'rgba(0,0,0,0.20)', null, 0);

    elip(ctx, 0, 0.60, 0.45, 0.47, col.cuerpo, col.borde, 0.04);
    elip(ctx, 0, 0.68, 0.26, 0.29, col.panza, null, 0);
    elip(ctx, -0.22, 1.00, 0.14, 0.075, col.panza, col.borde, 0.022);
    elip(ctx, 0.22, 1.00, 0.14, 0.075, col.panza, col.borde, 0.022);

    ctx.save();
    ctx.fillStyle = col.cuerpo;
    ctx.strokeStyle = col.borde;
    ctx.lineWidth = 0.035;
    [-1, 1].forEach(function (s) {
      ctx.beginPath();
      ctx.moveTo(s * 0.40, -0.56);
      ctx.lineTo(s * 0.60, -1.05);
      ctx.lineTo(s * 0.10, -0.74);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });
    ctx.restore();

    ctx.save();
    ctx.fillStyle = col.mejilla;
    [-1, 1].forEach(function (s) {
      ctx.beginPath();
      ctx.moveTo(s * 0.40, -0.63);
      ctx.lineTo(s * 0.52, -0.93);
      ctx.lineTo(s * 0.24, -0.75);
      ctx.closePath();
      ctx.fill();
    });
    ctx.restore();

    elip(ctx, 0, -0.26, 0.56, 0.55, col.cuerpo, col.borde, 0.045);

    ctx.save();
    ctx.strokeStyle = col.cuerpo2;
    ctx.lineWidth = 0.04;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-0.10, -0.77);
    ctx.lineTo(-0.10, -0.65);
    ctx.moveTo(0.10, -0.77);
    ctx.lineTo(0.10, -0.65);
    ctx.stroke();
    ctx.restore();

    ojoCaricatura(ctx, -0.21, -0.32, 0.135, col, modo, parp, mir);
    ojoCaricatura(ctx, 0.21, -0.32, 0.135, col, modo, parp, mir);

    ctx.save();
    ctx.fillStyle = '#ef6f8b';
    ctx.beginPath();
    ctx.moveTo(-0.055, -0.12);
    ctx.lineTo(0.055, -0.12);
    ctx.lineTo(0, -0.05);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = col.pupila;
    ctx.lineWidth = 0.022;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(-0.045, -0.045, 0.055, 0.05, Math.PI - 0.05);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0.045, -0.045, 0.055, 0.05, Math.PI - 0.05);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = col.borde;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 0.018;
    ctx.lineCap = 'round';
    [-1, 1].forEach(function (s) {
      ctx.beginPath();
      ctx.moveTo(s * 0.20, -0.24);
      ctx.lineTo(s * 0.66, -0.30);
      ctx.moveTo(s * 0.20, -0.16);
      ctx.lineTo(s * 0.68, -0.16);
      ctx.moveTo(s * 0.20, -0.08);
      ctx.lineTo(s * 0.66, -0.02);
      ctx.stroke();
    });
    ctx.restore();

    mejillas(ctx, 0.37, -0.20, 0.10, col.mejilla);
    brazosCaricatura(ctx, col, pose, t, 0.42, 0.44, 0.13);
  }

  function dibujarRobot(ctx, col, pose, t) {
    var parp = (t % 5.0) < 0.08;
    var modo = pose === 'celebrate' ? 'feliz' : 'normal';

    elip(ctx, 0, 1.10, 0.52, 0.09, 'rgba(0,0,0,0.20)', null, 0);

    ctx.save();
    ctx.strokeStyle = col.borde;
    ctx.lineWidth = 0.035;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -0.76);
    ctx.lineTo(0, -1.02);
    ctx.stroke();
    ctx.fillStyle = col.pupila;
    ctx.beginPath();
    ctx.arc(0, -1.08, 0.085, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 0.28;
    ctx.beginPath();
    ctx.arc(0, -1.08, 0.16, 0, TAU);
    ctx.fill();
    ctx.restore();

    caja(ctx, -0.34, 0.94, 0.20, 0.16, 0.06, col.cuerpo2, col.borde, 0.03);
    caja(ctx, 0.14, 0.94, 0.20, 0.16, 0.06, col.cuerpo2, col.borde, 0.03);
    caja(ctx, -0.50, 0.16, 1.00, 0.80, 0.18, col.cuerpo, col.borde, 0.045);
    caja(ctx, -0.24, 0.36, 0.48, 0.36, 0.10, col.pantalla, null, 0);
    corazon(ctx, 0, 0.54, 0.15, '#ff5c8a');

    caja(ctx, -0.55, -0.78, 1.10, 0.74, 0.20, col.cuerpo, col.borde, 0.05);
    caja(ctx, -0.40, -0.66, 0.80, 0.42, 0.12, col.pantalla, null, 0);
    caja(ctx, -0.66, -0.50, 0.12, 0.22, 0.05, col.cuerpo2, col.borde, 0.028);
    caja(ctx, 0.54, -0.50, 0.12, 0.22, 0.05, col.cuerpo2, col.borde, 0.028);

    if (modo === 'feliz') {
      ctx.save();
      ctx.strokeStyle = col.pupila;
      ctx.lineWidth = 0.05;
      ctx.lineCap = 'round';
      [-0.18, 0.18].forEach(function (x) {
        ctx.beginPath();
        ctx.arc(x, -0.44, 0.09, Math.PI * 1.10, Math.PI * 1.90);
        ctx.stroke();
      });
      ctx.restore();
    } else if (parp) {
      ctx.save();
      ctx.strokeStyle = col.pupila;
      ctx.lineWidth = 0.04;
      ctx.lineCap = 'round';
      [-0.18, 0.18].forEach(function (x) {
        ctx.beginPath();
        ctx.moveTo(x - 0.07, -0.46);
        ctx.lineTo(x + 0.07, -0.46);
        ctx.stroke();
      });
      ctx.restore();
    } else {
      [-0.18, 0.18].forEach(function (x) {
        ctx.save();
        ctx.fillStyle = col.pupila;
        ctx.beginPath();
        ctx.arc(x, -0.46, 0.075, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 0.28;
        ctx.beginPath();
        ctx.arc(x, -0.46, 0.14, 0, TAU);
        ctx.fill();
        ctx.restore();
      });
    }

    ctx.save();
    ctx.strokeStyle = col.pupila;
    ctx.lineWidth = 0.035;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, -0.35, 0.13, Math.PI * 0.18, Math.PI * 0.82);
    ctx.stroke();
    ctx.restore();

    brazosCaricatura(ctx, col, pose, t, 0.32, 0.50, 0.13);
  }

  function dibujarPlanta(ctx, col, pose, t) {
    var parp = (t % 4.8) < 0.10;
    var mir = pose === 'point' ? -1 : 0;
    var modo = pose === 'celebrate' ? 'feliz' : (pose === 'idea' ? 'asombrado' : 'normal');

    elip(ctx, 0, 1.10, 0.50, 0.09, 'rgba(0,0,0,0.20)', null, 0);

    ctx.save();
    ctx.fillStyle = col.maceta;
    ctx.strokeStyle = col.borde;
    ctx.lineWidth = 0.04;
    ctx.beginPath();
    ctx.moveTo(-0.46, 0.56);
    ctx.lineTo(0.46, 0.56);
    ctx.lineTo(0.36, 1.04);
    ctx.lineTo(-0.36, 1.04);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    caja(ctx, -0.55, 0.48, 1.10, 0.18, 0.08, col.maceta2, col.borde, 0.03);

    ctx.save();
    ctx.strokeStyle = col.cuerpo2;
    ctx.lineWidth = 0.075;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0.56);
    ctx.lineTo(0, -0.06);
    ctx.stroke();
    ctx.restore();

    var hojas = {
      idle: [[-0.34, 0.26, -0.55], [0.34, 0.26, 0.55]],
      idea: [[-0.32, 0.26, -0.55], [0.44, -0.02, -1.05]],
      point: [[-0.58, 0.10, -1.45], [0.32, 0.26, 0.55]],
      celebrate: [[-0.44, -0.02, -0.95], [0.44, -0.02, 0.95]],
      wave: [[-0.32, 0.26, -0.55], [0.46, -0.04, 1.0]]
    }[pose] || [];
    hojas.forEach(function (h) {
      elip(ctx, h[0], h[1], 0.23, 0.09, col.cuerpo, col.borde, 0.022, h[2]);
      elip(ctx, h[0], h[1], 0.16, 0.04, col.cuerpo2, null, 0, h[2]);
    });

    for (var i = 0; i < 6; i++) {
      var a = -Math.PI / 2 + (i / 6) * TAU;
      var px = Math.cos(a) * 0.34;
      var py = -0.45 + Math.sin(a) * 0.32;
      elip(ctx, px, py, 0.17, 0.24, col.petalo, col.borde, 0.025, a + Math.PI / 2);
    }
    elip(ctx, 0, -0.45, 0.35, 0.33, col.centro, col.borde, 0.035);

    ojoCaricatura(ctx, -0.13, -0.50, 0.075, col, modo, parp, mir);
    ojoCaricatura(ctx, 0.13, -0.50, 0.075, col, modo, parp, mir);
    bocaCaricatura(ctx, 0, -0.38, 0.10, col, pose === 'celebrate' ? 'abierta' : 'sonrisa');
    mejillas(ctx, 0.22, -0.38, 0.07, col.mejilla);
  }

  function dibujarNube(ctx, col, pose, t) {
    var parp = (t % 4.3) < 0.10;
    var mir = pose === 'point' ? -1 : 0;
    var modo = pose === 'celebrate' ? 'feliz' : (pose === 'idea' ? 'asombrado' : 'normal');

    elip(ctx, 0, 0.92, 0.48, 0.07, 'rgba(0,0,0,0.12)', null, 0);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-0.60, 0.34);
    ctx.bezierCurveTo(-0.82, 0.34, -0.86, 0.06, -0.64, -0.04);
    ctx.bezierCurveTo(-0.68, -0.38, -0.30, -0.54, -0.10, -0.32);
    ctx.bezierCurveTo(0.04, -0.68, 0.50, -0.62, 0.50, -0.26);
    ctx.bezierCurveTo(0.78, -0.28, 0.88, 0.04, 0.66, 0.16);
    ctx.bezierCurveTo(0.82, 0.38, 0.54, 0.50, 0.34, 0.36);
    ctx.lineTo(-0.60, 0.34);
    ctx.closePath();
    ctx.fillStyle = col.cuerpo;
    ctx.fill();
    ctx.strokeStyle = col.borde;
    ctx.lineWidth = 0.045;
    ctx.stroke();
    ctx.restore();

    ojoCaricatura(ctx, -0.17, 0.02, 0.10, col, modo, parp, mir);
    ojoCaricatura(ctx, 0.17, 0.02, 0.10, col, modo, parp, mir);
    bocaCaricatura(ctx, 0, 0.17, 0.10, col, pose === 'celebrate' ? 'abierta' : 'sonrisa');
    mejillas(ctx, 0.34, 0.12, 0.075, col.mejilla);
    brazosCaricatura(ctx, col, pose, t, 0.16, 0.55, 0.075);
  }

  function dibujarCaracter(ctx, tipo, c, pose, t) {
    var col = coloresDe(tipo);
    if (tipo === 'gato') dibujarGato(ctx, col, pose, t);
    else if (tipo === 'robot') dibujarRobot(ctx, col, pose, t);
    else if (tipo === 'planta') dibujarPlanta(ctx, col, pose, t);
    else if (tipo === 'nube') dibujarNube(ctx, col, pose, t);
    else dibujarBuho(ctx, col, pose, t);
  }

  function poseDeVisual(visual) {
    if (visual === 'idea') return 'idea';
    if (visual === 'check') return 'celebrate';
    if (visual === 'flecha' || visual === 'pasos' || visual === 'ciclo' ||
        visual === 'comparar' || visual === 'grafico') return 'point';
    return 'idle';
  }

  function envolverEnLineas(ctx, texto, maxAncho, tam) {
    var palabras = String(texto || '').split(/\s+/).filter(Boolean);
    var lineas = [];
    var actual = [];
    var ancho = 0;
    ctx.save();
    ctx.font = '800 ' + tam + 'px ' + FUENTE;
    var espacio = ctx.measureText(' ').width;
    palabras.forEach(function (palabra) {
      var w = ctx.measureText(palabra).width;
      if (actual.length && ancho + espacio + w > maxAncho) {
        lineas.push(actual.join(' '));
        actual = [palabra];
        ancho = w;
      } else {
        ancho += (actual.length ? espacio : 0) + w;
        actual.push(palabra);
      }
    });
    if (actual.length) lineas.push(actual.join(' '));
    ctx.restore();
    return lineas;
  }

  function dibujarGlobo(ctx, cx, abajo, W, S, texto, c) {
    var frase = recortar(String(texto || '¡Hola!').trim() || '¡Hola!', 90);
    var tam = S * 0.044;
    var maxAncho = W * 0.68;
    var lineas = envolverEnLineas(ctx, frase, maxAncho, tam);
    var vueltas = 0;
    while (lineas.length > 4 && vueltas < 6) {
      tam *= 0.88;
      lineas = envolverEnLineas(ctx, frase, maxAncho, tam);
      vueltas++;
    }
    if (lineas.length > 4) lineas = lineas.slice(0, 4);

    ctx.save();
    ctx.font = '800 ' + tam + 'px ' + FUENTE;
    var anchoTexto = 0;
    lineas.forEach(function (l) {
      anchoTexto = Math.max(anchoTexto, ctx.measureText(l).width);
    });
    ctx.restore();

    var padX = tam * 0.95;
    var padY = tam * 0.72;
    var ancho = anchoTexto + padX * 2;
    var alto = lineas.length * tam * 1.24 + padY * 2;
    var x = cx - ancho / 2;
    var y = abajo - alto;
    var radio = Math.min(alto / 2, tam * 1.1);
    var grosor = Math.max(2, S * 0.0045);

    var colaAncho = tam * 1.35;
    var colaAlto = tam * 1.5;
    ctx.save();
    ctx.fillStyle = c.panel;
    ctx.strokeStyle = c.acento;
    ctx.lineWidth = grosor;
    ctx.beginPath();
    ctx.moveTo(cx - colaAncho * 0.55, y + alto - 1);
    ctx.lineTo(cx + colaAncho * 0.55, y + alto - 1);
    ctx.lineTo(cx - colaAncho * 0.20, y + alto + colaAlto);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    caja(ctx, x, y, ancho, alto, radio, c.panel, c.acento, grosor);

    ctx.save();
    ctx.font = '800 ' + tam + 'px ' + FUENTE;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = c.tinta;
    var inicio = y + alto / 2 - (lineas.length - 1) * tam * 1.24 / 2;
    lineas.forEach(function (l, i) {
      ctx.fillText(l, cx, inicio + i * tam * 1.24);
    });
    ctx.restore();
  }

  function dibujarMascota(ctx, W, H, S, R, tipo, visual, progreso, t) {
    if (tipo === 'ninguno') return;
    var u = S * 0.058;
    var x = W - S * 0.105;
    var y = H * 0.32 + R * 0.62;
    var pose = poseDeVisual(visual);
    var alfa = limitar(progreso * 3, 0, 1);
    var bob = Math.sin(t * 2.4 + 0.5) * u * 0.05;

    ctx.save();
    ctx.globalAlpha = alfa;
    var g = ctx.createRadialGradient(x, y, 0, x, y, u * 1.5);
    g.addColorStop(0, 'rgba(255,255,255,0.16)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, u * 1.5, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = alfa;
    ctx.translate(x, y + bob);
    ctx.scale(u, u);
    dibujarCaracter(ctx, tipo, null, pose, t);
    ctx.restore();
  }

  function dibujarEscenaPersonaje(ctx, W, H, S, tipo, escena, progreso, c, t) {
    var u = S * 0.155;
    var cy = H * (H > W * 1.2 ? 0.46 : 0.53);
    var e = suave(progreso);
    var bob = Math.sin(t * 2.0) * u * 0.035;
    var headTop = cy - u * 1.12 + bob;

    var g = ctx.createRadialGradient(W / 2, cy - u * 0.2, 0, W / 2, cy - u * 0.2, u * 1.9);
    g.addColorStop(0, c.acento);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save();
    ctx.globalAlpha = 0.20 * e;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(W / 2, cy - u * 0.2, u * 1.9, 0, TAU);
    ctx.fill();
    ctx.restore();

    elip(ctx, W / 2, cy + u * 1.08, u * 0.78, u * 0.10, 'rgba(0,0,0,0.18)', null, 0);

    ctx.save();
    ctx.globalAlpha = e;
    ctx.translate(W / 2, cy + bob);
    var esc = 0.86 + 0.14 * e;
    ctx.scale(u * esc, u * esc);
    dibujarCaracter(ctx, tipo, c, 'wave', t);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = limitar((progreso - 0.18) * 2.2, 0, 1);
    dibujarGlobo(ctx, W / 2, headTop - u * 0.26, W, S, escena.texto, c);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = limitar((progreso - 0.4) * 2, 0, 1) * 0.8;
    for (var i = 0; i < 5; i++) {
      var a = t * 0.7 + i * 1.7;
      var r = u * (0.9 + (i % 3) * 0.35);
      var sx = W / 2 + Math.cos(a) * r * 1.25;
      var sy = cy - u * 0.2 + Math.sin(a) * r * 0.85;
      ctx.fillStyle = i % 2 ? c.acento2 : c.acento;
      ctx.beginPath();
      ctx.arc(sx, sy, Math.max(1.2, S * 0.006), 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  /* ---------- formas para anuncios y negocios ---------- */

  function destellos(ctx, R, e, c, tiempo) {
    for (var i = 0; i < 6; i++) {
      var a = tiempo * 0.55 + i * (TAU / 6);
      var rr = R * (0.88 + 0.05 * Math.sin(tiempo * 1.2 + i));
      var pi = limitar((e - 0.42 - i * 0.04) * 2.4, 0, 1);
      if (pi <= 0) continue;
      var s = R * 0.032;
      ctx.save();
      ctx.globalAlpha = pi * 0.85;
      ctx.fillStyle = i % 2 ? c.acento2 : c.acento;
      ctx.translate(Math.cos(a) * rr, Math.sin(a) * rr * 0.9);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(0, -s * 2.3);
      ctx.lineTo(s * 0.5, -s * 0.5);
      ctx.lineTo(s * 2.3, 0);
      ctx.lineTo(s * 0.5, s * 0.5);
      ctx.lineTo(0, s * 2.3);
      ctx.lineTo(-s * 0.5, s * 0.5);
      ctx.lineTo(-s * 2.3, 0);
      ctx.lineTo(-s * 0.5, -s * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  function dibujarPrecio(ctx, R, p, c, escena, tiempo) {
    var e = suave(p);
    var texto = String((escena.extra && escena.extra.precio) || '$');
    var w = R * 1.46;
    var h = R * 0.68;
    var esc = 0.86 + 0.14 * suave(limitar(e * 1.6, 0, 1));

    ctx.save();
    ctx.translate(0, R * 0.02);
    ctx.rotate(-0.05 + 0.03 * Math.sin(tiempo * 0.9));
    ctx.scale(esc, esc);
    ctx.globalAlpha = limitar(e * 2.4, 0, 1);

    ctx.save();
    ctx.globalAlpha = 0.18 * e;
    caja(ctx, -w / 2 - R * 0.04, -h / 2 - R * 0.04, w + R * 0.08, h + R * 0.08, R * 0.2, c.acento);
    ctx.restore();

    caja(ctx, -w / 2, -h / 2, w, h, R * 0.15, c.panel, c.acento, R * 0.025);

    ctx.save();
    ctx.fillStyle = c.tenue;
    ctx.beginPath();
    ctx.arc(-w / 2 + R * 0.16, 0, R * 0.042, 0, TAU);
    ctx.fill();
    ctx.restore();

    var tam = R * 0.42;
    if (texto.length > 4) tam = R * 0.32;
    if (texto.length > 7) tam = R * 0.25;
    rotulo(ctx, texto, R * 0.05, R * 0.008, tam, c.acento, '800');
    ctx.restore();

    destellos(ctx, R, e, c, tiempo);
  }

  function dibujarOferta(ctx, R, p, c, escena, tiempo) {
    var e = suave(p);
    var texto = String((escena.extra && escena.extra.oferta) || '%');
    var r = R * 0.62;
    var puntas = 13;

    ctx.save();
    ctx.translate(0, R * 0.01);
    ctx.rotate(0.1 * Math.sin(tiempo * 0.6));
    var esc = 0.6 + 0.4 * suave(limitar(e * 1.6, 0, 1));
    ctx.scale(esc, esc);
    ctx.globalAlpha = limitar(e * 2.2, 0, 1) * 0.94;

    var g = ctx.createRadialGradient(0, -r * 0.25, r * 0.12, 0, 0, r * 1.15);
    g.addColorStop(0, c.acento2);
    g.addColorStop(1, c.acento);
    ctx.fillStyle = g;
    ctx.beginPath();
    for (var i = 0; i < puntas * 2; i++) {
      var a = (i / (puntas * 2)) * TAU - Math.PI / 2;
      var rr = i % 2 ? r * 0.78 : r * 1.05;
      var x = Math.cos(a) * rr;
      var y = Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    circuloTrazo(ctx, 0, R * 0.01, r * 0.70, c.oscuro ? 'rgba(0,0,0,0.22)' : 'rgba(255,255,255,0.5)',
      R * 0.012, limitar((e - 0.3) * 2, 0, 1));

    var tam = R * 0.44;
    if (texto.length > 3) tam = R * 0.35;
    if (texto.length > 5) tam = R * 0.27;
    rotulo(ctx, texto, 0, R * 0.012, tam, c.oscuro ? '#08101f' : '#fffdf8', '800');

    destellos(ctx, R, e, c, tiempo);
  }

  function dibujarServicio(ctx, R, p, c, escena, tiempo) {
    var e = suave(p);
    var items = (escena.extra && escena.extra.items) || [];
    if (!items.length) items = [recortar(escena.texto || 'Servicios', 18)];
    items = items.slice(0, 3);

    var alto = R * 0.25;
    var ancho = R * 1.74;
    var sep = alto * 1.34;
    var y0 = -((items.length - 1) * sep) / 2;

    items.forEach(function (txt, i) {
      var pi = limitar((e - i * 0.16) * 2.6, 0, 1);
      if (pi <= 0) return;
      var despl = (1 - suave(pi)) * R * 0.2;
      ctx.save();
      ctx.globalAlpha = pi;
      ctx.translate(-despl, y0 + i * sep);
      caja(ctx, -ancho / 2, -alto / 2, ancho, alto, alto * 0.5, c.panel, c.tenue, R * 0.012);

      var cx = -ancho / 2 + alto * 0.58;
      ctx.fillStyle = c.acento;
      ctx.beginPath();
      ctx.arc(cx, 0, alto * 0.30, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = c.oscuro ? '#07101f' : '#fffdf8';
      ctx.lineWidth = alto * 0.09;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - alto * 0.13, 0);
      ctx.lineTo(cx - alto * 0.02, alto * 0.11);
      ctx.lineTo(cx + alto * 0.16, -alto * 0.11);
      ctx.stroke();

      rotulo(ctx, recortar(txt, 24), -ancho / 2 + alto * 1.08, R * 0.004, alto * 0.38, c.tinta, '700', 'left');
      ctx.restore();
    });
  }

  function dibujarHorario(ctx, R, p, c, escena, tiempo) {
    var e = suave(p);
    var r = R * 0.58;

    ctx.save();
    ctx.globalAlpha = 0.12 * e;
    ctx.fillStyle = c.acento;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();
    ctx.restore();

    circuloTrazo(ctx, 0, 0, r, c.tenue, R * 0.026, 1);
    circuloTrazo(ctx, 0, 0, r, c.acento, R * 0.042, limitar(e * 1.2, 0, 1), -Math.PI / 2, -Math.PI / 2 + TAU * 0.92);

    for (var i = 0; i < 12; i++) {
      var a = (i / 12) * TAU - Math.PI / 2;
      var pt = limitar((e - 0.18 - i * 0.02) * 3, 0, 1);
      ctx.save();
      ctx.globalAlpha = pt * (i % 3 === 0 ? 1 : 0.5);
      ctx.strokeStyle = i % 3 === 0 ? c.acento2 : c.suave;
      ctx.lineWidth = R * 0.013;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.80, Math.sin(a) * r * 0.80);
      ctx.lineTo(Math.cos(a) * r * 0.89, Math.sin(a) * r * 0.89);
      ctx.stroke();
      ctx.restore();
    }

    var avance = suave(limitar((e - 0.25) * 1.7, 0, 1));
    var angHora = -Math.PI / 2 + (9.5 / 12) * TAU * avance;
    var angMin = -Math.PI / 2 + (6 / 12) * TAU * avance;

    ctx.save();
    ctx.strokeStyle = c.tinta;
    ctx.lineCap = 'round';
    ctx.lineWidth = R * 0.05;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(angHora) * r * 0.48, Math.sin(angHora) * r * 0.48);
    ctx.stroke();
    ctx.lineWidth = R * 0.028;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(angMin) * r * 0.72, Math.sin(angMin) * r * 0.72);
    ctx.stroke();
    ctx.fillStyle = c.acento2;
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.045, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function dibujarContacto(ctx, R, p, c, escena, tiempo) {
    var e = suave(p);
    var w = R * 0.82;
    var h = R * 1.30;
    var esc = 0.84 + 0.16 * suave(limitar(e * 1.5, 0, 1));

    ctx.save();
    ctx.translate(0, R * 0.03);
    ctx.scale(esc, esc);
    ctx.globalAlpha = limitar(e * 2.2, 0, 1);

    caja(ctx, -w / 2, -h / 2, w, h, R * 0.15, c.panel, c.acento, R * 0.024);
    caja(ctx, -w / 2 + R * 0.05, -h / 2 + R * 0.11, w - R * 0.1, h - R * 0.22, R * 0.07,
      c.oscuro ? 'rgba(0,0,0,0.32)' : 'rgba(255,255,255,0.62)');

    ctx.globalAlpha = limitar((e - 0.28) * 3, 0, 1);
    caja(ctx, -w * 0.31, -h * 0.31, w * 0.58, h * 0.19, R * 0.06, c.acento);
    ctx.globalAlpha = limitar((e - 0.48) * 3, 0, 1);
    caja(ctx, -w * 0.06, -h * 0.04, w * 0.36, h * 0.16, R * 0.05, c.acento2);
    ctx.globalAlpha = limitar((e - 0.62) * 3, 0, 1);
    caja(ctx, -w * 0.31, h * 0.19, w * 0.44, h * 0.14, R * 0.045, c.acento);

    ctx.globalAlpha = limitar(e * 2, 0, 1);
    caja(ctx, -w * 0.13, -h / 2 + R * 0.04, w * 0.26, R * 0.022, R * 0.011, c.suave);
    ctx.restore();

    for (var i = 0; i < 3; i++) {
      var pi = limitar((e - 0.5 - i * 0.12) * 2, 0, 1);
      if (pi <= 0) continue;
      ctx.save();
      ctx.globalAlpha = pi * (0.9 - i * 0.22);
      ctx.strokeStyle = c.acento;
      ctx.lineWidth = R * 0.017;
      ctx.beginPath();
      ctx.arc(w * 0.44, -h * 0.30, R * (0.11 + i * 0.10), 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }

  function dibujarUbicacion(ctx, R, p, c, escena, tiempo) {
    var e = suave(p);
    var caida = (1 - suave(limitar(e * 1.9, 0, 1))) * -R * 0.42;

    for (var i = 0; i < 3; i++) {
      var pi = limitar((e - 0.4 - i * 0.14) * 2.2, 0, 1);
      if (pi <= 0) continue;
      ctx.save();
      ctx.globalAlpha = (1 - pi) * 0.85;
      ctx.strokeStyle = c.acento;
      ctx.lineWidth = R * 0.018;
      ctx.beginPath();
      ctx.ellipse(0, R * 0.62, R * (0.22 + pi * 0.44), R * (0.08 + pi * 0.15), 0, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(0, caida);
    ctx.globalAlpha = limitar(e * 2.6, 0, 1);

    var g = ctx.createLinearGradient(0, -R * 0.5, 0, R * 0.5);
    g.addColorStop(0, c.acento);
    g.addColorStop(1, c.acento2);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, -R * 0.14, R * 0.35, Math.PI * 0.78, Math.PI * 2.22);
    ctx.lineTo(0, R * 0.50);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = c.panel;
    ctx.beginPath();
    ctx.arc(0, -R * 0.14, R * 0.145, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function dibujarCta(ctx, R, p, c, escena, tiempo) {
    var e = suave(p);
    var frase = recortar(String(escena.texto || '¡Reserva ya!'), 60);
    var maxAncho = R * 1.74;
    var tam = R * 0.19;
    var lineas = envolverEnLineas(ctx, frase, maxAncho, tam);
    var vueltas = 0;
    while (lineas.length > 3 && vueltas < 6) {
      tam *= 0.88;
      lineas = envolverEnLineas(ctx, frase, maxAncho, tam);
      vueltas++;
    }
    if (lineas.length > 3) lineas = lineas.slice(0, 3);

    ctx.save();
    ctx.font = '800 ' + tam + 'px ' + FUENTE;
    var anchoTexto = 0;
    lineas.forEach(function (l) { anchoTexto = Math.max(anchoTexto, ctx.measureText(l).width); });
    ctx.restore();

    var padX = tam * 1.25;
    var padY = tam * 0.9;
    var w = anchoTexto + padX * 2;
    var h = lineas.length * tam * 1.22 + padY * 2;
    var esc = 0.8 + 0.2 * suave(limitar(e * 1.5, 0, 1));

    var pulso = (tiempo * 0.85) % 1;
    ctx.save();
    ctx.globalAlpha = (1 - pulso) * 0.20 * e;
    caja(ctx, -w / 2 - pulso * R * 0.18, -h / 2 - pulso * R * 0.18,
      w + pulso * R * 0.36, h + pulso * R * 0.36, h / 2 + pulso * R * 0.18, c.acento);
    ctx.restore();

    ctx.save();
    ctx.translate(0, R * 0.02);
    ctx.scale(esc, esc);
    ctx.globalAlpha = limitar(e * 2.4, 0, 1);
    var g = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
    g.addColorStop(0, c.acento);
    g.addColorStop(1, c.acento2);
    caja(ctx, -w / 2, -h / 2, w, h, h / 2, g);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = limitar((e - 0.22) * 2.6, 0, 1);
    ctx.font = '800 ' + tam + 'px ' + FUENTE;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = c.oscuro ? '#08101f' : '#fffdf8';
    var yIni = R * 0.02 - (lineas.length - 1) * tam * 0.61;
    lineas.forEach(function (l, i) { ctx.fillText(l, 0, yIni + i * tam * 1.22); });
    ctx.restore();
  }

  var FORMAS = {
    precio: dibujarPrecio,
    oferta: dibujarOferta,
    servicio: dibujarServicio,
    horario: dibujarHorario,
    contacto: dibujarContacto,
    ubicacion: dibujarUbicacion,
    cta: dibujarCta,
    idea: dibujarIdea,
    flecha: dibujarFlecha,
    pasos: dibujarPasos,
    ciclo: dibujarCiclo,
    comparar: dibujarComparar,
    grafico: dibujarGrafico,
    numero: dibujarNumero,
    check: dibujarCheck,
    formula: dibujarFormula,
    circulo: dibujarCirculoForma,
    subrayado: dibujarSubrayado
  };

  function pintar(ctx, W, H, escena, progreso, nombrePaleta, tiempo, nombrePersonaje) {
    var c = PALETAS[nombrePaleta] || PALETAS.pizarra;
    var S = Math.min(W, H);
    var R = S * (H > W * 1.2 ? 0.27 : 0.24);
    var personaje = nombrePersonaje || 'buho';
    var t = tiempo || 0;

    if (escena.visual === 'personaje') {
      if (personaje === 'ninguno') {
        var formaBase = FORMAS.idea;
        ctx.save();
        ctx.translate(W / 2, H * 0.32);
        formaBase(ctx, R, progreso, c, escena, t);
        ctx.restore();
      } else {
        dibujarEscenaPersonaje(ctx, W, H, S, personaje, escena, progreso, c, t);
      }
      return;
    }

    var forma = FORMAS[escena.visual] || FORMAS.idea;
    ctx.save();
    ctx.translate(W / 2, H * 0.32);
    forma(ctx, R, progreso, c, escena, t);
    ctx.restore();

    dibujarMascota(ctx, W, H, S, R, personaje, escena.visual, progreso, t);
  }

  global.Dibujos = {
    PALETAS: PALETAS,
    PERSONAJES: PERSONAJES,
    FORMAS: FORMAS,
    FUENTE: FUENTE,
    fondo: fondo,
    pintar: pintar
  };
})(window);
