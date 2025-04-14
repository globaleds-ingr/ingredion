// valid regions and locales
const VALID_REGIONS = ['na', 'sa', 'emea', 'apac'];
const VALID_LOCALES = ['en-us', 'es-mx', 'pt-br', 'es-co', 'es-ar', 'en-uk', 'en-sg', 'ja-jp', 'sc-cn', 'en-au'];

/**
 * Retrieves the region and locale from the URL path.
 * If the region or locale is not valid, it defaults to 'na' and 'en-us'
 * @returns {Array} An array containing the region and locale.
 */
export function getRegionLocale() {
  const segments = window.location.pathname
    .split('/')
    .filter((segment) => segment);
  // fallback values 'na' and 'en-us'
  let [region = 'na', locale = 'en-us'] = segments;
  // validate region and locale
  if (!VALID_REGIONS.includes(region)) region = 'na';
  if (!VALID_LOCALES.includes(locale)) locale = 'en-us';
  return [region, locale];
}

/**
 * Prevent rapid firing, throttles a function so that it is only
 * called once every specified number of milliseconds.
 * @param {Function} fn - The function to throttle.
 * @param {number} wait - Number of milliseconds to wait before calling again.
 * @param hoverWait
 * @returns {Function} A throttled version of the input function.
 */
export function throttle(fn, wait, hoverWait) {
  let lastCall = 0;
  let hoverTimer;
  let isHovered = false;
  return function throttled(event, ...args) {
    const now = Date.now();
    // clear any previous timer when hover starts
    if (hoverTimer) clearTimeout(hoverTimer);
    isHovered = true;
    hoverTimer = setTimeout(() => {
      if (isHovered && now - lastCall >= wait) {
        lastCall = now;
        fn.apply(this, args);
      }
    }, hoverWait);
    // attach event listener to cancel if mouse leaves
    event.target.addEventListener(
      'mouseleave',
      () => {
        isHovered = false;
        clearTimeout(hoverTimer);
      },
      { once: true },
    );
  };
}

// Store translations globally in the module scope.
let translations = {};

/**
 * Loads translations from a JSON file and caches the results.
 * Improved upon fetchPlaceholderData from scripts/aem.js.
 * If the translations for the specified sheet are already cached, returns the cached translations.
 * Otherwise, fetches the translations from the server, processes them, and caches the results.
 * @async
 * @param {string} [sheet='default'] - The name of the sheet to fetch translations for.
 * @returns {Promise<Object>} A promise that resolves to an object containing the translations.
 */
export async function loadTranslations(sheet = 'default') {
  const cache = loadTranslations.cache || (loadTranslations.cache = new Map());
  if (cache.has(sheet)) { return cache.get(sheet); }
  const url = `/translations.json?sheet=${sheet}`;
  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Failed to fetch translations for sheet: ${sheet}`);

    const json = await resp.json();
    const placeholders = json.data.reduce((acc, item) => {
      if (item.k) { acc[item.k] = item.v || ''; }
      return acc;
    }, {});
    cache.set(sheet, placeholders);
    translations = placeholders;
    return placeholders;
  } catch (error) {
    console.error('Error fetching translations:', error);
    cache.set(sheet, {});
    return {};
  }
}

// Function to fetch translations and return a lookup object
let formTranslations = {};
export async function loadFormTranslations(url, locale) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch translations');
    const data = await response.json();

    // Create a lookup object for translations
    formTranslations = data.data.reduce((acc, item) => {
      acc[item.key] = item[locale] || item.en;
      return acc;
    }, {});
    return formTranslations;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error loading form translations:', error);
    return {};
  }
}

/**
 * Translates a given key using the fetched translations.
 * If the key is not found in the translations, returns the key itself.
 * @param {string} key - The key to translate.
 * @returns {string} The translated string or the key if not found.
 */
export function translateFormLabels(key) { return formTranslations[key] || key; }

/**
 * Translates a given key using the fetched translations.
 * If the key is not found in the translations, returns the key itself.
 * @param {string} key - The key to translate.
 * @returns {string} The translated string or the key if not found.
 */
export function translate(key) { return translations[key] || key; }

/**
 * Converts a Unix timestamp to a human-readable date format.
 * @param {string | number} timestamp - The Unix timestamp in seconds.
 * @returns {string} Formatted date string in "Month Day, Year" format.
 */
export function formatDate(timestamp) {
  const date = new Date(parseInt(timestamp, 10) * 1000); // Convert seconds to milliseconds
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

export function getCookie(name) {
  const cookies = document.cookie.split('; ');
  const foundCookie = cookies.find((cookie) => cookie.startsWith(`${name}=`));

  if (foundCookie) {
    return decodeURIComponent(foundCookie.substring(foundCookie.indexOf('=') + 1));
  }
  return null;
}
