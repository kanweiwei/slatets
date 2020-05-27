import {
  drop,
  findLast,
  first,
  isArray,
  isEqual,
  isPlainObject,
  remove,
  take,
  uniqWith,
} from "lodash-es";
import MODEL_TYPES from "../constants/model-types";
import Mark from "./mark";

class Leaf {
  /**
   * 属性
   */
  public marks: Mark[];
  public text: string;

  constructor(obj: { marks: any[]; text: string }) {
    const { marks = [], text = "" } = obj;
    this.marks = Mark.createSet(marks.map(Mark.create));
    this.text = text;
  }

  /**
   * 静态方法
   */
  static create(
    attrs: Leaf | { text?: string; marks?: any } | string = {}
  ): Leaf {
    if (attrs instanceof Leaf) {
      return attrs;
    }

    if (typeof attrs == "string") {
      attrs = { text: attrs };
    }

    if (isPlainObject(attrs)) {
      return Leaf.fromJSON(attrs);
    }

    throw new Error(
      `\`Leaf.create\` only accepts objects, strings or leaves, but you passed it: ${attrs}`
    );
  }

  // 重新处理一遍叶节点，相邻的 `Leaf` 有相同的 marks 则合并这两个 `Leaf` 节点
  static createLeaves(leaves: Leaf[]): Leaf[] {
    if (leaves.length <= 1) return leaves;

    let invalid = false;

    // TODO: we can make this faster with [List] and then flatten
    const tmpLeaves: Leaf[] = [];
    findLast(leaves, (leaf: Leaf) => {
      const firstLeaf = first(tmpLeaves);
      if (firstLeaf) {
        if (isEqual(firstLeaf.marks, leaf.marks)) {
          invalid = true;
          firstLeaf.text = `${leaf.text}${firstLeaf.text}`;
          return;
        }
        if (firstLeaf.text === "") {
          invalid = true;
          tmpLeaves[0] = leaf;
          return;
        }
        if (leaf.text === "") {
          invalid = true;
          return;
        }
      }

      tmpLeaves.unshift(leaf);
    });

    if (!invalid) return leaves;
    return tmpLeaves;
  }

  // 从指定的文字位置分割
  static splitLeaves(leaves: Leaf[], offset: number): Leaf[][] {
    if (offset < 0) return [[], leaves];

    if (leaves.length === 0) {
      return [[], []];
    }

    let endOffset = 0;
    let index = -1;
    let left, right;

    leaves.find((leaf: Leaf) => {
      index++;
      const startOffset = endOffset;
      const { text } = leaf;
      endOffset += text.length;

      if (endOffset < offset) return false;
      if (startOffset > offset) return false;

      const length = offset - startOffset;
      left = new Leaf(leaf.toJSON());
      right = new Leaf(leaf.toJSON());
      left.text = text.slice(0, length);
      right.text = text.slice(length);
      return true;
    });

    if (!left) return [leaves, []];

    if (left.text === "") {
      if (index === 0) {
        return [[left], leaves];
      }

      return [take(leaves, index), drop(leaves, index)];
    }

    if (right.text === "") {
      if (index === leaves.length - 1) {
        return [leaves, [right]];
      }

      return [take(leaves, index + 1), drop(leaves, index + 1)];
    }
    const leftLeaves: Array<Leaf> = take(leaves, index);
    leftLeaves.push(left);

    const rightLeaves: Array<Leaf> = drop(leaves, index + 1);
    rightLeaves.unshift(right);

    return [leftLeaves, rightLeaves];
  }

  static createList(elements: any[] = []): Leaf[] {
    if (Array.isArray(elements)) {
      return elements.map(Leaf.create);
    }

    throw new Error(
      `\`Leaf.createList\` only accepts arrays or lists, but you passed it: ${elements}`
    );
  }

  static fromJSON(object: { text?: string; marks?: any[] }): Leaf {
    const { text = "", marks = [] } = object;

    const leaf = new Leaf({
      text,
      marks,
    });

    return leaf;
  }

  static isLeaf(obj: any) {
    return !!(obj && obj[MODEL_TYPES.LEAF]);
  }

  static isLeafList(any): boolean {
    return isArray(any) && any.every((item) => Leaf.isLeaf(item));
  }

  get object() {
    return "leaf";
  }

  updateMark(mark: Mark, newMark: Mark): this {
    const marks = this.marks.slice();
    if (isEqual(mark, newMark)) return this;
    if (!marks.some((m) => isEqual(m, mark))) return this;
    remove(marks, (m: Mark) => {
      if (isEqual(m, mark)) return true;
      return false;
    });
    marks.push(newMark);
    this.marks = marks;

    return this;
  }

  addMark(mark: Mark) {
    const marks = this.marks.slice();
    marks.push(mark);
    this.marks = uniqWith(marks, isEqual);
    return this;
  }

  // Add a `set` of marks to the leaf.
  addMarks(set: Mark[]) {
    let marks = this.marks.slice();
    marks = marks.concat(set);
    this.marks = uniqWith(marks, isEqual);
    return this;
  }

  removeMark(mark: Mark) {
    const marks = this.marks.slice();
    remove(marks, (m) => {
      if (isEqual(m, mark)) {
        return true;
      }
      return false;
    });
    this.marks = marks;
    return this;
  }

  toJSON() {
    const object = {
      object: this.object,
      text: this.text,
      marks: this.marks.map((m) => m.toJSON()),
    };

    return object;
  }
}

Leaf.prototype[MODEL_TYPES.LEAF] = true;

export default Leaf;
