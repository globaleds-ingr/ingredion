/* eslint-disable function-paren-newline, object-curly-newline */
import { breadcrumbs } from '../../scripts/breadcrumbs.js';

export default async function decorate(block) {
  const $breadcrumbs = await breadcrumbs();
  block.replaceWith($breadcrumbs);
}
