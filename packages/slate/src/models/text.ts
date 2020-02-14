import isPlainObject from "is-plain-object";
import logger from "slate-dev-logger";
import { List, OrderedSet, Record, Set } from "immutable";

import Leaf from "./leaf";
import MODEL_TYPES from "../constants/model-types";
import KeyUtils from "../utils/key-utils";
import memoize from "../utils/memoize";
import Mark from "./mark";

const DEFAULTS = {
  leaves: List(),
  key: void 0
};

class Text extends Record(DEFAULTS) {
  /**
   * 属性
   */

  public leaves: List<Leaf>;
  public key: string;

  /**
   * 静态方法
   */
  static create(attrs: any = ""): Text {
    if (Text.isText(attrs)) {
      return attrs;
    }

    if (typeof attrs == "string") {
      attrs = { leaves: [{ text: attrs }] };
    }

    if (isPlainObject(attrs)) {
      if (attrs.text) {
        const { text, marks, key } = attrs;
        attrs = { key, leaves: [{ text, marks }] };
      }

      return Text.fromJSON(attrs);
    }

    throw new Error(
      `\`Text.create\` only accepts objects, arrays, strings or texts, but you passed it: ${attrs}`
    );
  }

  static createList(elements = []) {
    if (List.isList(elements) || Array.isArray(elements)) {
      const list = List(elements.map(Text.create));
      return list;
    }

    throw new Error(
      `\`Text.createList\` only accepts arrays or lists, but you passed it: ${elements}`
    );
  }

  static fromJSON(object): Text {
    if (Text.isText(object)) {
      return object;
    }

    const { key = KeyUtils.create() } = object;
    let { leaves } = object;

    if (!leaves) {
      if (object.ranges) {
        logger.deprecate(
          "slate@0.27.0",
          "The `ranges` property of Slate objects has been renamed to `leaves`."
        );

        leaves = object.ranges;
      } else {
        leaves = List();
      }
    }

    if (Array.isArray(leaves)) {
      leaves = List(leaves.map(x => Leaf.create(x)));
    } else if (List.isList(leaves)) {
      leaves = leaves.map(x => Leaf.create(x));
    } else {
      throw new Error("leaves must be either Array or Immutable.List");
    }

    const node = new Text({
      leaves: Leaf.createLeaves(leaves),
      key
    });

    return node;
  }

  static isText(obj) {
    return !!(obj && obj[MODEL_TYPES.TEXT]);
  }

  // 判断是否是多个 `Text` 节点组成的 `List`
  static isTextList(any) {
    return List.isList(any) && any.every(item => Text.isText(item));
  }

  // 计算属性
  get object() {
    return "text";
  }

  get text() {
    return this.getText();
  }

  /**
   * 实例方法
   */
  getText() {
    return this.leaves.reduce(
      (string: string, leaf: Leaf) => string + leaf.text,
      ""
    );
  }

  getString() {
    logger.deprecate(
      "0.39.0",
      "The `Text.getString` property is deprecated, please use `Text.getText` instead."
    );

    return this.getText();
  }

  // 当前节点的文本内容是否为空
  isEmpty() {
    return this.text === "";
  }

  // 根据文字的位置获取所在 `leaf` 节点信息
  searchLeafAtOffset(offset) {
    let endOffset = 0;
    let startOffset = 0;
    let index = -1;

    const leaf = this.leaves.find((l: Leaf) => {
      index++;
      startOffset = endOffset;
      endOffset = startOffset + l.text.length;
      return endOffset >= offset;
    });

    return {
      leaf,
      endOffset,
      index,
      startOffset
    };
  }

  addMark(index, length, mark) {
    const marks = Set.of(mark);
    return this.addMarks(index, length, marks);
  }

  addMarks(index, length, set) {
    if (this.text === "" && length === 0 && index === 0) {
      const { leaves } = this;
      const first = leaves.first();

      if (!first) {
        return this.set(
          "leaves",
          List.of(Leaf.fromJSON({ text: "", marks: set }))
        );
      }

      const newFirst = first.addMarks(set);
      if (newFirst === first) return this;
      return this.set("leaves", List.of(newFirst));
    }

    if (this.text === "") return this;
    if (length === 0) return this;
    if (index >= this.text.length) return this;

    const [before, bundle] = Leaf.splitLeaves(this.leaves, index);
    const [middle, after] = Leaf.splitLeaves(bundle, length);
    const leaves = before
      .concat(
        middle.map((x: Leaf) => x.addMarks(set)),
        after
      )
      .toList();
    return this.setLeaves(leaves);
  }

