// @ts-nocheck
import direction from "direction";
import logger from "slate-dev-logger";
import { List, OrderedSet, Set } from "immutable";

import mixin from "../utils/mixin";
import Block from "../models/block";
import Decoration from "../models/decoration";
import Document from "../models/document";
import Inline from "../models/inline";
import Key from "../utils/key-utils";
import memoize from "../utils/memoize";
import PathUtils from "../utils/path-utils";
import Point from "../models/point";
import Range from "../models/range";
import Selection from "../models/selection";
import Key from "../utils/key-utils";
import { isEqual } from "lodash-es";
import Node from "../models/node";
import {
  NODE_TO_PARENT,
  NODE_TO_INDEX,
  KEY_TO_ELEMENT,
  ELEMENT_TO_NODE,
  KEY_TO_NODE,
  NODE_TO_KEY,
} from "../utils/weak-maps";
import Mark from "../models/mark";
import Schema from "../models/schema";

/**
 * The interface that `Document`, `Block` and `Inline` all implement, to make
 * working with the recursive node tree easier.
 *
 * @type {Class}
 */
class NodeInterface {
  // Get the concatenated text of all the block's children.
  get text(): string {
    return this.getText();
  }

  // Add mark to text at `offset` and `length` in node by `path`.
  addMark(
    path: List<number> | Key,
    offset: number,
    length: number,
    mark: Mark
  ): NodeInterface {
    let node = this.getDescendant(path);

    path = this.resolvePath(path);
    node = node.addMark(offset, length, mark);
    const ret = this.replaceNode(path, node);
    return ret;
  }

  // Create a decoration with `properties` relative to the node.
  createDecoration(properties: any | Decoration): Decoration {
    properties = Decoration.createProperties(properties);
    const decoration = this.resolveDecoration(properties);
    return decoration;
  }

  // Create a point with `properties` relative to the node.
  createPoint(properties: any | Point): Point {
    properties = Point.createProperties(properties);
    const point = this.resolvePoint(properties);
    return point;
  }

  // Create a range with `properties` relative to the node.
  createRange(properties: any | Range): Range {
    properties = Range.createProperties(properties);
    const range = this.resolveRange(properties);
    return range;
  }

  // Create a selection with `properties` relative to the node.
  createSelection(properties: any | Selection): Selection {
    properties = Selection.createProperties(properties);
    const selection = this.resolveSelection(properties);
    return selection as Selection;
  }

  // Recursively filter all descendant nodes with `iterator`.
  filterDescendants(iterator: Function): List<NodeInterface> {
    const matches: any[] = [];

    this.forEachDescendant((node: any, i: any, nodes: any) => {
      if (iterator(node, i, nodes)) matches.push(node);
    });

    return List(matches);
  }

  // Recursively find all descendant nodes by `iterator`.
  findDescendant(iterator: Function): NodeInterface | null {
    let found = null;

    this.forEachDescendant((node: any, i: number, nodes: any) => {
      if (iterator(node, i, nodes)) {
        found = node;
        return false;
      }
    });

    return found;
  }

  forEachDescendant(iterator: Function) {
    let ret: boolean;

    this.nodes.forEach((child: any, i: number, nodes: List<any>) => {
      if (iterator(child, i, nodes) === false) {
        ret = false;
        return false;
      }

      if (child.object != "text") {
        ret = child.forEachDescendant(iterator);
        return ret;
      }
    });

    return ret;
  }

  // Get a set of the active marks in a `range`.
  getActiveMarksAtRange(range: Range): Set<Mark> {
    range = this.resolveRange(range);
    if (range.isUnset) return Set();

    if (range.isCollapsed) {
      const { start } = range;
      return this.getMarksAtPosition(start.key, start.offset).toSet();
    }

    const { start, end } = range;
    let startKey = start.key;
    let startOffset = start.offset;
    let endKey = end.key;
    let endOffset = end.offset;
    let startText = this.getDescendant(startKey);

    if (!isEqual(startKey, endKey)) {
      while (!isEqual(startKey, endKey) && endOffset === 0) {
        const endText = this.getPreviousText(endKey);
        endKey = endText.key;
        endOffset = endText.text.length;
      }

      while (
        !isEqual(startKey, endKey) &&
        startOffset === startText.text.length
      ) {
        startText = this.getNextText(startKey);
        startKey = startText.key;
        startOffset = 0;
      }
    }

    if (isEqual(startKey, endKey)) {
      return startText.getActiveMarksBetweenOffsets(startOffset, endOffset);
    }

    const startMarks = startText.getActiveMarksBetweenOffsets(
      startOffset,
      startText.text.length
    );
    if (startMarks.size === 0) return Set();
    const endText = this.getDescendant(endKey);
    const endMarks = endText.getActiveMarksBetweenOffsets(0, endOffset);
    let marks = startMarks.intersect(endMarks);
    // If marks is already empty, the active marks is empty
    if (marks.size === 0) return marks;

    let text = this.getNextText(startKey);

    while (!isEqual(text.key, endKey)) {
      if (text.text.length !== 0) {
        marks = marks.intersect(text.getActiveMarks());
        if (marks.size === 0) return Set();
      }

      text = this.getNextText(text.key);
    }
    return marks;
  }

