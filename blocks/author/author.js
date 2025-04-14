/* eslint-disable function-paren-newline, object-curly-newline */
import { div, p, h4, picture, img } from '../../scripts/dom-helpers.js';
import { unwrapNestedDivs } from '../../scripts/scripts.js';

const authorSpreadsheetPath = '/author/author-info.json';

export default async function decorate(block) {
  unwrapNestedDivs(block);

  const resp = await fetch(authorSpreadsheetPath);
  const authorsJson = await resp.json();
  const authorName = block.querySelector('p');
  const authorInformation = authorsJson.data.find(
    (item) => item.name === authorName.innerText,
  );

  authorName.remove();

  if (authorInformation) {
    const authorImageContainer = div(
      { class: 'author-bio-image' },
      picture(img({ src: authorInformation.image })),
    );
    const authorTextContainer = div(
      { class: 'author-bio-text' },
      div({ class: 'heading', tabIndex: 0 }, h4(authorInformation.name)),
      p({ class: 'body-text', taxIndex: 0 }, authorInformation.description),
    );

    block.appendChild(authorImageContainer);
    block.appendChild(authorTextContainer);
  }
}
