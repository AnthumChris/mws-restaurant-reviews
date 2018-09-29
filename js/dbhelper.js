/**
 * Common database helper functions.
 */
class DBHelper {

  static get API_URL() {
    return 'http://localhost:1337';
  }

  // Returns Promise with IndexexDB for restaurants.  If ObjectStore is empty,
  // restaurants are fetched from the network and populated to the ObjectStore
  // This function is synchronizosed (_dbPromise) to prevent multiple network fetches
  static _db() {
    if (this._dbPromise) return this._dbPromise;

    // objectStore names
    const osRestaurantName = 'restaurants';
    const osReviewName = 'reviews';

    return this._dbPromise = idb.open('restaurantReviews', 2, upgradeDb => {
      const transactionPromises = [];
      let tx, os;

      // create/upgrade db
      switch (upgradeDb.oldVersion) {
        case 0:
          upgradeDb.createObjectStore(osRestaurantName, {keyPath: 'id'});
          tx = upgradeDb.transaction;
          os = tx.objectStore(osRestaurantName);
          os.createIndex('neighborhood', 'neighborhood');
          os.createIndex('cuisine', 'cuisine_type');
          os.createIndex('neighborhood-cuisine', ['neighborhood', 'cuisine_type']); // compound index
          transactionPromises.push(tx.complete);

        case 1:
          upgradeDb.createObjectStore(osReviewName, {keyPath: 'id'});
          tx = upgradeDb.transaction;
          os = tx.objectStore(osReviewName);
          os.createIndex('restaurant', 'restaurant_id');

          // indicate newly-added user reviews that require saving server/API
          // New reviews will be added and saved to server when app is online.
          os.createIndex('unsaved', 'unsaved');

          transactionPromises.push(tx.complete);
      }

      return Promise.all(transactionPromises);
    })
    .then(readyDb => {
      return Promise.all([
        DBHelper._populateRestaurants(readyDb),
        DBHelper._populateReviews(readyDb)
      ]).then(() => {
        console.log('restaurants/reviews populated in IDB');
        return readyDb;
      });
    })
  }

  static async _populateRestaurants(db) {
    return await DBHelper._populateObjectStoreIfEmpty(db, 'restaurants', '/restaurants');
  }

  static async _populateReviews(db) {
    return await DBHelper._populateObjectStoreIfEmpty(db, 'reviews', '/reviews');
  }

  static async _populateObjectStoreIfEmpty(db, osName, apiEndpoint) {
    let os = db.transaction(osName).objectStore(osName);
    const total = await os.count();

    if (total) {
      return Promise.resolve();
    } else {
      // restaurants not yet populated or deleted
      console.log('Populating '+osName+' from '+apiEndpoint)
      const list = await fetch(DBHelper.API_URL + apiEndpoint).then(resp => resp.json());

      const tx = db.transaction(osName, 'readwrite');
      os = tx.objectStore(osName)
      list.forEach(o => os.put(o));
      return tx.complete;
    }
  }

  // returns promise that resolves to ObjectStore for restaurants
  static _restaurantOs(transactionMode = 'readonly') {
    return DBHelper._db().then(db => db.transaction('restaurants', transactionMode).objectStore('restaurants'));
  }

  // returns promise that resolves to ObjectStore for reviews
  static _reviewOs(transactionMode = 'readonly') {
    return DBHelper._db().then(db => db.transaction('reviews', transactionMode).objectStore('reviews'));
  }

  // Returns Promise that resolves with array of all restaurants from IndexedDB
  // Excludes reviews
  static fetchRestaurants() {
    return DBHelper._restaurantOs().then(os => os.getAll());
  }

  // Returns Promise that resolves with restaurant from IndexedDB for specified ID
  static async fetchRestaurantWithReviews(id) {
    const restaurant = await DBHelper._restaurantOs().then(os => os.get(id));
    restaurant.reviews = await DBHelper.fetchRestaurantReviews(id);
    return restaurant;
  }

  // Fetch restaurants by a cuisine type
  static async fetchRestaurantReviews(restaurantId) {
    const reviews = await DBHelper._reviewOs().then(os => os.index('restaurant').getAll(restaurantId));

    // set JS date objects
    reviews.forEach(o => o.date = o.createdAt? DBHelper.getDateString(new Date(o.createdAt)) : '');
    return reviews;
  }


  // Fetch restaurants by a cuisine type
  static fetchRestaurantByCuisine(cuisine) {
    return DBHelper._restaurantOs().then(os => os.index('cuisine').getAll(cuisine));
  }

  // Fetch restaurants by a neighborhood
  static fetchRestaurantByNeighborhood(neighborhood) {
    return DBHelper._restaurantOs().then(os => os.index('neighborhood').getAll(neighborhood));
  }

  // Fetch restaurants by a cuisine and a neighborhood
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood) {
    const cuisineKey = cuisine === 'all'? false : cuisine,
          neighborhoodKey = neighborhood === 'all'? false : neighborhood;

    // search with compound index search if both cuisine and neighborhood specified. Otherwise only use one index
    if (cuisineKey && neighborhoodKey)
      return DBHelper._restaurantOs().then(os => os.index('neighborhood-cuisine').getAll([neighborhoodKey, cuisineKey]));
    else if (cuisineKey) {
      return DBHelper.fetchRestaurantByCuisine(cuisineKey);
    } else if (neighborhoodKey) {
      return DBHelper.fetchRestaurantByNeighborhood(neighborhoodKey);
    }

    // nothing specified, return all results
    return DBHelper.fetchRestaurants();
  }

  // returns a Promise that resolves with array of unique IndexedDB key values for indexName
  // TODO refactor this to use IndexedDB query for both fields
  static uniqueIndexValues(indexName) {
    const keyValues = [];
    return DBHelper._db().then(db => {
      return db.transaction('restaurants').objectStore('restaurants').index(indexName).openKeyCursor(null, 'nextunique');
    }).then(function next(cursor) {
      if (!cursor) return keyValues;
      keyValues.push(cursor.key);
      return cursor.continue().then(next)
    })
  }

  // Return array of unique neighborhoods
  static fetchNeighborhoods() {
    return DBHelper.uniqueIndexValues('neighborhood');
  }

  // Return array of unique cuisines
  static fetchCuisines() {
    return DBHelper.uniqueIndexValues('cuisine');
  }

  // Restaurant page URL.
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html#id=${restaurant.id}`);
  }

  // Restaurant image URL.
  static setRestaurantImage(elImg, restaurant) {
    /*
      API returns some restaurants without photo ids.  fallback to
      record id, which works for Sep 23, 2018 API version
    */
    const photoId = restaurant.photograph || restaurant.id;

    // API doesn't provide alt text, so set blank for a11y
    elImg.setAttribute('alt', '');

    if (!photoId) return;

    const photoFile = photoId + '.jpg';
    elImg.src = `/img/2a00w/${photoFile}`;
    elImg.setAttribute('srcset', `
      /img/200w/${photoFile} 200w,
      /img/400w/${photoFile} 400w,
      /img/600w/${photoFile} 600w,
      /img/800w/${photoFile} 800w,
    `)
  }

  // Map marker for a restaurant.
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

  // escapes/sanitizes string inputted by user
  static sanitize(unsafeString) {
    if (!this._sanitizeDiv) this._sanitizeDiv = document.createElement('div');

    this._sanitizeDiv.textContent = unsafeString;

    // reduce memory footprint
    const s = this._sanitizeDiv.innerHTML;
    this._sanitizeDiv.textContent = '';

    return s;
  }

  // returns date string as January 1, 2018
  static getDateString(date) {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ]
    return months[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
  }
}