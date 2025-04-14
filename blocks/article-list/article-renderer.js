/* eslint-disable function-call-argument-newline, max-len, function-paren-newline, object-curly-newline, no-shadow */
import { div, h3, h4, h5, ul, li, a, small, span, form, input, button } from '../../scripts/dom-helpers.js';
import { getRegionLocale, loadTranslations, translate } from '../../scripts/utils.js';

function getUrlParams(key) {
  const params = new URLSearchParams(window.location.search);
  return key ? params.get(key) : params;
}

function createSelectDropdown({
  options,
  selectedValue,
  onSelect,
  defaultText = 'Select',
  labelPrefix = '',
  labelSuffix = '',
  cssClass = [],
}) {
  const $dropdown = div({ class: ['select-dropdown', cssClass] },
    div({ class: 'selected' }, `${labelPrefix}${selectedValue || defaultText}${labelSuffix}`),
    ul({ class: 'options' }),
  );

  options.forEach(({ value, label, count }) => {
    const $option = li({ class: `option ${value === selectedValue ? 'active' : ''}` },
      label,
      count !== undefined ? small(` (${count})`) : '',
    );

    $option.addEventListener('click', (event) => {
      event.stopPropagation();
      onSelect(value, $option, $dropdown);
      // Close this dropdown after selection
      $dropdown.querySelector('.options').classList.remove('open');
    });

    $dropdown.querySelector('.options').appendChild($option);
  });

  // Add click handler to toggle dropdown
  $dropdown.querySelector('.selected').addEventListener('click', (event) => {
    event.stopPropagation();

    const thisOptionsList = $dropdown.querySelector('.options');
    const isCurrentlyOpen = thisOptionsList.classList.contains('open');

    // close all open dropdowns
    document.querySelectorAll('.select-dropdown .options.open').forEach((optionsList) => {
      optionsList.classList.remove('open');
    });

    // open this one if it was closed
    if (!isCurrentlyOpen) thisOptionsList.classList.add('open');
  });

  // Close all dropdowns when clicking outside
  document.addEventListener('click', () => {
    document.querySelectorAll('.select-dropdown .options.open').forEach((optionsList) => {
      optionsList.classList.remove('open');
    });
  });

  return $dropdown;
}

/**
 * Create an ArticleRenderer.
 * @param {string} options.jsonPath - The path to the JSON file containing the articles.
 * @param {Element} options.articleDiv - The container element for the articles.
 * @param {Function} options.articleCard - The function to create an article card element.
 * @param {string|number} [options.articlesPerPageOptions=10] - The options for the number of articles per page.
 * @param {Element} options.paginationDiv - The container element for the pagination.
 * @param {number} [options.paginationMaxBtns=7] - The maximum number of pagination buttons.
 * @param {Element} options.filterTagsList - The container element for the filters.
 * @param {Element} options.searchDiv - The container element for the search form.
 * @param {Element} options.sortDropdown - The container element for the sort dropdown.
 * @param {Element} options.countDiv - The container element for the article count.
 * @param {Element} options.perPageDropdown - The container element for the per-page dropdown.
 * @param {Element} options.filterYearsDropdown - The container element for the filter years dropdown.
 * @param {Element} options.filterTypesDropdown - The container element for the filter types dropdown.
 * @param {Element} options.filterByTagDropdown - The container element for the filter by specific tag dropdown.
 */
export default class ArticleRenderer {
  constructor({
    jsonPath,
    articleDiv,
    articleCard,
    articlesPerPageOptions = '10, 25, 50',
    paginationDiv,
    paginationMaxBtns = 7,
    filterTagsList,
    filterYearsDropdown,
    filterTypesDropdown,
    searchDiv,
    sortDropdown,
    countDiv,
    perPageDropdown,
    filterByTagDropdown,
    clearFilters,
  }) {
    this.jsonPath = jsonPath;
    this.articleDiv = articleDiv;
    this.articleCard = articleCard;
    this.articlesPerPageOptions = String(articlesPerPageOptions).split(',').map(Number);
    this.paginationDiv = paginationDiv;
    this.paginationMaxBtns = paginationMaxBtns;
    this.filterTagsList = filterTagsList;
    this.filterYearsDropdown = filterYearsDropdown;
    this.filterTypesDropdown = filterTypesDropdown;
    this.searchDiv = searchDiv;
    this.sortDropdown = sortDropdown;
    this.countDiv = countDiv;
    this.perPageDropdown = perPageDropdown;
    this.filterByTagDropdown = filterByTagDropdown;
    this.clearFilters = clearFilters;
    this.state = {
      allArticles: [],
      totalArticles: 0,
      currentPage: (parseInt(getUrlParams('page'), 10) || 1) - 1,
      tags: (getUrlParams('tags') || '').split(',').filter(Boolean),
      sort: getUrlParams('sort') || 'newest',
      searchQuery: getUrlParams('q') || '',
      year: getUrlParams('year') || '',
      articlesPerPage: getUrlParams('per-page') || this.articlesPerPageOptions[0],
      type: getUrlParams('type') || '',
    };

    // Synchronize initial URL state
    window.history.replaceState({ ...this.state }, '', window.location.href);

    // Listen to popstate events for back/forward navigation
    window.addEventListener('popstate', (event) => {
      const state = event.state || this.parseUrl();
      this.state = { ...this.state, ...state };
      this.updatePage(); // Re-render with updated state
    });
  }

