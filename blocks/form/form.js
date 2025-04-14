import {
  getCookie,
  getRegionLocale,
  loadFormTranslations,
  translateFormLabels,
} from '../../scripts/utils.js';

function createErrorElements(element) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'field-error';
  errorDiv.textContent = 'Please check your form entries';

  const validateIcon = document.createElement('span');
  validateIcon.classList.add('form-icon');
  if (element.type !== 'select-one') {
    element.parentElement.append(validateIcon);
    validateIcon.insertAdjacentElement('afterend', errorDiv);
  } else {
    element.parentElement.append(errorDiv);
  }
  return { errorDiv, validateIcon };
}

export function toggleError(element, show, message = 'Please check your form entries') {
  const errorDiv = element.parentElement.querySelector('.field-error');
  const validateIcon = element.parentElement.querySelector('.form-icon');

  if (errorDiv) {
    errorDiv.style.display = show ? 'block' : 'none';
    errorDiv.textContent = message;
  }

  if (element.tagName === 'DIV') {
    const number = element.querySelector('.number');
    number.classList.toggle('field-valid', !show);
    number.classList.toggle('field-invalid', show);
  } else {
    element.classList.toggle('field-valid', !show);
    element.classList.toggle('field-invalid', show);
  }

  if (validateIcon) {
    if (show) {
      validateIcon.classList.add('icon-reject');
      validateIcon.classList.remove('icon-approve');
    } else {
      validateIcon.classList.remove('icon-reject');
      validateIcon.classList.add('icon-approve');
    }
  }
}

export function addErrorHandling(element) {
  createErrorElements(element);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return false;
    }
    return true;
  };

  element.addEventListener('input', (e) => {
    const isEmpty = !element.value;
    if (e.target.classList.contains('email') && !isEmpty) {
      if (validateEmail(element.value)) {
        toggleError(element, false);
      } else {
        toggleError(element, true, e.target.getAttribute('validation-error-message'));
      }
    } else if (!e.target.classList.contains('number')) {
      toggleError(element, isEmpty, 'Please check your form entries');
    } else {
      toggleError(element, false);
    }
  });

  element.addEventListener('invalid', (e) => {
    e.preventDefault();
    toggleError(element, true);
  });
}

function createOption(label, value, initialValue) {
  const option = document.createElement('span');
  option.className = 'form-dropdown__option';
  option.setAttribute('data-label', label);
  option.setAttribute('data-value', value);
  option.setAttribute('tabindex', '-1');
  option.setAttribute('role', 'option');
  option.setAttribute('aria-selected', 'false');
  option.textContent = label;
  const check = document.createElement('span');
  check.className = 'form-dropdown__selected-check icon-check-2-blk';
  option.appendChild(check);
  if (value === initialValue || label === initialValue) {
    option.classList.add('selected');
    option.setAttribute('aria-selected', 'true');
  }
  return option;
}

