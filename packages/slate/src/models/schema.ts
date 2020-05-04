import Debug from "debug";
import isPlainObject from "is-plain-object";
import logger from "slate-dev-logger";
import { Record } from "immutable";
import {
  CHILD_OBJECT_INVALID,
  CHILD_REQUIRED,
  CHILD_TYPE_INVALID,
  CHILD_UNKNOWN,
  FIRST_CHILD_OBJECT_INVALID,
  FIRST_CHILD_TYPE_INVALID,
  LAST_CHILD_OBJECT_INVALID,
  LAST_CHILD_TYPE_INVALID,
  NODE_DATA_INVALID,
  NODE_IS_VOID_INVALID,
  NODE_MARK_INVALID,
  NODE_OBJECT_INVALID,
  NODE_TEXT_INVALID,
  NODE_TYPE_INVALID,
  PARENT_OBJECT_INVALID,
  PARENT_TYPE_INVALID,
  PREVIOUS_SIBLING_TYPE_INVALID,
  NEXT_SIBLING_OBJECT_INVALID,
  NEXT_SIBLING_TYPE_INVALID,
} from "@zykj/slate-schema-violations";

import MODEL_TYPES from "../constants/model-types";
import Stack from "./stack";
import Text from "./text";
import SlateError from "../utils/slate-error";
import { PREVIOUS_SIBLING_OBJECT_INVALID } from "@zykj/slate-schema-violations";
import { Change } from "..";
import { Path } from "../interfaces/path";

const debug = Debug("slate: schema");

const CORE_RULES = [
  // Only allow block nodes in documents.
  {
    match: { object: "document" },
    nodes: [
      {
        match: { object: "block" },
      },
    ],
  },

  // Only allow block nodes or inline and text nodes in blocks.
  {
    match: {
      object: "block",
      first: { object: "block" },
    },
    nodes: [
      {
        match: { object: "block" },
      },
    ],
  },
  {
    match: {
      object: "block",
      first: [{ object: "inline" }, { object: "text" }],
    },
    nodes: [
      {
        match: [{ object: "inline" }, { object: "text" }],
      },
    ],
  },

  // Only allow inline and text nodes in inlines.
  {
    match: { object: "inline" },
    nodes: [{ match: [{ object: "inline" }, { object: "text" }] }],
  },

  // Ensure that block and inline nodes have at least one text child.
  {
    match: [{ object: "block" }, { object: "inline" }],
    nodes: [{ min: 1 }],
    normalize: (change, error) => {
      const { code, node } = error;
      if (code !== "child_required") return;
      change.insertNodeByKey(node.key, 0, Text.create(), {
        normalize: false,
      });
    },
  },

  // Ensure that inline non-void nodes are never empty.
  {
    match: {
      object: "inline",
      isVoid: false,
      nodes: [{ match: { object: "text" } }],
    },
    text: /[\w\W]+/,
  },

  // Ensure that inline void nodes are surrounded by text nodes.
  {
    match: { object: "block" },
    first: [{ object: "block" }, { object: "text" }],
    last: [{ object: "block" }, { object: "text" }],
    normalize: (change, error) => {
      const { code, node } = error;
      const text = Text.create();
      let i;

      if (code === "first_child_object_invalid") {
        i = 0;
      } else if (code === "last_child_object_invalid") {
        i = node.nodes.size;
      } else {
        return;
      }

      change.insertNodeByKey(node.key, i, text, { normalize: false });
    },
  },
  {
    match: { object: "inline" },
    first: [{ object: "block" }, { object: "text" }],
    last: [{ object: "block" }, { object: "text" }],
    previous: [{ object: "block" }, { object: "text" }],
    next: [{ object: "block" }, { object: "text" }],
    normalize: (change, error) => {
      const { code, node, index } = error;
      const text = Text.create();
      let i;

      if (code === "first_child_object_invalid") {
        i = 0;
      } else if (code === "last_child_object_invalid") {
        i = node.nodes.size;
      } else if (code === "previous_sibling_object_invalid") {
        i = index;
      } else if (code === "next_sibling_object_invalid") {
        i = index + 1;
      } else {
        return;
      }

      change.insertNodeByKey(node.key, i, text, { normalize: false });
    },
  },

  // Merge adjacent text nodes.
  {
    match: { object: "text" },
    next: [{ object: "block" }, { object: "inline" }],
    normalize: (change, error) => {
      const { code, next } = error;
      if (code !== "next_sibling_object_invalid") return;
      change.mergeNodeByKey(next.key, { normalize: false });
    },
  },
];