  // Get a list of the ancestors of a descendant.
  getAncestors(path: List<number> | Key): List<NodeInterface> | null {
    path = this.resolvePath(path);
    if (!path) return null;

    const ancestors: any[] = [];

    path.forEach((p, i) => {
      const current = path.slice(0, i);
      const parent = this.getNode(current);
      ancestors.push(parent);
    });

    return List(ancestors);
  }

  /**
   * Get the leaf block descendants of the node.
   *
   * @return {List<Node>}
   */

  getBlocks() {
    const array = this.getBlocksAsArray();
    return List(array);
  }

  // Get the leaf block descendants of the node.
  getBlocksAsArray(): NodeInterface[] {
    return this.nodes.reduce(
      (
        array: any[],
        child: {
          object: string;
          isLeafBlock: () => any;
          getBlocksAsArray: () => any;
        }
      ) => {
        if (child.object != "block") return array;
        if (!child.isLeafBlock()) return array.concat(child.getBlocksAsArray());
        array.push(child);
        return array;
      },
      []
    );
  }

  // Get the leaf block descendants in a `range`.
  getBlocksAtRange(range: Range): List<NodeInterface> {
    const array = this.getBlocksAtRangeAsArray(range);
    // Eliminate duplicates by converting to an `OrderedSet` first.
    return List(OrderedSet(array));
  }

  // Get the leaf block descendants in a `range` as an array
  getBlocksAtRangeAsArray(range: Range): NodeInterface[] {
    range = this.resolveRange(range);
    if (range.isUnset) return [];

    const { start, end } = range;
    const startBlock = this.getClosestBlock(start.key);

    // PERF: the most common case is when the range is in a single block node,
    // where we can avoid a lot of iterating of the tree.
    if (isEqual(start.key, end.key)) return [startBlock];

    const endBlock = this.getClosestBlock(end.key);
    const blocks = this.getBlocksAsArray();
    const startIndex = blocks.indexOf(startBlock);
    const endIndex = blocks.indexOf(endBlock);
    return blocks.slice(startIndex, endIndex + 1);
  }

  // Get all of the leaf blocks that match a `type`.
  getBlocksByType(type: string): List<NodeInterface> {
    const array = this.getBlocksByTypeAsArray(type);
    return List(array);
  }

  // Get all of the leaf blocks that match a `type` as an array
  getBlocksByTypeAsArray(type: string): NodeInterface[] {
    return this.nodes.reduce(
      (
        array: any[],
        node: {
          object: string;
          isLeafBlock: () => any;
          type: string;
          getBlocksByTypeAsArray: (arg0: string) => any;
        }
      ) => {
        if (node.object != "block") {
          return array;
        } else if (node.isLeafBlock() && node.type == type) {
          array.push(node);
          return array;
        } else {
          return array.concat(node.getBlocksByTypeAsArray(type));
        }
      },
      []
    );
  }

  // Get a child node.
  getChild(path: List<number> | Key): NodeInterface {
    path = this.resolvePath(path);
    if (!path) return null;

    const child = path.size === 1 ? this.nodes.get(path.first()) : null;
    return child;
  }

  // Get closest parent of node that matches an `iterator`.
  getClosest(
    path: List<number> | Key,
    iterator: Function
  ): NodeInterface | null {
    const ancestors = this.getAncestors(path);
    if (!ancestors) return null;

    const closest = ancestors.findLast((node, ...args) => {
      // We never want to include the top-level node.
      if (node === this) return false;
      return iterator(node, ...args);
    });

    return closest || null;
  }

  // Get the closest block parent of a node.
  getClosestBlock(path: List<number> | Key): NodeInterface | null {
    const closest = this.getClosest(
      path,
      (n: { object: string }) => n.object === "block"
    );
    return closest;
  }

  // Get the closest inline parent of a node by `path`.
  getClosestInline(path: List<number> | Key): NodeInterface | null {
    const closest = this.getClosest(
      path,
      (n: { object: string }) => n.object === "inline"
    );
    return closest;
  }

  // Get the closest void parent of a node by `path`.
  getClosestVoid(
    path: List<number> | Key,
    schema: Schema
  ): NodeInterface | null {
    if (!schema) {
      logger.deprecate(
        "0.38.0",
        "Calling the `Node.getClosestVoid` method without passing a second `schema` argument is deprecated."
      );

      const closest = this.getClosest(path, (p: any) => schema.isVoid(p));
      return closest;
    }

    const ancestors = this.getAncestors(path);

    const ancestor = ancestors.findLast((a) => schema.isVoid(a));
    return ancestor;
  }

  // Get the common ancestor of nodes `a` and `b`.
  getCommonAncestor(
    a: List<number> | Key,
    b: List<number> | Key
  ): NodeInterface {
    a = this.resolvePath(a);
    b = this.resolvePath(b);
    if (!a || !b) return null;

    const path = PathUtils.relate(a, b);
    const node = this.getNode(path);
    return node;
  }

  // Get the decorations for the node from a `stack`.
  getDecorations(stack: Stack): List<Decoration> {
    const decorations = stack.$$find("decorateNode", this);
    const list = Decoration.createList(decorations || []);
    return list;
  }

