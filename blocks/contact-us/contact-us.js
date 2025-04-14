import { div } from '../../scripts/dom-helpers.js';
import { unwrapNestedDivs } from '../../scripts/scripts.js';

function changeElementTag(oldElement, newTagName) {
  const newElement = document.createElement(newTagName);
  Array.from(oldElement.attributes).forEach((attr) => {
    newElement.setAttribute(attr.name, attr.value);
  });

  newElement.innerHTML = oldElement.innerHTML;
  oldElement.parentNode.replaceChild(newElement, oldElement);
  return newElement;
}

export default async function decorate(block) {
  unwrapNestedDivs(block);

  const heading = div({ class: 'heading', tabIndex: 0 });
  changeElementTag(block.firstElementChild, 'h3');
  heading.appendChild(block.firstElementChild);
  block.prepend(heading);

  const contentHeading = div({ class: 'heading', tabIndex: 0 });
  if (block.children.length > 1) {
    changeElementTag(block.children[1], 'h4');
    contentHeading.appendChild(block.children[1]);
    block.insertBefore(contentHeading, block.children[1]);
  }

  const contactBannerContent = div(
    { class: 'contact-banner-content' },
    div({ class: 'contact-banner-primary' }),
  );
  block.appendChild(contactBannerContent);

  const contactBannerPrimary = document.querySelector(
    '.contact-banner-primary',
  );
  contactBannerPrimary.appendChild(contentHeading);
  let currentIndex = 1;
  while (currentIndex < block.children.length) {
    const child = block.children[currentIndex];
    if (child.tagName === 'P') {
      contactBannerPrimary.appendChild(child);
    } else {
      currentIndex += 1;
    }
  }

  const contentWrapper = div({ class: 'content', tabIndex: 0 });
  while (contactBannerPrimary.children.length > 1) {
    contentWrapper.appendChild(contactBannerPrimary.children[1]);
  }
  contactBannerPrimary.appendChild(contentWrapper);
}
