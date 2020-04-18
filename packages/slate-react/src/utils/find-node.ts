/**
 * Find a Slate node from a DOM `element`.
 *
 * @param {Element} element
 * @param {Value} value
 * @return {Node|Null}
 */

import { ELEMENT_TO_NODE } from "@zykj/slate";

function findNode(element) {
  const closest = element.closest("[data-key]");
  if (!closest) return null;

  const node = ELEMENT_TO_NODE.get(closest);
  return node || null;
}

/**
 * Export.
 *
 * @type {Function}
 */

export default findNode;