  getLeaves(decorations = []) {
    let { leaves } = this;
    if (leaves.size === 0) return List.of(Leaf.create({}));
    if (!decorations || decorations.length === 0) return leaves;
    if (this.text.length === 0) return leaves;
    const { key } = this;

    decorations.forEach((dec: any) => {
      const { start, end, mark } = dec;
      const hasStart = start.key == key;
      const hasEnd = end.key == key;

      if (hasStart && hasEnd) {
        const index = hasStart ? start.offset : 0;
        const length = hasEnd ? end.offset - index : this.text.length - index;

        if (length < 1) return;
        if (index >= this.text.length) return;

        if (index !== 0 || length < this.text.length) {
          const [before, bundle] = Leaf.splitLeaves(leaves, index);
          const [middle, after] = Leaf.splitLeaves(bundle, length);
          leaves = before.concat(
            middle.map((x: Leaf) => x.addMark(mark)),
            after
          ) as List<Leaf>;
          return;
        }
      }

      leaves = leaves.map((x: Leaf) => x.addMark(mark)) as List<Leaf>;
    });

    if (leaves === this.leaves) return leaves;
    return Leaf.createLeaves(leaves);
  }

  getActiveMarksBetweenOffsets(startOffset: number, endOffset: number) {
    if (startOffset <= 0 && endOffset >= this.text.length) {
      return this.getActiveMarks();
    }

    if (startOffset >= endOffset) return Set();
    // For empty text in a paragraph, use getActiveMarks;
    if (this.text === "") return this.getActiveMarks();

    let result: any = null;
    let leafEnd = 0;

    this.leaves.forEach((leaf: Leaf) => {
      const leafStart = leafEnd;
      leafEnd = leafStart + leaf.text.length;

      if (leafEnd <= startOffset) return;
      if (leafStart >= endOffset) return false;

      if (!result) {
        result = leaf.marks;
        return;
      }

      result = result.intersect(leaf.marks);
      if (result && result.size === 0) return false;
      return false;
    });

    return result || Set();
  }

  getActiveMarks() {
    if (this.leaves.size === 0) return Set();

    const result = this.leaves.first().marks;
    if (result.size === 0) return result;

    return result.withMutations(x => {
      this.leaves.forEach((c: Leaf): any => {
        x.intersect(c.marks);
        if (x.size === 0) return false;
      });
    });
  }

  getFirstText() {
    return this;
  }

  getLastText() {
    return this;
  }

  /**
   * Get all of the marks on between two offsets
   * Corner Cases:
   *   1. if startOffset is equal or bigger than endOffset, then return Set();
   *   2. If no text is selected between start and end, then return Set()
   *
   * @return {OrderedSet<Mark>}
   */
  getMarksBetweenOffsets(startOffset: number, endOffset: number) {
    if (startOffset <= 0 && endOffset >= this.text.length) {
      return this.getMarks();
    }

    if (startOffset >= endOffset) return Set();
    // For empty text in a paragraph, use getActiveMarks;
    if (this.text === "") return this.getActiveMarks();

    let result: any = null;
    let leafEnd = 0;

    this.leaves.forEach((leaf: Leaf): any => {
      const leafStart = leafEnd;
      leafEnd = leafStart + leaf.text.length;

      if (leafEnd <= startOffset) return;
      if (leafStart >= endOffset) return false;

      if (!result) {
        result = leaf.marks;
        return;
      }

      result = result.union(leaf.marks);
    });

    return result || Set();
  }

  /**
   * Get all of the marks on the text.
   *
   * @return {OrderedSet<Mark>}
   */

  getMarks() {
    const array = this.getMarksAsArray();
    return OrderedSet(array);
  }

  /**
   * Get all of the marks on the text as an array
   *
   * @return {Array}
   */

