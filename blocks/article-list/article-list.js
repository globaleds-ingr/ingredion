/* eslint-disable function-call-argument-newline, max-len, function-paren-newline, object-curly-newline */
import { div, h3, h4, p, a } from '../../scripts/dom-helpers.js';
import { createOptimizedPicture, readBlockConfig } from '../../scripts/aem.js';
import { formatDate } from '../../scripts/utils.js';
import ArticleRenderer from './article-renderer.js';

export default async function decorate(block) {
  const {
    'article-data': jsonPath,
    'articles-per-page-options': articlesPerPageOptions,
    'pagination-max-buttons': paginationMaxBtns,
  } = readBlockConfig(block);

  const $search = div();
  const $sortDropdown = div();
  const $count = h3({ class: 'count' });
  const $pagination = div({ class: 'pagination' });
  const $perPageDropdown = div();
  const $articles = div({ class: 'articles' });

  let $articlePage;
  let $articleCard;

  if (block.classList.contains('cards')) {
    // cards view
    const $filterYearsDropdown = div();
    const $filterTypesDropdown = div();
    const $filterMarketsDropdown = div({ 'data-tag': 'Markets' }); // pass the tag
    const $clearFilters = a({ class: 'clear-all' }, 'Clear All');

    $articleCard = (article) => a({ class: 'card', href: article.path },
      a({ class: 'thumb', href: article.path },
        createOptimizedPicture(article.image, article.title, true, [{ width: '235' }]),
      ),
      div({ class: 'info' },
        article.type && p({ class: 'type' }, JSON.parse(article.type)[0]),
        h4(article.title),
        p({ class: 'date' }, formatDate(article.publishDate)),
        p(article.description),
        a({ class: 'arrow', href: article.path }, 'Learn More'),
      ),
    );

    $articlePage = div({ class: 'article-list' },
      div({ class: 'filter-search-sort' },
        $search,
        $filterTypesDropdown,
        $filterYearsDropdown,
        $filterMarketsDropdown,
        $sortDropdown,
      ),
      div({ class: 'clear-all-wrapper' }, $clearFilters),
      div({ class: 'filter-results-wrapper' },
        div({ class: 'results cards' },
          $count,
          $articles,
          div({ class: 'controls' },
            $pagination,
            $perPageDropdown,
          ),
        ),
      ),
    );

    await new ArticleRenderer({
      jsonPath,
      articlesPerPageOptions,
      paginationMaxBtns,
      articleDiv: $articles,
      articleCard: $articleCard,
      clearFilters: $clearFilters,
      filterYearsDropdown: $filterYearsDropdown,
      filterTypesDropdown: $filterTypesDropdown,
      filterByTagDropdown: $filterMarketsDropdown,
      searchDiv: $search,
      sortDropdown: $sortDropdown,
      paginationDiv: $pagination,
      perPageDropdown: $perPageDropdown,
      countDiv: $count,
    }).render();
  } else {
    // list view
    const $filtersList = div();

    $articleCard = (article) => div({ class: 'card' },
      a({ class: 'thumb', href: article.path },
        createOptimizedPicture(article.image, article.title, true, [{ width: '235' }]),
      ),
      div({ class: 'info' },
        h4(article.title),
        p(article.description),
        p({ class: 'date' }, formatDate(article.publishDate)),
        a({ class: 'button', href: article.path }, 'Learn More'),
      ),
    );

    $articlePage = div({ class: 'article-list' },
      div({ class: 'filter-search-sort' },
        $search,
        $sortDropdown,
      ),
      div({ class: 'filter-results-wrapper' },
        div({ class: 'filter' },
          $filtersList,
        ),
        div({ class: 'results' },
          $count,
          $articles,
          div({ class: 'controls' },
            $pagination,
            $perPageDropdown,
          ),
        ),
      ),
    );

    await new ArticleRenderer({
      jsonPath,
      articlesPerPageOptions,
      paginationMaxBtns,
      articleDiv: $articles,
      articleCard: $articleCard,
      filterTagsList: $filtersList,
      searchDiv: $search,
      sortDropdown: $sortDropdown,
      paginationDiv: $pagination,
      perPageDropdown: $perPageDropdown,
      countDiv: $count,
    }).render();
  }

  block.replaceWith($articlePage);
}
