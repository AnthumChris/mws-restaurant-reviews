/**
 * Common database helper functions.
 */
class DBHelper {

  static get DATABASE_URL() {
    return '/data/restaurants.json';
  }

  // Fetch all restaurants.
  static fetchRestaurants() {
    return fetch(DBHelper.DATABASE_URL)
    .then(resp => resp.json())
    .then(json => json.restaurants)
  }

  // Fetch a restaurant by its ID.
  static fetchRestaurantById(id) {
    return DBHelper.fetchRestaurants()
    .then(restaurants => restaurants.find(r => r.id == id));
  }

  // Fetch restaurants by a cuisine type
  static fetchRestaurantByCuisine(cuisine) {
    return DBHelper.fetchRestaurants()
    .then(restaurants => restaurants.filter(r => r.cuisine_type == cuisine));
  }

  // Fetch restaurants by a neighborhood
  static fetchRestaurantByNeighborhood(neighborhood) {
    return DBHelper.fetchRestaurants()
    .then(restaurants => restaurants.filter(r => r.neighborhood == neighborhood));
  }

  // Fetch restaurants by a cuisine and a neighborhood
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood) {
    return DBHelper.fetchRestaurants()
    .then(restaurants => {
      return restaurants.filter(r => {
        const isCuisine = cuisine === 'all'? true : r.cuisine_type === cuisine,
              isNeighborhood = neighborhood === 'all'? true : r.neighborhood === neighborhood;

        return (isCuisine && isNeighborhood);
      })
    })
  }

  // Fetch all neighborhoods
  static fetchNeighborhoods() {
    return DBHelper.fetchRestaurants()
    .then(list => new Set(list.map(o => o.neighborhood)));
  }

  // Fetch all cuisines
  static fetchCuisines() {
    return DBHelper.fetchRestaurants()
    .then(list => new Set(list.map(o => o.cuisine_type)));
  }

  // Restaurant page URL.
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  // Restaurant image URL.
  static setRestaurantImage(elImg, restaurant) {
    elImg.src = `/img/2a00w/${restaurant.photograph}`;
    elImg.setAttribute('alt', restaurant.photo_alt);
    elImg.setAttribute('srcset', `
      /img/200w/${restaurant.photograph} 200w,
      /img/400w/${restaurant.photograph} 400w,
      /img/600w/${restaurant.photograph} 600w,
      /img/800w/${restaurant.photograph} 800w,
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
