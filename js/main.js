let restaurants,
  neighborhoods,
  cuisines;
var markers = []

document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
  updateRestaurants();
  renderMap();
});


renderMap = () => {
  // already called
  if (self._renderMapPromise)
    return self._renderMapPromise;

  // not yet called
  return self._renderMapPromise = new Promise((resolve, reject) => {
    App.googleMap.then(_ => {
      let loc = {
        lat: 40.715216,
        lng: -73.969501
      };

      const mapEl = document.getElementById('map');
      if (!mapEl) return reject('Map element not found in DOM');

      const map = new google.maps.Map((mapEl), {
        zoom: 11,
        center: loc,
        scrollwheel: false,
        mapTypeControl: false
      });

      map.addListener('tilesloaded', addAltToGoogleMapsImages);
      resolve(map);
    }).catch(_ => {})
  })
}

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods()
  .then(neighborhoods => {
    self.neighborhoods = neighborhoods;
    fillNeighborhoodsHTML();
  })
  .catch(error => console.log(error))
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines()
  .then(cuisines => {
    self.cuisines = cuisines;
    fillCuisinesHTML();
  })
  .catch(error => console.log(error))
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood)
  .then(restaurants => {
    resetRestaurants(restaurants);
    fillRestaurantsHTML();
  })
  .catch(error => console.error(error));
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  ul.setAttribute('aria-label', restaurants.length + ' search results');

  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li'),
        imgWrapper = document.createElement('div'),
        info = document.createElement('div'),
        image = document.createElement('img'),
        aspectRatio = document.createElement('div'),
        name = document.createElement('h2'),
        neighborhood = document.createElement('p')
        address = document.createElement('p'),
        more = document.createElement('a');

  imgWrapper.className = 'restaurant-photo';
  li.append(imgWrapper);

  aspectRatio.className = 'x x4-3'; // preserve 4x3 aspect ratio for image
  imgWrapper.append(aspectRatio);

  image.className = 'restaurant-img';
  DBHelper.setRestaurantImage(image, restaurant);
  aspectRatio.append(image);

  info.className = 'restaurant-info';
  li.append(info);

  name.innerHTML = restaurant.name;
  info.append(name);

  neighborhood.innerHTML = restaurant.neighborhood;
  info.append(neighborhood);

  address.innerHTML = restaurant.address;
  info.append(address);

  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  more.tabIndex = 0;
  more.setAttribute('aria-label', 'view restaurant details for '+restaurant.name);
  info.append(more)

  return li;
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  // TODO this causes a race condition if previous call didn't execute
  renderMap().then(map => {
    restaurants.forEach(restaurant => {
      // Add marker to the map
      const marker = DBHelper.mapMarkerForRestaurant(restaurant, map);
      google.maps.event.addListener(marker, 'click', () => {
        window.location.href = marker.url
      });
      self.markers.push(marker);
    });
  })
}
