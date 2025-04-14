/* eslint-disable function-paren-newline, object-curly-newline */

export default function decorate(doc) {
  const main = doc.querySelector('main');

  // --- FORMULATION INSTRUCTIONS
  const instructionsSection = main.querySelector('.instructions-section');
  const instructionsWrapper = document.createElement('div');
  instructionsWrapper.classList.add('instructions-wrapper');
  const leftColumnSection = main.querySelectorAll('.column-left');
  const rightColumnSection = main.querySelectorAll('.column-right');
  instructionsWrapper.append(...leftColumnSection, ...rightColumnSection);
  instructionsSection.append(instructionsWrapper);
}
