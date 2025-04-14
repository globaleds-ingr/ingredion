/* eslint-disable no-use-before-define, no-undef, function-paren-newline, object-curly-newline */
import { script, div, ul, li, h2, h3, p, button, a } from '../../scripts/dom-helpers.js';
import { readBlockConfig, toClassName } from '../../scripts/aem.js';
import { getRegionLocale, loadTranslations, translate } from '../../scripts/utils.js';

let map;
let bounds;
let markers = [];

// Add this state object at the top with other declarations
const state = {
  allLocations: [],
  filteredLocations: [],
  filters: {
    country: '',
    type: '',
  },
};

// Sets the map on all markers in the array.
function setAllMarkers(m) {
  markers.forEach((marker) => {
    marker.setMap(m);
  });
}

// Removes the markers from the map, but keeps them in the array.
function hideMarkers() {
  setAllMarkers(null);
}

// Deletes all markers in the array by removing references to them.
function deleteMapMarkers() {
  hideMarkers();
  markers = [];
}

/**
 * Creates a marker pin element for a location.
 * @param {Object} location - The location object.
 * @param {number} i - The index of the pin.
 * @returns {HTMLElement} - The marker pin element.
 */
function markerPin(location, i) {
  return div({ class: `pin pin-${i} ${toClassName(location.type)}`, 'data-pin': i },
    div({ class: 'icon' }),
    div({ class: 'details' },
      createLocationCard(location),
    ),
  );
}

/**
 * Adds map markers for each location in the data.
 * @param {Array} locations - The array of locations to add as markers on the map.
 * @returns {Promise<void>} - A promise that resolves when the markers are added.
 */
async function updateMarkers(locations) {
  const { AdvancedMarkerElement } = await google.maps.importLibrary('marker');
  bounds = new google.maps.LatLngBounds();

  deleteMapMarkers();

  // if locations data is empty reset map
  if (!locations || locations.length === 0) {
    buildMap();
    return;
  }

  locations.forEach((location, i) => {
    const lat = Number(location.lat);
    const lng = Number(location.long);
    const marker = new AdvancedMarkerElement({
      map,
      position: { lat, lng },
      content: markerPin(location, i),
    });

    markers.push(marker);
    bounds.extend(new google.maps.LatLng(lat, lng));

    // Important: this must be added in order for any other events to work
    marker.addListener('gmp-click', () => {});

    marker.content.addEventListener('click', () => {
      highlightActiveLocation(i);
    });

    map.addListener('click', () => {
      resetActiveLocations();
    });
  });

  // add padding to bounds so markers aren't hidden when active
  map.fitBounds(bounds, { top: 0, right: 0, bottom: 0, left: 700 });
}

/**
 * Builds a map using the Google Maps API.
 * @returns {Promise<void>} A promise that resolves when the map is built.
 */
async function buildMap() {
  const { Map } = await google.maps.importLibrary('maps');

  map = new Map(document.getElementById('google-map'), {
    center: { lat: 43.696, lng: -116.641 },
    zoom: 12,
    minZoom: 3,
    mapId: 'IM_IMPORTANT',
    disableDefaultUI: false, // Enable default UI controls
    zoomControl: false, // Ensure zoom control is enabled
    streetViewControl: false, // Ensure street view control is enabled
    fullscreenControl: true, // Ensure fullscreen control is enabled
    mapTypeControl: false, // Disable map type control to remove Map/Satellite buttons
    gestureHandling: 'cooperative', // Allow map to pan when scrolling
  });
}

/**
 * Highlights the active location card and its corresponding pin on the map.
 * @param {number} i - The index of the active location.
 */
function highlightActiveLocation(i) {
  resetActiveLocations();

  const marker = markers[i];
  if (marker) {
    marker.content.classList.add('active');
    marker.content.parentNode.style.zIndex = '999';
  }

  // Remove existing active class from location cards
  const $locationCards = document.querySelectorAll('.location-card');
  $locationCards.forEach((card) => {
    card.classList.remove('active');
  });

  // Highlight location card
  const $location = document.querySelector(`.location-card[data-pin="${i}"]`);
  if ($location) {
    $location.classList.add('active');
  }

  // Ensure the marker is not too close to the edges
  if (marker) {
    fitMarkerWithinBounds(marker.content);
  }
}

