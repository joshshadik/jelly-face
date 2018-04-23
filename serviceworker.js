// used this template: https://gist.github.com/ngokevin/7eb03d90987c0ed03b873530c3b4c53c

var VERSION = 'v1';

var cacheFirstFiles = [
  'assets/snoop.jpg',
  'assets/snoop.vbo',
  'assets/vr_atlas.png',
  'icons/charlize.png',
  'icons/jackie.png',
  'icons/marilyn.png',
  'icons/obama.png',
  'icons/shatner.png',
  'icons/snoop.png',
  'assets/charlize.jpg',
  'assets/charlize.vbo',
  'assets/jackie.jpg',
  'assets/jackie.vbo',
  'assets/marilyn.jpg',
  'assets/marilyn.vbo',
  'assets/obama.jpg',
  'assets/obama.vbo',
  'assets/shatner.jpg',
  'assets/shatner.vbo',

  'thirdparty/gl-matrix-min.js',
  'thirdparty/ShaderLoader.js',
];

var networkFirstFiles = [
  'index.html',
  'style.css',
  
  'js/app.js',
  'js/framebuffer.js',
  'js/hand.js',
  'js/input.js',
  'js/jelly-face.js',
  'js/material.js',
  'js/mesh.js',
  'js/stretch-sound.js',
  'js/texture.js',
  'js/time.js',
  'js/vbo-loader.js',
  'js/vr-button.js',
  'js/vr.js',

  'shaders/gles30/composeFS.glsl',
  'shaders/gles30/copyFS.glsl',
  'shaders/gles30/faceFS.glsl',
  'shaders/gles30/faceVS.glsl',
  'shaders/gles30/floorFS.glsl',
  'shaders/gles30/floorVS.glsl',
  'shaders/gles30/grab3DVS.glsl',
  'shaders/gles30/grabVS.glsl',
  'shaders/gles30/handFS.glsl',
  'shaders/gles30/handVS.glsl',
  'shaders/gles30/initPosFS.glsl',
  'shaders/gles30/initPosVS.glsl',
  'shaders/gles30/posFS.glsl',
  'shaders/gles30/screenQuadVS.glsl',
  'shaders/gles30/shadowBufferFS.glsl',
  'shaders/gles30/texturedQuadFS.glsl',
  'shaders/gles30/texturedQuadVS.glsl',
  'shaders/gles30/vColorFS.glsl',
  'shaders/gles30/vel3DVS.glsl',
  'shaders/gles30/velVS.glsl',

  'shaders/gles20/composeFS.glsl',
  'shaders/gles20/copyFS.glsl',
  'shaders/gles20/faceColFS.glsl',
  'shaders/gles20/facePosFS.glsl',
  'shaders/gles20/faceVS.glsl',
  'shaders/gles20/floorColFS.glsl',
  'shaders/gles20/floorPosFS.glsl',
  'shaders/gles20/floorVS.glsl',
  'shaders/gles20/grab3DVS.glsl',
  'shaders/gles20/grabVS.glsl',
  'shaders/gles20/handFS.glsl',
  'shaders/gles20/handVS.glsl',
  'shaders/gles20/initPosFS.glsl',
  'shaders/gles20/initPosVS.glsl',
  'shaders/gles20/posFS.glsl',
  'shaders/gles20/screenQuadVS.glsl',
  'shaders/gles20/shadowBufferFS.glsl',
  'shaders/gles20/texturedQuadFS.glsl',
  'shaders/gles20/texturedQuadVS.glsl',
  'shaders/gles20/vColorFS.glsl',
  'shaders/gles20/vel3DVS.glsl',
  'shaders/gles20/velVS.glsl'
];

// Below is the service worker code.

var cacheFiles = cacheFirstFiles.concat(networkFirstFiles);

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(VERSION).then(cache => {
      return cache.addAll(cacheFiles);
    })
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') { return; }
  if (networkFirstFiles.indexOf(event.request.url) !== -1) {
    event.respondWith(networkElseCache(event));
  } else if (cacheFirstFiles.indexOf(event.request.url) !== -1) {
    event.respondWith(cacheElseNetwork(event));
  }
  event.respondWith(fetch(event.request));
});

// If cache else network.
// For images and assets that are not critical to be fully up-to-date.
// developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/
// #cache-falling-back-to-network
function cacheElseNetwork (event) {
  return caches.match(event.request).then(response => {
    function fetchAndCache () {
       return fetch(event.request).then(response => {
        // Update cache.
        caches.open(VERSION).then(cache => cache.put(event.request, response.clone()));
        return response;
      });
    }

    // If not exist in cache, fetch.
    if (!response) { return fetchAndCache(); }

    // If exists in cache, return from cache while updating cache in background.
    fetchAndCache();
    return response;
  });
}

// If network else cache.
// For assets we prefer to be up-to-date (i.e., JavaScript file).
function networkElseCache (event) {
  return caches.match(event.request).then(match => {
    if (!match) { return fetch(event.request); }
    return fetch(event.request).then(response => {
      // Update cache.
      caches.open(VERSION).then(cache => cache.put(event.request, response.clone()));
      return response;
    }) || response;
  });
}