import {
  div,
  p,
  button,
} from '../../scripts/dom-helpers.js';
import { getCookie } from '../../scripts/utils.js';

function deleteCartItem(itemName, itemUrl, clickedButton) {
  const cartCookies = getCookie('cartCookies');
  if (cartCookies) {
    const items = cartCookies.split('cookie ').filter(Boolean);
    const itemIndex = items.findIndex((item) => {
      const [name, url] = item.split(',url=');
      return name === itemName && url.trim() === itemUrl.trim();
    });

    if (itemIndex !== -1) {
      items.splice(itemIndex, 1);
      document.cookie = `cartCookies=${items.length ? `cookie ${items.join(' cookie ')}` : ''}; path=/`;

      const cartCount = document.querySelector('.icon-cart > .count');
      if (cartCount) {
        const newCount = parseInt(cartCount.textContent, 10) - 1;
        cartCount.textContent = newCount;
        cartCount.style.display = newCount === 0 ? 'none' : 'block';
        if (newCount === 0) {
          const noItems = document.querySelector('.cart-list__noItems');
          const cartList = document.querySelector('.cart-list__list');
          if (noItems && cartList) {
            noItems.style.display = 'block';
            cartList.style.display = 'none';
          }
        }
      }

      const itemRow = clickedButton.closest('.cart-list__list--item');
      if (itemRow) {
        itemRow.remove();
      }
      // Store the deleted item info for undo
      window.lastDeletedItem = { name: itemName, url: itemUrl };
    }
  }
}

function addItemToCart(ingredientName, ingredientUrl) {
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

  // Create and add the item row back to the cart list
  const cartList = document.querySelector('.cart-list__list');
  const noItems = document.querySelector('.cart-list__noItems');
  if (cartList && noItems) {
    // Show cart list and hide no items message
    cartList.style.display = 'block';
    noItems.style.display = 'none';

    // Create new item row
    const itemDiv = document.createElement('div');
    itemDiv.classList.add('cart-list__list--item');

    const link = document.createElement('a');
    link.href = ingredientUrl;
    link.textContent = ingredientName;

    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('icon-trash');
    const notification = document.querySelector('.cart-list-notification');
    deleteBtn.addEventListener('click', (e) => {
      deleteCartItem(ingredientName, ingredientUrl, e.currentTarget);
      if (notification) {
        notification.style.display = 'block';
        setTimeout(() => {
          notification.style.display = 'none';
        }, 5000);
      }
    });

    itemDiv.appendChild(link);
    itemDiv.appendChild(deleteBtn);
    cartList.appendChild(itemDiv);
  }
}

export default async function decorate(block) {
  const sampleCart = document.createElement('div');
  sampleCart.classList.add('sample-cart');

  const heading = document.createElement('div');
  heading.classList.add('heading');
  heading.setAttribute('tabindex', '0');
  heading.innerHTML = '<h4>Ingredients in Your Cart</h4>';
  sampleCart.appendChild(heading);

  const cartList = document.createElement('div');
  cartList.classList.add('cart-list__list', 'isVisible');

  const cartListNotificationContainer = div(
    { class: 'cart-list-notification' },
    div(
      { class: 'cart-list-notification-wrapper' },
      p('Product successfully added to cart!'),
      button({ class: 'cart-list-notification-undo icon-close' }, 'Undo'),
      button({ class: 'cart-list-notification-close icon-close' }),
    ),
  );

  // Create label
  const label = document.createElement('p');
  label.classList.add('cart-list__list--label');
  label.setAttribute('tabindex', '0');
  label.textContent = 'Ingredients';
  cartList.appendChild(label);

  // Create line break
  const lineBreak = document.createElement('div');
  lineBreak.classList.add('line-break', 'line-break--gray');
  cartList.appendChild(lineBreak);

  const cartCookies = getCookie('cartCookies');
  const noItems = document.createElement('div');
  noItems.classList.add('cart-list__noItems');
  noItems.style.display = 'block';
  noItems.innerHTML = '<p class="body-text">There are currently no items in your cart</p>';

  if (cartCookies && cartCookies.length > 0) {
    const items = cartCookies.split('cookie ').filter(Boolean);
    items.forEach((item) => {
      const [name, urlPart] = item.split(',url=');
      const itemDiv = document.createElement('div');
      itemDiv.classList.add('cart-list__list--item');

      const link = document.createElement('a');
      link.href = urlPart;
      link.textContent = name;

      const deleteBtn = document.createElement('button');
      deleteBtn.classList.add('icon-trash');
      deleteBtn.addEventListener('click', (e) => {
        deleteCartItem(name, urlPart, e.currentTarget);
        cartListNotificationContainer.style.display = 'block';
        setTimeout(() => {
          cartListNotificationContainer.style.display = 'none';
        }, 5000);
      });

      itemDiv.appendChild(link);
      itemDiv.appendChild(deleteBtn);
      cartList.appendChild(itemDiv);
    });
    if (items.length !== 0) {
      noItems.style.display = 'none';
      cartList.style.display = 'block';
    } else {
      noItems.style.display = 'none';
      cartList.style.display = 'block';
    }
  } else {
    cartList.style.display = 'none';
  }

  const undoButton = cartListNotificationContainer.querySelector('.cart-list-notification-undo');
  const closeButton = cartListNotificationContainer.querySelector('.cart-list-notification-close');

  undoButton.addEventListener('click', () => {
    if (window.lastDeletedItem) {
      addItemToCart(window.lastDeletedItem.name, window.lastDeletedItem.url);
      window.lastDeletedItem = null;
    }
    cartListNotificationContainer.style.display = 'none';
  });

  closeButton.addEventListener('click', () => {
    window.lastDeletedItem = null;
    cartListNotificationContainer.style.display = 'none';
  });

  sampleCart.appendChild(noItems);
  sampleCart.appendChild(cartList);
  sampleCart.appendChild(cartListNotificationContainer);
  block.replaceWith(sampleCart);
}