function fitMarkerWithinBounds(markerElement) {
  const padding = {
    top: 40,
    right: 40,
    bottom: 40,
    left: 700,
  };

  const markerRect = markerElement.getBoundingClientRect();
  const mapContainer = document.getElementById('google-map');
  const mapRect = mapContainer.getBoundingClientRect();
  const { top: markerTop, left: markerLeft, right: markerRight, bottom: markerBottom } = markerRect;
  const { top: mapTop, left: mapLeft, right: mapRight, bottom: mapBottom } = mapRect;

  // calculate distances
  const markerPXfromTop = markerTop - mapTop;
  const markerPXfromLeft = markerLeft - mapLeft;
  const markerPXfromRight = mapRight - markerRight;
  const markerPXfromBottom = mapBottom - markerBottom;

  let panX = 0;
  let panY = 0;

  if (markerPXfromTop < padding.top) {
    panY = (padding.top - markerPXfromTop) * -1;
  } else if (markerPXfromBottom < padding.bottom) {
    panY = (padding.bottom - markerPXfromBottom);
  }

  if (markerPXfromLeft < padding.left) {
    panX = (padding.left - markerPXfromLeft) * -1;
  } else if (markerPXfromRight < padding.right) {
    panX = (padding.right - markerPXfromRight);
  }

  // pan the map if needed
  if (panX !== 0 || panY !== 0) {
    const currentCenter = map.getCenter();
    const projection = map.getProjection();
    const currentCenterPX = projection.fromLatLngToPoint(currentCenter);
    currentCenterPX.y += (panY / 2 ** map.getZoom());
    currentCenterPX.x += (panX / 2 ** map.getZoom());
    const newCenter = projection.fromPointToLatLng(currentCenterPX);
    map.panTo(newCenter);
  }
}

/**
 * Disables active locations by removing the 'active' class from pins.
 */
function resetActiveLocations() {
  const allPins = document.querySelectorAll('.pin');
  allPins.forEach((pin) => {
    pin.classList.remove('active');
    pin.parentNode.style.zIndex = '';
  });
}

function createDropdown(title, options, type) {
  const $list = ul({ class: 'options' });
  const $dropdown = div({ class: `select-dropdown ${type || ''}` },
    div({ class: 'selected' }, title),
    $list,
  );

  const toggleDropdown = (event) => {
    event.stopPropagation();
    $list.classList.toggle('open');
    document.querySelectorAll('.select-dropdown .options').forEach((dropdown) => {
      if (dropdown !== $list) dropdown.classList.remove('open');
    });
  };

  $dropdown.querySelector('.selected').addEventListener('click', toggleDropdown);
  document.addEventListener('click', () => $list.classList.remove('open'));

  options.forEach((option) => {
    const optionClass = toClassName(option);
    const label = type === 'country' ? option : translate(optionClass);
    const $option = li({ class: `option ${optionClass}` }, label);
    $option.addEventListener('click', () => {
      $dropdown.querySelector('.selected').textContent = option;
      $list.classList.remove('open');
    });
    $list.append($option);
  });

  return $dropdown;
}

function getUniqueValues(locations, key) {
  return [...new Set(
    locations.map((location) => location[key]),
  )].filter((value) => value).sort();
}

function filterLocations(locations, country, type) {
  const defaultCountry = translate('select-country');
  const defaultType = translate('select-type');

  // If no filters are active, return all locations
  if (country === defaultCountry && type === defaultType) {
    return locations;
  }

  return locations.filter((location) => {
    if (country !== defaultCountry && location.country !== country) {
      return false;
    }
    if (type !== defaultType && location.type !== type) {
      return false;
    }
    return true;
  });
}

function updateTypeOptions($typeFilter, locations, selectedCountry) {
  // Get locations for selected country
  const countryLocations = selectedCountry === translate('select-country')
    ? locations
    : locations.filter((location) => location.country === selectedCountry);

  // Get unique types from filtered locations
  const availableTypes = [...new Set(
    countryLocations.map((location) => location.type),
  )].filter((type) => type).sort();

  // Create new dropdown with filtered types
  const newDropdown = createDropdown(translate('select-type'), availableTypes, 'type');

  // Replace the old dropdown with the new one
  $typeFilter.replaceWith(newDropdown);

  // Return the new dropdown so it can be used in the calling function
  return newDropdown;
}

// create location card
function createLocationCard(location, index) {
  // format website url
  const formatUrl = (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.host + urlObj.pathname;
    } catch (e) {
      return url;
    }
  };

  return div({ class: 'location-card', 'data-pin': index },
    h3({ class: toClassName(location.type) }, location.location),
    // replace \n replaced with <br>
    ...location.address.split('\\n').map((line) => p(line)),
    // create website link if URL exists and is valid
    ...(location.website && location.website.trim() ? [
      a({
        href: location.website,
      }, formatUrl(location.website)),
    ] : []),
  );
}

