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

    // objectStore name
    const osName = 'restaurants';

    return this._dbPromise = idb.open('restaurantReviews', 1, upgradeDb => {
      // create/upgrade db
      switch (upgradeDb.oldVersion) {
        case 0:
          upgradeDb.createObjectStore(osName, {keyPath: 'id'});
          const tx = upgradeDb.transaction;
          const os = tx.objectStore(osName);
          os.createIndex('neighborhood', 'neighborhood');
          os.createIndex('cuisine', 'cuisine_type');
          os.createIndex('neighborhood-cuisine', ['neighborhood', 'cuisine_type']); // compound index
          return tx.complete;
      }
    })
    .then(db => {
      let os = db.transaction(osName).objectStore(osName)
      return os.count()
      .then(total => {
        if (total) {
          // restaurants already populated
          return db;
        } else {
          // restaurants not yet populated or deleted
          console.log('Populating restaurants from network fetch')
          return fetch(DBHelper.API_URL + '/restaurants/')
          .then(resp => resp.json())
          .then(list => {
            const tx = db.transaction(osName, 'readwrite');
            os = tx.objectStore(osName)
            list.forEach(o => os.put(o));
            return tx.complete.then(_ => db);
          })
        }
      })
    })
  }

  // returns promise that resolves to ObjectStore for restaurants
  static _objectStore(transactionMode = 'readonly') {
    return DBHelper._db().then(db => db.transaction('restaurants', transactionMode).objectStore('restaurants'));
  }

  // Returns Promise that resolves with array of all restaurants from IndexedDB
  static fetchRestaurants() {
    return DBHelper._objectStore().then(os => os.getAll());
  }

  // Returns Promise that resolves with restaurant from IndexedDB for specified ID
  static fetchRestaurantById(id) {
    return DBHelper._objectStore().then(os => os.get(id));
  }

  // Fetch restaurants by a cuisine type
  static fetchRestaurantByCuisine(cuisine) {
    return DBHelper._objectStore().then(os => os.index('cuisine').getAll(cuisine));
  }

  // Fetch restaurants by a neighborhood
  static fetchRestaurantByNeighborhood(neighborhood) {
    return DBHelper._objectStore().then(os => os.index('neighborhood').getAll(neighborhood));
  }

  // Fetch restaurants by a cuisine and a neighborhood
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood) {
    const cuisineKey = cuisine === 'all'? false : cuisine,
          neighborhoodKey = neighborhood === 'all'? false : neighborhood;

    // search with compound index search if both cuisine and neighborhood specified. Otherwise only use one index
    if (cuisineKey && neighborhoodKey)
      return DBHelper._objectStore().then(os => os.index('neighborhood-cuisine').getAll([neighborhoodKey, cuisineKey]));
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
    return (`./restaurant.html?id=${restaurant.id}`);
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
}