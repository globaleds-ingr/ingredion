import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  const pic = block.querySelector('picture');
  if (pic) {
    const img = pic.querySelector('img');
    const optimizedPicture = createOptimizedPicture(
      img.src,
      img.alt,
      false,
      [
        { media: '(min-width: 1080px)', width: '2000' },
        { media: '(min-width: 768px)', width: '750' },
        { width: '300' },
      ],
    );
    pic.replaceWith(optimizedPicture);
  }
}
