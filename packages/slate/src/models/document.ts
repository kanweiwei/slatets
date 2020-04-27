import isPlainObject from "is-plain-object";
import { List, Map, Record } from "immutable";

import MODEL_TYPES from "../constants/model-types";
import Key from "../utils/key-utils";
import Block from "./block";
import Inline from "./inline";
import Text from "./text";
import Data from "./data";
import Node from "./node";
// 默认值
const DEFAULTS: any = {
  data: Map(),
  key: void 0,
  nodes: List(),
};

class Document extends Record(DEFAULTS) {
  // 属性
  public key: string;
  public data: Data;
  public nodes: List<Block & Inline & Text>;

  // 静态方法
  static create(attrs: any = {}) {
    if (Document.isDocument(attrs)) {
      return attrs;
    }

    if (List.isList(attrs) || Array.isArray(attrs)) {
      attrs = { nodes: attrs };
    }

    if (isPlainObject(attrs)) {
      return Document.fromJSON(attrs);
    }

    throw new Error(
      `\`Document.create\` only accepts objects, arrays, lists or documents, but you passed it: ${attrs}`
    );
  }

  static fromJSON(object: any) {
    if (Document.isDocument(object)) {
      return object;
    }

    const { data = {}, key = Key.create(), nodes = [] } = object;

    const document = new Document({
      key,
      data: Map(data),
      nodes: Node.createList(nodes),
    });

    return document;
  }

  static isDocument(obj) {
    return !!(obj && obj[MODEL_TYPES.DOCUMENT]);
  }

  static createChildren: (nodes) => List<any>;

  // 计算属性
  get object(): "document" {
    return "document";
  }

  toJSON(options: any = {}) {
    const object: any = {
      object: this.object,
      data: (this.data as any).toJSON(),
      nodes: this.nodes.toArray().map((n) => n.toJSON(options)),
    };

    if (options.preserveKeys) {
      object.key = this.key;
    }

    return object;
  }

  /**
   * 节点通用方法
   */
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

Document.prototype[MODEL_TYPES.DOCUMENT] = true;

export default Document;
