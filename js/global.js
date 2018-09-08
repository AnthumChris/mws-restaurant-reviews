if ('serviceWorker' in navigator) {
  window.addEventListener('load', event => {
    navigator.serviceWorker.register('/sw.js')
    .then(reg => console.log('SW registered', reg))
    .catch(error => console.error('SW reg failed', error));
  })
}