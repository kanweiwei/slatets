import isPlainObject from "is-plain-object";

import Key from "../utils/key-utils";
import Text from "./text";
import MODEL_TYPES from "../constants/model-types";
import Node from "./node";

import NodeInterface from "../interfaces/baseNode";
import mixin from "../utils/mixin";
import BaseNode from "../interfaces/baseNode";
import Data from "./data";
// import Mark from "./mark";

/**
 * Block
 * @type {Block}
 */
class Block extends BaseNode {
  // 计算属性
  get object(): "block" {
    return "block";
  }

  constructor(data: { key: Key; type: string; isVoid: boolean; nodes: Array<BaseNode | Text>; data: Data; parent?: BaseNode }) {
    super(data);
    this.key = data.key;
    this.type = data.type;
    this.nodes = data.nodes;
    this.isVoid = data.isVoid;
    this.parent = data.parent;
  }

  // 静态方法
  static create(attrs: any | string | Block = {}): Block {
    if (Block.isBlock(attrs)) {
      return attrs;
    }

    if (typeof attrs === "string") {
      attrs = { type: attrs };
    }
    if (isPlainObject(attrs)) {
      return Block.fromJSON(attrs);
    }

    throw new Error(`\`Block.create\` only accepts objects, strings or blocks, but you passed it: ${attrs}`);
  }

  static createList(elements: Array<any>): Array<Block> {
    if (!elements) {
      elements = [];
    }
    if (Array.isArray(elements)) {
      const list = elements.map(Block.create);
      return list;
    }

    throw new Error(`\`Block.createList\` only accepts arrays, but you passed it: ${elements}`);
  }

  static fromJSON(obj: any): Block {
    if (Block.isBlock(obj)) {
      return obj;
    }

    const { data = {}, isVoid = false, key = Key.create(), nodes = [], type } = obj;

    if (typeof type !== "string") {
      throw new Error("`Block.fromJSON` requires a `type` string.");
    }

    const block = new Block({
      key,
      type,
      isVoid: !!isVoid,
      data: Data.create(data),
      nodes: Node.createList(nodes),
    });
    return block;
  }

  static isBlock(obj: any) {
    return !!(obj && obj[MODEL_TYPES.BLOCK]);
  }
  /**
   * 确认参数any是否是一个block组成的list
   */
  static isBlockList(elements: any) {
    return Array.isArray(elements) && elements.every((item: any) => Block.isBlock(item));
  }

  // 成员方法
  toJSON(options: any = {}): any {
    const object: any = {
      object: this.object,
      type: this.type,
      isVoid: this.isVoid,
      data: this.data.toJSON(),
      nodes: this.nodes.map((n) => n.toJSON(options)),
    };

    if (options.preserveKeys) {
      object.key = this.key;
    }

    return object;
  }
}

Block.prototype[MODEL_TYPES.BLOCK] = true;

mixin(NodeInterface, [Block]);
export default Block;
