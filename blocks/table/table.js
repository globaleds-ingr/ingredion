/*
 * Table Block
 * Recreate a table
 * https://www.hlx.live/developer/block-collection/table
 */

function buildCell(rowIndex) {
  const cell = rowIndex ? document.createElement('td') : document.createElement('th');
  if (!rowIndex) cell.setAttribute('scope', 'col');
  return cell;
}

export default async function decorate(block) {
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');

  const isList = block.classList.contains('list');
  const header = !block.classList.contains('no-header') && !isList;
  if (header) table.append(thead);
  table.append(tbody);

  let columnCount = 0;

  [...block.children].forEach((child, i) => {
    const row = document.createElement('tr');
    if (header && i === 0) thead.append(row);
    else tbody.append(row);

    const cols = [...child.children];
    if (i === 0) columnCount = cols.length;

    cols.forEach((col) => {
      const cell = buildCell(header ? i : i + 1);

      const paragraphs = col.querySelectorAll('p');
      if (paragraphs.length > 1) {
        paragraphs.forEach((paragraph, index) => {
          if (index < paragraphs.length - 1) {
            const spacerP = document.createElement('p');
            spacerP.innerHTML = '&nbsp;';
            paragraph.after(spacerP);
          }
        });
      }

      col.querySelectorAll('a').forEach((a) => {
        a.classList.add('table', 'link');

        const { nextSibling } = a;

        if (nextSibling && nextSibling.nodeType === Node.TEXT_NODE) {
          const { textContent } = nextSibling;
          const updatedTextContent = textContent.startsWith(' ')
            ? textContent
            : ` ${textContent}`;

          nextSibling.textContent = updatedTextContent;
        }
      });

      const buttons = col.querySelectorAll('.button');
      buttons.forEach((button) => {
        button.classList.remove('button');
        button.classList.add('table', 'link');
      });

      cell.innerHTML = col.innerHTML;
      row.append(cell);
    });
  });

  // Dynamically set column widths for <th> elements
  if (header && columnCount > 0) {
    const thElements = thead.querySelectorAll('th');
    const columnWidth = `${100 / columnCount}%`;
    thElements.forEach((th) => {
      th.style.width = columnWidth;
    });
  }

  block.innerHTML = '';
  block.append(table);
}
