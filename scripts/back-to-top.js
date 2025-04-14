/* eslint-disable import/prefer-default-export */
import { div, span, button } from './dom-helpers.js';

/**
 * Adds a button that appears after scrolling past a threshold
 * and allows smooth scrolling back to the top.
 */
export function initBackToTop() {
  const scrollThreshold = 1600;
  const footerBlock = document.querySelector('footer.footer-wrapper .footer.block');

  const scrollTopBtn = div({ class: 'scroll-top-btn' });
  const wrapper = div(
    { class: 'scroll-top-btn-wrapper' },
    span({ class: 'scroll-top-btn-label' }, 'back to top'),
    button({ class: 'scroll-top-btn-button icon-arrow-blk' }),
  );

  scrollTopBtn.appendChild(wrapper);
  footerBlock.prepend(scrollTopBtn);

  const toggleVisibility = () => {
    const { scrollY, innerHeight: windowHeight } = window;
    const documentHeight = document.documentElement.scrollHeight;

    if (
      scrollY > scrollThreshold
      && documentHeight > windowHeight + scrollThreshold
    ) {
      scrollTopBtn.classList.add('is-visible');
    } else {
      scrollTopBtn.classList.remove('is-visible');
    }
  };

  window.addEventListener('scroll', toggleVisibility);

  wrapper.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  });
}