/**
 * Default properties.
 *
 * @type {Object}
 */

const DEFAULTS = {
  stack: Stack.create(),
  rules: [],
};

class Schema extends Record(DEFAULTS) {
  /**
   * 属性
   */
  public stack: Stack;
  public rules: any[];

  /**
   * 静态方法
   */
  static create(attrs = {}) {
    if (Schema.isSchema(attrs)) {
      return attrs;
    }

    if (isPlainObject(attrs)) {
      return Schema.fromJSON(attrs);
    }

    throw new Error(
      `\`Schema.create\` only accepts objects or schemas, but you passed it: ${attrs}`
    );
  }

  static fromJSON(object) {
    if (Schema.isSchema(object)) {
      return object;
    }

    const plugins = object.plugins ? object.plugins : [{ schema: object }];
    let rules = [...CORE_RULES];

    for (const plugin of plugins) {
      const { schema = {} } = plugin;
      const { blocks = {}, inlines = {}, marks = {} } = schema;

      if (schema.rules) {
        rules = rules.concat(schema.rules);
      }

      if (schema.document) {
        rules.push({
          match: [{ object: "document" }],
          ...schema.document,
        });
      }

      for (const key in blocks) {
        rules.push({
          match: [{ object: "block", type: key }],
          ...blocks[key],
        });
      }

      for (const key in inlines) {
        rules.push({
          match: [{ object: "inline", type: key }],
          ...inlines[key],
        });
      }

      for (const key in marks) {
        rules.push({
          match: [{ object: "mark", type: key }],
          ...marks[key],
        });
      }
    }

    const stack = Stack.create({ plugins });
    const ret = new Schema({ stack, rules });
    return ret;
  }

  static isSchema(any) {
    return !!(any && any[MODEL_TYPES.SCHEMA]);
  }

  /**
   * 计算属性
   */
  get object() {
    return "schema";
  }

  /**
   * 实例方法
   */
  validateNode(node, path) {
    const rules = this.rules.filter((r) => testRules(node, r.match));
    const failure = validateRules(node, rules, this.rules, { every: true });
    if (!failure) return;
    const error = new SlateError(failure.code, failure);
    return error;
  }

  /**
   * Test whether a `node` is valid against the schema.
   *
   * @param {Node} node
   * @return {Boolean}
   */
  testNode(node) {
    const error = this.validateNode(node);
    return !error;
  }

  /**
   * Assert that a `node` is valid against the schema.
   *
   * @param {Node} node
   * @throws
   */
  assertNode(node) {
    const error = this.validateNode(node);
    if (error) throw error;
  }

  /**
   * Normalize a `node` with the schema, returning a function that will fix the
   * invalid node, or void if the node is valid.
   *
   * @param {Node} node
   * @return {Function|Void}
   */
  normalizeNode(node, path) {
    const ret = this.stack.$$find("normalizeNode", node, path);
    if (ret) return ret;
    if (node.object == "text") return;

    const error = this.validateNode(node, path);
    if (!error) return;

    return (change) => {
      debug(`normalizing`, { error });
      const { rule } = error as any;
      const { size } = change.operations;

      // First run the user-provided `normalize` function if one exists...
      if (rule.normalize) {
        rule.normalize(change, error);
      }

      // If the `normalize` function did not add any operations to the change
      // object, it can't have normalized, so run the default one.
      if (change.operations.size === size) {
        defaultNormalize(change, error);
      }
    };
  }

  /**
   * Check if a mark is void.
   *
   * @param {Mark}
   * @return {Boolean}
   */

  isAtomic(mark) {
    const rule = this.rules.find(
      (r) => "isAtomic" in r && testRules(mark, r.match)
    );

    return rule ? rule.isAtomic : false;
  }

  /**
   * Check if a node is void.
   *
   * @param {Node}
   * @return {Boolean}
   */

