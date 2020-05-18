import isPlainObject from "is-plain-object";
import { List, Map, Record, Stack, OrderedSet } from "immutable";

import MODEL_TYPES from "../constants/model-types";
import Key from "../utils/key-utils";
import Block from "./block";
import Inline from "./inline";
import Text from "./text";
import Data from "./data";
import Node from "./node";
import mixin from "../utils/mixin";
import NodeInterface from "../interfaces/node";
import { Path, Mark, Decoration, Point, Schema, Change } from "..";
import Selection from "./selection";
import Range from "./range";
// 默认值
const DEFAULTS: any = {
  data: Map(),
  key: void 0,
  nodes: List(),
};

class Document extends Record(DEFAULTS) implements NodeInterface {
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

  // Get a fragment of the node at a `range`.
  getFragmentAtRange(range: Range): Document {
    if (range.isUnset) {
      return Document.create();
    }

    const { start, end } = range;
    let node = this;
    let targetPath = end.path;
    let targetPosition = end.offset;
    let mode = "end";

    while (targetPath.size) {
      const index = targetPath.last();

      node = node.splitNode(targetPath, targetPosition);
      targetPosition = index + 1;
      targetPath = Path.lift(targetPath);

      if (!targetPath.size && mode === "end") {
        targetPath = start.path;
        targetPosition = start.offset;
        mode = "start";
      }
    }

    const startIndex = start.path.first() + 1;
    const endIndex = end.path.first() + 2;

    const nodes = node.nodes.slice(startIndex, endIndex);
    const fragment = Document.create({ nodes });
    return fragment;
  }