  parseUrl() {
    return {
      currentPage: (parseInt(getUrlParams('page'), 10) || 1) - 1,
      tags: (getUrlParams('tags') || '').split(',').filter(Boolean),
      sort: getUrlParams('sort') || 'newest',
      searchQuery: getUrlParams('q') || '',
      articlesPerPage: getUrlParams('per-page') || this.articlesPerPageOptions[0],
    };
  }

  /**
   * Update the page state and re-render the articles
   */
  updatePage() {
    const { currentPage, searchQuery, tags, sort, articlesPerPage, allArticles, year, type } = this.state;
    let articles = [...allArticles];

    // Filter articles by tags
    if (tags.length > 0) {
      articles = articles.filter((article) => tags.every((tag) => article.tags.toLowerCase().replace(/\s+/g, '-').includes(tag)));
    }

    // Filter articles by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      articles = articles.filter((article) => article.title.toLowerCase().includes(query) || article.description.toLowerCase().includes(query));
    }

    // Filter articles by year
    if (year) {
      articles = articles.filter((article) => new Date(article.publishDate * 1000).getFullYear() === parseInt(year, 10));
    }

    // Filter articles by type
    if (type) {
      articles = articles.filter((article) => {
        if (!article.type) return false;
        const articleType = JSON.parse(article.type)[0];
        return articleType === type;
      });
    }

    // Sort articles
    switch (sort) {
      case 'a-z':
        articles = articles.sort((A, B) => A.title.localeCompare(B.title));
        break;
      case 'z-a':
        articles = articles.sort((A, B) => B.title.localeCompare(A.title));
        break;
      case 'oldest':
        articles = articles.sort((A, B) => parseInt(A.publishDate, 10) - parseInt(B.publishDate, 10));
        break;
      case 'newest': default:
        articles = articles.sort((A, B) => parseInt(B.publishDate, 10) - parseInt(A.publishDate, 10));
        break;
    }

