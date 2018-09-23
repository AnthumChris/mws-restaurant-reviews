let restaurant;

/**
 * Initialize Google map, called from HTML.
 */
// TODO decouple this from global map handler used on home page
const mapReady = new Promise((resolve, reject) => {
  window.initMap = resolve;
  window.initMapError = reject;
});

/**
 * Fetch restaurant once page loads.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  const restaurantLoaded = loadRestaurant().then(() => {
    fillRestaurantHTML();
    fillBreadcrumb();
  })

  // draw map when both map library and restaurant are loaded
  Promise.all([mapReady, restaurantLoaded])
  .then(() => {
    const elMap = document.getElementById('map');
    if (elMap) {
      const map = new google.maps.Map(elMap, {
        zoom: 16,
        center: self.restaurant.latlng,
        scrollwheel: false,
        mapTypeControl: false
      });

      map.addListener('tilesloaded', addAltToGoogleMapsImages);
      DBHelper.mapMarkerForRestaurant(self.restaurant, map);
    }
  })
});

loadRestaurant = () => {
  return new Promise((resolve, reject) => {
    if (self.restaurant)
      return resolve();

    // Get current restaurant from page URL.
    const id = getParameterByName('id');
    if (!id) { // no id found in URL
      return reject('No restaurant id in URL');
    }

    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      if (!restaurant) {
        return reject(error);
      }

      self.restaurant = restaurant;
      return resolve();
    });
  });
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.querySelector('.restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  DBHelper.setRestaurantImage(image, restaurant);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');

    // add span to prevent line wrapping on times
    time.innerHTML = '<span>'+operatingHours[key].split(', ').join('</span>, <span>')+'</span>';
    // time.innerHTML = operatingHours[key].replace(/,/,',<br />');
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.className = 'no-reviews';
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  ul.setAttribute('arial-label', reviews.length+' user reviews');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  // using HTML templates. Not the most performant, but easier to code and debug
  const li = document.createElement('li');
  li.innerHTML = `
    <div class="review">
      <div class="review-heading">
        NAME
        <span class="review-date"></span>
      </div>
      <div class="review-body">
        <div class="review-rating">
        </div>
        <p></p>
      </div>
    </div>
  `;
  li.querySelector('.review-heading').firstChild.textContent = review.name;
  li.querySelector('.review-date').innerText = review.date;

  // add "checked" attribute to color stars
  const rating = li.querySelector('.review-rating');
  rating.setAttribute('arial-label', 'Rating ' + review.rating + ' of 5');
  for (let i=1; i<=5; i++) {
    const star = document.createElement('i');
    if (i <= review.rating) {
      star.setAttribute('checked', true);
    }
    rating.appendChild(star);
  }

  li.querySelector('.review-body p').innerText = review.comments;
  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
