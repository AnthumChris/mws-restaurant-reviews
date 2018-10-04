# Release Notes

### Submission v3.1
1. New reviews can be added and are saved to IDB
1. Add/Remove favorite restaurants is available on all pages
1. New reviews and modified restaurants in IDB are synchronized to the API server when the browser is online.
1. If the browser is offline, all API server synchs are performed when the browser comes back online
    1. `DBHelper.initOfflineSync()` uses [online/offline events](https://developer.mozilla.org/en-US/docs/Web/API/NavigatorOnLine/Online_and_offline_events) instead of Service Worker `SyncManager` because [SyncManager is not well-supported standard](https://developer.mozilla.org/en-US/docs/Web/API/SyncManager#Browser_compatibility). 
1. Both pages show UI errors during page load when things fail.
1. Home page now caches correctly
1. Chrome 69 Lighthouse audits for both mobile/desktop for both pages are showing:
    1. Accessiblity: __100__
    1. Progressive Web App: __100__ (92 if https redirection is not configured)
    1. Performance: __100__ (no throttling enabled)



### Submission v2.1
1. External JSON Api is used instead of static JSON file
1. IndexedDB is used after first `/restaurants` fetch is stored
1. Lighthouse Accessibility score is 100
1. Entire application is pre-cached on first visit
1. PWA install feature is added
1. Promise is used to elegantly handle all Google Maps library load
1. All images have fixed aspect ratios and page doesn't jump on slow image loads
1. Maps load separately (asynchronously) and don't block the main thread on all pages
1. Added new app icons
1. Google Maps shows error if it fails to load (useful for working locally without Internet)
1. Entire app re-written to use Promises instead of success/error callbacks
1. `/restaurants.html?id={id}` now uses hash params instead: `/restaurants.html#id={id}`.  This allows full pre-caching behavior and avoids unique `/restaurant.html*` URLs.

### Submission v1.2
Added fixes based on feedback.
1. Max content width (excluding header/footer) is 100rem
1. Added aria attributes for header, reviews list, and Google Maps
1. Added home page breakpoints to show 4 and 5 columns of results
1. Added details breakpoints to show 3 columns of reviews and restrict image to max display width.

### Submission v1.1
1. I run browser sync locally on :3000 and disabled the SW for those URLs because of SW errors.
1. I was not sure if refactoring existing code to meet style guides was necessary. Most of my new code should conform to style guides. If refactoring is required, I will do this, but it wasn't explicitly specified as a requirement.
1. ServiceWorker clears invalid caches based on cacheVer value.
1. Normalize stylesheet removed from both pages because the URL seems old/deprecated.



---
# Mobile Web Specialist Certification Course
---
#### _Three Stage Course Material Project - Restaurant Reviews_

## Project Overview: Stage 1

For the **Restaurant Reviews** projects, you will incrementally convert a static webpage to a mobile-ready web application. In **Stage One**, you will take a static design that lacks accessibility and convert the design to be responsive on different sized displays and accessible for screen reader use. You will also add a service worker to begin the process of creating a seamless offline experience for your users.

### Specification

You have been provided the code for a restaurant reviews website. The code has a lot of issues. It’s barely usable on a desktop browser, much less a mobile device. It also doesn’t include any standard accessibility features, and it doesn’t work offline at all. Your job is to update the code to resolve these issues while still maintaining the included functionality. 

### What do I do from here?

1. In this folder, start up a simple HTTP server to serve up the site files on your local computer. Python has some simple tools to do this, and you don't even need to know Python. For most people, it's already installed on your computer. 

In a terminal, check the version of Python you have: `python -V`. If you have Python 2.x, spin up the server with `python -m SimpleHTTPServer 8000` (or some other port, if port 8000 is already in use.) For Python 3.x, you can use `python3 -m http.server 8000`. If you don't have Python installed, navigate to Python's [website](https://www.python.org/) to download and install the software.

2. With your server running, visit the site: `http://localhost:8000`, and look around for a bit to see what the current experience looks like.
3. Explore the provided code, and make start making a plan to implement the required features in three areas: responsive design, accessibility and offline use.
4. Write code to implement the updates to get this site on its way to being a mobile-ready website.

### Note about ES6

Most of the code in this project has been written to the ES6 JavaScript specification for compatibility with modern web browsers and future proofing JavaScript code. As much as possible, try to maintain use of ES6 in any additional JavaScript you write. 



