import {
  div,
  span,
  p,
  button,
} from '../../scripts/dom-helpers.js';

import { unwrapNestedDivs } from '../../scripts/scripts.js';
import { getCookie } from '../../scripts/utils.js';

function addIngredientToCart(ingredientName, ingredientUrl) {
  const cartCookies = getCookie('cartCookies');
  if (cartCookies) {
    document.cookie = `cartCookies=${cartCookies} cookie ${ingredientName},url=${ingredientUrl}; path=/`;
  } else {
    document.cookie = `cartCookies=cookie ${ingredientName},url=${ingredientUrl}; path=/`;
  }

  const cartCount = document.querySelector('.icon-cart > .count');
  if (cartCount) {
    cartCount.textContent = parseInt(cartCount.textContent, 10) + 1;
    cartCount.style.display = 'block';
  }
  if (cartCount.textContent === '0') {
    cartCount.style.display = 'none';
  }
}

function removeIngredientFromCart() {
  const cartCookies = getCookie('cartCookies');
  const cookies = cartCookies.split('cookie ');
  const lastCookie = cookies[cookies.length - 1];
  const lastCookieUrl = lastCookie.split('=')[1];
  if (lastCookieUrl === window.location.href) {
    const updatedCookies = cookies.slice(0, -1);
    document.cookie = `cartCookies=${updatedCookies.join(' cookie ').trim()}; path=/`;
  }

  const cartCount = document.querySelector('.icon-cart > .count');
  if (cartCount) {
    cartCount.textContent = parseInt(cartCount.textContent, 10) - 1;
    cartCount.style.display = 'block';
  }
  if (cartCount.textContent === '0') {
    cartCount.style.display = 'none';
  }
}

export default async function decorate(block) {
  unwrapNestedDivs(block);

  const contentContainer = div(
    { class: 'related-ingredient-content', tabIndex: 0 },
    div({ class: 'related-ingredient-text' }),
  );

  const buttonContainer = div({ class: 'related-ingredient-buttons' });
  const cartListNotificationContainer = div(
    { class: 'cart-list-notification' },
    div(
      { class: 'cart-list-notification-wrapper' },
      p('Product successfully added to cart!'),
      button({ class: 'cart-list-notification-undo icon-close' }, 'Undo'),
      button({ class: 'cart-list-notification-close icon-close' }),
    ),
  );

  const undoButton = cartListNotificationContainer.querySelector('.cart-list-notification-undo');
  const closeButton = cartListNotificationContainer.querySelector('.cart-list-notification-close');

  undoButton.addEventListener('click', () => {
    removeIngredientFromCart();
    cartListNotificationContainer.style.display = 'none';
  });

  closeButton.addEventListener('click', () => {
    cartListNotificationContainer.style.display = 'none';
  });

  block.appendChild(contentContainer);
  block.appendChild(buttonContainer);
  block.appendChild(cartListNotificationContainer);

  const textContainer = block.querySelector('.related-ingredient-text');
  const productName = block.querySelector('.related-ingredient.block h4');
  productName.classList.add('product-name');
  productName.setAttribute('tabIndex', 0);
  contentContainer.insertBefore(productName, textContainer);

  const children = Array.from(block.children);

  if (
    children[0].tagName === 'P'
    && !children[0].classList.contains('button-container')
    && children[1].tagName !== 'H3'
  ) {
    textContainer.appendChild(children[0]);
  } else {
    let currentChild = block.firstElementChild;
    let foundH3 = false;

    while (currentChild) {
      if (currentChild.classList.contains('button-container')) {
        break;
      }
      if (currentChild.tagName === 'H3') {
        foundH3 = true;
      }
      if (foundH3) {
        const nextSibling = currentChild.nextElementSibling;
        textContainer.appendChild(currentChild);
        currentChild = nextSibling;
      } else if (currentChild.tagName === 'P') {
        currentChild.classList.add('product-type');
        contentContainer.insertBefore(currentChild, textContainer);
        currentChild = block.firstElementChild;
      } else {
        currentChild = currentChild.nextElementSibling;
      }
    }
  }

  const buttons = block.querySelectorAll('.button-container');

  for (let i = 0; i < buttons.length; i += 1) {
    const link = buttons[i].querySelector(':scope > a');
    const normalizedIndex = buttons.length === 2 ? i + 2 : i;

    if (normalizedIndex < 2) {
      link.classList.add('icon');
      const spanClass = normalizedIndex === 1 ? 'icon-download' : 'icon-eye';
      const spanElement = span({ class: spanClass });

      if (normalizedIndex === 1) {
        link.download = '';
      }
      link.prepend(spanElement);
      contentContainer.appendChild(link);
    } else {
      if (normalizedIndex === 2) {
        link.classList.add('add-sample-button');
        const ingredientName = productName.textContent;
        const ingredientUrl = window.location.href;
        link.addEventListener('click', (e) => {
          e.preventDefault();
          addIngredientToCart(ingredientName, ingredientUrl);
          cartListNotificationContainer.style.display = 'block';
          setTimeout(() => {
            cartListNotificationContainer.style.display = 'none';
          }, 5000);
        });
      } else if (normalizedIndex === 3) {
        link.classList.add('secondary');
      }
      buttonContainer.appendChild(link);
    }
    buttons[i].remove();
  }

  if (!document.querySelector('.section-related-ingredient-wrapper')) {
    const section = document.querySelector(
      '.section.related-ingredient-container',
    );
    const sectionWrapper = div({ class: 'section-related-ingredient-wrapper' });
    section.parentNode.insertBefore(sectionWrapper, section);
    sectionWrapper.appendChild(section);
  }
}