  // Get the depth of a descendant, with optional `startAt`.
  getDepth(path: List<number> | Key, startAt: number = 1): number | null {
    path = this.resolvePath(path);
    if (!path) return null;

    const node = this.getNode(path);
    const depth = node ? path.size - 1 + startAt : null;
    return depth;
  }

  // Get a descendant node.
  getDescendant(path: List<number> | Key): NodeInterface | null {
    path = this.resolvePath(path);
    if (!path) return null;

    const deep = path.flatMap((x) => ["nodes", x]);

    const ret = this.getIn(deep);
    return ret;
  }

  // Get the first invalid descendant
  getFirstInvalidNode(schema: Schema): NodeInterface | Text | null {
    let result = null;

    this.nodes.find(
      (
        n: {
          validate: (arg0: Schema) => any;
          getFirstInvalidNode: (arg0: Schema) => null;
        } | null
      ) => {
        result = n.validate(schema) ? n : n.getFirstInvalidNode(schema);
        return result;
      }
    );

    return result;
  }

  // Get the first child text node.
  getFirstText(): Text | null {
    let descendant = null;

    const found = this.nodes.find(
      (node: { object: string; getFirstText: () => null }) => {
        if (node.object === "text") return true;
        descendant = node.getFirstText();
        return !!descendant;
      }
    );

    return descendant || found;
  }