  isVoid(node) {
    // COMPAT: Right now this just provides a way to get around the
    // deprecation warnings, but in the future it will check the rules.
    return node.get("isVoid");
  }

  /**
   * Return a JSON representation of the schema.
   *
   * @return {Object}
   */
  toJSON(options: any = {}) {
    const object = {
      object: this.object,
      rules: this.rules,
    };

    return object;
  }
}

/**
 * Normalize an invalid value with `error` with default remedies.
 *
 * @param {Change} change
 * @param {SlateError} error
 */

function defaultNormalize(change: Change, error: SlateError) {
  const {
    code,
    node,
    nodePath,
    child,
    childPath,
    key,
    mark,
    next,
    nextPath,
    previous,
    prevPath,
  } = error;
  switch (code) {
    case CHILD_OBJECT_INVALID:
    case CHILD_TYPE_INVALID:
    case CHILD_UNKNOWN:
    case FIRST_CHILD_OBJECT_INVALID:
    case FIRST_CHILD_TYPE_INVALID:
    case LAST_CHILD_OBJECT_INVALID:
    case LAST_CHILD_TYPE_INVALID: {
      return child.object === "text" &&
        node.object === "block" &&
        node.nodes.size === 1
        ? change.removeNodeByPath(nodePath, { normalize: false })
        : change.removeNodeByPath(childPath, { normalize: false });
    }
    case PREVIOUS_SIBLING_OBJECT_INVALID:
    case PREVIOUS_SIBLING_TYPE_INVALID: {
      return previous.object === "text" &&
        node.object === "block" &&
        node.nodes.size === 1
        ? change.removeNodeByPath(nodePath, { normalize: false })
        : change.removeNodeByPath(prevPath, { normalize: false });
    }

    case NEXT_SIBLING_OBJECT_INVALID:
    case NEXT_SIBLING_TYPE_INVALID: {
      return next.object === "text" &&
        node.object === "block" &&
        node.nodes.size === 1
        ? change.removeNodeByPath(nodePath, { normalize: false })
        : change.removeNodeByPath(nextPath, { normalize: false });
    }
    case CHILD_REQUIRED:
    case NODE_TEXT_INVALID:
    case PARENT_OBJECT_INVALID:
    case PARENT_TYPE_INVALID: {
      return node.object === "document"
        ? node.nodes.forEach((n, i) =>
            change.removeNodeByPath(nodePath.concat(i), { normalize: false })
          )
        : change.removeNodeByPath(nodePath, { normalize: false });
    }

    case NODE_DATA_INVALID: {
      return node.data.get(key) === undefined && node.object !== "document"
        ? change.removeNodeByPath(nodePath, { normalize: false })
        : change.setNodeByPath(
            nodePath,
            { data: node.data.delete(key) },
            { normalize: false }
          );
    }

    case NODE_IS_VOID_INVALID: {
      return change.setNodeByPath(
        nodePath,
        { isVoid: !node.get("isVoid") },
        { normalize: false }
      );
    }

    case NODE_MARK_INVALID: {
      return node.getTexts().forEach(([t, tp]) =>
        change.removeMarkByPath(tp, 0, t.text.length, mark, {
          normalize: false,
        })
      );
    }

    default: {
      const { nodePath } = error;
      return change.removeNodeByPath(nodePath, { normalize: false });
    }
  }
}

/**
 * Check that an `object` matches one of a set of `rules`.
 *
 * @param {Node} object
 * @param {Object|Array} rules
 * @return {Boolean}
 */

function testRules(object, path, rules) {
  const error = validateRules(object, path, rules);
  return !error;
}

/**
 * Validate that an `object` matches a `rule` object or array.
 *
 * @param {Node} object
 * @param {Object|Array} rule
 * @param {Array|Void} rules
 * @return {Error|Void}
 */

