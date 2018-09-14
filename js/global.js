if ('serviceWorker' in navigator) {
  window.addEventListener('load', event => {
    navigator.serviceWorker.register('/sw.js')
    .then(reg => console.log('SW registered', reg))
    .catch(error => console.error('SW reg failed', error));
  })
}

// to improve Lighthouse accessibility for google Maps images
// https://www.w3.org/WAI/tutorials/images/decorative/
function addAltToGoogleMapsImages() {
  // intentional delay required to capture UI control SVG images
  setTimeout(_ => {
    this.getDiv().querySelectorAll('img').forEach(el => {
      // el.setAttribute('alt', '');
      // el.setAttribute('role', 'presentation');
    });
  }, 250);
}