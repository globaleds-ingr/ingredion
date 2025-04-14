import { parseClassFromString } from '../../scripts/scripts.js';

function setPreview(selectedPic) {
  const previewPic = selectedPic.cloneNode(true);
  previewPic.classList.add('gallery-preview');
  return previewPic;
}

function updateModal(modal, pic) {
  modal.innerHTML = `<div class="gallery-modal">
    <div class="image-modal-container">
      ${pic.innerHTML}
    </div>
    <div class="zoom-buttons-container">
      <button class="zoom-in">+</button>
      <button class="zoom-out">-</button>
      <button class="close">X</button>
    </div>
  </div>`;
}

export default function decorate(block) {
  const allPics = block.querySelectorAll('picture');
  const h1 = block.querySelector('h1');
  const link = block.querySelectorAll('a');

  const textWrapper = h1.closest('div');
  textWrapper.classList.add('gallery-content');

  if (link) {
    Array.from(link).forEach((l) => {
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

  const firstPic = allPics[0];

  const galleryImages = firstPic.closest('div');
  galleryImages.classList.add('gallery-images-container');

  const blockImage = setPreview(firstPic);
  galleryImages.prepend(blockImage);

  const thumbnails = document.createElement('div');
  thumbnails.classList.add('gallery-thumbnails');
  galleryImages.append(thumbnails);

  allPics.forEach((image) => {
    thumbnails.append(image);
  });

  const galleryModal = document.createElement('div');
  updateModal(galleryModal, blockImage);

  const modalImage = galleryModal.querySelector('.image-modal-container img');

  let zoomLevel = 1;
  const zoomStep = 0.1;
  const maxZoom = 3;
  const minZoom = 1;

  Array.from(thumbnails.children).forEach(((img) => {
    img.addEventListener('click', () => {
      const newPreview = setPreview(img);
      galleryImages.querySelector('.gallery-preview').replaceWith(newPreview);

      newPreview.addEventListener('click', () => {
        zoomLevel = 1;
        updateModal(galleryModal, newPreview);

        const modalImg = galleryModal.querySelector('.image-modal-container img');
        modalImg.style.transform = `scale(${zoomLevel})`;

        block.append(galleryModal);

        const actionButtons = galleryModal.querySelector('.zoom-buttons-container');
        actionButtons.querySelector('.close').addEventListener('click', () => {
          galleryModal.remove();
          block.dataset.embedLoaded = false;
        });

        actionButtons.querySelector('.zoom-in').addEventListener('click', () => {
          if (zoomLevel < maxZoom) {
            zoomLevel += zoomStep;
            modalImg.style.transform = `scale(${zoomLevel})`;
          }
        });

        actionButtons.querySelector('.zoom-out').addEventListener('click', () => {
          if (zoomLevel > minZoom) {
            zoomLevel -= zoomStep;
            modalImg.style.transform = `scale(${zoomLevel})`;
          }
        });
      });
    });
  }));

  blockImage.addEventListener('click', () => {
    zoomLevel = 1;
    modalImage.style.transform = `scale(${zoomLevel})`;
    block.append(galleryModal);
  });
  const actionButtons = galleryModal.querySelector('.zoom-buttons-container');
  actionButtons.querySelector('.close').addEventListener('click', () => {
    galleryModal.remove();
    block.dataset.embedLoaded = false;
  });
  actionButtons.querySelector('.zoom-in').addEventListener('click', () => {
    if (zoomLevel < maxZoom) {
      zoomLevel += zoomStep;
      modalImage.style.transform = `scale(${zoomLevel})`;
    }
  });
  actionButtons.querySelector('.zoom-out').addEventListener('click', () => {
    if (zoomLevel > minZoom) {
      zoomLevel -= zoomStep;
      modalImage.style.transform = `scale(${zoomLevel})`;
    }
  });
}