function createSelect(fd, problemOptionsUrl) {
  const wrapper = document.createElement('div');
  wrapper.className = 'form-input__input-wrapper';

  const dropdown = document.createElement('div');
  dropdown.className = 'form-dropdown';

  // Create hidden input
  const hiddenInput = document.createElement('input');
  hiddenInput.type = 'hidden';
  hiddenInput.id = fd.Field;
  hiddenInput.name = fd.Field;
  hiddenInput.setAttribute('placeholder', fd.Placeholder || 'Select One');
  hiddenInput.setAttribute('aria-label', fd.Label || fd.Placeholder || 'Select One');

  // Create trigger
  const trigger = document.createElement('div');
  trigger.className = 'form-dropdown__trigger';
  trigger.setAttribute('tabindex', '0');
  trigger.setAttribute('role', 'combobox');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-label', fd.Label || fd.Placeholder || 'Select One');

  const listboxId = `${fd.Field}-listbox`;
  trigger.setAttribute('aria-controls', listboxId);
  trigger.setAttribute('aria-activedescendant', '');

  const selectedLabel = document.createElement('div');
  selectedLabel.className = 'form-dropdown__selected-label';
  selectedLabel.textContent = fd.Placeholder || 'Select One';
  selectedLabel.setAttribute('aria-hidden', 'true');

  const icon = document.createElement('div');
  icon.className = 'form-dropdown__icon icon-Expand';
  icon.setAttribute('aria-hidden', 'true');

  trigger.appendChild(selectedLabel);
  trigger.appendChild(icon);

  // Create options container
  const optionsContainer = document.createElement('div');
  optionsContainer.className = 'form-dropdown__options';
  optionsContainer.setAttribute('role', 'listbox');
  optionsContainer.id = listboxId;
  optionsContainer.setAttribute('aria-label', fd.Label || fd.Placeholder || 'Select One');

  // Add validation icons
  const validIcon = document.createElement('span');
  validIcon.className = 'form-input__icon form-input__icon--valid icon-Approve';

  const errorIcon = document.createElement('span');
  errorIcon.className = 'form-input__icon form-input__icon--error icon-Error';

  // Function to select an option
  const selectOption = (option) => {
    if (!option) return;
    const { value, label } = option.dataset;
    hiddenInput.value = value;
    selectedLabel.textContent = label;

    optionsContainer.querySelectorAll('.form-dropdown__option').forEach((opt) => {
      opt.classList.remove('selected');
      opt.setAttribute('aria-selected', 'false');
    });

    option.classList.add('selected');
    option.setAttribute('aria-selected', 'true');
    trigger.setAttribute('aria-activedescendant', option.id);
    selectedLabel.style.color = 'black';

    const event = new Event('change', { bubbles: true });
    hiddenInput.dispatchEvent(event);
  };

  // Add keyboard navigation
  trigger.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      dropdown.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
    } else {
      const char = e.key.toLowerCase();
      const options = Array.from(optionsContainer.querySelectorAll('.form-dropdown__option'));
      const matchingOption = options.find((option) => {
        const label = option.dataset.label.toLowerCase();
        return label.startsWith(char) && option.style.display !== 'none';
      });
      if (matchingOption) {
        selectOption(matchingOption);
      }
    }
  });

  // Populate options
  if (fd.Options && fd.Options?.startsWith('https://')) {
    const optionsUrl = fd.Field === 'problem' && problemOptionsUrl ? new URL(problemOptionsUrl) : new URL(fd.Options);
    fetch(`${optionsUrl.pathname}${optionsUrl.search}`)
      .then(async (response) => {
        const json = await response.json();
        const initialValue = 'United States';
        json.data.forEach((opt) => {
          const option = createOption(
            opt.Option.trim(),
            opt.Value || opt.Option.trim(),
            initialValue,
          );
          if (fd.Field === 'State') {
            option.setAttribute('data-country', opt.Country);
            option.style.display = opt.Country !== 'US' ? 'none' : '';
          }
          if (fd.Field === 'Category') {
            option.setAttribute('data-market', opt.Market);
            option.style.display = 'none';
          }
          optionsContainer.appendChild(option);
          if (option.classList.contains('selected')) {
            hiddenInput.value = option.dataset.value;
            selectedLabel.textContent = option.dataset.label;
          }
        });
      });
  } else {
    const initialValue = fd.Value || fd.Placeholder || '';
    fd.Options.split(',').forEach((o) => {
      const option = createOption(o.trim(), o.trim(), initialValue);
      optionsContainer.appendChild(option);
      if (option.classList.contains('selected')) {
        hiddenInput.value = option.dataset.value;
        selectedLabel.textContent = option.dataset.label;
      }
    });
  }

  trigger.addEventListener('click', () => {
    dropdown.classList.toggle('is-open');
  });

  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) {
      dropdown.classList.remove('is-open');
    }
  });

  optionsContainer.addEventListener('click', (e) => {
    const option = e.target.closest('.form-dropdown__option');
    if (option) {
      selectOption(option);
      dropdown.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
    }
  });

  if (fd.Field === 'Country') {
    hiddenInput.addEventListener('change', (e) => {
      const stateWrapper = document.querySelector('.State');
      const countryValue = e.target.value?.toUpperCase();
      if (countryValue && !['US', 'CA', 'MX'].includes(countryValue)) {
        stateWrapper.style.display = 'none';
      } else {
        stateWrapper.style.display = 'block';
        stateWrapper.querySelectorAll('.form-dropdown__option').forEach((option) => {
          option.style.display = option?.dataset?.country === countryValue ? 'flex' : 'none';
        });
      }
    });
  }

  if (fd.Field === 'Market') {
    hiddenInput.addEventListener('change', (e) => {
      const categoryWrapper = document.querySelector('.form-select-wrapper.Category');
      const marketValue = e.target.value;
      categoryWrapper.querySelectorAll('.form-dropdown__option').forEach((option) => {
        option.style.display = option?.dataset?.market === marketValue ? 'flex' : 'none';
      });
    });
  }

  dropdown.appendChild(hiddenInput);
  wrapper.appendChild(dropdown);
  dropdown.appendChild(trigger);
  dropdown.appendChild(optionsContainer);
  wrapper.appendChild(validIcon);
  wrapper.appendChild(errorIcon);

  return wrapper;
}

