import { Set } from "immutable";
import {
  first,
  flatten,
  intersectionWith,
  isArray,
  isEqual,
  isEqualWith,
  isPlainObject,
  keys,
  uniqWith,
} from "lodash-es";
import MODEL_TYPES from "../constants/model-types";
import Key from "../utils/key-utils";
import memoize from "../utils/memoize";
import Data from "./data";
import Leaf from "./leaf";
import Mark from "./mark";
import Schema from "./schema";

class Text {
  leaves: Leaf[];
  key: Key;

  constructor(obj: { key?: Key; leaves?: any[] }) {
    this.key = obj.key ?? Key.create();
    this.leaves = (obj?.leaves ?? []).map(Leaf.create);
  }
  /**
   * 静态方法
   */
  static create(
    attrs:
      | Text
      | {
          text?: string;
          key?: Key;
          marks?: any[];
          leaves?: { text?: string; marks?: any[] }[];
        }
      | string = ""
  ): Text {
    if (attrs instanceof Text) {
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
    if (Array.isArray(elements)) {
      return elements.map(Text.create);
    }

    throw new Error(
      `\`Text.createList\` only accepts arrays, but you passed it: ${elements}`
    );
  }

  static fromJSON(object): Text {
    const { key = Key.create() } = object;
    let { leaves = [] } = object;

    const node = new Text({
      leaves,
      key,
    });

    return node;
  }

  static isText(obj) {
    return !!(obj && obj[MODEL_TYPES.TEXT]);
  }

  // 判断是否是多个 `Text` 节点组成的 `List`
  static isTextList(any) {
    return isArray(any) && any.every((item) => Text.isText(item));
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

  // 当前节点的文本内容是否为空
  isEmpty() {
    return this.text === "";
  }

  // 根据文字的位置获取所在 `leaf` 节点信息
  searchLeafAtOffset(offset: number) {
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
      startOffset,
    };
  }

  addMark(index: number, length: number, mark: Mark) {
    const marks = [mark];
    return this.addMarks(index, length, marks);
  }

  addMarks(index: number, length: number, set: Mark[]) {
    if (this.text === "" && length === 0 && index === 0) {
      const { leaves } = this;
      const f = first(leaves);

      if (!f) {
        this.leaves = [Leaf.fromJSON({ text: "", marks: set })];
        return this;
      }

      const newFirst = f.addMarks(set);
      if (newFirst === f) return this;
      this.leaves = [newFirst];
      return this;
    }

    if (this.text === "") return this;
    if (length === 0) return this;
    if (index >= this.text.length) return this;

    const [before, bundle] = Leaf.splitLeaves(this.leaves, index);
    const [middle, after] = Leaf.splitLeaves(bundle, length);
    const leaves = before.concat(
      middle.map((x: Leaf) => x.addMarks(set)),
      after
    );
    this.leaves = leaves;
    return this;
  }

  getLeaves(decorations = []) {
    let { leaves } = this;
    if (leaves.length === 0) return [Leaf.create({})];
    if (!decorations || decorations.length === 0) return leaves;
    if (this.text.length === 0) return leaves;
    const { key } = this;

    decorations.forEach((dec: any) => {
      const { start, end, mark } = dec;
      const hasStart = isEqual(start.key, key);
      const hasEnd = isEqual(end.key, key);

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
          );
          return;
        }
      }

      leaves = leaves.map((x: Leaf) => x.addMark(mark));
    });

    if (leaves === this.leaves) return leaves;
    return Leaf.createLeaves(leaves);
  }

  getActiveMarksBetweenOffsets(startOffset: number, endOffset: number) {
    if (startOffset <= 0 && endOffset >= this.text.length) {
      return this.getActiveMarks();
    }

    if (startOffset >= endOffset) return [];
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

      result = intersectionWith(result, leaf.marks, isEqual);
      if (result && result.length === 0) return false;
      return false;
    });

    return result || Set();
  }

  getActiveMarks() {
    if (this.leaves.length === 0) return [];

    const firstLeaf = first(this.leaves);
    if (!firstLeaf) {
      return [];
    }

    const result = firstLeaf.marks;
    if (result.length === 0) return result;
    let tmp = result;
    const res = this.leaves.find((l) => {
      tmp = intersectionWith(tmp, l.marks, isEqual);
      if (tmp.length === 0) {
        return true;
      }
      return false;
    });
    if (res) {
      return [];
    }
    return tmp;
  }

  getFirstText() {
    return this;
  }

  getLastText() {
    return this;
  }

  getMarksBetweenOffsets(startOffset: number, endOffset: number) {
    if (startOffset <= 0 && endOffset >= this.text.length) {
      return this.getMarks();
    }

    if (startOffset >= endOffset) return Set();
    if (this.text === "") return this.getActiveMarks();

    let result: any = null;
    let leafEnd = 0;

    this.leaves.find((leaf: Leaf): any => {
      const leafStart = leafEnd;
      leafEnd = leafStart + leaf.text.length;

      if (leafEnd <= startOffset) return;
      if (leafStart >= endOffset) return true;

      if (!result) {
        result = leaf.marks;
        return;
      }

      result = uniqWith(result.concat(leaf.marks), isEqual);
    });

    return result || [];
  }

  getMarks() {
    const array = this.getMarksAsArray();
    return uniqWith(array, isEqual);
  }

  getMarksAsArray() {
    return flatten(this.leaves.map((l) => l.marks));
  }

  getMarksAtIndex(index: number) {
    const { leaf } = this.searchLeafAtOffset(index);
    if (!leaf) return [];
    return leaf.marks;
  }

  getNode(key: Key) {
    return isEqual(this.key, key) ? this : null;
  }

  hasNode(key: Key) {
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
      this.leaves = [Leaf.create({ text, marks })];
      return this;
    }

    if (text.length === 0) return this;
    if (!marks) marks = Set();

    const { startOffset, leaf, index } = this.searchLeafAtOffset(offset);
    if (!leaf) return this;
    const delta = offset - startOffset;
    const beforeText = leaf.text.slice(0, delta);
    const afterText = leaf.text.slice(delta);
    const { leaves } = this;

    if (isEqualWith(leaf.marks, marks, isEqual)) {
      this.leaves[index].text = beforeText + text + afterText;
      return this;
    }

    const leafObj = leaf.toJSON();
    const left = Leaf.create(leafObj);
    const right = Leaf.create(leafObj);
    left.text = beforeText;
    right.text = afterText;

    const nextLeaves = leaves.splice(
      index,
      1,
      left,
      Leaf.create({ text, marks }),
      right
    );
    this.leaves = nextLeaves;
    return this;
  }

  regenerateKey(): Text {
    this.key = Key.create();
    return this;
  }

  /**
   * Remove a `mark` at `index` and `length`.
   */
  removeMark(index: number, length: number, mark: Mark): Text {
    if (this.text === "" && index === 0 && length === 0) {
      const f = first(this.leaves);
      if (!f) return this;
      const newFirst = f.removeMark(mark);
      if (newFirst === f) return this;
      this.leaves = [newFirst];
      return this;
    }

    if (length <= 0) return this;
    if (index >= this.text.length) return this;
    const [before, bundle] = Leaf.splitLeaves(this.leaves, index);
    const [middle, after] = Leaf.splitLeaves(bundle, length);
    const leaves = before.concat(
      middle.map((x: Leaf) => x.removeMark(mark)),
      after
    );
    this.leaves = leaves;
    return this;
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
          this.leaves.splice(index, 1);
          return this;
        }

        const beforeText = leaf.text.slice(0, offset);
        const afterText = leaf.text.slice(offset + length);
        const text = beforeText + afterText;

        if (text.length > 0) {
          this.leaves[index].text = text;
          return this;
        }
      }
    }

    const [before, bundle] = Leaf.splitLeaves(this.leaves, start);
    const after = Leaf.splitLeaves(bundle, length)[1];
    const leaves = Leaf.createLeaves(before.concat(after));

    if (leaves.length === 1) {
      const f = first(leaves)!;

      if (f.text === "") {
        f.marks = this.getActiveMarks();
        this.leaves = [f];
        return this;
      }
    }
    this.leaves = leaves;
    return this;
  }

  // Return a JSON representation of the text.
  toJSON(
    options: any = {}
  ): {
    object: "text";
    leaves: any;
  } {
    const object: any = {
      object: this.object,
      leaves: this.getLeaves().map((r) => r.toJSON()),
    };

    if (options.preserveKeys) {
      object.key = this.key;
    }

    return object;
  }

  // Update a `mark` at `index` and `length` with `properties`.
  updateMark(
    index: number,
    length: number,
    mark: Mark,
    properties: Mark | { type?: string; data?: Data }
  ): Text {
    const newMark = Mark.create(mark.toJSON());
    keys(properties).map((key) => {
      newMark[key] = properties[key];
    });

    if (this.text === "" && length === 0 && index === 0) {
      const { leaves } = this;
      const f = first(leaves);
      if (!f) return this;
      const newFirst = f.updateMark(mark, newMark);
      this.leaves = [newFirst];
      return this;
    }

    if (length <= 0) return this;
    if (index >= this.text.length) return this;

    const [before, bundle] = Leaf.splitLeaves(this.leaves, index);
    const [middle, after] = Leaf.splitLeaves(bundle, length);

    const leaves = before.concat(
      middle.map((x: Leaf) => x.updateMark(mark, newMark)),
      after
    );
    this.leaves = leaves;
    return this;
  }

  // Split this text and return two different texts
  splitText(offset: number): Text[] {
    const splitted = Leaf.splitLeaves(this.leaves, offset);
    const textObj = this.toJSON();
    const one = Text.create(textObj);
    const two = Text.create(textObj);
    one.leaves = splitted[0];
    two.leaves = splitted[1];
    return [one, two];
  }

  // merge this text and another text at the end
  mergeText(text: Text): Text {
    const leaves = this.leaves.concat(text.leaves);
    this.leaves = leaves;
    return this;
  }

  // Normalize the text node with a `schema`.
  normalize(schema: Schema): any {
    return schema.normalizeNode(this);
  }

  // Validate the text node against a `schema`.
  validate(schema: Schema): any {
    return schema.validateNode(this);
  }

  // Get the first invalid descendant. PERF: Do not cache this method; because it can cause cycle reference
  getFirstInvalidNode(schema: Schema): Text | null {
    return this.validate(schema) ? this : null;
  }

  // Set leaves with normalized `leaves`
  setLeaves(leaves: Leaf[]): Text {
    const result = Leaf.createLeaves(leaves);

    if (result.length === 1) {
      const f = first(result)!;

      if (!f.marks || f.marks.length === 0) {
        if (f.text === "") {
          this.leaves = [];
          return this;
        }
      }
    }
    this.leaves = Leaf.createLeaves(leaves);
    return this;
  }
}

Text.prototype[MODEL_TYPES.TEXT] = true;

memoize(Text.prototype, [
  "getActiveMarks",
  "getMarks",
  "getMarksAsArray",
  "validate",
  "getText",
]);

export default Text;
