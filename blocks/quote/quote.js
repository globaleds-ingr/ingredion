import { div, h1, h3 } from '../../scripts/dom-helpers.js';
import { unwrapNestedDivs } from '../../scripts/scripts.js';

export default async function decorate(block) {
  unwrapNestedDivs(block);

  const quoteWrapper = div(
    { class: 'quoteblock-wrapper' },
    div({ class: 'heading heading-center' }, h1({ tabIndex: 0 })),
    div({ class: 'heading heading-center' }, h3({ tabIndex: 0 })),
    h3({ class: 'label-text label-text-center', tabIndex: 0 }),
  );

  block.insertBefore(quoteWrapper, block.firstElementChild);

  const mainHeading = document.querySelector('.quoteblock-wrapper .heading.heading-center h1');
  const firstSubheading = document.querySelector('.quoteblock-wrapper .heading.heading-center h3');
  const secondSubheading = document.querySelector('.quoteblock-wrapper .label-text.label-text-center');
  const paragraphs = document.querySelectorAll('.quoteblock-wrapper ~ p');

  if (paragraphs.length >= 1) {
    mainHeading.appendChild(paragraphs[0]);
    firstSubheading.appendChild(paragraphs[1]);
    secondSubheading.appendChild(paragraphs[2]);
  }
}
