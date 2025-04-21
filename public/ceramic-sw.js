// Ceramic Network Service Worker
// This service worker adds CORS headers to Ceramic network responses

const CERAMIC_URL = 'https://gateway.ceramic.network';

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Only intercept Ceramic network requests
  if (url.origin === CERAMIC_URL) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone the response so we can modify headers
          const newResponse = response.clone();
          
          // Create headers with proper CORS permissions
          const headers = new Headers(response.headers);
          headers.set('Access-Control-Allow-Origin', self.location.origin);
          headers.set('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
          headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
          
          // Return modified response with CORS headers
          return new Response(newResponse.body, {
            status: newResponse.status,
            statusText: newResponse.statusText,
            headers: headers
          });
        })
        .catch(err => console.error('Ceramic service worker error:', err))
    );
  }
});
