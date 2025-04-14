import { unwrapNestedDivs } from '../../scripts/scripts.js';
import { createOptimizedPicture } from '../../scripts/aem.js';
import { div } from '../../scripts/dom-helpers.js';

export default function decorate(block) {
  const firstDiv = block.querySelectorAll('div')[0];
  const linkCount = firstDiv.querySelectorAll('a').length;

  const columnClass = linkCount === 4 ? 'section-content-columns-4' : 'section-content-columns-6';
  block.classList.add(columnClass);

  unwrapNestedDivs(block);

  const pictureParagraphs = block.querySelectorAll('p:has(picture)');

  const eagerLoadLimit = 6;
  let imageCount = 0;

  if (pictureParagraphs.length > 0) {
    pictureParagraphs.forEach((pictureParagraph) => {
      const buttonContainer = pictureParagraph.nextElementSibling;
      if (!buttonContainer || !buttonContainer.classList.contains('button-container')) {
        return;
      }

      const linkElement = buttonContainer.querySelector('a');
      const pictureElement = pictureParagraph.querySelector('picture img');

      if (pictureElement) {
        const src = pictureElement.getAttribute('src');
        const alt = pictureElement.getAttribute('alt') || '';

        const eager = imageCount < eagerLoadLimit;
        imageCount += 1;

        const optimizedPicture = createOptimizedPicture(src, alt, eager);

        if (linkElement) {
          const linkHref = linkElement.getAttribute('href');
          const linkTitle = linkElement.getAttribute('title');
          const buttonText = linkElement.textContent.trim();

          const iconWrapper = document.createElement('a');
          iconWrapper.classList.add('icon-card');
          iconWrapper.href = linkHref;
          iconWrapper.title = linkTitle;

          iconWrapper.innerHTML = `
            <div class='icon-card-wrapper'>
              <h3 class='label-text label-text-center' title='${linkTitle}'>${buttonText}</h3>
            </div>
          `;

          optimizedPicture.querySelector('img').classList.add('icon-card-icon');
          iconWrapper.querySelector('.icon-card-wrapper').prepend(pictureElement);
          pictureElement.replaceWith(optimizedPicture);

          buttonContainer.replaceWith(iconWrapper);
          pictureParagraph.remove();
        }
      }
    });
  } else {
    const buttons = block.querySelectorAll('.button-container');
    buttons.forEach((button) => {
      const linkElement = button.querySelector('a');

      imageCount += 1;

      const iconPlaceholder = div({ class: 'icon-card-icon' });
      if (linkElement) {
        const linkHref = linkElement.getAttribute('href');
        const linkTitle = linkElement.getAttribute('title');
        const buttonText = linkElement.textContent.trim();

        const iconWrapper = document.createElement('a');
        iconWrapper.classList.add('icon-card');
        iconWrapper.href = linkHref;
        iconWrapper.title = linkTitle;

        iconWrapper.innerHTML = `
          <div class='icon-card-wrapper'>
            <h3 class='label-text label-text-center' title='${linkTitle}'>${buttonText}</h3>
          </div>
        `;

        iconWrapper.querySelector('.icon-card-wrapper').prepend(iconPlaceholder);
        button.replaceWith(iconWrapper);
      }
    });
  }
}
