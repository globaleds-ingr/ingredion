/* eslint-disable function-paren-newline, object-curly-newline */
import { div, h2, h3, p, a, span, img } from '../../scripts/dom-helpers.js';
import { getMetadata, createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(doc) {
  const main = doc.querySelector('main');
  const content = main.querySelector('.default-content-wrapper');
  const title = getMetadata('og:title');
  const image = getMetadata('og:image');
  const eventType = getMetadata('event-type');
  const duration = getMetadata('duration');
  const location = getMetadata('location');
  const boothNumber = getMetadata('booth-number');
  const socialShare = getMetadata('social-share');
  const registrationLink = getMetadata('registration');
  const eventSiteRegistrationLink = getMetadata('registration-event-site');

  const details = [
    eventType && p({ class: 'event-detail-details', tabIndex: 0 }, span('Event Type: '), eventType),
    duration && p({ class: 'event-detail-details', tabIndex: 0 }, span('Duration: '), duration),
    location && p({ class: 'event-detail-details', tabIndex: 0 }, span('Location: '), location),
    boothNumber && p({ class: 'event-detail-details', tabIndex: 0 }, span('Booth Number: '), boothNumber),
  ].filter(Boolean);

  const eventWrapper = div(
    { class: 'event-detail-wrapper' },
    h3({ class: 'label-text', tabIndex: 0 }, eventType),
    div({ class: 'heading' }, h2({ tabIndex: 0 }, title)),
    ...details,
    div({ class: 'event-detail-content' }),
  );
  content.prepend(eventWrapper);

  const eventContent = eventWrapper.querySelector('.event-detail-content');
  let nextSibling = eventWrapper.nextElementSibling;
  while (nextSibling) {
    const nextElement = nextSibling.nextElementSibling;
    eventContent.appendChild(nextSibling);
    nextSibling = nextElement;
  }

  const socialShareLinks = socialShare
    .split(',')
    .map((platform) => {
      const platformLink = platform.trim().toLowerCase();
      if (platformLink === 'facebook') {
        return a(
          {
            class: 'icon icon-facebook',
            href: `https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`,
            'aria-label': 'Facebook',
          },
          img({ src: '/icons/facebook.svg', alt: 'Facebook' }),
        );
      }
      if (platformLink === 'x') {
        return a(
          {
            class: 'icon icon-x',
            href: `https://x.com/intent/tweet?url=${window.location.href}`,
            'aria-label': 'X',
          },
          img({ src: '/icons/x.svg', alt: 'X' }),
        );
      }
      return null;
    })
    .filter(Boolean);

  const socialButtons = div(
    { class: 'social-share' },
    a(
      {
        class: 'icon icon-linkedin',
        href: `https://www.linkedin.com/cws/share?url=${window.location.href}`,
        'aria-label': 'LinkedIn',
      },
      img({ src: '/icons/linkedin.svg', alt: 'LinkedIn' }),
    ),
    ...socialShareLinks,
  );

  eventWrapper.append(socialButtons);
  eventWrapper.append(div({ class: 'line-break' }));

  const eventMedia = div({ class: 'event-detail-media' });
  eventMedia.append(createOptimizedPicture(image, '', false));
  content.append(eventMedia);

  if (eventSiteRegistrationLink && registrationLink) {
    const eventSiteRegistration = div(
      { class: 'register-event' },
      div(
        { class: 'register-event-text' },
        div(
          { class: 'heading' },
          h3('Register now'),
          a(
            { class: 'button primary', href: eventSiteRegistrationLink },
            'Register on Event Site',
          ),
        ),
      ),
    );
    content.append(eventSiteRegistration);
    const eventRegistration = div(
      { class: 'event-detail-body' },
      a(
        { class: 'button-register-event', href: registrationLink },
        'Register',
        span({ class: 'icon icon-green-arrow' }),
      ),
    );
    content.append(eventRegistration);
  }

  if ((!eventSiteRegistrationLink && registrationLink)
     || (eventSiteRegistrationLink && !registrationLink)) {
    const eventRegistration = div(
      { class: 'register-event' },
      div(
        { class: 'event-detail-body' },
        a(
          { class: 'button-register-event', href: registrationLink },
          'Register',
          span({ class: 'icon icon-green-arrow' }),
        ),
      ),
    );
    content.append(eventRegistration);
  }
}
