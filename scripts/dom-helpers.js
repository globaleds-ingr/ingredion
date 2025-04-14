/* eslint-disable no-param-reassign */

/**
 * Example Usage:
 *
 * domEl('main',
 *  div({ class: 'card' },
 *  a({ href: item.path },
 *    div({ class: 'card-thumb' },
 *     createOptimizedPicture(item.image, item.title, 'lazy', [{ width: '800' }]),
 *    ),
 *   div({ class: 'card-caption' },
 *      h3(item.title),
 *      p({ class: 'card-description' }, item.description),
 *      p({ class: 'button-container' },
 *       a({ href: item.path, 'aria-label': 'Read More', class: 'button primary' }, 'Read More'),
 *     ),
 *   ),
 *  ),
 * )
 */

/**
 * Helper for more concisely generating DOM Elements with attributes and children
 * @param {string} tag HTML tag of the desired element
 * @param  {[Object?, ...Element]} items: First item can optionally be an object of attributes,
 *  everything else is a child element
 * @returns {Element} The constructred DOM Element
 */
export function domEl(tag, ...items) {
  const element = document.createElement(tag);

  if (!items || items.length === 0) return element;

  if (
    !(items[0] instanceof Element || items[0] instanceof HTMLElement)
    && typeof items[0] === 'object'
  ) {
    const [attributes, ...rest] = items;
    items = rest;

    Object.entries(attributes).forEach(([key, value]) => {
      if (!key.startsWith('on')) {
        element.setAttribute(
          key,
          Array.isArray(value) ? value.join(' ') : value,
        );
      } else {
        element.addEventListener(key.substring(2).toLowerCase(), value);
      }
    });
  }

  items.forEach((item) => {
    if (item === null || item === undefined) return;
    item = item instanceof Element || item instanceof HTMLElement
      ? item
      : document.createTextNode(item);
    element.appendChild(item);
  });

  return element;
}

export const removeEmptyTags = (block) => {
  block.querySelectorAll('*').forEach((x) => {
    const tagName = `</${x.tagName}>`;

    // checking that the tag is not autoclosed to make sure we don't remove <meta />
    // checking the innerHTML and trim it to make sure the content inside the tag is 0
    if (
      x.outerHTML.slice(tagName.length * -1).toUpperCase() === tagName
      // && x.childElementCount === 0
      && x.innerHTML.trim().length === 0
    ) {
      x.remove();
    }
  });
};

/**
 * Waits for a DOM element to appear within a specified timeout period.
 * @param {string} selector - The CSS selector of the desired element.
 * @param {number} [timeout=3000] - The maximum time to wait for the element,
 * in milliseconds. Defaults to 3000ms.
 * @returns {Promise<Element>} A promise that resolves with the element when it is found,
 * or rejects if the timeout is reached.
 */
export const waitForElement = (selector, timeout = 3000) => new Promise((resolve, reject) => {
  const interval = 100;
  let elapsedTime = 0;

  const check = () => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
    } else {
      elapsedTime += interval;
      if (elapsedTime >= timeout) {
        reject(new Error('Element not found: ', selector));
      } else {
        setTimeout(check, interval);
      }
    }
  };

  check();
});

export function div(...items) { return domEl('div', ...items); }
export function p(...items) { return domEl('p', ...items); }
export function a(...items) { return domEl('a', ...items); }
export function h1(...items) { return domEl('h1', ...items); }
export function h2(...items) { return domEl('h2', ...items); }
export function h3(...items) { return domEl('h3', ...items); }
export function h4(...items) { return domEl('h4', ...items); }
export function h5(...items) { return domEl('h5', ...items); }
export function h6(...items) { return domEl('h6', ...items); }
export function ul(...items) { return domEl('ul', ...items); }
export function ol(...items) { return domEl('ol', ...items); }
export function li(...items) { return domEl('li', ...items); }
export function i(...items) { return domEl('i', ...items); }
export function small(...items) { return domEl('small', ...items); }
export function strong(...items) { return domEl('strong', ...items); }
export function img(...items) { return domEl('img', ...items); }
export function span(...items) { return domEl('span', ...items); }
export function input(...items) { return domEl('input', ...items); }
export function form(...items) { return domEl('form', ...items); }
export function label(...items) { return domEl('label', ...items); }
export function button(...items) { return domEl('button', ...items); }
export function nav(...items) { return domEl('nav', ...items); }
export function aside(...items) { return domEl('aside', ...items); }
export function section(...items) { return domEl('section', ...items); }
export function meta(...items) { return domEl('meta', ...items); }
export function picture(...items) { return domEl('picture', ...items); }
export function br() { return domEl('br'); }
export function select(...items) { return domEl('select', ...items); }
export function option(...items) { return domEl('option', ...items); }
export function dl(...items) { return domEl('dl', ...items); }
export function dt(...items) { return domEl('dt', ...items); }
export function dd(...items) { return domEl('dd', ...items); }
export function hr(...items) { return domEl('hr', ...items); }
export function script(...items) { return domEl('script', ...items); }
export function summary(...items) { return domEl('summary', ...items); }
export function details(...items) { return domEl('details', ...items); }
export function tr(...items) { return domEl('tr', ...items); }
export function th(...items) { return domEl('th', ...items); }
export function td(...items) { return domEl('td', ...items); }
export function dialog(...items) { return domEl('dialog', ...items); }
export function sup(...items) { return domEl('sup', ...items); }
export function iframe(...items) { return domEl('iframe', ...items); }
