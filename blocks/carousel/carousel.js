/* eslint-disable function-paren-newline, object-curly-newline */
import { div, ul, li, button, nav } from '../../scripts/dom-helpers.js';
import { fetchPlaceholders } from '../../scripts/aem.js';
import { parseClassFromString } from '../../scripts/scripts.js';

function showSlide(block, slideIndex = 0) {
  block.dataset.activeSlide = slideIndex;
  const slides = block.querySelectorAll('.carousel-slide');
  const realSlideIndex = Math.max(0, Math.min(slideIndex, slides.length - 1));
  const activeSlide = block.querySelector(`.carousel-slide[data-slide-index="${realSlideIndex}"]`);
  const indicators = block.querySelectorAll('.carousel-slide-indicator button');

  indicators.forEach((indicator, i) => {
    if (i !== realSlideIndex) indicator.removeAttribute('disabled');
    else indicator.setAttribute('disabled', 'true');
  });

  // disable btns when on first or last slide
  block.querySelector('.slide-prev').toggleAttribute('disabled', realSlideIndex === 0);
  block.querySelector('.slide-next').toggleAttribute('disabled', realSlideIndex === slides.length - 1);

  const slideWidth = activeSlide.offsetWidth;
  const scrollPosition = slideWidth * realSlideIndex;

  block.querySelector('.carousel-slides').scrollTo({
    left: scrollPosition,
    behavior: 'smooth',
  });
}

function snapToSlide(block) {
  const slidesContainer = block.querySelector('.carousel-slides');
  const slides = [...block.querySelectorAll('.carousel-slide')];
  const slideWidth = slides[0].offsetWidth;
  const closestSlideIndex = Math.round(slidesContainer.scrollLeft / slideWidth);

  showSlide(block, closestSlideIndex);
}

function enableDragging(block) {
  const slidesContainer = block.querySelector('.carousel-slides');
  let isDragging = false;
  let startX = 0;
  let lastScrollLeft = 0;

  function onMove(x) {
    if (!isDragging) return;
    const deltaX = startX - x;
    slidesContainer.scrollLeft = lastScrollLeft + deltaX; // Move smoothly with the mouse
  }

  function onEnd() {
    if (!isDragging) return;
    isDragging = false;
    slidesContainer.classList.remove('dragging');
    snapToSlide(block);
  }

  slidesContainer.addEventListener('mousedown', (e) => {
    isDragging = true;
    slidesContainer.classList.add('dragging');
    startX = e.pageX;
    lastScrollLeft = slidesContainer.scrollLeft;
  });

  slidesContainer.addEventListener('mousemove', (e) => {
    if (isDragging) {
      e.preventDefault();
      onMove(e.pageX);
    }
  });

  slidesContainer.addEventListener('mouseup', onEnd);
  slidesContainer.addEventListener('mouseleave', onEnd);

  // Touch support for mobile
  slidesContainer.addEventListener('touchstart', (e) => {
    isDragging = true;
    slidesContainer.classList.add('dragging');
    startX = e.touches[0].pageX;
    lastScrollLeft = slidesContainer.scrollLeft;
  });

  slidesContainer.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    e.preventDefault();
    onMove(e.touches[0].pageX);
  });

  slidesContainer.addEventListener('touchend', onEnd);

  // Prevent images from being dragged
  block.querySelectorAll('.carousel-slide img').forEach((img) => {
    img.addEventListener('dragstart', (e) => e.preventDefault());
  });
}

function bindEvents(block) {
  block.querySelectorAll('.carousel-slide-indicator button').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const slideIndex = parseInt(e.currentTarget.closest('li').dataset.slideIndex, 10);
      showSlide(block, slideIndex);
    });
  });

  block.querySelector('.slide-prev').addEventListener('click', () => {
    showSlide(block, parseInt(block.dataset.activeSlide, 10) - 1);
  });

  block.querySelector('.slide-next').addEventListener('click', () => {
    showSlide(block, parseInt(block.dataset.activeSlide, 10) + 1);
  });
}

function createSlide(row, i) {
  const children = Array.from(row.children);

  children.forEach((child) => {
    // Check if this div contains an <img> element anywhere inside
    if (child.querySelector('img')) {
      child.classList.add('slide-image');
    } else {
      child.classList.add('slide-body');
      const links = child.querySelectorAll('a');
      if (links) {
        Array.from(links).forEach((l) => {
          const parsingResult = parseClassFromString(l.title);
          if (parsingResult.className) {
            const parentDiv = l.parentElement;
            const grandParent = parentDiv.parentElement;
            grandParent.insertBefore(l, parentDiv);
            parentDiv.remove();
            l.classList.remove('button');
            l.classList.add(parsingResult.className);
            l.title = parsingResult.cleanedString;
            l.textContent = parsingResult.cleanedString;
          }
        });
      }
    }
  });

  return li({ class: 'carousel-slide', 'data-slide-index': i }, ...children);
}

let carouselId = 0;

export default async function decorate(block) {
  carouselId += 1;
  block.id = `carousel-${carouselId}`;
  const rows = block.querySelectorAll(':scope > div');
  const placeholders = await fetchPlaceholders();
  const isSingleSlide = rows.length < 2;

  const carouselContainer = div({ class: 'carousel-container' },
    div({ class: 'carousel-overview' }, rows[0]),
    div({ class: 'carousel-slides-container' },
      !isSingleSlide && nav(
        ul({ class: 'carousel-slide-indicators' },
          ...Array.from(rows).slice(1).map((_, i) => li({ class: 'carousel-slide-indicator', 'data-slide-index': i },
            button({ type: 'button', 'aria-label': `Show Slide ${i + 1}` }),
          )),
        ),
        button({ type: 'button', class: 'slide-prev', 'aria-label': placeholders.previousSlide || 'Previous Slide' }),
        button({ type: 'button', class: 'slide-next', 'aria-label': placeholders.nextSlide || 'Next Slide' }),
      ),
      ul({ class: 'carousel-slides' },
        ...Array.from(rows).slice(1).map((row, i) => createSlide(row, i)),
      ),
    ),
  );

  block.replaceChildren(carouselContainer);
  if (!isSingleSlide) {
    bindEvents(block);
    enableDragging(block);
    showSlide(block, 0);
  }
}
