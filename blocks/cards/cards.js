import { createOptimizedPicture } from '../../scripts/aem.js';

const isDesktop = window.matchMedia('(width >= 1280px)');

function embedVimeo(url, autoplay, background) {
  const [, video] = url.pathname.split('/');
  let suffix = '';
  if (background || autoplay) {
    const suffixParams = {
      autoplay: autoplay ? '1' : '0',
      background: background ? '1' : '0',
    };
    suffix = `?${Object.entries(suffixParams).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')}`;
  }
  const temp = document.createElement('div');
  temp.innerHTML = `<div class="video-modal" style="display: block;">
    <div class="video-modal-wrapper">
      <div class='video-modal-content'>
        <iframe src="https://player.vimeo.com/video/${video}${suffix}" 
          style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;" 
          frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen  
          title="Content from Vimeo" loading="lazy"></iframe>
        <div class="video-modal-close icon-close-blk" tabindex="0" aria-label="Close Video Modal"></div>
      </div>
    </div>
  </div>`;
  return temp.children.item(0);
}

const loadVideoEmbed = (block, link, autoplay, background) => {
  if (block.dataset.embedLoaded === 'true') {
    return;
  }
  const url = new URL(link);
  const isVimeo = link.includes('vimeo');
  if (isVimeo) {
    const embedWrapper = embedVimeo(url, autoplay, background);
    block.append(embedWrapper);
    embedWrapper.querySelector('iframe').addEventListener('load', () => {
      block.dataset.embedLoaded = true;
    });
    embedWrapper.querySelector('.video-modal-close').addEventListener('click', () => {
      embedWrapper.remove();
      block.dataset.embedLoaded = false;
    });
  }
};

export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    if (block.classList.contains('video')) {
      const placeholder = li.querySelector('picture');
      const link = li.querySelector('a');
      li.dataset.embedLoaded = false;
      const autoplay = li.classList.contains('autoplay');
      if (placeholder) {
        li.classList.add('placeholder');
        const wrapper = document.createElement('div');
        wrapper.className = 'video-placeholder';
        wrapper.append(placeholder);

        if (!autoplay) {
          wrapper.insertAdjacentHTML(
            'beforeend',
            '<div class="video-placeholder-play"><button type="button" title="Play"></button></div>',
          );
          wrapper.addEventListener('click', () => {
            loadVideoEmbed(block, link.href, true, false);
          });
          link.addEventListener('click', (e) => {
            e.preventDefault();
            loadVideoEmbed(block, link.href, true, false);
          });
        }
        li.prepend(wrapper);
        ul.append(li);
      }
    } else {
      [...li.children].forEach((div) => {
        if (div.children.length === 1 && div.querySelector('picture')) {
          div.className = 'cards-card-image';
          const imageAnchor = document.createElement('a');
          const picture = div.querySelector('picture');
          imageAnchor.append(picture);
          div.append(imageAnchor);
        } else div.className = 'cards-card-body';
      });
      if (block.classList.contains('four-column')) {
        const existingWrapper = document.querySelector('.section-title-description-wrapper');
        if (!existingWrapper) {
          const wrapper = document.createElement('div');
          wrapper.className = 'section-title-description-wrapper';
          block.insertAdjacentElement('beforebegin', wrapper);
        }

        const imageContainer = li.querySelector('.cards-card-image');
        const bodyContainer = li.querySelector('.cards-card-body');
        const textLink = bodyContainer.querySelector('a');

        if (textLink && imageContainer && bodyContainer) {
          const linkHref = textLink.href;
          const h3 = document.createElement('h3');
          h3.textContent = textLink.textContent;
          h3.title = textLink.title || '';
          textLink.parentNode.replaceWith(h3);

          const wrapperLink = document.createElement('a');
          wrapperLink.href = linkHref;
          wrapperLink.title = textLink.title || '';

          li.prepend(wrapperLink);
          wrapperLink.appendChild(imageContainer);
          wrapperLink.appendChild(bodyContainer);
        }
      }

      const btnContainers = li.querySelectorAll('.button-container');
      if (btnContainers) {
        btnContainers.forEach((btnContainer, index) => {
          if (btnContainers.length === 1 || index > 0) {
            const a = btnContainer.querySelector('a');
            const span = document.createElement('span');
            span.className = 'icon-green-arrow';
            a.append(span);
            const imageAnchor = li.querySelector('.cards-card-image a');
            if (!imageAnchor) return;
            imageAnchor.href = a.href;
            imageAnchor.setAttribute('aria-label', a.href);
            btnContainer.classList.add('secondary-cta');
          } else {
            btnContainer.classList.add('heading');
          }
          btnContainer.classList.remove('button-container');
        });
      }
      ul.append(li);
    }
  });
  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  block.textContent = '';
  block.append(ul);
  if (block.classList.contains('slim')) {
    const dotsNav = document.createElement('div');
    dotsNav.className = 'dots-nav';
    [...ul.children].forEach((_, index) => {
      const dot = document.createElement('span');
      dot.className = 'dot';
      if (index === 0) dot.classList.add('active');
      dot.dataset.index = index;
      dotsNav.append(dot);
      dotsNav.addEventListener('click', (e) => {
        if (e.target.classList.contains('dot')) {
          let i;
          const n = parseInt(e.target.dataset.index, 10);
          const slides = ul.children;
          const dots = dotsNav.children;
          for (i = 0; i < slides.length; i += 1) {
            slides[i].style.display = 'none';
          }
          for (i = 0; i < dots.length; i += 1) {
            dots[i].className = dots[i].className.replace(' active', '');
          }
          slides[n].style.display = 'block';
          dots[n].className += ' active';
        }
      });
    });
    block.append(dotsNav);
  }
  isDesktop.addEventListener('change', () => {
    requestAnimationFrame(window.location.reload());
  });
}