function validateRules(
  object,
  path,
  rule,
  rules: any[] = [],
  options: any = {}
) {
  const { every = false } = options;

  if (Array.isArray(rule)) {
    const array = rule.length ? rule : [{}];
    let first;

    for (const r of array) {
      const error = validateRules(object, r, rules);
      first = first || error;
      if (every && error) return error;
      if (!every && !error) return;
    }

    return first;
  }

  const error =
    validateObject(object, path, rule) ||
    validateType(object, path, rule) ||
    validateIsVoid(object, path, rule) ||
    validateData(object, path, rule) ||
    validateMarks(object, path, rule) ||
    validateText(object, path, rule) ||
    validateFirst(object, path, rule) ||
    validateLast(object, path, rule) ||
    validateNodes(object, path, rule, rules);

  return error;
}

function validateObject(node, path, rule) {
  if (rule.objects) {
    logger.warn(
      "The `objects` schema validation rule was changed. Please use the new `match` syntax with `object`."
    );
  }

  if (rule.object == null) return;
  if (rule.object === node.object) return;
  if (typeof rule.object === "function" && rule.object(node.object)) return;
  return fail(NODE_OBJECT_INVALID, { rule, node, nodePath: path });
}

function validateType(node, path, rule) {
  if (rule.types) {
    logger.warn(
      "The `types` schema validation rule was changed. Please use the new `match` syntax with `type`."
    );
  }

  if (rule.type == null) return;
  if (rule.type === node.type) return;
  return fail(NODE_TYPE_INVALID, { rule, node, nodePath: path });
}

function validateIsVoid(node, path, rule) {
  if (rule.isVoid == null) return;
  if (rule.isVoid === node.get("isVoid")) return;
  if (typeof rule.type === "function" && rule.type(node.type)) return;
  return fail(NODE_IS_VOID_INVALID, { rule, node, nodePath: path });
}

function validateData(node, path, rule) {
  if (rule.data == null) return;
  if (node.data == null) return;

  if (typeof rule.data === "function") {
    if (rule.data(node.data)) return;
    return fail("node_data_invalid", { rule, node, nodePath: path });
  }

  for (const key in rule.data) {
    const fn = rule.data[key];
    const value = node.data && node.data.get(key);
    const valid = typeof fn === "function" ? fn(value) : fn === value;
    if (valid) continue;
    return fail(NODE_DATA_INVALID, { rule, node, nodePath: path, key, value });
  }
}

function validateMarks(node, path, rule) {
  if (rule.marks == null) return;
  const marks = node.getMarks().toArray();

  for (const mark of marks) {
    const valid = rule.marks.some((def) =>
      typeof def.type === "function"
        ? def.type(mark.type)
        : def.type === mark.type
    );
    if (valid) continue;
    return fail(NODE_MARK_INVALID, { rule, node, nodePath: path, mark });
  }
}

function validateText(node, path, rule) {
  if (rule.text == null) return;
  const { text } = node;
  const valid =
    typeof rule.text === "function" ? rule.text(text) : rule.text.test(text);
  if (valid) return;
  return fail(NODE_TEXT_INVALID, { rule, node, nodePath: path, text });
}

function validateFirst(node, path, rule) {
  if (rule.first == null) return;
  const first = node.nodes.first();
  if (!first) return;
  const error = validateRules(first, path.concat(0), rule.first);
  if (!error) return;
  error.rule = rule;
  error.node = node;
  error.nodePath = path;
  error.child = first;
  error.childPath = path.concat(0);
  error.code = error.code.replace("node_", "first_child_");
  return error;
}

function validateLast(node, path, rule) {
  if (rule.last == null) return;
  const last = node.nodes.last();
  if (!last) return;
  const error = validateRules(
    last,
    path.concat(node.nodes.size - 1),
    rule.last
  );
  if (!error) return;
  error.rule = rule;
  error.node = node;
  error.nodePath = path;
  error.child = last;
  error.childPath = path.concat(node.nodes.size - 1);
  error.code = error.code.replace("node_", "last_child_");
  return error;
}