function createSubmitButton(fd) {
  const button = document.createElement('button');
  button.textContent = fd.Label;
  button.classList.add('button');
  button.type = 'submit';
  if (fd.Extra) {
    button.dataset.redirectUrl = fd.Extra;
  }
  return button;
}

function createHeading(fd) {
  const heading = document.createElement('h3');
  heading.textContent = fd.Label;
  return heading;
}

function createInput(fd) {
  const input = document.createElement('input');
  input.id = fd.Field;
  input.type = fd.Type;
  if (fd.Type === 'number' || fd.Type === 'email') {
    input.type = 'text-input';
  }
  if (fd.Type === 'checkbox') {
    input.value = 'TRUE';
  }
  input.name = fd.Field;
  if (fd.Type === 'number') {
    input.classList.add('number');
  }
  if (fd.Type === 'email') {
    input.classList.add('email');
  }
  input.setAttribute('placeholder', fd.Placeholder);
  if (fd.Pattern) {
    input.setAttribute('pattern', fd.Pattern);
    if (fd.Title) {
      input.setAttribute('title', fd.Title);
    }
  }
  if (fd.Checked) {
    input.setAttribute('checked', fd.Checked);
  }
  if (fd.ValidationErrorMessage) {
    input.setAttribute('validation-error-message', fd.ValidationErrorMessage);
  }
  return input;
}

function createTextArea(fd) {
  const input = document.createElement('textarea');
  input.id = fd.Field;
  input.name = fd.Field;
  input.setAttribute('placeholder', fd.Placeholder);
  return input;
}

function createText(fd) {
  const input = document.createElement('p');
  input.textContent = fd.Label;
  return input;
}

function createLabel(fd) {
  const label = document.createElement('label');
  label.setAttribute('for', fd.Field);
  label.textContent = fd.Label;
  if (fd.Required && fd.Required !== 'false') {
    label.classList.add('required');
    label.textContent = `${label.textContent} *`;
  }
  return label;
}

function createFieldWrapper(fd, tagName = 'div') {
  const fieldWrapper = document.createElement(tagName);
  const nameStyle = fd.Field ? ` form-${fd.Field}` : '';
  const fieldId = `form-${fd.Type}-wrapper${nameStyle}`;
  fieldWrapper.className = fieldId;
  fieldWrapper.dataset.fieldset = fd.Fieldset ? fd.Fieldset : '';
  fieldWrapper.classList.add('field-wrapper');
  return fieldWrapper;
}

function createFieldSet(fd) {
  const wrapper = createFieldWrapper(fd, 'fieldset');
  wrapper.name = fd.Field;
  if (fd.Extra) {
    wrapper.classList.add('align-vertical');
  }
  return wrapper;
}

function handleFormElement(form, fieldWrapper, fd, element) {
  const shouldAddLabel = !['fieldset', 'submit', 'heading', 'text'].includes(fd.Type);
  const container = fd.Fieldset ? form.querySelector(`.${fd.Fieldset} fieldset`) : fieldWrapper;

  if (shouldAddLabel) {
    fieldWrapper.append(createLabel(fd));
  }

  fieldWrapper.append(element);
  if (fd.Required && fd.Required !== 'false') {
    element.setAttribute('required', 'required');
    addErrorHandling(element);
  }

  if (fd.Fieldset) {
    container.append(fieldWrapper);
  }

  if (fd.Extra === 'hidden') {
    fieldWrapper.style.display = 'none';
  }

  if (fd.Value) {
    fieldWrapper.querySelector('input').value = fd.Value;
  }
}

