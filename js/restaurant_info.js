'use strict'

let restaurant;

/**
 * Fetch restaurant once page loads.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  const restaurantLoaded = loadRestaurant().then(() => {
    fillRestaurantHTML();
    fillBreadcrumb();

    // TODO remove test code
    // const button = document.querySelector('button.write-review');
    // button.focus();
    // button.click();
    // console.log(self.restaurant.reviews)
  }).catch(error => {
    console.error(error);
    document.querySelector('main').hidden = true;

    const elError = document.querySelector('#error');
    elError.hidden = false;
    elError.innerHTML += '<p>'+error+'</p>';
  })

  // draw map when both map library and restaurant are loaded
  Promise.all([
    App.googleMap,
    restaurantLoaded
  ])
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

  // bind button to modal
  document.querySelector('button.write-review').addEventListener('click', App.AddReviewModal.show);
});

const loadRestaurant = () => {
  return new Promise((resolve, reject) => {
    if (self.restaurant)
      return resolve();

    // Get current restaurant from page URL.
    const id = parseInt(getParameterByName('id'));
    if (isNaN(id)) { // no id found in URL
      return reject('No restaurant id in URL');
    }

    return DBHelper.fetchRestaurantWithReviews(id)
    .then(restaurant => {
      if (!restaurant) {
        return reject('No restaurant found for id '+id);
      }

      self.restaurant = restaurant;
      return resolve();
    }).catch(error => {
      console.error(error);
      return reject(error);
    });
  });
}

/**
 * Create restaurant HTML and add it to the webpage
 */
const fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.querySelector('.restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  DBHelper.setRestaurantImage(image, restaurant);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  const favorite = document.querySelector('.favorite');
  DBHelper.favoriteButtonInit(favorite, restaurant);
  favorite.style.opacity = 1;

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
const fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
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
const fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.className = 'no-reviews';
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  ul.innerHTML = '';
  ul.setAttribute('arial-label', reviews.length+' user reviews');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

// adds review to in-memory list, re-displays the list, then queues it to be added
const displayNewReview = review => {
  self.restaurant.reviews.unshift(review);
  fillReviewsHTML();
}

/**
 * Create review HTML and add it to the webpage.
 */
const createReviewHTML = (review) => {
  // using HTML templates. Not the most performant, but easier to code and debug
  const li = document.createElement('li');
  li.innerHTML = `
    <div class="review">
      <div class="review-heading">
        NAME
        <span class="review-date"></span>
      </div>
      <div class="review-body">
        <div class="review-rating clearfix">
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
const fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a hash parameter by name from page URL.
 */
const getParameterByName = (paramName) => {
  const params = {};

  // build params from hash value
  window.location.hash.replace(/^#/,'').split(',').forEach(o => {
    const paramArry = o.split('=');
    if (paramArry.length === 2) {
      params[paramArry[0].trim()] = decodeURIComponent(paramArry[1].trim().replace(/\+/g, ' '));
    }
  })

  return params[paramName];
}

// UI control to click stars for ratings
function RatingsControl(element) {
  this.wrapper = element;
  this._value = 0;
  this.ratingsButtons = element.querySelectorAll('i');

  this.ratingsButtons.forEach((el, i) => {
    el.setAttribute('aria-checked', false);
    el.setAttribute('aria-pressed', false);

    el.addEventListener('click', event => {
      this.value(i+1);
    });

    const ariaToggleKeys = [32, 13]; // spacebar, enter
    el.addEventListener('keydown', event => {
      if (ariaToggleKeys.indexOf(event.keyCode) !== -1) {
        event.preventDefault();
        this.value(i+1);
      }
    })
  })
}
// gets or sets the value
RatingsControl.prototype.value = function(optionalValue) {
  if ('undefined' === typeof optionalValue)
    return this._value;

  // keep value within boundaries of 0-buttons.length
  const val = Math.max(0, Math.min(optionalValue, this.ratingsButtons.length));
  this._value = val;

  // mark buttons selected/deselected
  this.ratingsButtons.forEach((o, i) => {
    const checked = i+1 === this._value;
    o.setAttribute('aria-checked', checked);
    o.setAttribute('aria-pressed', checked);

    o.classList.toggle('active', i+1 <= this._value);
  });

  this.wrapper.dataset.value=this._value;
}

App.AddReviewModal = (function() {
  const modal = document.querySelector('.modal');
  const modalContent = modal.firstElementChild;
  const error = modal.querySelector('.error');
  const closeButton = modal.querySelector('.modal-close');
  const cancelButton = modal.querySelector('.cancel');
  const successButton = modal.querySelector('.success-done');

  const form = modal.querySelector('form');
  const comments = form.querySelector('[name=comments]');

  const successView = modal.querySelector('.success');
  const formView = modal.querySelector('.form');

  // warn users before closing. disable this after success
  let preventCloseIfChanged = true;

  // focus trap - keep focus within modal
  let focusableFirst, focusableLast;

  const ratingControl = new RatingsControl(form.querySelector('.review-rating'));

  // prep inner elements to be focused
  modal.setAttribute('tabindex', -1);

  // return focus to element before modal opened
  let previousActiveElement;

  // resets modal to initial display
  function reset() {
    form.reset();
    error.classList.remove('active');
    preventCloseIfChanged = true;
    ratingControl.value(0);

    successView.classList.remove('active');

    formView.setAttribute('aria-hidden', false);
    successView.setAttribute('aria-hidden', true);

    const focusables = modalContent.querySelectorAll('form [tabindex="0"]');
    focusableFirst = focusables[0];
    focusableLast = focusables[focusables.length-1];
  }

  // shows the success div when the review is submitted
  function showSuccess() {
    preventCloseIfChanged = false;

    // set new focus trap
    const focusables = modalContent.querySelectorAll('.success [tabindex="0"]');
    focusableFirst = focusables[0];
    focusableLast = focusables[focusables.length-1];

    formView.setAttribute('aria-hidden', true);
    successView.setAttribute('aria-hidden', false);

    successView.classList.add('active');
    modal.focus();
  }

  // close if modal background (not content area) was clicked
  function onClick(event) {
    if (!event.path.some(el => el === modalContent)) {
      hide();
    }
  }

  form.onsubmit = event => {
    error.classList.remove('active');
    error.offsetWidth // trigger animation if error already shown

    if (ratingControl.value() === 0 || form.name.value.trim() === '') {
      error.innerHTML = 'Your name and a rating are required.';
      error.classList.add('active');
    } else {
      const review = DBHelper.saveNewReview({
        restaurant_id: self.restaurant.id,
        rating: ratingControl.value(),
        name: form.name.value.trim(),
        comments: form.comments.value.trim()
      });
      displayNewReview(review);
      showSuccess();
    }

    return false;
  }

  function onKeyDown(e) {
    // close on ESC
    if (e.keyCode === 27) hide();

      // keep keyboard tabbing within modal
    if (e.keyCode === 9) {
      const active = document.activeElement;
      if (e.shiftKey) {
        if (active === focusableFirst) {
          e.preventDefault();
          focusableLast.focus();
        }
      } else {
        if (active === focusableLast) {
          e.preventDefault();
          focusableFirst.focus();
        }
      }
    }
  }

  // returns boolean of whether a form changed
  function formChanged() {
    return ratingControl.value() !== 0 || Array.from(form).some(el => 'defaultValue' in el && el.defaultValue !== el.value.trim());
  }

  // opens and shows modal
  function show() {
    requestAnimationFrame(_ => {
      reset();

      previousActiveElement = document.activeElement;
      document.body.classList.add('modal-active');
      modal.setAttribute('aria-hidden', false);

      modal.focus();

      // add event listeners
      document.addEventListener('keydown', onKeyDown);
      modal.addEventListener('click', onClick);
      cancelButton.addEventListener('click', hide);
      closeButton.addEventListener('click', hide);
      successButton.addEventListener('click', hide);
    });
  }

  // closes and hides modal
  function hide() {
    // warn user before closing
    if (preventCloseIfChanged && formChanged() && !confirm("Discard your review?"))
      return;

    requestAnimationFrame(_ => {
      document.body.classList.remove('modal-active');
      modal.setAttribute('aria-hidden', true);

      if (previousActiveElement) {
        previousActiveElement.focus();
        previousActiveElement = null;
      }

      // remove event listeners
      document.removeEventListener('keydown', onKeyDown);
      modal.removeEventListener('click', onClick);
      cancelButton.removeEventListener('click', hide);
      closeButton.removeEventListener('click', hide);
      successButton.removeEventListener('click', hide);
    })
  }

  return {
    show,
    hide
  }
})();