  // 节点通用方法
  text: string;
  addMark(path: Path, offset: number, length: number, mark: Mark): this;
  createDecoration(properties: any | Decoration): Decoration;
  createPoint(properties: any | Point): Point;
  createRange(properties: any | Range): Range;
  craeteSelection(properties: any | Selection): Selection;
  filterDescendants(
    iterator: Function,
    path: Path
  ): List<[NodeInterface, List<number>]>;
  findDescendant(iterator: Function, path?: Path): any | null;
  forEachDescendant(iterator: Function, path?: Path): boolean;
  getActiveMarksAtRange(range: Selection): Set<Mark>;
  getAncestors(path: Path): List<[NodeInterface, Path]>;
  getBlocks(): [NodeInterface, Path][];
  getBlocksAsArray(path?: Path): [NodeInterface, Path][];
  getBlocksAtRange(range: Range): List<[NodeInterface, Path]>;
  getBlocksAtRangeAsArray(range: Range): [NodeInterface, Path][];
  getBlocksByType(type: string): List<[NodeInterface, Path]>;
  getBlocksByTypeAsArray(type: string, path?: Path): [NodeInterface, Path][];
  getChild(path: Path): NodeInterface;
  getClosest(path: Path, iterator: Function): [NodeInterface, Path] | null;
  getClosestBlock(path: Path): [NodeInterface, Path] | null;
  getClosestInline(path: Path | Key): [NodeInterface, Path] | null;
  getClosestVoid(path: Path, schema: Schema): [NodeInterface, Path] | null;
  getCommonAncestor(a: Path, b: Path): [NodeInterface, Path];
  getDecorations(stack: Stack): List<Decoration>;
  getDepth(path: Path, startAt?: number): number | null;
  getDescendant(path: Path): NodeInterface | null;
  getFirstText(path?: Path): [Text, Path] | null;
  getFurthest(path: Path, iterator: Function): NodeInterface | null;
  getFurthestAncestor(path: Path): NodeInterface | null;
  getFurthestBlock(path: Path): NodeInterface | null;
  getFurthestInline(path: Path): NodeInterface | null;
  getFurthestOnlyChildAncestor(path: Path): NodeInterface | null;
  getInlines(): List<[NodeInterface, Path]>;
  getInlinesAsArray(path?: Path): [NodeInterface, Path][];
  getInlinesAtRange(range: Range): List<NodeInterface>;
  getInlinesAtRangeAsArray(range: Range): [NodeInterface, Path][];
  getInlinesByType(type: string): List<[NodeInterface, Path]>;
  getInlinesByTypeAsArray(type: string): [NodeInterface, Path][];
  getInsertMarksAtRange(range: Range): Set<Mark>;
  getLastText(path?: Path): [Text, Path] | null;
  getMarks(): Set<Mark>;
  getMarksAsArray(): Mark[];
  getMarksAtPosition(path: Path, offset: number): Set<Mark>;
  getMarksAtRange(range: Range): Set<Mark>;
  getMarksByType(type: string): Set<Mark>;
  getMarksByTypeAsArray(type: string): Mark[];
  getNextBlock(path: Path): [NodeInterface, Path] | null;
  getNextNode(path: Path): [NodeInterface, Path] | null;
  getNextSibling(path: Path): [NodeInterface, Path] | null;
  getNextText(path: Path): [NodeInterface, Path] | null;
  getNode(path: Path): NodeInterface | null;
  getOffset(change: Change, path: Path, targetPath: Path): number;
  getOffsetAtRange(range: Range): number;
  getOrderedMarks(): OrderedSet<Mark>;
  getOrderedMarksAtRange(range: Range): OrderedSet<Mark>;
  getOrderedMarksBetweenPositions(
    startPath: Path,
    startOffset: number,
    endPath: Path,
    endOffset: number
  ): OrderedSet<Mark>;
  getOrderedMarksByType(type: string): OrderedSet<Mark>;
  getParent(path: Path): [NodeInterface, Path] | null;
  getPath(key: Key | Path): Path;
  getPreviousBlock(path: Path): [NodeInterface, Path] | null;
  getPreviousNode(path: Path): [NodeInterface, Path] | null;
  getPreviousSibling(path: Path): NodeInterface | null;
  getPreviousText(path: Path): [Text, Path] | null;
  getSelectionIndexes(range: Range, isSelected?: boolean): any | null;
  getText(): string;
  getTextAtOffset(offset: number): Text | null;
  getTextDirection(): string;
  getTexts(): List<Text>;
  getTextsAsArray(path?: Path): [Text, Path][];
  getTextsAtRange(range: Range): List<[Text, Path]>;
  getTextsAtRangeAsArray(range: Range): [Text, Path][];
  getTextsBetweenPositionsAsArray(
    startPath: Path,
    endPath: Path
  ): [Text, Path][];
  hasBlockChildren(): boolean;
  hasChild(path: Path): boolean;
  hasInlineChildren(): boolean;
  hasDescendant(path: Path): boolean;
  hasNode(path: Path): boolean;
  hasVoidParent(path: Path, schema: Schema): boolean;
  insertNode(path: Path, node: NodeInterface): NodeInterface;
  insertText(
    path: Path,
    offset: number,
    text: string,
    marks: Set<Mark>
  ): NodeInterface;
  isLeafBlock(): boolean;
  isLeafInline(): boolean;
  mapChildren(iterator: Function): NodeInterface;
  mapDescendants(iterator: Function): NodeInterface;
  mergeNode(path: Path): NodeInterface;
  moveNode(path: Path, newPath: Path, newIndex?: number): NodeInterface;
  normalize(schema: Schema): any;
  refindNode(path: Path, key: Key): NodeInterface | null;
  refindPath(path: Path | string, key: Key): NodeInterface | null;
  regenerateKey(): NodeInterface;
  removeMark(
    path: Path,
    offset: number,
    length: number,
    mark: Mark
  ): NodeInterface;
  removeNode(path: Path): NodeInterface;
  removeText(path: Path, offset: number, text: string): NodeInterface;
  replaceNode(path: Path, node: NodeInterface): NodeInterface;
  resolveDecoration(decoration: Decoration | any): Decoration;
  resolvePath(path: Path, index?: number): Path;
  resolvePoint(point: Point | any): Point;
  resolveRange(range: Range | any): Range;
  resolveSelection(selection: Selection | any): Selection;
  setNode(path: Path, properties: any): NodeInterface;
  setMark(
    path: Path,
    offset: number,
    length: number,
    mark: Mark,
    properties: any
  ): NodeInterface;
  splitNode(path: Path, position: number, properties?: any): NodeInterface;
  validate(schema: Schema): Error | void;
}

Document.prototype[MODEL_TYPES.DOCUMENT] = true;

mixin(NodeInterface, [Document]);

export default Document;