export async function createForm(formURL, submitUrl, problemOptionsUrl) {
  const resp = await fetch(formURL);
  const json = await resp.json();
  const form = document.createElement('form');
  form.method = 'GET';
  form.action = submitUrl;

  const [, locale] = getRegionLocale();
  await (async () => {
    await loadFormTranslations('/forms/form-translations.json?sheet=translations', locale || 'en');
  })();

  json.data.forEach((fd) => {
    fd.Label = translateFormLabels(fd.Label);
    fd.Type = fd.Type || 'text-input';
    const fieldWrapper = document.createElement('div');
    const style = fd.Style ? ` form-${fd.Style}` : '';
    const fieldId = `form-${fd.Type}-wrapper${style}`;
    fieldWrapper.className = fieldId;
    fieldWrapper.classList.add('field-wrapper');
    fieldWrapper.classList.add(fd.Field);
    if (fd.Colspan) {
      fieldWrapper.classList.add(`col-span-${fd.Colspan}`);
    }
    if (fd.Fieldset !== '' && fd.Colspan === '') {
      fieldWrapper.style.flex = '1';
    }

    let element;
    switch (fd.Type) {
      case 'select':
        element = createSelect(fd, problemOptionsUrl);
        break;
      case 'heading':
        element = createHeading(fd);
        break;
      case 'checkbox':
        if (fd.Fieldset) {
          const fieldset = form.querySelector(`.${fd.Fieldset} fieldset`);
          fieldWrapper.append(createInput(fd));
          fieldWrapper.append(createLabel(fd));
          fieldset.append(fieldWrapper);
          return;
        }
        fieldWrapper.append(createInput(fd));
        fieldWrapper.append(createLabel(fd));
        break;
      case 'text-area':
        element = createTextArea(fd);
        break;
      case 'fieldset':
        element = createFieldSet(fd);
        break;
      case 'submit':
        element = createSubmitButton(fd);
        break;
      case 'text':
        element = createText(fd);
        break;
      default:
        element = createInput(fd);
    }

    if (element) {
      handleFormElement(form, fieldWrapper, fd, element);
    }

    if (fd.Fieldset === '') {
      form.append(fieldWrapper);
    }
  });

  return form;
}

export default async function decorate(block) {
  const form = block.querySelector('a[href$=".json"]');
  if (form) {
    const { pathname } = new URL(form.href);
    const submitAction = block.querySelectorAll('p > a')[1];
    const submitUrl = submitAction ? submitAction.href : String(pathname).split('.json')[0];
    submitAction.parentElement.style.display = 'none';
    const problemOptions = block.querySelectorAll('p > a')[2];
    if (problemOptions) {
      problemOptions.parentElement.style.display = 'none';
    }
    const formElement = await createForm(pathname, submitUrl, problemOptions?.href);

    // Add form submit handler for client-side validation
    formElement.addEventListener('submit', (e) => {
      // set phone number to full phone number
      const phoneNumber = formElement.querySelector('input[name="Phone"]').getAttribute('full-phone-number');
      if (phoneNumber) {
        formElement.querySelector('input[name="Phone"]').value = phoneNumber;
      }
      if (!formElement.checkValidity()) {
        e.preventDefault();
      }

      // check if current page is sample-cart
      const currentPage = window.location.pathname;
      if (currentPage.includes('sample-cart')) {
        const messageTextArea = formElement.querySelector('textarea[name="Message"]');
        const messageDesc = 'This prospect would like to request a sample of the following products: ';
        messageTextArea.value = `${messageTextArea.value}\n${messageDesc}`;
        const cartCookies = getCookie('cartCookies');
        if (cartCookies) {
          const items = cartCookies.split('cookie ').filter(Boolean);
          items.forEach((item) => {
            const [name] = item.split(',url=');
            messageTextArea.value += `${name},`;
          });
          // remove cartCookies cookie
          document.cookie = 'cartCookies=; path=/';
        }
      }
    });

    form.replaceWith(formElement);
  }
}
