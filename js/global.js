window.App = window.App || {}

/**
 * Use Promise to queue all map features until maps loads. Provides a smoother
 * UX that ensures that app can run if maps aren't yet loaded.  Also shows
 * error if maps can't instantiate.
 */
App.googleMap = new Promise((resolve, reject) => {
  self._googleMapInit = resolve;
  self._googleMapError = reject;
})
.catch(error => {
  const elMap = document.getElementById('map');
  if (elMap) {
    elMap.classList.add('init-error');
  }
  return Promise.reject('Map library failed to initialize')
})
.finally(_ => {
  delete App._googleMapInit;
  delete App._googleMapError;
})

if ('serviceWorker' in navigator) {
  window.addEventListener('load', event => {
    navigator.serviceWorker.register('/sw.js')
    .catch(error => console.error('SW reg failed', error));
  })
}

// to improve Lighthouse accessibility for google Maps images
// https://www.w3.org/WAI/tutorials/images/decorative/
function addAltToGoogleMapsImages() {
  // intentional delay required to capture UI control SVG images
  setTimeout(_ => {
    this.getDiv().querySelectorAll('img').forEach(el => {
      el.setAttribute('alt', '');
      el.setAttribute('role', 'presentation');
    });
  }, 250);
}