  getMarksAsArray() {
    if (this.leaves.size === 0) return [];
    const first = this.leaves.first().marks;
    if (this.leaves.size === 1) return first.toArray();

    const result: any = [];

    this.leaves.forEach((leaf: Leaf) => {
      result.push(leaf.marks.toArray());
    });

    return Array.prototype.concat.apply(first.toArray(), result);
  }

  /**
   * Get the marks on the text at `index`.
   * Corner Cases:
   *   1. if no text is before the index, and index !== 0, then return Set()
   *   2. (for insert after split node or mark at range) if index === 0, and text === '', then return the leaf.marks
   *   3. if index === 0, text !== '', return Set()
   *
   *
   * @param {Number} index
   * @return {Set<Mark>}
   */

  getMarksAtIndex(index: number) {
    const { leaf } = this.searchLeafAtOffset(index);
    if (!leaf) return Set();
    return leaf.marks as Set<Mark>;
  }

  /**
   * Get a node by `key`, to parallel other nodes.
   *
   * @param {String} key
   * @return {Node|Null}
   */

  getNode(key: string) {
    return this.key == key ? this : null;
  }

  /**
   * Check if the node has a node by `key`, to parallel other nodes.
   *
   * @param {String} key
   * @return {Boolean}
   */

  hasNode(key: string) {
    return !!this.getNode(key);
  }

  /**
   * Insert `text` at `index`.
   *
   * @param {Numbder} offset
   * @param {String} text
   * @param {Set} marks (optional)
   * @return {Text}
   */

  insertText(offset: number, text: string, marks: Set<Mark>): Text {
    if (this.text === "") {
      return this.set("leaves", List.of(Leaf.create({ text, marks }))) as Text;
    }

    if (text.length === 0) return this;
    if (!marks) marks = Set();

    const { startOffset, leaf, index } = this.searchLeafAtOffset(offset);
    const delta = offset - startOffset;
    const beforeText = leaf.text.slice(0, delta);
    const afterText = leaf.text.slice(delta);
    const { leaves } = this;

    if (leaf.marks.equals(marks)) {
      return this.set(
        "leaves",
        leaves.set(
          index,
          leaf.set("text", beforeText + text + afterText) as Leaf
        )
      ) as Text;
    }

    const nextLeaves = leaves
      .splice(
        index,
        1,
        leaf.set("text", beforeText),
        Leaf.create({ text, marks }),
        leaf.set("text", afterText)
      )
      .toList();

    return this.setLeaves(nextLeaves);
  }

  /**
   * Regenerate the node's key.
   */

  regenerateKey(): Text {
    const key = KeyUtils.create();
    return this.set("key", key) as Text;
  }

  /**
   * Remove a `mark` at `index` and `length`.
   */

  removeMark(index: number, length: number, mark: Mark): Text {
    if (this.text === "" && index === 0 && length === 0) {
      const first = this.leaves.first();
      if (!first) return this;
      const newFirst = first.removeMark(mark);
      if (newFirst === first) return this;
      return this.set("leaves", List.of(newFirst)) as Text;
    }

    if (length <= 0) return this;
    if (index >= this.text.length) return this;
    const [before, bundle] = Leaf.splitLeaves(this.leaves, index);
    const [middle, after] = Leaf.splitLeaves(bundle, length);
    const leaves = before
      .concat(
        middle.map((x: Leaf) => x.removeMark(mark)),
        after
      )
      .toList();
    return this.setLeaves(leaves);
  }

  /**
   * Remove text from the text node at `start` for `length`.
   */

  removeText(start: number, length: number): Text {
    if (length <= 0) return this;
    if (start >= this.text.length) return this;

    // PERF: For simple backspace, we can operate directly on the leaf
    if (length === 1) {
      const { leaf, index, startOffset } = this.searchLeafAtOffset(start + 1);
      const offset = start - startOffset;

      if (leaf) {
        if (leaf.text.length === 1) {
          const leaves = this.leaves.remove(index);
          return this.setLeaves(leaves);
        }

        const beforeText = leaf.text.slice(0, offset);
        const afterText = leaf.text.slice(offset + length);
        const text = beforeText + afterText;

        if (text.length > 0) {
          return this.set(
            "leaves",
            this.leaves.set(index, leaf.set("text", text) as Leaf)
          ) as Text;
        }
      }
    }

    const [before, bundle] = Leaf.splitLeaves(this.leaves, start);
    const after = Leaf.splitLeaves(bundle, length)[1];
    const leaves = Leaf.createLeaves(before.concat(after) as List<Leaf>);

    if (leaves.size === 1) {
      const first = leaves.first();

      if (first.text === "") {
        return this.set(
          "leaves",
          List.of(first.set("marks", this.getActiveMarks()))
        ) as Text;
      }
    }

    return this.set("leaves", leaves) as Text;
  }

