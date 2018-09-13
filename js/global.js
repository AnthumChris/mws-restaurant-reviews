if ('serviceWorker' in navigator) {
  window.addEventListener('load', event => {
    navigator.serviceWorker.register('/sw.js')
    .then(reg => console.log('SW registered', reg))
    .catch(error => console.error('SW reg failed', error));
  })
}

// add alt attribute to map <img> to improve Lighthouse accessibility score
function addAltToGoogleMapsImages() {
  // intentional delay required to capture UI control SVG images
  setTimeout(_ => {
    this.getDiv().querySelectorAll('img').forEach(el => el.setAttribute('alt', 'Google Maps Tile Image'));
  }, 250);
}