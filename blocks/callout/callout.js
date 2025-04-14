import { createOptimizedPicture } from '../../scripts/aem.js';

const themeColors = [
  'blue',
  'teal',
  'green',
  'orange',
  'red',
  'lilac',
  'purple',
  'dark-purple',
  'dark-blue',
];

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
      <div class='video-modal-content' style="left: 0; width: 100%; position: relative; padding-bottom: 45%;">
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

function embedYoutube(url, autoplay, background) {
  const usp = new URLSearchParams(url.search);
  let suffix = '';
  if (background || autoplay) {
    const suffixParams = {
      autoplay: autoplay ? '1' : '0',
      mute: background ? '1' : '0',
      controls: background ? '0' : '1',
      disablekb: background ? '1' : '0',
      loop: background ? '1' : '0',
      playsinline: background ? '1' : '0',
    };
    suffix = `&${Object.entries(suffixParams).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')}`;
  }
  let vid = usp.get('v') ? encodeURIComponent(usp.get('v')) : '';
  const embed = url.pathname;
  if (url.origin.includes('youtu.be')) {
    [, vid] = url.pathname.split('/');
  }

  const temp = document.createElement('div');
  temp.innerHTML = `<div class="video-modal" style="display: block;">
    <div class="video-modal-wrapper">
      <div class='video-modal-content' style="left: 0; width: 100%; height: 0; position: relative; padding-bottom: 45%;">
        <iframe src="https://www.youtube.com${vid ? `/embed/${vid}?rel=0&v=${vid}${suffix}` : embed}" style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;"
        frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen
        title="Content from YouTube" loading="lazy"></iframe>
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
  const isYoutube = link.includes('youtube') || link.includes('youtu.be');
  if (isYoutube) {
    const embedWrapper = embedYoutube(url, autoplay, background);
    block.append(embedWrapper);
    embedWrapper.querySelector('iframe').addEventListener('load', () => {
      block.dataset.embedLoaded = true;
    });
    document.body.classList.add('modal-open');
    embedWrapper.querySelector('.video-modal-close').addEventListener('click', () => {
      embedWrapper.remove();
      block.dataset.embedLoaded = false;
      document.body.classList.remove('modal-open');
    });
  } else if (isVimeo) {
    const embedWrapper = embedVimeo(url, autoplay, background);
    block.append(embedWrapper);
    embedWrapper.querySelector('iframe').addEventListener('load', () => {
      block.dataset.embedLoaded = true;
    });
    document.body.classList.add('modal-open');
    embedWrapper.querySelector('.video-modal-close').addEventListener('click', () => {
      embedWrapper.remove();
      block.dataset.embedLoaded = false;
      document.body.classList.remove('modal-open');
    });
  }
};

export default function decorate(block) {
  const pic = block.querySelector('picture');
  const h3 = block.querySelector('h3');
  const h2 = block.querySelector('h2');
  const h1 = block.querySelector('h1');
  const link = block.querySelector('a');

  const header = h1 ?? h2 ?? h3;

  const textWrapper = header.closest('div');
  textWrapper.classList.add('callout-content');

  const classListArray = Array.from(block.classList);

  const hasThemeColor = themeColors.some((color) => classListArray.includes(color));
  if (!hasThemeColor) {
    block.classList.add('default');
  } else if (link) {
    link.classList.add('transparent'); // apply transparent button style
  }

  if (pic) {
    const picWrapper = pic.closest('div');
    picWrapper.classList.add('callout-image');

    const img = pic.querySelector('img');
    const optimizedPicture = createOptimizedPicture(
      img.src,
      img.alt,
      false,
      [{ width: '750' }],
    );
    pic.replaceWith(optimizedPicture);

    if (block.classList.contains('video')) {
      block.dataset.embedLoaded = false;
      const autoplay = block.classList.contains('autoplay');
      picWrapper.classList.add('placeholder');

      if (!autoplay) {
        picWrapper.insertAdjacentHTML(
          'beforeend',
          '<div class="video-placeholder-play"><button type="button" title="Play"></button></div>',
        );
        picWrapper.addEventListener('click', () => {
          loadVideoEmbed(block, link.href, true, false);
        });
      }
      link.remove();
    }
  } else {
    block.classList.add('text-only');
  }
}
