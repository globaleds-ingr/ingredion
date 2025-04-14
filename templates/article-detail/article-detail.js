/* eslint-disable function-paren-newline, object-curly-newline */
import { div, h2, a, img, sup, p } from '../../scripts/dom-helpers.js';
import { getMetadata, createOptimizedPicture } from '../../scripts/aem.js';
import { breadcrumbs } from '../../scripts/breadcrumbs.js';

export default async function decorate(doc) {
  const $main = doc.querySelector('main');
  const $content = $main.querySelector('.default-content-wrapper');
  const teaserTitle = getMetadata('teaser-title');
  const teaserDescription = getMetadata('teaser-description');
  const heroImg = getMetadata('og:image');
  const type = getMetadata('type');
  const publishedDate = getMetadata('published-date');
  const categories = getMetadata('categories');
  const author = getMetadata('author');
  const socialShare = getMetadata('social-share');
  const $breadcrumbs = await breadcrumbs();
  const picBreakpoints = [
    { media: '(min-width: 1080px)', width: '2000' },
    { media: '(min-width: 600px)', width: '800' },
    { width: '600' },
  ];

  const $hero = div({ class: 'hero' });
  const $picture = $main.querySelector('picture');
  if ($picture) {
    // if picture exist use it as the hero
    const pic = $picture.querySelector('img');
    const picOpt = createOptimizedPicture(pic.src, pic.alt, true, picBreakpoints);
    pic.replaceWith(picOpt);
    $hero.append($picture);
  } else if (heroImg) {
    // use the metadata image as the hero
    $hero.append(
      createOptimizedPicture(heroImg, teaserTitle, true, picBreakpoints),
    );
  }

  const socialShareLinks = socialShare.split(',')
    .map((platform) => {
      const platformLink = platform.trim().toLowerCase();
      if (platformLink === 'facebook') {
        return a({
          class: 'icon icon-facebook',
          href: `https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`,
          'aria-label': 'Facebook',
        }, img({ src: '/icons/facebook.svg', alt: 'Facebook' }));
      }
      if (platformLink === 'x') {
        return a({
          class: 'icon icon-x',
          href: `https://x.com/intent/tweet?url=${window.location.href}`,
          'aria-label': 'X',
        }, img({ src: '/icons/x.svg', alt: 'X' }));
      }
      return null; // Return null for unsupported platforms
    })
    .filter(Boolean); // Filter out null entries

  const $header = div({ class: 'header' },
    $breadcrumbs,
    div({ class: 'type' }, type),
    h2(teaserTitle),
    p({ class: 'description' }, teaserDescription),
    p(sup(author)),
    div({ class: 'social-share' },
      // linkedIn always shown
      a({
        class: 'icon icon-linkedin',
        href: `https://www.linkedin.com/cws/share?url=${window.location.href}`,
        'aria-label': 'LinkedIn',
      }, img({ src: '/icons/linkedin.svg', alt: 'LinkedIn' })),
      // other share icons
      ...socialShareLinks,
    ),
    div({ class: 'line-break' }),
  );

  // center align ### paragraphs
  $content.querySelectorAll('p').forEach((paragraph) => {
    if (paragraph.textContent.trim() === '###') {
      paragraph.classList.add('centered');
    }
  });

  $main.prepend($hero);
  $content.prepend($header);

  const teaserTitleHeader = $header.querySelector('h2');
  let categoryTags;

  if (categories) {
    categoryTags = div({ class: 'category-tags' },
      publishedDate,
      ' | ',
      categories,
    );
  } else {
    categoryTags = div({ class: 'category-tags' },
      publishedDate,
    );
  }

  teaserTitleHeader.insertAdjacentElement('afterend', categoryTags);

  let nextElement = $content.nextElementSibling;
  while (nextElement) {
    const temp = nextElement.nextElementSibling;
    if (nextElement.classList.contains('default-content-wrapper')) {
      while (nextElement.firstChild) {
        $content.appendChild(nextElement.firstChild);
      }
      nextElement.remove();
    } else {
      $content.appendChild(nextElement);
    }
    nextElement = temp;
  }
}
