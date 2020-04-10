import isPlainObject from "is-plain-object";
import { List, Map, Record } from "immutable";

import Key from "../utils/key-utils";
import Inline from "./inline";
import Text from "./text";
import MODEL_TYPES from "../constants/model-types";
import Node from "./node";
// import Mark from "./mark";

/**
 * 默认属性
 */
const DEFAULTS = {
  data: Map(),
  isVoid: false,
  key: void 0,
  nodes: List(),
  type: void 0,
};

/**
 * Block
 * @type {Block}
 */
class Block extends Record(DEFAULTS) {
  // 属性
  public key: string;
  public type: string;
  public data: Map<any, any>;
  public nodes: List<Block & Inline & Text>;

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

    throw new Error(
      `\`Block.create\` only accepts objects, strings or blocks, but you passed it: ${attrs}`
    );
  }

  static createList(elements: Array<any> | List<any>): List<Block> {
    if (!elements) {
      elements = List();
    }
    if (Array.isArray(elements)) {
      elements = List(elements);
    }
    if (List.isList(elements)) {
      const list: List<Block> = List(elements.map(Block.create));
      return list;
    }

    throw new Error(
      `\`Block.createList\` only accepts arrays or lists, but you passed it: ${elements}`
    );
  }

  static fromJSON(obj: any): Block {
    if (Block.isBlock(obj)) {
      return obj;
    }

    const {
      data = {},
      isVoid = false,
      key = Key.create(),
      nodes = [],
      type,
    } = obj;

    if (typeof type !== "string") {
      throw new Error("`Block.fromJSON` requires a `type` string.");
    }

    const block = new Block({
      key,
      type,
      isVoid: !!isVoid,
      data: Map(data),
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
    return (
      List.isList(elements) &&
      elements.every((item: any) => Block.isBlock(item))
    );
  }

  static createChildren: (nodes) => List<any>;

  // 计算属性
  get object(): "block" {
    return "block";
  }

  // 成员方法
  toJSON(options: any = {}): any {
    const object: any = {
      object: this.object,
      type: this.type,
      isVoid: this.get("isVoid"),
      data: (this.data as any).toJSON(),
      nodes: this.nodes.toArray().map((n) => n.toJSON(options)),
    };

    if (options.preserveKeys) {
      object.key = this.key;
    }

    return object;
  }

  isEmpty() {
    return (
      !this.get("isVoid") &&
      !this.nodes.some((child: Block & Text & Inline) => !child.isEmpty)
    );
  }

  //
  addMark;
  createPoint;
  createRange;
  filterDescendants;
  findDescendant;
  forEachDescendant;
  getActiveMarksAtRange;
  getAncestors;
  getBlocks;
  getBlocksAsArray;
  getBlocksAtRange;
  getBlocksAtRangeAsArray;
  getBlocksByType;
  getBlocksByTypeAsArray;
  getChild;
  getClosest;
  getClosestBlock;
  getClosestInline;
  getClosestVoid;
  getCommonAncestor;
  getDecorations;
  getDepth;
  getDescendant;
  getFirstInvalidDescendant;
  getFirstText;
  getFragmentAtRange;
  getFurthest;
  getFurthestAncestor;
  getFurthestBlock;
  getFurthestInline;
  getFurthestOnlyChildAncestor;
  getInlines;
  getInlinesAsArray;
  getInlinesAtRange;
  getInlinesAtRangeAsArray;
  getInlinesByType;
  getInlinesByTypeAsArray;
  getInsertMarksAtRange;
  getKeysToPathsTable;
  getLastText;
  getMarks;
  getMarksAsArray;
  getMarksAtPosition;
  getMarksAtRange;
  getMarksByType;
  getMarksByTypeAsArray;
  getNextBlock;
  getNextNode;
  getNextSibling;
  getNextText;
  getNode;
  getOffset;
  getOffsetAtRange;
  getOrderedMarks;
  getOrderedMarksAtRange;
  getOrderedMarksBetweenPositions;
  getOrderedMarksByType;
  getParent;
  getPath;
  getPreviousBlock;
  getPreviousNode;
  getPreviousSibling;
  getPreviousText;
  getSelectionIndexes;
  getText;
  getTextAtOffset;
  getTextDirection;
  getTexts;
  getTextsAsArray;
  getTextsAtRange;
  getTextsAtRangeAsArray;
  getTextsBetweenPositionsAsArray;
  hasBlockChildren;
  hasChild;
  hasInlineChildren;
  hasDescendant;
  hasNode;
  hasVoidParent;
  insertNode;
  insertText;
  isLeafBlock;
  isLeafInline;
  mapChildren;
  mapDescendants;
  mergeNode;
  moveNode;
  normalize;
  refindNode;
  refindPath;
  regenerateKey;
  removeMark;
  removeNode;
  removeText;
  replaceNode;
  resolvePath;
  resolvePoint;
  resolveRange;
  setNode;
  setMark;
  splitNode;
  validate;
  getNodeAtPath;
  getDescendantAtPath;
  getKeys;
  getKeysAsArray;
  areDescendantsSorted;
  isInRange;
  assertChild;
  assertDepth;
  assertDescendant;
  assertNode;
  assertParent;
  assertPath;
}

Block.prototype[MODEL_TYPES.BLOCK] = true;

export default Block;