function validateNodes(node, path, rule, rules: any[] = []) {
  if (node.nodes == null) return;

  const children = node.nodes.toArray();
  const defs = rule.nodes != null ? rule.nodes.slice() : [];
  let offset;
  let min;
  let index;
  let def;
  let max;
  let child;
  let childPath;
  let previous;
  let prevPath;
  let next;
  let nextPath;

  function nextDef() {
    offset = offset == null ? null : 0;
    def = defs.shift();
    min = def && def.min;
    max = def && def.max;
    return !!def;
  }

  function nextChild() {
    index = index == null ? 0 : index + 1;
    offset = offset == null ? 0 : offset + 1;
    previous = child;
    prevPath = childPath;
    child = children[index];
    childPath = path.concat(index);
    next = children[index + 1];
    nextPath = path.concat(index + 1);
    if (max != null && offset == max) nextDef();
    return !!child;
  }

  function rewind() {
    offset -= 1;
    index -= 1;
  }

  if (rule.nodes != null) {
    nextDef();
  }

  while (nextChild()) {
    const err =
      validateParent(node, path, child, childPath, rules) ||
      validatePrevious(
        node,
        path,
        child,
        childPath,
        previous,
        prevPath,
        index,
        rules
      ) ||
      validateNext(node, path, child, childPath, next, nextPath, index, rules);

    if (err) return err;

    if (rule.nodes != null) {
      if (!def) {
        return fail(CHILD_UNKNOWN, {
          rule,
          node,
          nodePath: path,
          child,
          childPath,
          index,
        });
      }

      if (def) {
        if (def.objects) {
          logger.warn(
            "The `objects` schema validation rule was changed. Please use the new `match` syntax with `object`."
          );
        }

        if (def.types) {
          logger.warn(
            "The `types` schema validation rule was changed. Please use the new `match` syntax with `type`."
          );
        }
      }

      if (def.match) {
        const error = validateRules(child, childPath, def.match);

        if (error && offset >= min && nextDef()) {
          rewind();
          continue;
        }

        if (error) {
          error.rule = rule;
          error.node = node;
          error.nodePath = path;
          error.child = child;
          error.childPath = childPath;
          error.index = index;
          error.code = error.code.replace("node_", "child_");
          return error;
        }
      }
    }
  }

  if (rule.nodes != null) {
    while (min != null) {
      if (offset < min) {
        return fail(CHILD_REQUIRED, { rule, node, nodePath: path, index });
      }

      nextDef();
    }
  }
}

function validateParent(node, path, child, childPath, rules) {
  for (const rule of rules) {
    if (rule.parent == null) continue;
    if (!testRules(child, childPath, rule.match)) continue;

    const error = validateRules(node, path, rule.parent);
    if (!error) continue;

    error.rule = rule;
    error.parent = node;
    error.parentPath = path;
    error.node = child;
    error.nodePath = childPath;
    error.code = error.code.replace("node_", "parent_");
    return error;
  }
}

function validatePrevious(
  node,
  path,
  child,
  childPath,
  previous,
  prevPath,
  index,
  rules
) {
  if (!previous) return;

  for (const rule of rules) {
    if (rule.previous == null) continue;
    if (!testRules(child, childPath, rule.match)) continue;

    const error = validateRules(previous, prevPath, rule.previous);
    if (!error) continue;

    error.rule = rule;
    error.node = node;
    error.nodePath = path;
    error.child = child;
    error.childPath = childPath;
    error.index = index;
    error.previous = previous;
    error.prevPath = prevPath;
    error.code = error.code.replace("node_", "previous_sibling_");
    return error;
  }
}

function validateNext(
  node,
  path,
  child,
  childPath,
  next,
  nextPath,
  index,
  rules
) {
  if (!next) return;

  for (const rule of rules) {
    if (rule.next == null) continue;
    if (!testRules(child, childPath, rule.match)) continue;

    const error = validateRules(next, nextPath, rule.next);
    if (!error) continue;

    error.rule = rule;
    error.node = node;
    error.nodePath = path;
    error.child = child;
    error.childPath = childPath;
    error.index = index;
    error.next = next;
    error.nextPath = nextPath;
    error.code = error.code.replace("node_", "next_sibling_");
    return error;
  }
}

/**
 * Create an interim failure object with `code` and `attrs`.
 *
 * @param {String} code
 * @param {Object} attrs
 * @return {Object}
 */

function fail(code, attrs) {
  return { code, ...attrs };
}

/**
 * Attach a pseudo-symbol for type checking.
 */

Schema.prototype[MODEL_TYPES.SCHEMA] = true;

/**
 * Export.
 *
 * @type {Schema}
 */

export default Schema;