function handleSearch($countryFilter, $typeFilter) {
  const selectedCountry = $countryFilter.querySelector('.selected').textContent;
  const selectedType = $typeFilter.querySelector('.selected').textContent;

  // Update state
  state.filters.country = selectedCountry;
  state.filters.type = selectedType;
  state.filteredLocations = filterLocations(state.allLocations, selectedCountry, selectedType);

  // Remove existing filtered results if they exist
  const existingFilteredResults = document.querySelector('.filtered-results');
  if (existingFilteredResults) existingFilteredResults.remove();

  const editSearch = a({ class: 'edit' }, translate('edit-search'));
  editSearch.addEventListener('click', () => {
    $locatorSearch.classList.remove('hide-filters');
  });

  const $results = div({ class: 'results' });

  // Update UI
  const $filteredResults = div({ class: 'filtered-results' },
    div({ class: 'header' },
      div({ class: 'country' }, selectedCountry),
      editSearch,
    ),
    div({ class: 'type' }, selectedType === translate('select-type') ? '' : selectedType),
    $results,
  );

  state.filteredLocations.forEach((location, i) => {
    const $location = createLocationCard(location, i);
    $results.append($location);

    $location.addEventListener('click', () => {
      highlightActiveLocation(i);
    });
  });

  // insert results after filters
  const $locatorSearch = document.querySelector('.locator-search');
  $locatorSearch.append($filteredResults);
  $locatorSearch.classList.add('hide-filters');

  updateMarkers(state.filteredLocations);
}

function createFilters(locations) {
  // Store locations in state
  state.allLocations = locations;
  state.filteredLocations = locations;

  // Create filter elements
  const uniqueCountries = getUniqueValues(locations, 'country');
  const uniqueTypes = getUniqueValues(locations, 'type');

  const $countryFilter = createDropdown(translate('select-country'), uniqueCountries, 'country');
  // Add country selection handler
  $countryFilter.querySelectorAll('.option').forEach(($option) => {
    $option.addEventListener('click', () => {
      const selectedCountry = $option.textContent;
      $typeFilter = updateTypeOptions($typeFilter, locations, selectedCountry);
      $searchButton.disabled = false;
    });
  });
  let $typeFilter = createDropdown(translate('select-type'), uniqueTypes, 'type');

  const $searchButton = button({ class: 'button search', disabled: true }, translate('search'));
  $searchButton.addEventListener('click', () => {
    handleSearch($countryFilter, $typeFilter);
    $searchButton.parentElement.classList.add('reset');
  });

  // Clear button handler
  const $clearButton = a({ class: 'clear' }, translate('clear'));
  $clearButton.addEventListener('click', () => {
    // Reset state
    state.filters.country = translate('select-country');
    state.filters.type = translate('select-type');
    state.filteredLocations = state.allLocations;

    // Reset UI
    $countryFilter.querySelector('.selected').textContent = state.filters.country;
    $typeFilter = updateTypeOptions($typeFilter, locations, state.filters.country);
    // clear filter-results
    const $filteredResults = document.querySelector('.filtered-results');
    if ($filteredResults) $filteredResults.remove();
    updateMarkers(state.allLocations);
    $clearButton.parentElement.classList.remove('reset');
    $searchButton.disabled = true;
  });

  // Return assembled filter container
  return div({ class: 'filters' },
    h3(translate('please-select-country')),
    $countryFilter,
    h3(translate('please-select-type')),
    $typeFilter,
    div({ class: 'search-clear' },
      $searchButton,
      $clearButton,
    ),
  );
}

// key = AIzaSyBzkFWc7cMP0Ww_5cYqCcgxIEx-2YpNas4
export default async function decorate(block) {
  const [, locale] = getRegionLocale();
  const {
    'filter-title': filterTitle,
    'google-maps-api-key': mapKey,
    'map-data': mapData,
  } = readBlockConfig(block);
  const googleMapScript = script(`
    (g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=\`https://maps.googleapis.com/maps/api/js?\`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({
      key: "${mapKey}", 
      v: "weekly",
    });
  `);
  document.head.appendChild(googleMapScript);

  // fetch both map data and translations
  const [mapResponse] = await Promise.all([
    fetch(mapData),
    loadTranslations(locale),
  ]);

  // handle response
  if (!mapResponse.ok) throw new Error('Failed to fetch map data');
  const locationData = await mapResponse.json();

  const $mapFilter = div({ class: 'map-filter-container' },
    div({ class: 'map' },
      div({ id: 'google-map' }),
    ),
    div({ class: 'locator-search' },
      h2(filterTitle),
      createFilters(locationData.data),
    ),
  );
  block.innerHTML = '';
  block.append($mapFilter);

  buildMap();
  updateMarkers(locationData.data);
}
