import isPlainObject from "is-plain-object";
import { List, Map, Record } from "immutable";

import MODEL_TYPES from "../constants/model-types";
import KeyUtils from "../utils/key-utils";
import Node from "./node";
/**
 * 默认属性
 */
const DEFAULTS = {
  data: Map(),
  isVoid: false,
  key: void 0,
  nodes: List(),
  type: void 0
};

/**
 * Inline
 * @type {Inline}
 */
class Inline extends Record(DEFAULTS) {
  public key: string;
  public type: string;
  public data: Map<any, any>;
  public nodes: List<any>;

  static create(properties: any = {}): Inline {
    if (Inline.isInline(properties)) {
      return properties;
    }

    if (typeof properties == "string") {
      properties = { type: properties };
    }

    if (isPlainObject(properties)) {
      return Inline.fromJSON(properties);
    }

    throw new Error(
      `\`Inline.create\` only accepts objects, strings or inlines, but you passed it: ${properties}`
    );
  }

  static createList(elements: Array<any> | List<any>): List<Inline> {
    if (!elements) {
      elements = List();
    }
    if (Array.isArray(elements)) {
      elements = List(elements);
    }
    if (List.isList(elements)) {
      const list: List<Inline> = List(elements.map(Inline.create));
      return list;
    }

    throw new Error(
      `\`Inline.createList\` only accepts arrays or lists, but you passed it: ${elements}`
    );
  }

  static fromJSON(obj: any) {
    if (Inline.isInline(obj)) {
      return obj;
    }

    const {
      data = {},
      isVoid = false,
      key = KeyUtils.create(),
      nodes = [],
      type
    } = obj;

    if (typeof type != "string") {
      throw new Error("`Inline.fromJS` requires a `type` string.");
    }

    const inline = new Inline({
      key,
      type,
      isVoid: !!isVoid,
      data: Map(data),
      nodes: Node.createList(nodes)
    });

    return inline;
  }

  static isInline(obj) {
    return !!(obj && obj[MODEL_TYPES.INLINE]);
  }

  static isInlineList(any) {
    return List.isList(any) && any.every(item => Inline.isInline(item));
  }

  static createChildren: (nodes) => List<any>;

  // 计算属性
  get object(): "inline" {
    return "inline";
  }

  // 成员方法
  toJSON(options: any = {}): any {
    const object: any = {
      object: this.object,
      type: this.type,
      isVoid: this.get("isVoid"),
      data: (this.data as any).toJSON(),
      nodes: this.nodes.toArray().map((n: any) => n.toJSON(options))
    };

    if (options.preserveKeys) {
      object.key = this.key;
    }

    return object;
  }

  // 节点通用方法
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

Inline.prototype[MODEL_TYPES.INLINE] = true;

export default Inline;
