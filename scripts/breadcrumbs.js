import {
  nav, a, li, ul, strong,
} from './dom-helpers.js';
import { loadCSS } from './aem.js';
import { getRegionLocale } from './utils.js';

async function fetchIndex(homePath) {
  const indexPath = `${homePath}/indexes/global-index.json`;
  const request = await fetch(indexPath);
  if (request.ok) {
    const result = await request.json();
    const { data } = result;
    return data;
  }
  throw new Error('Failed to fetch workbook');
}

// eslint-disable-next-line import/prefer-default-export
export async function breadcrumbs() {
  loadCSS(`${window.hlx.codeBasePath}/styles/breadcrumbs.css`);
  const $breadcrumbs = nav({ class: 'breadcrumbs' });
  // todo: update breadcrumbs - just static HTML for now
  const [region, locale] = getRegionLocale();
  const homePath = `/${region}/${locale}`;
  const data = await fetchIndex(homePath);
  let { pathname } = window.location;
  if (pathname.startsWith(homePath)) {
    pathname = pathname.slice(homePath.length);
  }
  const pathParts = pathname.split('/').filter((part) => part);
  let currentPath = homePath;
  const breadcrumbItems = [];
  function getPageNamesByPath(path) {
    let pagePath = path;
    let pages = data.filter((page) => page.path === pagePath);
    if (pages.length === 0 && !pagePath.endsWith('/')) {
      pagePath = `${pagePath}/`;
      pages = data.filter((page) => page.path === pagePath);
    }
    const pageNames = pages.map((page) => page.title);
    return { pageNames, pagePath };
  }

  const homeLink = a({ href: `${homePath}/` }, 'Ingredion');
  const homeCrumb = li(homeLink);
  const crumbList = ul(homeCrumb);

  pathParts.forEach((part, index) => {
    currentPath += `/${part}`;
    const { pageNames, pagePath } = getPageNamesByPath(currentPath);

    if (pageNames.length === 0) return;

    const lastBreadcrumb = breadcrumbItems[breadcrumbItems.length - 1];
    const isParentSameAsChild = lastBreadcrumb && lastBreadcrumb.textContent === pageNames[0];

    if (isParentSameAsChild) {
      breadcrumbItems.pop();
    }

    pageNames.forEach((pageName, idx) => {
      const liEl = li();
      let link = a();

      // Set the href for all but the last part
      if (index < pathParts.length - 1 || idx < pageNames.length - 1) {
        link.setAttribute('href', pagePath);
      } else {
        link = strong();
      }

      link.textContent = pageName;
      liEl.appendChild(link);
      breadcrumbItems.push(liEl);
    });
  });

  // TODO: add more cases where breadcrumbs are not displayed
  if (breadcrumbItems.length > 0) {
    // Append all breadcrumb items to the container if there are more than one
    breadcrumbItems.forEach((item) => {
      crumbList.appendChild(item);
    });
  } else {
    $breadcrumbs.style.display = 'none';
  }

  $breadcrumbs.appendChild(crumbList);
  return $breadcrumbs;
}
