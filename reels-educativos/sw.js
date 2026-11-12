/* Service worker: permite instalar la app y usarla sin internet. */
const CACHE = 'reels-educativos-v11';
const ARCHIVOS = [
  './',
  './index.html',
  './css/estilos.css',
  './js/dibujos.js',
  './js/motor.js',
  './js/voz.js',
  './js/grabador.js',
  './js/app.js',
  './manifest.webmanifest',
  './iconos/icon-192.png',
  './iconos/icon-512.png',
  './iconos/icon-maskable-192.png',
  './iconos/icon-maskable-512.png',
  './iconos/apple-touch-icon.png'
];

/* Guarda un archivo con reintentos: si la conexión es lenta o inestable,
   la instalación no se cancela por un solo fallo. */
async function guardar(cache, archivo, intentos) {
  for (let i = 0; i < intentos; i++) {
    try {
      const respuesta = await fetch(archivo, { cache: 'reload' });
      if (!respuesta || !respuesta.ok) throw new Error('HTTP ' + (respuesta && respuesta.status));
      await cache.put(archivo, respuesta);
      return true;
    } catch (e) {
      if (i < intentos - 1) {
        await new Promise((listo) => setTimeout(listo, 300 * (i + 1)));
      }
    }
  }
  return false;
}

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE)
      .then(async (cache) => {
        let fallos = 0;
        // En serie y con reintentos: más fiable en redes móviles lentas.
        for (const archivo of ARCHIVOS) {
          const ok = await guardar(cache, archivo, 3);
          if (!ok) fallos += 1;
        }
        if (fallos) {
          console.warn('Reels Educativos: no se pudieron guardar ' + fallos + ' archivo(s).');
        }
        await self.skipWaiting();
      })
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys().then(async (claves) => {
      const actual = await caches.open(CACHE);
      const guardados = (await actual.keys()).length;
      // Solo borra cachés antiguas si la nueva está prácticamente completa.
      if (guardados >= 10) {
        await Promise.all(
          claves.filter((c) => c !== CACHE).map((c) => caches.delete(c))
        );
      }
      await self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (evento) => {
  const peticion = evento.request;
  if (peticion.method !== 'GET') return;

  let url;
  try { url = new URL(peticion.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) return;

  if (peticion.mode === 'navigate') {
    evento.respondWith(
      fetch(peticion, { cache: 'no-cache' })
        .then((respuesta) => {
          if (!respuesta || !respuesta.ok) throw new Error('sin red');
          const copia = respuesta.clone();
          caches.open(CACHE).then((cache) => cache.put('./index.html', copia));
          return respuesta;
        })
        .catch(() => caches.match('./index.html').then((guardado) => guardado || caches.match('./')))
    );
    return;
  }

  evento.respondWith(
    caches.match(peticion).then((guardado) => {
      if (guardado) return guardado;
      return fetch(peticion, { cache: 'no-cache' }).then((respuesta) => {
        if (respuesta.ok) {
          const copia = respuesta.clone();
          caches.open(CACHE).then((cache) => cache.put(peticion, copia));
        }
        return respuesta;
      });
    })
  );
});
