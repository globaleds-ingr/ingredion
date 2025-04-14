import {
  /* buildBlock, */
  loadHeader,
  loadFooter,
  decorateButtons,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  getMetadata,
} from './aem.js';

import { toggleError } from '../blocks/form/form.js';

/**
 * Recursively removes nested <div> elements from a given element.
 */
export function unwrapNestedDivs(element) {
  const children = Array.from(element.children);
  children.forEach((child) => {
    if (child.tagName === 'DIV') {
      unwrapNestedDivs(child);
      while (child.firstChild) {
        element.insertBefore(child.firstChild, child);
      }
      element.removeChild(child);
    }
  });
}

/**
 * Extracts a class name from a string like "Some text [class:some-class]"
 * and returns it with the cleaned text.
 * Useful to style links as highlighted text instead of default button style.
 *
 * @param {string} inputString
 * @returns {{ className: string|null, cleanedString: string }}
 */
export function parseClassFromString(inputString) {
  const classRegex = /\[class:\s*([^\]]+)\]/;
  const classMatch = inputString.match(classRegex);

  let className = null;
  let cleanedString = inputString;

  if (classMatch) {
    className = classMatch[1].trim();
    cleanedString = inputString.replace(classRegex, '').trim();
  }

  return { className, cleanedString };
}

/**
 * Builds hero block and prepends to main in a new section.
 * @param {Element} main The container element
 */
/*
function buildHeroBlock(main) {
  const h1 = main.querySelector('h1');
  const picture = main.querySelector('picture');
  // eslint-disable-next-line no-bitwise
  if (h1 && picture && (h1.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_PRECEDING)) {
    const section = document.createElement('div');
    section.append(buildBlock('hero', { elems: [picture, h1] }));
    main.prepend(section);
  }
}
*/

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
/*
function buildAutoBlocks(main) {
  try {
    buildHeroBlock(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}
*/

/**
 * Decorate links
 * @param {Element} main The container element
 */
function decorateLinks(main) {
  main.querySelectorAll('a').forEach((link) => {
    // add aria-label to links with icons for Accessibility
    if (link.querySelector('span.icon')) {
      const iconName = link.querySelector('img').getAttribute('data-icon-name');
      link.setAttribute('aria-label', iconName);
    }
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  // hopefully forward compatible button decoration
  decorateButtons(main);
  decorateIcons(main);
  // buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateLinks(main);
}

/**
 * Decorates the template.
 */
export async function loadTemplate(doc, templateName) {
  try {
    const cssLoaded = new Promise((resolve) => {
      loadCSS(
        `${window.hlx.codeBasePath}/templates/${templateName}/${templateName}.css`,
      )
        .then(resolve)
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.error(
            `failed to load css module for ${templateName}`,
            err.target.href,
          );
          resolve();
        });
    });
    const decorationComplete = new Promise((resolve) => {
      (async () => {
        try {
          const mod = await import(
            `../templates/${templateName}/${templateName}.js`
          );
          if (mod.default) {
            await mod.default(doc);
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.log(`failed to load module for ${templateName}`, error);
        }
        resolve();
      })();
    });

    document.body.classList.add(`${templateName}-template`);

    await Promise.all([cssLoaded, decorationComplete]);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(`failed to load block ${templateName}`, error);
  }
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const templateName = getMetadata('template');
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    if (templateName) {
      await loadTemplate(doc, templateName);
    }
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * function to attach observation listener to hero block if anchor block is present
 * add observer to anchor links to highlight active section
 */
function addHeroObserver(doc) {
  const anchorBlock = doc.querySelector('.anchor-wrapper');
  const heroBlock = doc.querySelector('.hero-wrapper');
  if (anchorBlock && heroBlock) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          anchorBlock.classList.remove('is-fixed');
        } else {
          anchorBlock.classList.add('is-fixed');
        }
      });
    });
    observer.observe(heroBlock);
  }
  if (anchorBlock) {
    const anchorLinks = anchorBlock.querySelectorAll('a');
    const arrayLinks = [];
    anchorLinks.forEach((link) => {
      arrayLinks.push(link.getAttribute('href'));
    });
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const index = arrayLinks.indexOf(`#${entry.target.id}`);
        if (entry.isIntersecting) {
          anchorLinks.forEach((link) => {
            link.classList.remove('active');
          });
          anchorLinks[index].classList.add('active');
        }
      });
    });
    anchorLinks.forEach((link) => {
      const target = doc.querySelector(link.getAttribute('href'));
      if (target) {
        observer.observe(target);
      }
    });
  }
}

function initializePhoneValidation(document) {
  const form = document.querySelector('.modal dialog form') || document.querySelector('form');
  if (!form) return;
  const input = document.querySelector('.Phone > input');
  const countryDropdown = document.querySelector('.Country .form-dropdown > input');
  const countryTrigger = document.querySelector('.Country .form-dropdown__selected-label');

  const iti = window.intlTelInput(input, {
    loadUtils: () => import('./intl-tel-input-utils.js'),
    countrySearch: false,
    countryOrder: ['us', 'ca'],
    fixDropdownWidth: false,
    initialCountry: 'us',
    formatAsYouType: false,
    formatOnDisplay: false,
  });

  const initialCountryData = iti.getSelectedCountryData();
  countryDropdown.value = initialCountryData.iso2;
  countryTrigger.textContent = initialCountryData.name;
  countryTrigger.style.color = 'black';

  input.addEventListener('countrychange', () => {
    const countryData = iti.getSelectedCountryData();
    countryDropdown.value = countryData.iso2;
    countryTrigger.textContent = countryData.name;
    countryTrigger.style.color = 'black';
    countryDropdown.dispatchEvent(new Event('change'));
  });

  countryDropdown.addEventListener('change', (e) => {
    const countryCode = e.target.value;
    if (countryCode) {
      iti.setCountry(countryCode.toLowerCase());
    }
  });

  input.addEventListener('input', (e) => {
    const isValid = iti.isValidNumber();
    let errorMessage;
    if (!isValid && input.value === '') {
      errorMessage = 'Please check your form entries';
    } else if (!isValid) {
      errorMessage = e.target.getAttribute('validation-error-message');
    } else {
      input.setAttribute('full-phone-number', iti.getNumber());
    }
    toggleError(input.parentElement, !isValid, errorMessage);
  });
}

function autolinkModals(element) {
  element.addEventListener('click', async (e) => {
    const origin = e.target.closest('a');

    if (origin && origin.href && origin.href.includes('/modals/')) {
      e.preventDefault();
      const { openModal } = await import(`${window.hlx.codeBasePath}/blocks/modal/modal.js`);
      await openModal(origin.href);
      initializePhoneValidation(document);
    }
  });
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  autolinkModals(doc);
  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadHeader(doc.querySelector('header'));
  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
  addHeroObserver(doc);

  loadCSS(`${window.hlx.codeBasePath}/styles/intlTelInput.min.css`);
  await import('./intlTelInput.min.js');
  initializePhoneValidation(doc);
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