  /**
   * Return a JSON representation of the text.
   *
   * @param {Object} options
   * @return {Object}
   */

  toJSON(
    options: any = {}
  ): {
    object: "text";
    leaves: any;
  } {
    const object: any = {
      object: this.object,
      leaves: this.getLeaves()
        .toArray()
        .map(r => r.toJSON())
    };

    if (options.preserveKeys) {
      object.key = this.key;
    }

    return object;
  }

  /**
   * Update a `mark` at `index` and `length` with `properties`.
   */

  updateMark(index: number, length: number, mark: Mark, properties: any): Text {
    const newMark = mark.merge(properties) as Mark;

    if (this.text === "" && length === 0 && index === 0) {
      const { leaves } = this;
      const first = leaves.first();
      if (!first) return this;
      const newFirst = first.updateMark(mark, newMark);
      if (newFirst === first) return this;
      return this.set("leaves", List.of(newFirst)) as Text;
    }

    if (length <= 0) return this;
    if (index >= this.text.length) return this;

    const [before, bundle] = Leaf.splitLeaves(this.leaves, index);
    const [middle, after] = Leaf.splitLeaves(bundle, length);

    const leaves = before
      .concat(
        middle.map((x: Leaf) => x.updateMark(mark, newMark)),
        after
      )
      .toList();

    return this.setLeaves(leaves);
  }

  /**
   * Split this text and return two different texts
   */

  splitText(offset: number): Text[] {
    const splitted = Leaf.splitLeaves(this.leaves, offset);
    const one = this.set("leaves", splitted[0]) as Text;
    const two = (this.set(
      "leaves",
      splitted[1]
    ) as Text).regenerateKey() as Text;
    return [one, two];
  }

  /**
   * merge this text and another text at the end
   */

  mergeText(text: Text): Text {
    const leaves = this.leaves.concat(text.leaves).toList();
    return this.setLeaves(leaves);
  }

  /**
   * Normalize the text node with a `schema`.
   *
   * @param {Schema} schema
   * @return {Function|Void}
   */

  normalize(schema) {
    return schema.normalizeNode(this);
  }
  /**
   * Validate the text node against a `schema`.
   *
   * @param {Schema} schema
   * @return {Error|Void}
   */

  validate(schema) {
    return schema.validateNode(this);
  }
  /**
   * Get the first invalid descendant
   * PERF: Do not cache this method; because it can cause cycle reference
   *
   * @param {Schema} schema
   * @returns {Text|Null}
   */

  getFirstInvalidNode(schema): Text | null {
    return this.validate(schema) ? this : null;
  }

  getFirstInvalidDescendant(schema) {
    logger.deprecate(
      "0.39.0",
      "The `Node.getFirstInvalidDescendant` method is deprecated, please use `Node.getFirstInvalidNode` instead."
    );

    return this.getFirstInvalidNode(schema);
  }

  /**
   * Set leaves with normalized `leaves`
   */
  setLeaves(leaves: List<Leaf>): Text {
    const result = Leaf.createLeaves(leaves);

    if (result.size === 1) {
      const first = result.first();

      if (!first.marks || first.marks.size === 0) {
        if (first.text === "") {
          return this.set("leaves", List()) as Text;
        }
      }
    }

    return this.set("leaves", Leaf.createLeaves(leaves)) as Text;
  }

  /**
   * Get an object mapping all the keys in the node to their paths.
   *
   * @return {Object}
   */
  getKeysToPathsTable() {
    return {
      [this.key]: []
    };
  }
}

Text.prototype[MODEL_TYPES.TEXT] = true;

memoize(Text.prototype, [
  "getActiveMarks",
  "getMarks",
  "getMarksAsArray",
  "validate",
  "getText",
  "getKeysToPathsTable"
]);

export default Text;