    this.state.filteredArticles = articles;
    this.state.totalArticles = articles.length;
    this.renderArticles(articles.slice(currentPage * articlesPerPage, (currentPage + 1) * articlesPerPage));
    this.renderFilterTags();
    this.renderFilterYears();
    this.renderFilterTypes();
    this.renderFilterByTagDropdown();
    this.renderSearchForm();
    this.renderSortDropdown();
    this.renderCount();
    this.renderPagination();
    this.renderPerPageDropdown();
    this.renderClearFilters();
    this.updateUrl(); // sync state
  }

  updateUrl() {
    const url = new URL(window.location);

    // Update the URL parameters
    function updateUrlParam(key, value) {
      url.searchParams.set(key, value);
    }
    function removeUrlParam(key) {
      url.searchParams.delete(key);
    }

    // Manage URL parameters
    if (this.state.currentPage !== 0) updateUrlParam('page', this.state.currentPage + 1);
    else removeUrlParam('page');

    if (this.state.articlesPerPage !== this.articlesPerPageOptions[0]) updateUrlParam('per-page', this.state.articlesPerPage);
    else removeUrlParam('per-page');

    if (this.state.tags.length > 0) updateUrlParam('tags', this.state.tags.join(','));
    else removeUrlParam('tags');

    if (this.state.searchQuery) updateUrlParam('q', this.state.searchQuery);
    else removeUrlParam('q');

    if (this.state.sort !== 'newest') updateUrlParam('sort', this.state.sort);
    else removeUrlParam('sort');

    if (this.state.year) updateUrlParam('year', this.state.year);
    else removeUrlParam('year');

    if (this.state.type) updateUrlParam('type', this.state.type);
    else removeUrlParam('type');

    // Compare with current history state to avoid redundant pushes
    if (JSON.stringify(window.history.state) !== JSON.stringify(this.state)) {
      window.history.pushState({ ...this.state }, '', url.toString());
    }
  }

  renderCount() {
    if (!this.countDiv) return;
    const start = this.state.currentPage * this.state.articlesPerPage + 1;
    const end = Math.min((this.state.currentPage + 1) * this.state.articlesPerPage, this.state.totalArticles);
    this.countDiv.textContent = `${translate('items')} ${start}–${end} ${translate('of')} ${this.state.totalArticles}`;
  }

  /**
   * Render articles and add them to articleDiv.
   * @param {Array} articles - The list of articles.
   */
  renderArticles(articles) {
    this.articleDiv.innerHTML = '';
    const article = document.createDocumentFragment();
    articles.forEach((card) => article.appendChild(this.articleCard(card)));
    this.articleDiv.appendChild(article);
  }

  renderFilterYears() {
    if (!this.filterYearsDropdown) return;
    this.filterYearsDropdown.innerHTML = '';

    const years = {};
    this.state.allArticles.forEach((article) => {
      const year = new Date(article.publishDate * 1000).getFullYear();
      years[year] = (years[year] || 0) + 1;
    });

    const yearOptions = [
      ...Object.keys(years)
        .sort()
        .reverse()
        .map((year) => ({
          value: year,
          label: year,
          count: years[year],
        })),
      { value: '', label: 'All Years' },
    ];

    const $dropdown = createSelectDropdown({
      options: yearOptions,
      selectedValue: this.state.year,
      defaultText: 'Year',
      onSelect: (value, option, dropdown) => {
        this.state.currentPage = 0;
        this.state.year = value;
        dropdown.querySelector('.selected').textContent = value || 'Year';
        this.updatePage();
      },
      cssClass: ['filter-years'],
    });

    this.filterYearsDropdown.appendChild($dropdown);
  }

  renderFilterTypes() {
    if (!this.filterTypesDropdown) return;
    this.filterTypesDropdown.innerHTML = '';

    const types = {};
    this.state.allArticles.forEach((article) => {
      if (article.type) {
        try {
          const type = JSON.parse(article.type)[0];
          if (type && type !== 'undefined') { // Only count defined types
            types[type] = (types[type] || 0) + 1;
          }
        } catch (e) {
          // Skip invalid JSON
          console.warn('Invalid type format:', article.type);
        }
      }
    });

    const typeOptions = [
      ...Object.keys(types)
        .filter((type) => type && type !== 'undefined') // Extra safety filter
        .sort()
        .map((type) => ({
          value: type,
          label: type,
          count: types[type],
        })),
      { value: '', label: 'All Types' },
    ];

    const $dropdown = createSelectDropdown({
      options: typeOptions,
      selectedValue: this.state.type,
      defaultText: 'Type',
      onSelect: (value, option, dropdown) => {
        this.state.currentPage = 0;
        this.state.type = value;
        dropdown.querySelector('.selected').textContent = value || 'Type';
        this.updatePage();
      },
      cssClass: ['filter-types'],
    });

    this.filterTypesDropdown.appendChild($dropdown);
  }

  renderFilterByTagDropdown() {
    if (!this.filterByTagDropdown) return;
    const tagCategory = this.filterByTagDropdown.getAttribute('data-tag');
    if (!tagCategory) return;

    this.filterByTagDropdown.innerHTML = '';

    const tags = {};

    // Build tag counts from all articles
    this.state.allArticles.forEach((article) => {
      article.tags.split(',').forEach((tag) => {
        const cleanedTag = tag.replace(/["[\]]+/g, '').trim();
        if (cleanedTag.startsWith(`${tagCategory} /`)) {
          tags[cleanedTag] = (tags[cleanedTag] || 0) + 1;
        }
      });
    });

    // Process tags to get just the second part after "Markets /"
    const tagOptions = Object.keys(tags)
      .map((fullTag) => {
        const [, tag] = fullTag.split(' / ');
        const cleanedValue = tag.toLowerCase().replace(/\s+/g, '-'); // for filtering
        return {
          value: cleanedValue, // lowercase hyphenated for filtering
          label: tag.trim(), // original format for display
          count: tags[fullTag],
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));

    // Add "All Markets" option at the end
    tagOptions.push({ value: '', label: `All ${tagCategory}` });

    // Find the currently selected option and use its label for display
    const selectedTag = this.state.tags.find((tag) => tagOptions.some((option) => option.value === tag),
    );
    const selectedOption = tagOptions.find((opt) => opt.value === selectedTag);
    const selectedDisplay = selectedOption ? selectedOption.label : '';

    const $dropdown = createSelectDropdown({
      options: tagOptions,
      selectedValue: selectedDisplay, // Use the display label instead of the value
      defaultText: tagCategory,
      onSelect: (value, option, dropdown) => {
        this.state.currentPage = 0;

        // Remove any existing tags from this category
        this.state.tags = this.state.tags.filter((tag) => !tagOptions.some((option) => option.value === tag),
        );

        // Add the new tag if one was selected
        if (value) {
          this.state.tags.push(value);
        }

        // Use the original format label for display
        const selectedOption = tagOptions.find((opt) => opt.value === value);
        dropdown.querySelector('.selected').textContent = selectedOption
          ? selectedOption.label // Use the original format label
          : tagCategory;

        this.updatePage();
      },
      cssClass: ['filter-by-tag'],
    });

    this.filterByTagDropdown.appendChild($dropdown);
  }

  renderFilterTags() {
    if (!this.filterTagsList) return;
    this.filterTagsList.innerHTML = '';
    const tags = {};

    // Build tag counts from the filtered articles
    this.state.filteredArticles.forEach((article) => {
      article.tags.split(',').forEach((tag) => {
        const cleanedTag = tag.replace(/["[\]]+/g, '').trim();
        tags[cleanedTag] = (tags[cleanedTag] || 0) + 1;
      });
    });

    // Group tags by heading
    const groupedTags = {};
    Object.keys(tags).forEach((rawTag) => {
      if (!rawTag.trim()) return; // ignore blank tags
      const [heading, tag] = rawTag.split(' / ');
      if (!groupedTags[heading]) groupedTags[heading] = [];
      groupedTags[heading].push({
        tag: tag.toLowerCase().replace(/\s+/g, '-'), // cleaned tag
        original: tag,
        count: tags[rawTag],
      });
    });

    const $filter = document.createDocumentFragment();
    const $filterHeading = h3('Filters Options');
    $filter.append($filterHeading);

    // if filters are selected
    if (this.state.tags.length > 0) {
      const $appliedFilterHeading = h4('Filters Applied');
      const $appliedFilters = ul({ class: 'applied-filters' });

      this.state.tags.forEach((tag) => {
        let originalName = tag;

        // find the original name
        Object.values(groupedTags).forEach((group) => {
          const foundTag = group.find((item) => item.tag === tag);
          if (foundTag) originalName = foundTag.original;
        });

        const $li = li(originalName, span({ class: 'icon-close' }, '\ue91c'));
        $li.addEventListener('click', () => {
          this.state.tags = this.state.tags.filter((t) => t !== tag);
          this.state.currentPage = 0;
          this.updatePage();
        });
        $appliedFilters.appendChild($li);
      });

      // clear all button
      const $clearAll = li({ class: 'clear-all' }, 'Clear All');
      $clearAll.addEventListener('click', () => {
        this.state.tags = []; // clear all tags
        this.state.currentPage = 0;
        this.updatePage();
      });
      $appliedFilters.append($clearAll);

      this.filterTagsList.append($appliedFilterHeading, $appliedFilters);
    }

    // Initialize state to keep track of open/closed groups
    this.groupState = this.groupState || {};

    // Build filter groups
    Object.keys(groupedTags).sort().forEach((heading) => {
      const isOpen = this.groupState[heading] || false;

      const $groupHeading = h5({ class: isOpen ? 'open' : '' }, heading, span({ class: 'icon' }, isOpen ? '－' : '＋'));

      // create the filters list
      const $filters = ul({ class: 'filter-options', style: `display: ${isOpen ? 'block' : 'none'}` });

      // Toggle group visibility
      $groupHeading.addEventListener('click', () => {
        this.groupState[heading] = !this.groupState[heading];
        const isCurrentlyOpen = this.groupState[heading];
        const icon = $groupHeading.querySelector('.icon');
        icon.textContent = isCurrentlyOpen ? '－' : '＋';
        $filters.style.display = isCurrentlyOpen ? 'block' : 'none';
      });

      groupedTags[heading]
        .sort((A, B) => A.original.localeCompare(B.original)) // Alphabetical sort by original tag name
        .forEach(({ tag, original, count }) => {
          const isSelected = this.state.tags.includes(tag);
          const $li = li({ class: isSelected ? 'selected' : '' }, a({ href: `?tags=${tag}` }, `${original} `, small(`(${count})`)));

          $li.addEventListener('click', (event) => {
            event.preventDefault();
            if (isSelected) this.state.tags = this.state.tags.filter((t) => t !== tag);
            else this.state.tags.push(tag); // add tag if not selected
            this.state.currentPage = 0;
            this.updatePage();
          });

          $filters.appendChild($li);
        });

      $filter.append($groupHeading, $filters);
    });

    this.filterTagsList.appendChild($filter);
  }

  renderSortDropdown() {
    if (!this.sortDropdown) return;
    this.sortDropdown.innerHTML = '';

    const sortOptions = ['newest', 'oldest', 'a-z', 'z-a'].map((value) => ({
      value, // Keep original value for state
      label: translate(value), // Translated label for display
      count: undefined,
    }));

    // Find the currently selected option and use its label for display
    const selectedOption = sortOptions.find((opt) => opt.value === this.state.sort);
    const selectedDisplay = selectedOption ? selectedOption.label : translate('newest');

    const $dropdown = createSelectDropdown({
      options: sortOptions,
      selectedValue: selectedDisplay, // Use the translated label for display
      defaultText: translate('newest'),
      labelPrefix: 'Sort by: ',
      onSelect: (value, option, dropdown) => {
        if (this.state.sort !== value) {
          this.state.sort = value;
          this.state.currentPage = 0;

          // Use the translated label for display
          const selectedOption = sortOptions.find((opt) => opt.value === value);
          dropdown.querySelector('.selected').textContent = `Sort by: ${selectedOption.label}`;

          this.updatePage();
        }
      },
      cssClass: ['filter-sort'],
    });

    this.sortDropdown.appendChild($dropdown);
  }

  renderPerPageDropdown() {
    if (!this.perPageDropdown) return;
    this.perPageDropdown.innerHTML = '';

    const perPageOptions = this.articlesPerPageOptions.map((value) => ({
      value,
      label: value.toString(),
    }));

    const $dropdown = createSelectDropdown({
      options: perPageOptions,
      selectedValue: this.state.articlesPerPage,
      labelSuffix: ' per page',
      onSelect: (value, option, dropdown) => {
        if (this.state.articlesPerPage !== value) {
          this.state.articlesPerPage = value;
          this.state.currentPage = 0;
          this.updatePage();
        }
        dropdown.querySelector('.selected').textContent = `${value} per page`;
      },
      cssClass: ['per-page'],
    });

    this.perPageDropdown.appendChild($dropdown);
  }

  renderSearchForm() {
    if (!this.searchDiv) return;
    this.searchDiv.innerHTML = '';
    this.searchDiv.classList.add('filter-search');
    const searchPlaceholder = translate('search');
    const $form = form();
    const $input = input({
      type: 'listing-search',
      name: 'q',
      placeholder: searchPlaceholder,
      value: this.state.searchQuery || '',
    });

    $input.addEventListener('focus', () => {
      $input.placeholder = '';
    });

    $input.addEventListener('blur', () => {
      if (!$input.value.trim()) {
        $input.placeholder = searchPlaceholder;
      }
    });

    const $submit = button({ class: 'icon-search', type: 'submit', 'aria-label': 'Search Button' });
    $form.append($input, $submit);

    $form.addEventListener('submit', (event) => {
      event.preventDefault();
      const query = $input.value.trim();
      this.state.currentPage = 0;
      this.state.searchQuery = query;
      this.updatePage();
    });

    this.searchDiv.appendChild($form);
  }

  /**
   * Create a pagination button.
   * @param {number} n - The page number.
   * @returns {HTMLElement} The pagination button element.
   */
  createPageBtn(n) {
    const $pageBtn = button({ class: n === this.state.currentPage ? 'active' : '' }, (n + 1).toString());
    $pageBtn.addEventListener('click', () => {
      if (this.state.currentPage !== n) {
        this.state.currentPage = n;
        this.scrollTop();
        this.updatePage();
      }
    });
    return $pageBtn;
  }

  /**
   * Render the article list and initialize event listeners.
   * Fetches translations and articles, updates the page, and sets up a popstate event listener.
   * @async
   * @returns {Promise<void>}
   */
  renderPagination() {
    if (!this.paginationDiv) return;
    this.paginationDiv.innerHTML = '';

    // Exit if article count is less than max page count
    if (this.state.totalArticles < this.state.articlesPerPage) return;

    const p = document.createDocumentFragment();

    const $prev = button({ class: 'prev' }, translate('prev'));
    $prev.addEventListener('click', () => {
      if (this.state.currentPage > 0) {
        this.state.currentPage -= 1;
        this.scrollTop();
        this.updatePage();
      }
    });
    $prev.disabled = this.state.currentPage === 0;
    p.appendChild($prev);

    const totalPages = Math.ceil(this.state.totalArticles / this.state.articlesPerPage);

    if (totalPages <= this.paginationMaxBtns + 2) {
      Array.from({ length: totalPages }, (_, i) => p.appendChild(this.createPageBtn(i)));
    } else {
      const half = Math.floor((this.paginationMaxBtns - 3) / 2); // Buttons on either side of active
      const extra = (this.paginationMaxBtns - 1) % 2; // Remainder (if maxBtns is an even number)
      let startPage;
      let endPage;
      const $spaceBtn = button({ class: 'space' }, ' - ');
      $spaceBtn.disabled = true;

      // Determine start/end values
      if (this.state.currentPage < totalPages - half * 2 + 1 + extra) {
        startPage = Math.max(1, this.state.currentPage - half);
        endPage = Math.max(this.paginationMaxBtns - 2, this.state.currentPage + half + extra);
      } else {
        startPage = totalPages - half * 2 - 2 - extra;
        endPage = totalPages - 1;
      }

      // First button + space
      p.appendChild(this.createPageBtn(0));
      if (startPage > 1) p.appendChild($spaceBtn.cloneNode(true));

      // Middle buttons
      for (let i = startPage; i <= endPage; i += 1) {
        p.appendChild(this.createPageBtn(i));
      }

      // Space + last button
      if (endPage < totalPages - 2) {
        p.appendChild($spaceBtn.cloneNode(true));
        p.appendChild(this.createPageBtn(totalPages - 1));
      } else if (endPage === totalPages - 2) {
        p.appendChild(this.createPageBtn(totalPages - 1));
      }
    }

    const $next = button({ class: 'next' }, translate('next'));
    $next.addEventListener('click', () => {
      if (this.state.currentPage < totalPages - 1) {
        this.state.currentPage += 1;
        this.scrollTop();
        this.updatePage();
      }
    });
    $next.disabled = this.state.currentPage === totalPages - 1;
    p.appendChild($next);

    this.paginationDiv.appendChild(p);
    this.updateUrl();
  }

  scrollTop() {
    const { top } = this.articleDiv.getBoundingClientRect();
    const scrollToY = top + window.scrollY - 120; // account for header
    window.scrollTo({ top: scrollToY, behavior: 'smooth' });
  }

  /**
   * Render the article list and initialize event listeners.
   */
  async render() {
    try {
      // eslint-disable-next-line no-unused-vars
      const [region, locale] = getRegionLocale();

      // fetch both articles and translations
      const [articlesResponse] = await Promise.all([
        fetch(this.jsonPath),
        loadTranslations(locale),
      ]);

      // handle articles response
      if (!articlesResponse.ok) throw new Error('Failed to fetch articles');
      const { data } = await articlesResponse.json();
      this.state.allArticles = data;

      // render page after data and translations are loaded
      await this.updatePage();
    } catch (error) {
      console.error('Error during render:', error);
    }
  }

  renderClearFilters() {
    if (!this.clearFilters) return;

    // Check if any filters are active
    const hasActiveFilters = this.state.tags.length > 0
      || this.state.searchQuery
      || this.state.year
      || this.state.type;

    // Show/hide clear filters based on active filters
    if (hasActiveFilters) {
      this.clearFilters.classList.remove('hidden');

      // Remove any existing click handlers
      const oldHandler = this.clearFiltersHandler;
      if (oldHandler) {
        this.clearFilters.removeEventListener('click', oldHandler);
      }

      // Create and store the new handler
      this.clearFiltersHandler = (event) => {
        event.preventDefault();

        // Reset all filters to default state
        this.state.tags = [];
        this.state.searchQuery = '';
        this.state.year = '';
        this.state.type = '';
        this.state.sort = 'newest';
        this.state.currentPage = 0;

        // Update the page with reset filters
        this.updatePage();
      };

      // Add the new handler
      this.clearFilters.addEventListener('click', this.clearFiltersHandler);
    } else {
      this.clearFilters.classList.add('hidden');
    }
  }
}