  // Get a fragment of the node at a `range`.
  getFragmentAtRange(range: Range): Document {
    range = this.resolveRange(range);

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
      targetPath = PathUtils.lift(targetPath);

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

  // Get the furthest parent of a node that matches an `iterator`.
  getFurthest(
    path: List<number> | Key,
    iterator: Function
  ): NodeInterface | null {
    const ancestors = this.getAncestors(path);
    if (!ancestors) return null;

    const furthest = ancestors.find((node, ...args) => {
      // We never want to include the top-level node.
      if (node === this) return false;
      return iterator(node, ...args);
    });

    return furthest || null;
  }

  // Get the furthest ancestor of a node.
  getFurthestAncestor(path: List<number> | Key): NodeInterface | null {
    path = this.resolvePath(path);
    if (!path) return null;

    const furthest = path.size ? this.nodes.get(path.first()) : null;
    return furthest;
  }

  // Get the furthest block parent of a node.
  getFurthestBlock(path: List<number> | Key): NodeInterface | null {
    const furthest = this.getFurthest(
      path,
      (n: { object: string }) => n.object === "block"
    );
    return furthest;
  }

  // Get the furthest inline parent of a node.
  getFurthestInline(path: List<number> | Key): NodeInterface | null {
    const furthest = this.getFurthest(
      path,
      (n: { object: string }) => n.object === "inline"
    );
    return furthest;
  }

  // Get the furthest ancestor of a node that has only one child.
  getFurthestOnlyChildAncestor(path: List<number> | Key): NodeInterface | null {
    const ancestors = this.getAncestors(path);
    if (!ancestors) return null;

    const furthest = ancestors
      .rest()
      .reverse()
      .takeUntil((p) => p.nodes.size > 1)
      .last();

    return furthest || null;
  }

  // Get the closest inline nodes for each text node in the node.
  getInlines(): List<NodeInterface> {
    const array = this.getInlinesAsArray();
    const list = List(array);
    return list;
  }

  // Get the closest inline nodes for each text node in the node, as an array.
  getInlinesAsArray(): List<NodeInterface> {
    let array = [];

    this.nodes.forEach((child: NodeInterface) => {
      if (child.object == "text") return;

      if (child.isLeafInline()) {
        array.push(child);
      } else {
        array = array.concat(child.getInlinesAsArray());
      }
    });

    return array;
  }

  // Get the closest inline nodes for each text node in a `range`.
  getInlinesAtRange(range: Range): List<NodeInterface> {
    const array = this.getInlinesAtRangeAsArray(range);
    // Remove duplicates by converting it to an `OrderedSet` first.
    const list = List(OrderedSet(array));
    return list;
  }

  // Get the closest inline nodes for each text node in a `range` as an array.
  getInlinesAtRangeAsArray(range: Range): NodeInterface[] {
    range = this.resolveRange(range);
    if (range.isUnset) return [];

    const array = this.getTextsAtRangeAsArray(range)
      .map((text) => this.getClosestInline(text.key))
      .filter((exists) => exists);

    return array;
  }

  // Get all of the leaf inline nodes that match a `type`.
  getInlinesByType(type: string): List<NodeInterface> {
    const array = this.getInlinesByTypeAsArray(type);
    const list = List(array);
    return list;
  }

  // Get all of the leaf inline nodes that match a `type` as an array.
  getInlinesByTypeAsArray(type: string): NodeInterface[] {
    const array = this.nodes.reduce(
      (
        inlines: any[],
        node: {
          object: string;
          isLeafInline: () => any;
          type: string;
          getInlinesByTypeAsArray: (arg0: string) => any;
        }
      ) => {
        if (node.object == "text") {
          return inlines;
        } else if (node.isLeafInline() && node.type == type) {
          inlines.push(node);
          return inlines;
        } else {
          return inlines.concat(node.getInlinesByTypeAsArray(type));
        }
      },
      []
    );

    return array;
  }

  // Get a set of the marks in a `range`.
  getInsertMarksAtRange(range: Range): Set<Mark> {
    range = this.resolveRange(range);
    const { start } = range;

    if (range.isUnset) {
      return Set();
    }

    if (range.isCollapsed) {
      // PERF: range is not cachable, use key and offset as proxies for cache
      return this.getMarksAtPosition(start.key, start.offset);
    }

    const text = this.getDescendant(start.key);
    const marks = text.getMarksAtIndex(start.offset + 1);
    return marks;
  }

  // Get the last child text node.
  getLastText(): Text | null {
    let descendant = null;

    const found = this.nodes.findLast(
      (node: { object: string; getLastText: () => null }) => {
        if (node.object == "text") return true;
        descendant = node.getLastText();
        return descendant;
      }
    );

    return descendant || found;
  }

  getMarks(): Set<Mark> {
    const array = this.getMarksAsArray();
    return Set(array);
  }

  // Get all of the marks as an array.
  getMarksAsArray(): Mark[] {
    const result: Mark[] = [];

    this.nodes.forEach((node: NodeInterface) => {
      result.push(node.getMarksAsArray());
    });

    // PERF: use only one concat rather than multiple for speed.
    const array = [].concat(...result);
    return array;
  }

  // Get a set of marks in a `position`, the equivalent of a collapsed range
  getMarksAtPosition(key: Key, offset: number): Set<Mark> {
    const text = this.getDescendant(key);
    const currentMarks = text.getMarksAtIndex(offset);
    if (offset !== 0) return currentMarks;
    const closestBlock = this.getClosestBlock(key);

    if (closestBlock.text === "") {
      // insert mark for empty block; the empty block are often created by split node or add marks in a range including empty blocks
      return currentMarks;
    }

    const previous = this.getPreviousText(key);
    if (!previous) return Set();

    if (closestBlock.hasDescendant(previous.key)) {
      return previous.getMarksAtIndex(previous.text.length);
    }

    return currentMarks;
  }

  // Get a set of the marks in a `range`.
  getMarksAtRange(range: Range): Set<Mark> {
    const marks = Set(this.getOrderedMarksAtRange(range));
    return marks;
  }

  // Get all of the marks that match a `type`.
  getMarksByType(type: string): Set<Mark> {
    const array = this.getMarksByTypeAsArray(type);
    return Set(array);
  }

  // Get all of the marks that match a `type` as an array.
  getMarksByTypeAsArray(type: string): Mark[] {
    const array = this.nodes.reduce((memo: Mark[], node: NodeInterface) => {
      return node.object == "text"
        ? memo.concat(node.getMarksAsArray().filter((m) => m.type == type))
        : memo.concat(node.getMarksByTypeAsArray(type));
    }, []);

    return array;
  }

  // Get the block node before a descendant text node by `key`.
  getNextBlock(key: List<number> | Key): NodeInterface | null {
    const child = this.getDescendant(key);
    let last: Text | null;

    if (child.object == "block") {
      last = child.getLastText();
    } else {
      const block = this.getClosestBlock(key);
      last = block.getLastText();
    }

    const next = this.getNextText(last.key);
    if (!next) return null;

    const closest = this.getClosestBlock(next.key);
    return closest;
  }

  getNextNode(path: List<number> | Key): NodeInterface | null {
    path = this.resolvePath(path);
    if (!path) return null;
    if (!path.size) return null;

    for (let i = path.size; i > 0; i--) {
      const p = path.slice(0, i);
      const target = PathUtils.increment(p);
      const node = this.getNode(target);
      if (node) return node;
    }

    return null;
  }

  // Get the next sibling of a node.
  getNextSibling(path: List<number> | Key): NodeInterface | null {
    path = this.resolvePath(path);
    if (!path) return null;
    if (!path.size) return null;
    const p = PathUtils.increment(path);
    const sibling = this.getNode(p);
    return sibling;
  }

  // Get the text node after a descendant text node.
  getNextText(path: List<number> | Key): NodeInterface {
    path = this.resolvePath(path);
    if (!path) return null;
    if (!path.size) return null;
    const next = this.getNextNode(path);
    if (!next) return null;
    const text = next.getFirstText();
    return text;
  }

  // Get a node in the tree.
  getNode(path: List<number> | Key): NodeInterface | null {
    path = this.resolvePath(path);
    if (!path) return null;
    const node = path.size ? this.getDescendant(path) : this;
    return node;
  }

  // Get the offset for a descendant text node by `key`.
  getOffset(key: List<number> | Key): number {
    this.getDescendant(key);

    // Calculate the offset of the nodes before the highest child.
    const child = this.getFurthestAncestor(key);

    const offset = this.nodes
      .takeUntil((n: NodeInterface | null) => n == child)
      .reduce(
        (memo: any, n: { text: string | any[] }) => memo + n.text.length,
        0
      );

    // Recurse if need be.
    const ret = this.hasChild(key) ? offset : offset + child.getOffset(key);
    return ret;
  }

  // Get the offset from a `range`.
  getOffsetAtRange(range: Range): number {
    range = this.resolveRange(range);

    if (range.isUnset) {
      throw new Error("The range cannot be unset to calculcate its offset.");
    }

    if (range.isExpanded) {
      throw new Error("The range must be collapsed to calculcate its offset.");
    }

    const { start } = range;
    const offset = this.getOffset(start.key) + start.offset;
    return offset;
  }

  // Get all of the marks for all of the characters of every text node.
  getOrderedMarks(): OrderedSet<Mark> {
    const array = this.getMarksAsArray();
    return OrderedSet(array);
  }

  // Get a set of the marks in a `range`.
  getOrderedMarksAtRange(range: Range): OrderedSet<Mark> {
    range = this.resolveRange(range);
    const { start, end } = range;

    if (range.isUnset) {
      return OrderedSet();
    }

    if (range.isCollapsed) {
      // PERF: range is not cachable, use key and offset as proxies for cache
      return this.getMarksAtPosition(start.key, start.offset).toOrderedSet();
    }

    const marks = this.getOrderedMarksBetweenPositions(
      start.key,
      start.offset,
      end.key,
      end.offset
    );

    return marks;
  }

  // Get a set of the marks in a `range`. PERF: arguments use key and offset for utilizing cache
  getOrderedMarksBetweenPositions(
    startKey: Key,
    startOffset: number,
    endKey: Key,
    endOffset: number
  ): OrderedSet<Mark> {
    if (isEqual(startKey, endKey)) {
      const startText = this.getDescendant(startKey);
      return startText.getMarksBetweenOffsets(startOffset, endOffset);
    }

    const texts = this.getTextsBetweenPositionsAsArray(startKey, endKey);

    return OrderedSet().withMutations((result) => {
      texts.forEach((text) => {
        if (isEqual(text.key, startKey)) {
          result.union(
            text.getMarksBetweenOffsets(startOffset, text.text.length)
          );
        } else if (isEqual(text.key, endKey)) {
          result.union(text.getMarksBetweenOffsets(0, endOffset));
        } else {
          result.union(text.getMarks());
        }
      });
    });
  }

  // Get all of the marks that match a `type`.
  getOrderedMarksByType(type: string): OrderedSet<Mark> {
    const array = this.getMarksByTypeAsArray(type);
    return OrderedSet(array);
  }

  // Get the parent of a descendant node.
  getParent(path: List<number> | Key): NodeInterface | null {
    path = this.resolvePath(path);
    if (!path) return null;
    if (!path.size) return null;
    const parentPath = PathUtils.lift(path);
    const parent = this.getNode(parentPath);
    return parent;
  }

  // Find the path to a node.
  getPath(key: Key | List<number>): List<number> {
    // Handle the case of passing in a path directly, to match other methods.

    if (List.isList(key)) return key;
    let node = KEY_TO_NODE.get(key);

    let path: number[] = [];
    let child = node;

    while (true) {
      if (isEqual(child.key, this.key)) {
        return List(path);
      }
      const parent = NODE_TO_PARENT.get(child);
      if (!parent) {
        if (Document.isDocument(child)) {
          return List(path);
        }
        break;
      }

      const i = NODE_TO_INDEX.get(child);
      if (i === null) {
        break;
      }

      path.unshift(i);
      child = parent;
    }
  }

  // Get the block node before a descendant text node by `key`.
  getPreviousBlock(key: Key): NodeInterface | null {
    const child = this.getDescendant(key);
    let first: Text | null;

    if (child.object == "block") {
      first = child.getFirstText();
    } else {
      const block = this.getClosestBlock(key);
      first = block.getFirstText();
    }

    const previous = this.getPreviousText(first.key);
    if (!previous) return null;

    const closest = this.getClosestBlock(previous.key);
    return closest;
  }

  getPreviousNode(path: List<number> | Key): NodeInterface[] {
    path = this.resolvePath(path);
    if (!path) return null;
    if (!path.size) return null;

    for (let i = path.size; i > 0; i--) {
      const p = path.slice(0, i);
      if (p.last() === 0) continue;

      const target = PathUtils.decrement(p);
      const node = this.getNode(target);
      if (node) return node;
    }

    return null;
  }

  // Get the previous sibling of a node.
  getPreviousSibling(path: List<number> | Key): NodeInterface | null {
    path = this.resolvePath(path);
    if (!path) return null;
    if (!path.size) return null;
    if (path.last() === 0) return null;
    const p = PathUtils.decrement(path);
    const sibling = this.getNode(p);
    return sibling;
  }

  // Get the text node after a descendant text node.
  getPreviousText(path: List<number> | Key): Text | null {
    path = this.resolvePath(path);
    if (!path) return null;
    if (!path.size) return null;
    const previous = this.getPreviousNode(path);
    if (!previous) return null;
    const text = previous.getLastText();
    return text;
  }

  /**
   * Get the indexes of the selection for a `range`, given an extra flag for
   * whether the node `isSelected`, to determine whether not finding matches
   * means everything is selected or nothing is.
   *
   * @param {Range} range
   * @param {Boolean} isSelected
   * @return {Object|Null}
   */

  getSelectionIndexes(range: Range, isSelected: boolean = true): any | null {
    const { start, end } = range;

    // PERF: if we're not selected, we can exit early.
    if (!isSelected) {
      return null;
    }

    // if we've been given an invalid selection we can exit early.
    if (range.isUnset) {
      return null;
    }

    // PERF: if the start and end keys are the same, just check for the child
    // that contains that single key.
    if (isEqual(start.key, end.key)) {
      const child = this.getFurthestAncestor(start.key);

      const index = child ? this.nodes.indexOf(child) : null;
      return { start: index, end: index + 1 };
    }

    // Otherwise, check all of the children...
    let startIndex = null;
    let endIndex = null;

    this.nodes.forEach((child: NodeInterface, i: number) => {
      if (child.object == "text") {
        if (startIndex == null && isEqual(child.key, start.key)) startIndex = i;
        if (endIndex == null && isEqual(child.key, end.key)) endIndex = i + 1;
      } else {
        if (startIndex == null && child.hasDescendant(start.key))
          startIndex = i;
        if (endIndex == null && child.hasDescendant(end.key)) endIndex = i + 1;
      }

      // PERF: exit early if both start and end have been found.
      return startIndex == null || endIndex == null;
    });

    if (isSelected && startIndex == null) startIndex = 0;

    if (isSelected && endIndex == null) endIndex = this.nodes.size;
    return startIndex == null ? null : { start: startIndex, end: endIndex };
  }

  // Get the concatenated text string of all child nodes.
  getText(): string {
    const text = this.nodes.reduce((string: any, node: { text: any }) => {
      return string + node.text;
    }, "");

    return text;
  }

  // Get the descendent text node at an `offset`.
  getTextAtOffset(offset: number): Text | null {
    // PERF: Add a few shortcuts for the obvious cases.
    if (offset === 0) return this.getFirstText();
    if (offset === this.text.length) return this.getLastText();
    if (offset < 0 || offset > this.text.length) return null;

    let length = 0;
    const text = this.getTexts().find((node, i, nodes) => {
      length += node.text.length;
      return length > offset;
    });

    return text;
  }

  // Get the direction of the node's text.
  getTextDirection(): string {
    const dir = direction(this.text);
    return dir === "neutral" ? null : dir;
  }

  getTexts(): List<Text> {
    const array = this.getTextsAsArray();
    return List(array);
  }

  getTextsAsArray(): Text[] {
    let array = [];

    this.nodes.forEach((node: NodeInterface) => {
      if (node.object == "text") {
        array.push(node);
      } else {
        array = array.concat(node.getTextsAsArray());
      }
    });

    return array;
  }

  // Get all of the text nodes in a `range`.
  getTextsAtRange(range: Range): List<Text> {
    range = this.resolveRange(range);
    if (range.isUnset) return List();
    const { start, end } = range;
    const list = List(this.getTextsBetweenPositionsAsArray(start.key, end.key));

    return list;
  }

  // Get all of the text nodes in a `range` as an array.
  getTextsAtRangeAsArray(range: Range): Text[] {
    range = this.resolveRange(range);
    if (range.isUnset) return [];
    const { start, end } = range;
    const texts = this.getTextsBetweenPositionsAsArray(start.key, end.key);
    return texts;
  }

  getTextsBetweenPositionsAsArray(startKey: Key, endKey: Key): Text[] {
    const startText = this.getDescendant(startKey);

    // PERF: the most common case is when the range is in a single text node,
    // where we can avoid a lot of iterating of the tree.
    if (isEqual(startKey, endKey)) return [startText];

    const endText = this.getDescendant(endKey);
    const texts = this.getTextsAsArray();

    const start = texts.indexOf(startText);

    const end = texts.indexOf(endText, start);
    const ret = texts.slice(start, end + 1);
    return ret;
  }

  // Check if the node has block children.
  hasBlockChildren() {
    return !!(
      this.nodes &&
      this.nodes.find((n: { object: string }) => n.object === "block")
    );
  }

  hasChild(path: List<number> | Key): boolean {
    const child = this.getChild(path);
    return !!child;
  }

  // Check if a node has inline children.
  hasInlineChildren() {
    return !!(
      this.nodes &&
      this.nodes.find(
        (n: { object: string }) => n.object === "inline" || n.object === "text"
      )
    );
  }

  // Recursively check if a child node exists.
  hasDescendant(path: List<number> | Key) {
    const descendant = this.getDescendant(path);
    return !!descendant;
  }

  // Recursively check if a node exists.
  hasNode(path: List<number> | Key) {
    const node = this.getNode(path);
    return !!node;
  }

  // Check if a node has a void parent.
  hasVoidParent(path: List<number> | Key, schema: Schema) {
    if (!schema) {
      logger.deprecate(
        "0.38.0",
        "Calling the `Node.hasVoidParent` method without the second `schema` argument is deprecated."
      );

      const closest = this.getClosestVoid(path);
      return !!closest;
    }

    const closest = this.getClosestVoid(path, schema);
    return !!closest;
  }

  // Insert a `node`.
  insertNode(path: List<number> | Key, node: NodeInterface): NodeInterface {
    path = this.resolvePath(path);
    const index = path.last();
    const parentPath = PathUtils.lift(path);
    let parent = this.getNode(parentPath);
    const nodes = parent.nodes.splice(index, 0, node);
    parent = parent.set("nodes", nodes);
    NODE_TO_INDEX.set(node, index);
    NODE_TO_KEY.set(parent, parent.key);
    KEY_TO_NODE.set(parent.key, parent);

    parent.nodes.forEach((n: object) => {
      let i = parent.nodes.indexOf(n);
      NODE_TO_INDEX.set(n, i);
      NODE_TO_PARENT.set(n, parent);
    });
    const ret = this.replaceNode(parentPath, parent);
    NODE_TO_KEY.set(ret, ret.key);
    KEY_TO_NODE.set(ret.key, ret);
    return ret;
  }

  // Insert `text` at `offset` in node by `path`.
  insertText(
    path: List<number> | Key,
    offset: number,
    text: string,
    marks: Set<Mark>
  ) {
    let node = this.getDescendant(path);
    path = this.resolvePath(path);
    node = node.insertText(offset, text, marks);
    const ret = this.replaceNode(path, node);
    return ret;
  }

  /**
   * Check whether the node is a leaf block.
   *
   * @return {Boolean}
   */

  isLeafBlock() {
    return (
      this.object === "block" &&
      this.nodes.every((n: { object: string }) => n.object !== "block")
    );
  }

  /**
   * Check whether the node is a leaf inline.
   *
   * @return {Boolean}
   */

  isLeafInline() {
    return (
      this.object === "inline" &&
      this.nodes.every((n: { object: string }) => n.object !== "inline")
    );
  }

  mapChildren(iterator: Function): List<NodeInterface> {
    let { nodes } = this;

    nodes.forEach((node: any, i: any) => {
      const ret = iterator(node, i, this.nodes);
      if (ret !== node) nodes = nodes.set(ret.key, ret);
    });

    const ret = this.set("nodes", nodes);
    return ret;
  }

  /**
   * Map all descendant nodes, updating them in their parents. This method is
   * optimized to not return a new node if no changes are made.
   *
   * @param {Function} iterator
   * @return {Node}
   */

  mapDescendants(iterator: Function) {
    let { nodes } = this;

    nodes.forEach((node: NodeInterface, index: number) => {
      let ret = node;
      if (ret.object !== "text") ret = ret.mapDescendants(iterator);
      ret = iterator(ret, index, this.nodes);
      if (ret === node) return;

      nodes = nodes.set(index, ret);
    });

    const ret = this.set("nodes", nodes);
    return ret;
  }

  // Merge a node backwards its previous sibling.
  mergeNode(path: List<number> | Key) {
    const b = this.getNode(path);
    path = this.resolvePath(path);

    if (path.last() === 0) {
      throw new Error(
        `Unable to merge node because it has no previous sibling: ${b}`
      );
    }

    const withPath = PathUtils.decrement(path);
    const a = this.getNode(withPath);

    if (a.object !== b.object) {
      throw new Error(
        `Unable to merge two different kinds of nodes: ${a} and ${b}`
      );
    }

    const newNode =
      a.object === "text"
        ? a.mergeText(b)
        : a.set("nodes", a.nodes.concat(b.nodes));

    let ret = this;
    ret = ret.removeNode(path);
    ret = ret.removeNode(withPath);
    ret = ret.insertNode(withPath, newNode);
    if (newNode.object !== "text" && newNode.nodes.size > 0) {
      newNode.nodes.forEach((n, i) => {
        NODE_TO_INDEX.set(n, i);
        NODE_TO_PARENT.set(n, newNode);
      });
    }
    return ret;
  }

  moveNode(
    path: List<number> | Key,
    newPath: List<number> | Key,
    newIndex: number = 0
  ) {
    const node = this.getNode(path);
    path = this.resolvePath(path);
    newPath = this.resolvePath(newPath, newIndex);

    const newParentPath = PathUtils.lift(newPath);
    this.getNode(newParentPath);

    const [p, np] = PathUtils.crop(path, newPath);
    const position = PathUtils.compare(p, np);

    // If the old path ends above and before a node in the new path, then
    // removing it will alter the target, so we need to adjust the new path.
    if (path.size < newPath.size && position === -1) {
      newPath = PathUtils.decrement(newPath, 1, p.size - 1);
    }

    let ret = this;
    ret = ret.removeNode(path);
    ret = ret.insertNode(newPath, node);
    return ret;
  }

  normalize(schema: Schema) {
    const normalizer = schema.normalizeNode(this);
    return normalizer;
  }

  // Attempt to "refind" a node by a previous `path`, falling back to looking it up by `key` again.
  refindNode(path: List<number> | string, key: Key) {
    const node = this.getDescendant(path);
    const found =
      node && isEqual(node.key, key) ? node : this.getDescendant(key);
    return found;
  }

  refindPath(path: List<number> | string, key: Key) {
    const node = this.getDescendant(path);
    const found = node && isEqual(node.key, key) ? path : this.getPath(key);
    return found;
  }

  // Regenerate the node's key.
  regenerateKey() {
    const key = new Key();
    const node = this.set("key", key);
    return node;
  }

  // Remove mark from text at `offset` and `length` in node.
  removeMark(
    path: List<number> | Key,
    offset: number,
    length: number,
    mark: Mark
  ) {
    let node = this.getDescendant(path);
    path = this.resolvePath(path);
    node = node.removeMark(offset, length, mark);
    const ret = this.replaceNode(path, node);
    return ret;
  }

  // Remove a node.
  removeNode(path: List<number> | Key): NodeInterface {
    this.getDescendant(path);
    path = this.resolvePath(path);
    const deep = path.flatMap((x) => ["nodes", x]);

    const ret = this.deleteIn(deep);
    return ret;
  }

  // Remove `text` at `offset` in node.
  removeText(path: List<number> | Key, offset: number, text: string) {
    let node = this.getDescendant(path);
    node = node.removeText(offset, text.length);
    const ret = this.replaceNode(path, node);
    return ret;
  }

  // Replace a `node` in the tree.
  replaceNode(path: List<number> | Key, node: NodeInterface): NodeInterface {
    path = this.resolvePath(path);

    if (!path) {
      throw new Error(
        `Unable to replace a node because it could not be found in the first place: ${path}`
      );
    }

    if (!path.size) return node;
    const deep = path.flatMap((x) => ["nodes", x]);
    const ret = this.setIn(deep, node);
    return ret;
  }

  resolveDecoration(decoration: Decoration | any): Decoration {
    decoration = Decoration.create(decoration);
    decoration = decoration.normalize(this);
    return decoration;
  }

  resolvePath(path: List<number> | Key, index?: number): List<number> {
    if (path instanceof Key) {
      path = this.getPath(path);

      if (index != null) {
        path = path.concat(index);
      }
    } else {
      path = PathUtils.create(path);
    }

    return path;
  }

  resolvePoint(point: Point | any): Point {
    point = Point.create(point);
    point = point.normalize(this);
    return point;
  }

  resolveRange(range: Range | any): Range {
    range = Range.create(range);
    range = range.normalize(this);
    return range;
  }

  resolveSelection(selection: Selection | any): Selection {
    selection = Selection.create(selection);
    selection = selection.normalize(this);
    return selection;
  }

  setNode(path: List<number> | Key, properties: any): NodeInterface {
    let node = this.getNode(path);
    node = node.merge(properties);
    const ret = this.replaceNode(path, node);
    return ret;
  }

  // Set `properties` on `mark` on text at `offset` and `length` in node.
  setMark(
    path: List<number> | Key,
    offset: number,
    length: number,
    mark: Mark,
    properties: any
  ) {
    let node = this.getNode(path);
    node = node.updateMark(offset, length, mark, properties);
    const ret = this.replaceNode(path, node);
    return ret;
  }

  splitNode(
    path: List<number> | Key,
    position: number,
    properties?: any
  ): NodeInterface {
    const child = this.getNode(path);
    path = this.resolvePath(path);
    let a: NodeInterface;
    let b: NodeInterface;

    if (child.object === "text") {
      [a, b] = child.splitText(position);
    } else {
      const befores = child.nodes.take(position);
      const afters = child.nodes.skip(position);
      a = child.set("nodes", befores);
      b = child.set("nodes", afters).regenerateKey();
    }

    if (properties && child.object !== "text") {
      b = b.merge(properties);
    }

    let ret = this;
    ret = ret.removeNode(path);
    ret = ret.insertNode(path, b);
    ret = ret.insertNode(path, a);
    return ret;
  }

  validate(schema: Schema): Error | void {
    return schema.validateNode(this);
  }

  /**
   * Deprecated.
   */
  get isVoid() {
    logger.deprecate(
      "0.38.0",
      "The `Node.isVoid` property is deprecated, please use the `Schema.isVoid()` checking method instead."
    );

    return this.get("isVoid");
  }

  get isEmpty() {
    logger.deprecate("0.38.0", "The `Node.isEmpty` property is deprecated.");

    return (
      !this.get("isVoid") &&
      !this.nodes.some((child: { isEmpty: any }) => !child.isEmpty)
    );
  }
}

/**
 * Memoize read methods.
 */

memoize(NodeInterface.prototype, [
  "getBlocksAsArray",
  "getBlocksAtRangeAsArray",
  "getBlocksByTypeAsArray",
  "getDecorations",
  "getFirstInvalidNode",
  "getFirstText",
  "getFragmentAtRange",
  "getInlinesAsArray",
  "getInlinesAtRangeAsArray",
  "getInlinesByTypeAsArray",
  "getMarksAsArray",
  "getMarksAtPosition",
  "getOrderedMarksBetweenPositions",
  "getInsertMarksAtRange",
  "getLastText",
  "getMarksByTypeAsArray",
  "getNextBlock",
  "getOffset",
  "getOffsetAtRange",
  "getPreviousBlock",
  "getText",
  "getTextAtOffset",
  "getTextDirection",
  "getTextsAsArray",
  "getTextsBetweenPositionsAsArray",
  "isLeafBlock",
  "isLeafInline",
  "normalize",
  "validate",
]);

/**
 * Mix in the node interface.
 */

mixin(NodeInterface, [Block, Inline, Document]);
