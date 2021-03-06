import { Path } from "../interfaces/path";

/**
 * Changes.
 *
 * @type {Object}
 */

const Changes: {
  normalize;
  normalizeDocument;
  normalizeNodeByPath;
  normalizeParentByPath;
} = {} as any;

/**
 * Normalize the value with its schema.
 *
 * @param {Change} change
 */

Changes.normalize = (change, options) => {
  change.normalizeDocument(options);
};

/**
 * Normalize the document with the value's schema.
 *
 * @param {Change} change
 */

Changes.normalizeDocument = (change, options) => {
  const { value } = change;
  const { document } = value;
  change.normalizeNodeByKey(document.key, options);
};

/**
 * Normalize a `node` and its children with the value's schema.
 *
 * @param {Change} change
 * @param {Array} path
 */

Changes.normalizeNodeByPath = (change, path, options = {}) => {
  const normalize = change.getFlag("normalize", options);
  if (!normalize) return;

  const { value } = change;
  let { document, schema } = value;
  const node = document.getNode(path);

  normalizeNodeAndChildren(change, node, path, schema);

  document = change.value.document;
  const ancestors = document.getAncestors(path);

  ancestors.forEach(([ancestor, ancestorPath]) => {
    if (change.value.document.getDescendant(ancestorPath)) {
      normalizeNode(change, ancestor, ancestorPath, schema);
    }
  });
};

Changes.normalizeParentByPath = (change, path, options) => {
  const p = Path.lift(path);
  change.normalizeNodeByPath(p, options);
};

/**
 * Normalize a `node` and its children with a `schema`.
 *
 * @param {Change} change
 * @param {Node} node
 * @param {Schema} schema
 */

function normalizeNodeAndChildren(change, node, path, schema) {
  if (node.object == "text") {
    normalizeNode(change, node, path, schema);
    return;
  }

  let [child, childPath] = node.getFirstInvalidNode(schema, path);

  while (node && child) {
    normalizeNodeAndChildren(change, child, childPath, schema);
    node = change.value.document.refindNode(path, node.key);

    if (!node) {
      path = [];
      child = null;
    } else {
      path = change.value.document.refindPath(path, node.key);
      child = node.getFirstInvalidNode(schema);
    }
  }

  // Normalize the node itself if it still exists.
  if (node) {
    normalizeNode(change, node, path, schema);
  }
}

/**
 * Normalize a `node` with a `schema`, but not its children.
 *
 * @param {Change} change
 * @param {Node} node
 * @param {Schema} schema
 */

function normalizeNode(change, node, path, schema) {
  const max =
    schema.stack.plugins.length +
    schema.rules.length +
    (node.object === "text" ? 1 : node.nodes.size);

  let iterations = 0;

  function iterate(c, n, p) {
    const normalize = n.normalize(schema, p);
    if (!normalize) return;

    // Run the `normalize` function to fix the node.
    let path = c.value.document.getPath(n.key);
    normalize(c);

    // Re-find the node reference, in case it was updated. If the node no longer
    // exists, we're done for this branch.
    n = c.value.document.refindNode(path, n.key);
    if (!n) return;

    path = c.value.document.refindPath(path, n.key);

    // Increment the iterations counter, and check to make sure that we haven't
    // exceeded the max. Without this check, it's easy for the `normalize`
    // function of a schema rule to be written incorrectly and for an infinite
    // invalid loop to occur.
    iterations++;

    if (iterations > max) {
      throw new Error(
        "A schema rule could not be normalized after sufficient iterations. This is usually due to a `rule.normalize` or `plugin.normalizeNode` function of a schema being incorrectly written, causing an infinite loop."
      );
    }

    // Otherwise, iterate again.
    iterate(c, n, path);
  }

  iterate(change, node, path);
}

/**
 * Export.
 *
 * @type {Object}
 */

export default Changes;
