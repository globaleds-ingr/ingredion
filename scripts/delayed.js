// add delayed functionality here
import { initBackToTop } from './back-to-top.js';

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBackToTop);
} else {
  initBackToTop();
}
