import direction from "direction";
import isPlainObject from "is-plain-object";
import logger from "slate-dev-logger";

import { List, Iterable, OrderedSet, Set } from "immutable";

import Data from "./data";
import Block from "./block";
import Inline from "./inline";
import Document from "./document";
import { isType } from "../constants/model-types";
import Range from "./range";
import Text from "./text";

import Mark from "./mark";

import PathUtils from "../utils/path-utils";
import KeyUtils from "../utils/key-utils";
import memoize from "../utils/memoize";
import Schema from "./schema";
import Point from "./point";

class Node {
    public key: string;
    public nodes: List<any>;
    public text: string;

    public object: "document" | "block" | "inline" | "text";

    /**
     * craete a new Node width attrs
     * @param attrs
     */
    static create(attrs: any = {}) {
        if (Node.isNode(attrs)) {
            return attrs;
        }

        if (isPlainObject(attrs)) {
            let { object, kind } = attrs;

            if (!object && kind) {
                logger.deprecate(
                    "slate@0.32.0",
                    "The `kind` property of Slate objects has been renamed to `object`."
                );

                object = kind;
            }

            switch (object) {
                case "block":
                    return Block.create(attrs);
                case "document":
                    return Document.create(attrs);
                case "inline":
                    return Inline.create(attrs);
                case "text":
                    return Text.create(attrs);

                default: {
                    throw new Error(
                        "`Node.create` requires a `object` string."
                    );
                }
            }
        }

        throw new Error(
            `\`Node.create\` only accepts objects or nodes but you passed it: ${attrs}`
        );
    }

    /**
     * create a list of Nodes from an Array or a List
     * @param elements
     */
    static createList(elements: List<any> | Array<any> = []): List<any> {
        if (Array.isArray(elements)) {
            elements = List(elements);
        }
        if (List.isList(elements)) {
            const list = List(elements.map(Node.create));
            return list;
        }

        throw new Error(
            `\`Node.createList\` only accepts lists or arrays, but you passed it: ${elements}`
        );
    }

    /**
     * create a dictionary of settable node properties from attrs
     * @param attrs
     */
    static createProperties(
        attrs: any = {}
    ): { data?: Data; isVoid?: boolean; type: string } {
        if (Block.isBlock(attrs) || Inline.isInline(attrs)) {
            return {
                data: attrs.data,
                isVoid: attrs.isVoid,
                type: attrs.type
            };
        }

        if (typeof attrs === "string") {
            return { type: attrs };
        }

        if (isPlainObject(attrs)) {
            const props: any = {};
            if ("type" in attrs) props.type = attrs.type;
            if ("data" in attrs) props.data = Data.create(attrs.data);
            if ("isVoid" in attrs) props.isVoid = attrs.isVoid;
            return props;
        }

        throw new Error(
            `\`Node.createProperties\` only accepts objects, strings, blocks or inlines, but you passed it: ${attrs}`
        );
    }

    /**
     * create a Node from a JSON value
     * @param value
     */
    static fromJSON(
        value: any,
        options: any = {}
    ): Block | Inline | Document | Text {
        let { object, kind } = value;

        if (!object && kind) {
            logger.deprecate(
                "slate@0.32.0",
                "The `kind` property of Slate objects has been renamed to `object`."
            );

            object = kind;
        }

        switch (object) {
            case "block":
                return Block.fromJSON(value);
            case "document":
                return Document.fromJSON(value);
            case "inline":
                return Inline.fromJSON(value);
            case "text":
                return Text.fromJSON(value);

            default: {
                throw new Error(
                    `\`Node.fromJSON\` requires an \`object\` of either 'block', 'document', 'inline' or 'text', but you passed: ${value}`
                );
            }
        }
    }

    /**
     * alias fromJS
     */
    static fromJS = Node.fromJSON;

    /**
     * check if any is a Node
     * @param any
     */
    static isNode(any: any) {
        return !!["BLOCK", "DOCUMENT", "INLINE", "TEXT"].find((type: string) =>
            isType(type, any)
        );
    }

    /**
     * check if any is a list of nodes
     * @param any
     */
    static isNodeList(any: any): boolean {
        return List.isList(any) && any.every(item => Node.isNode(item));
    }

    /**
     * add mark to text at offset and length in node by path or key
     * @param path
     * @param offset
     * @param length
     * @param mark
     */
    addMark(
        path: List<number> | string,
        offset: number,
        length: number,
        mark: Mark
    ): any | Block | Inline {
        let node: any = this.assertDescendant(path) as Text;
        if (!Text.isText(node)) {
            throw new Error(
                `The node found by path isn't a Text node, it's ${node}`
            );
        }
        path = this.resolvePath(path);
        node = node.addMark(offset, length, mark);
        const ret = this.replaceNode(path, node) as any;
        return ret;
    }

    /**
     * create a point with properties relative to the node
     * @param properties
     */
    createPoint(properties: any) {
        properties = Point.createProperties(properties);
        const point = this.resolvePoint(properties);
        return point;
    }

    /**
     * create a range width properties relative to the node
     * @param properties
     */
    createRange(properties: any) {
        properties = Range.createProperties(properties);
        const range: Range = this.resolveRange(properties);
        return range;
    }

    /**
     * Recursively filter all descendant nodes with `iterator`.
     * @param iterator
     */
    filterDescendants(
        iterator: (
            child: any,
            index: number,
            nodes: List<any>
        ) => boolean | void
    ): List<any> {
        const matches: any[] = [];

        this.forEachDescendant((node, i, nodes) => {
            if (iterator(node, i, nodes)) matches.push(node);
        });

        return List(matches);
    }

    /**
     * Recursively filter all descendant nodes with `iterator`.
     * @param iterator
     */
    findDescendant(
        iterator: (
            child: any,
            index: number,
            nodes: List<any>
        ) => boolean | void
    ): List<any> {
        const matches: any[] = [];

        this.forEachDescendant((node, i, nodes) => {
            if (iterator(node, i, nodes)) matches.push(node);
        });

        return List(matches);
    }

    /**
     * Recursively iterate over all descendant nodes with `iterator`. If the
     * iterator returns false it will break the loop.
     * @param iterator
     */
    forEachDescendant(
        iterator: (
            child: any,
            index: number,
            nodes: List<any>
        ) => boolean | void
    ): List<any> {
        let ret;

        this.nodes.forEach(
            (child: any, i: number, nodes: List<any>): void | boolean => {
                if (iterator(child, i, nodes) === false) {
                    ret = false;
                    return false;
                }

                if (child.object != "text") {
                    ret = child.forEachDescendant(iterator);
                    return ret;
                }
            }
        );

        return ret;
    }

    /**
     *  Get a set of the active marks in a `range`.
     * @param range
     */
    getActiveMarksAtRange(range: Range): Set<Mark> {
        range = range.normalize(this);
        if (range.isUnset) return Set();

        if (range.isCollapsed) {
            const { startKey, startOffset } = range;
            return this.getMarksAtPosition(
                startKey as string,
                startOffset as number
            ).toSet() as Set<Mark>;
        }

        let { startKey, endKey, startOffset, endOffset } = range;
        let startText = this.getDescendant(startKey as string) as any;

        if (startKey !== endKey) {
            while (startKey !== endKey && endOffset === 0) {
                const endText: Text = this.getPreviousText(
                    endKey as string
                ) as Text;
                endKey = endText.key;
                endOffset = endText.text.length;
            }

            while (
                startKey !== endKey &&
                startOffset === startText.text.length
            ) {
                startText = this.getNextText(startKey as string);
                startKey = startText.key;
                startOffset = 0;
            }
        }

        if (startKey === endKey) {
            return startText.getActiveMarksBetweenOffsets(
                startOffset,
                endOffset
            );
        }

        const startMarks = startText.getActiveMarksBetweenOffsets(
            startOffset,
            startText.text.length
        );
        if (startMarks.size === 0) return Set();
        const endText = this.getDescendant(endKey as string);
        const endMarks = (endText as any).getActiveMarksBetweenOffsets(
            0,
            endOffset
        );
        let marks = startMarks.intersect(endMarks);
        // If marks is already empty, the active marks is empty
        if (marks.size === 0) return marks;

        let text = this.getNextText(startKey as string) as any;

        while (text.key !== endKey) {
            if (text.text.length !== 0) {
                marks = marks.intersect(text.getActiveMarks());
                if (marks.size === 0) return Set();
            }

            text = this.getNextText(text.key) as any;
        }
        return marks;
    }

    /**
     * Get a list of the ancestors of a descendant.
     * @param path
     */
    getAncestors(path: List<number> | string): List<any> | null {
        path = this.resolvePath(path);
        if (!path) return null;

        const ancestors: any[] = [];

        path.forEach((p, i) => {
            const current = path.slice(0, i) as List<number>;
            const parent = this.getNode(current);
            ancestors.push(parent);
        });

        return List(ancestors);
    }

    /**
     * Get the leaf block descendants of the node.
     */
    getBlocks(): List<Block> {
        const array: Block[] = this.getBlocksAsArray();
        return List(array);
    }

    /**
     * Get the leaf block descendants of the node.
     */
    getBlocksAsArray(): Array<Block> {
        return this.nodes.reduce((array: Block[], child: any) => {
            if (child.object != "block") return array;
            if (!child.isLeafBlock())
                return array.concat(child.getBlocksAsArray());
            array.push(child);
            return array;
        }, []);
    }

    /**
     * Get the leaf block descendants in a `range`.
     * @param range
     */
    getBlocksAtRange(range: Range): List<Block> {
        const array = this.getBlocksAtRangeAsArray(range);
        // Eliminate duplicates by converting to an `OrderedSet` first.
        return List(OrderedSet(array));
    }

    /**
     * Get the leaf block descendants in a `range` as an array
     * @param range
     */
    getBlocksAtRangeAsArray(range: Range): Block[] {
        range = range.normalize(this);
        if (range.isUnset) return [];

        const { startKey, endKey } = range;
        const startBlock = this.getClosestBlock(startKey as string);

        // PERF: the most common case is when the range is in a single block node,
        // where we can avoid a lot of iterating of the tree.
        if (startKey === endKey) return startBlock ? [startBlock] : [];

        const endBlock = this.getClosestBlock(endKey as string);
        const blocks = this.getBlocksAsArray();
        if (startBlock && endBlock) {
            const start = blocks.indexOf(startBlock);
            const end = blocks.indexOf(endBlock);
            return blocks.slice(start, end + 1);
        } else {
            return [];
        }
    }

    /**
     * Get all of the leaf blocks that match a `type`.
     * @param type
     */
    getBlocksByType(type: string): List<Block> {
        const array = this.getBlocksByTypeAsArray(type);
        return List(array);
    }

    /**
     * Get all of the leaf blocks that match a `type` as an array
     * @param type
     */
    getBlocksByTypeAsArray(type: string): Block[] {
        return this.nodes.reduce((array: Block[], node: any) => {
            if (node.object != "block") {
                return array;
            } else if (node.isLeafBlock() && node.type == type) {
                array.push(node);
                return array;
            } else {
                return array.concat(node.getBlocksByTypeAsArray(type));
            }
        }, []);
    }

    /**
     * Get a child node.
     * @param path
     */
    getChild(path: List<number> | string) {
        path = this.resolvePath(path);
        if (!path) return null;
        const child = path.size === 1 ? this.nodes.get(path.first()) : null;
        return child;
    }

    /**
     * Get closest parent of node that matches an `iterator`.
     *
     * @param {List|String} path
     * @param {Function} iterator
     * @return {Node|Null}
     */
    getClosest(
        path: List<number> | string,
        iterator: (
            child: any,
            index?: number,
            nodes?: Iterable<number, any>
        ) => boolean
    ): any | null {
        const ancestors = this.getAncestors(path);
        if (!ancestors) return null;

        const closest = ancestors.findLast((node, index, nodes) => {
            // We never want to include the top-level node.
            if ((node as any) === this) return false;
            return iterator(node, index, nodes);
        });

        return closest || null;
    }

    /**
     * Get the closest block parent of a node.
     *
     * @param path
     */
    getClosestBlock(path: List<number> | string): Block | null {
        const closest = this.getClosest(path, n => n.object === "block");
        return closest;
    }

    /**
     * Get the closest inline parent of a node by `path`.
     *
     * @param path
     */
    getClosestInline(path: List<number> | string) {
        const closest = this.getClosest(path, n => n.object === "inline");
        return closest;
    }

    /**
     *  Get the closest void parent of a node by `path`.
     *
     * @param path
     */
    getClosestVoid(path: List<number> | string) {
        const closest = this.getClosest(path, p => p.isVoid);
        return closest;
    }

    /**
     * Get the common ancestor of nodes `a` and `b`.
     *
     * @param a
     * @param b
     */
    getCommonAncestor(a: List<number> | string, b: List<number> | string) {
        a = this.resolvePath(a);
        b = this.resolvePath(b);
        if (!a || !b) return null;

        const path = PathUtils.relate(a, b);
        const node = this.getNode(path);
        return node;
    }

    /**
     * Get the decorations for the node from a `stack`.
     *
     * @param stack
     * @return
     */
    getDecorations(stack) {
        const decorations = stack.$$find("decorateNode", this);
        const list = Range.createList(decorations || []);
        return list;
    }

    /**
     * Get the depth of a descendant, with optional `startAt`.
     *
     * @param path
     * @param startAt
     */
    getDepth(path: List<number> | string, startAt: number = 1) {
        path = this.resolvePath(path);
        if (!path) return null;

        const node = this.getNode(path);
        const depth = node ? path.size - 1 + startAt : null;
        return depth;
    }

    /**
     * Get a descendant node.
     *
     * @param  path
     */
    getDescendant(
        path: List<number> | string
    ): null | any | Block | Inline | Text {
        path = this.resolvePath(path);
        if (!path) return null;

        const array = path.toArray();
        let descendant: any = this;

        for (const index of array) {
            if (!descendant) return null;
            if (!descendant.nodes) return null;
            descendant = descendant.nodes.get(index) as any;
        }

        return descendant;
    }

    /**
     * Get the first invalid descendant
     *
     * @param  schema
     * @return
     */
    getFirstInvalidDescendant(schema: Schema) {
        let result: any | null = null;

        this.nodes.find((n: any) => {
            result = n.validate(schema)
                ? n
                : n.getFirstInvalidDescendant(schema);

            return !!result;
        });

        return result;
    }

    /**
     * Get the first child text node.
     *
     * @return
     */
    getFirstText() {
        let descendant: any | null = null;

        const found = this.nodes.find((node: any) => {
            if (node.object === "text") return true;
            descendant = node.getFirstText();
            return !!descendant;
        });

        return descendant || found;
    }

    /**
     * Get a fragment of the node at a `range`.
     *
     * @param range
     * @return
     */
    getFragmentAtRange(range: Range) {
        range = range.normalize(this);

        if (range.isUnset) {
            return Document.create();
        }

        const { startPath, startOffset, endPath, endOffset } = range;
        let node = this;
        let targetPath = endPath as List<number>;
        let targetPosition = endOffset;
        let mode = "end";

        while (targetPath.size) {
            const index = targetPath.last();
            node = node.splitNode(targetPath, targetPosition);
            targetPosition = index + 1;
            targetPath = PathUtils.lift(targetPath);

            if (!targetPath.size && mode === "end") {
                targetPath = startPath as List<number>;
                targetPosition = startOffset;
                mode = "start";
            }
        }

        const startIndex = (startPath as List<number>).first() + 1;
        const endIndex = (endPath as List<number>).first() + 2;
        const nodes = node.nodes.slice(startIndex, endIndex);
        const fragment = Document.create({ nodes });
        return fragment;
    }

    /**
     * Get the furthest parent of a node that matches an `iterator`.
     *
     * @param path
     * @param iterator
     */
    getFurthest(
        path: List<number> | string,
        iterator: (
            child: any,
            index?: number,
            nodes?: Iterable<number, any>
        ) => boolean
    ) {
        const ancestors = this.getAncestors(path);
        if (!ancestors) return null;

        const furthest = ancestors.find((node, ...args) => {
            // We never want to include the top-level node.
            if ((node as any).key === this.key) return false;
            return iterator(node, ...args);
        });

        return furthest || null;
    }

    /**
     * Get the furthest ancestor of a node.
     *
     * @param  path
     */
    getFurthestAncestor(path: List<number> | string) {
        path = this.resolvePath(path);
        if (!path) return null;
        const furthest = path.size ? this.nodes.get(path.first()) : null;
        return furthest;
    }

    /**
     * Get the furthest block parent of a node.
     *
     * @param  path
     */
    getFurthestBlock(path: List<number> | string) {
        const furthest = this.getFurthest(path, n => n.object === "block");
        return furthest;
    }

    /**
     * Get the furthest inline parent of a node.
     *
     * @param  path
     */
    getFurthestInline(path: List<number> | string) {
        const furthest = this.getFurthest(path, n => n.object === "inline");
        return furthest;
    }

    /**
     * Get the furthest ancestor of a node that has only one child.
     *
     * @param path
     */
    getFurthestOnlyChildAncestor(path: List<number> | string) {
        const ancestors = this.getAncestors(path);
        if (!ancestors) return null;

        const furthest = ancestors
            .rest()
            .reverse()
            .takeUntil((p: any) => p.nodes.size > 1)
            .last();

        return furthest || null;
    }

    /**
     * Get the closest inline nodes for each text node in the node.
     *
     */
    getInlines(): List<Inline> {
        const array = this.getInlinesAsArray();
        const list = List(array);
        return list;
    }

    /**
     * Get the closest inline nodes for each text node in the node, as an array.
     */
    getInlinesAsArray(): Inline[] {
        let array: Inline[] = [];

        this.nodes.forEach((child: any) => {
            if (child.object == "text") return;

            if (child.isLeafInline()) {
                array.push(child);
            } else {
                array = array.concat(child.getInlinesAsArray());
            }
        });

        return array;
    }

    /**
     * Get the closest inline nodes for each text node in a `range`.
     *
     * @param {Range} range
     */
    getInlinesAtRange(range: Range): List<Inline> {
        const array = this.getInlinesAtRangeAsArray(range);
        // Remove duplicates by converting it to an `OrderedSet` first.
        const list = List(OrderedSet(array));
        return list;
    }

    /**
     * Get the closest inline nodes for each text node in a `range` as an array.
     *
     * @param {Range} range
     * @return {Array}
     */
    getInlinesAtRangeAsArray(range) {
        range = range.normalize(this);
        if (range.isUnset) return [];

        const array = this.getTextsAtRangeAsArray(range)
            .map((text: Text) => this.getClosestInline(text.key) as Inline)
            .filter(exists => exists);

        return array;
    }

    /**
     * Get all of the leaf inline nodes that match a `type`.
     *
     * @param  type
     */
    getInlinesByType(type: string) {
        const array: Inline[] = this.getInlinesByTypeAsArray(type);
        const list = List(array);
        return list;
    }

    /**
     * Get all of the leaf inline nodes that match a `type` as an array.
     *
     * @param type
     */
    getInlinesByTypeAsArray(type: string) {
        const array = this.nodes.reduce((inlines: Inline[], node: any) => {
            if (node.object == "text") {
                return inlines;
            } else if (node.isLeafInline() && node.type == type) {
                inlines.push(node);
                return inlines;
            } else {
                return inlines.concat(node.getInlinesByTypeAsArray(type));
            }
        }, []);

        return array;
    }

    /**
     * Get a set of the marks in a `range`.
     *
     * @param {Range} range
     */
    getInsertMarksAtRange(range: Range) {
        range = range.normalize(this);
        if (range.isUnset) return Set();

        if (range.isCollapsed) {
            // PERF: range is not cachable, use key and offset as proxies for cache
            return this.getMarksAtPosition(
                range.startKey as string,
                range.startOffset as number
            );
        }

        const { startKey, startOffset } = range;
        const text = this.getDescendant(startKey as string) as Text;
        const marks = text.getMarksAtIndex((startOffset as number) + 1);
        return marks;
    }

    /**
     * Get an object mapping all the keys in the node to their paths.
     *
     */
    getKeysToPathsTable() {
        const ret: any = {
            [this.key]: []
        };

        this.nodes.forEach((node: any, i: number) => {
            ret[node.key] = [i];

            if (node.object !== "text") {
                const nested = node.getKeysToPathsTable();

                for (const key in nested) {
                    const path = nested[key];
                    ret[key] = [i, ...path];
                }
            }
        });

        return ret;
    }

    /**
     * Get the last child text node.
     *
     */
    getLastText() {
        let descendant: null | any = null;

        const found = this.nodes.findLast((node: any) => {
            if (node.object == "text") return true;
            descendant = node.getLastText() as any;
            return !!descendant;
        });

        return descendant || found;
    }

    /**
     * Get all of the marks for all of the characters of every text node.
     */
    getMarks(): Set<Mark> {
        const array: Mark[] = this.getMarksAsArray();
        const set = Set(array);
        return set;
    }

    /**
     * Get all of the marks as an array.
     *
     */
    getMarksAsArray() {
        const result: Array<Mark[]> = [];

        this.nodes.forEach((node: any) => {
            result.push(node.getMarksAsArray());
        });

        // PERF: use only one concat rather than multiple for speed.
        const array = ([] as Mark[]).concat(...result);
        return array;
    }

    /**
     * Get a set of marks in a `position`, the equivalent of a collapsed range
     *
     * @param {string} key
     * @param {number} offset
     */
    getMarksAtPosition(key: string, offset: number): OrderedSet<Mark> {
        const text = this.getDescendant(key) as Text;
        const currentMarks = text.getMarksAtIndex(offset) as OrderedSet<Mark>;
        if (offset !== 0) return currentMarks;
        const closestBlock = this.getClosestBlock(key);

        if ((closestBlock as Block).text === "") {
            // insert mark for empty block; the empty block are often created by split node or add marks in a range including empty blocks
            return currentMarks;
        }

        const previous = this.getPreviousText(key);
        if (!previous) return Set();

        if ((closestBlock as Block).hasDescendant(previous.key)) {
            return previous.getMarksAtIndex(previous.text.length) as OrderedSet<
                Mark
            >;
        }

        return currentMarks as OrderedSet<Mark>;
    }

    /**
     * Get a set of the marks in a `range`.
     */
    getMarksAtRange(range: Range): Set<Mark> {
        const marks: Set<Mark> = Set(this.getOrderedMarksAtRange(range)) as Set<
            Mark
        >;
        return marks;
    }

    /**
     * Get all of the marks that match a `type`.
     */
    getMarksByType(type: string): Set<Mark> {
        const array: Mark[] = this.getMarksByTypeAsArray(type);
        const set: Set<Mark> = Set(array);
        return set;
    }

    /**
     * Get all of the marks that match a `type` as an array.
     *
     * @param type
     */
    getMarksByTypeAsArray(type: string): Mark[] {
        const array = this.nodes.reduce((memo: Mark[], node: any) => {
            return node.object == "text"
                ? memo.concat(
                      node.getMarksAsArray().filter(m => m.type == type)
                  )
                : memo.concat(node.getMarksByTypeAsArray(type));
        }, []);

        return array;
    }

    /**
     * Get the block node before a descendant text node by `key`.
     *
     * @param key
     */
    getNextBlock(key: string) {
        const child = this.assertDescendant(key) as any;
        let last;

        if (child.object == "block") {
            last = child.getLastText();
        } else {
            const block = this.getClosestBlock(key) as Block;
            last = block.getLastText();
        }

        const next = this.getNextText(last.key);
        if (!next) return null;

        const closest = this.getClosestBlock(next.key);
        return closest;
    }

    /**
     * Get the next node in the tree from a node.
     *
     * This will not only check for siblings but instead move up the tree
     * returning the next ancestor if no sibling is found.
     *
     * @param {List|String} path
     */
    getNextNode(path: List<number> | string) {
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

    /**
     * Get the next sibling of a node.
     *
     * @param path
     */
    getNextSibling(path: List<number> | string) {
        path = this.resolvePath(path);
        if (!path) return null;
        if (!path.size) return null;
        const p = PathUtils.increment(path);
        const sibling = this.getNode(p);
        return sibling;
    }

    /**
     * Get the text node after a descendant text node.
     *
     * @param  path
     */
    getNextText(path: List<number> | string) {
        path = this.resolvePath(path);
        if (!path) return null;
        if (!path.size) return null;
        const next = this.getNextNode(path);
        if (!next) return null;
        const text = next.getFirstText();
        return text;
    }

    /**
     * Get a node in the tree.
     *
     * @param {List|String} path
     */
    getNode(path: List<number> | string) {
        path = this.resolvePath(path);
        if (!path) return null;
        const node = path.size ? this.getDescendant(path) : this;
        return node;
    }

    /**
     * Get the offset for a descendant text node by `key`.
     *
     * @param key
     */
    getOffset(key: string) {
        this.assertDescendant(key);

        // Calculate the offset of the nodes before the highest child.
        const child = this.getFurthestAncestor(key) as any;
        const offset = this.nodes
            .takeUntil(n => n == child)
            .reduce((memo: number, n: any) => memo + n.text.length, 0);

        // Recurse if need be.
        const ret = this.hasChild(key) ? offset : offset + child.getOffset(key);
        return ret;
    }

    /**
     * Get the offset from a `range`.
     *
     * @param {Range} range
     */
    getOffsetAtRange(range: Range) {
        range = range.normalize(this);

        if (range.isUnset) {
            throw new Error(
                "The range cannot be unset to calculcate its offset."
            );
        }

        if (range.isExpanded) {
            throw new Error(
                "The range must be collapsed to calculcate its offset."
            );
        }

        const { startKey, startOffset } = range;
        const offset = this.getOffset(startKey as string) + startOffset;
        return offset;
    }

    /**
     * Get all of the marks for all of the characters of every text node.
     *
     */
    getOrderedMarks(): OrderedSet<Mark> {
        const array = this.getMarksAsArray();
        const set = OrderedSet(array);
        return set;
    }

    /**
     * Get a set of the marks in a `range`.
     *
     * @param {Range} range
     */
    getOrderedMarksAtRange(range: Range): OrderedSet<Mark> {
        range = range.normalize(this);
        if (range.isUnset) return OrderedSet();

        if (range.isCollapsed) {
            // PERF: range is not cachable, use key and offset as proxies for cache
            return this.getMarksAtPosition(
                range.startKey as string,
                range.startOffset as number
            );
        }

        const { startKey, startOffset, endKey, endOffset } = range;
        const marks = this.getOrderedMarksBetweenPositions(
            startKey as string,
            startOffset as number,
            endKey as string,
            endOffset as number
        );

        return marks;
    }

    /**
     * Get a set of the marks in a `range`.
     * PERF: arguments use key and offset for utilizing cache
     *
     * @param {string} startKey
     * @param {number} startOffset
     * @param {string} endKey
     * @param {number} endOffset
     */
    getOrderedMarksBetweenPositions(
        startKey: string,
        startOffset: number,
        endKey: string,
        endOffset: number
    ): OrderedSet<Mark> {
        if (startKey === endKey) {
            const startText = this.getDescendant(startKey) as any;
            return startText.getMarksBetweenOffsets(startOffset, endOffset);
        }

        const texts = this.getTextsBetweenPositionsAsArray(startKey, endKey);

        return OrderedSet().withMutations((result: Set<Mark>) => {
            texts.forEach((text: any) => {
                if (text.key === startKey) {
                    result.union(
                        text.getMarksBetweenOffsets(
                            startOffset,
                            text.text.length
                        )
                    );
                } else if (text.key === endKey) {
                    result.union(text.getMarksBetweenOffsets(0, endOffset));
                } else {
                    result.union(text.getMarks());
                }
            });
        }) as OrderedSet<Mark>;
    }

    /**
     * Get all of the marks that match a `type`.
     *
     * @param {String} type
     */
    getOrderedMarksByType(type: string): OrderedSet<Mark> {
        const array = this.getMarksByTypeAsArray(type);
        const set = OrderedSet(array);
        return set;
    }

    /**
     * Get the parent of a descendant node.
     *
     * @param {List|String} path
     */
    getParent(path: List<number> | string) {
        path = this.resolvePath(path);
        if (!path) return null;
        if (!path.size) return null;
        const parentPath = PathUtils.lift(path);
        const parent = this.getNode(parentPath);
        return parent;
    }

    /**
     * Find the path to a node.
     *
     * @param {String|List} key
     */
    getPath(key: List<number> | string) {
        // Handle the case of passing in a path directly, to match other methods.
        if (List.isList(key)) return key;

        const dict = this.getKeysToPathsTable();
        const path = dict[key as string];
        return path ? List(path) : null;
    }

    /**
     * Get the block node before a descendant text node by `key`.
     *
     * @param {String} key
     */
    getPreviousBlock(key: string) {
        const child = this.assertDescendant(key) as any;
        let first;

        if (child.object == "block") {
            first = child.getFirstText();
        } else {
            const block = this.getClosestBlock(key);
            first = (block as Block).getFirstText();
        }

        const previous = this.getPreviousText(first.key);
        if (!previous) return null;

        const closest = this.getClosestBlock(previous.key);
        return closest;
    }

    /**
     * Get the previous node from a node in the tree.
     *
     * This will not only check for siblings but instead move up the tree
     * returning the previous ancestor if no sibling is found.
     *
     * @param {List|String} path
     */
    getPreviousNode(path: List<number> | string) {
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

    /**
     * Get the previous sibling of a node.
     *
     * @param {List|String} path
     */
    getPreviousSibling(path: List<number> | string) {
        path = this.resolvePath(path);
        if (!path) return null;
        if (!path.size) return null;
        if (path.last() === 0) return null;
        const p = PathUtils.decrement(path);
        const sibling = this.getNode(p);
        return sibling;
    }

    /**
     * Get the text node after a descendant text node.
     *
     * @param {List|String} path
     */
    getPreviousText(path: List<number> | string): Text | null {
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
     */
    getSelectionIndexes(range: Range, isSelected: boolean = true): any {
        const { startKey, endKey } = range;

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
        if (startKey == endKey) {
            const child = this.getFurthestAncestor(startKey as string);
            const index = child ? this.nodes.indexOf(child) : -1;
            return { start: index, end: index + 1 };
        }

        // Otherwise, check all of the children...
        let start: number = -1;
        let end: number = -1;

        this.nodes.forEach((child: any, i: number) => {
            if (child.object == "text") {
                if (start == null && child.key == startKey) start = i;
                if (end == null && child.key == endKey) end = i + 1;
            } else {
                if (start == null && child.hasDescendant(startKey)) start = i;
                if (end == null && child.hasDescendant(endKey)) end = i + 1;
            }

            // PERF: exit early if both start and end have been found.
            return start === -1 || end === -1;
        });

        if (isSelected && start == null) start = 0;
        if (isSelected && end == null) end = this.nodes.size;
        return start == null ? null : { start, end };
    }

    /**
     * Get the concatenated text string of all child nodes.
     *
     */
    getText() {
        const text = this.nodes.reduce((string: string, node: any) => {
            return string + node.text;
        }, "");

        return text;
    }

    /**
     * Get the descendent text node at an `offset`.
     *
     * @param {String} offset
     */
    getTextAtOffset(offset: number) {
        // PERF: Add a few shortcuts for the obvious cases.
        if (offset === 0) return this.getFirstText();
        if (offset === this.text.length) return this.getLastText();
        if (offset < 0 || offset > this.text.length) return null;

        let length = 0;
        const text = this.getTexts().find(
            (node: Text, i: number, nodes: List<Text>) => {
                length += node.text.length;
                return length > offset;
            }
        );

        return text;
    }

    /**
     * Get the direction of the node's text.
     *
     * @return {String}
     */
    getTextDirection() {
        const dir = direction(this.text);
        return dir === "neutral" ? null : dir;
    }

    /**
     * Recursively get all of the child text nodes in order of appearance.
     */
    getTexts(): List<Text> {
        const array: Text[] = this.getTextsAsArray();
        const list = List(array);
        return list;
    }

    /**
     * Recursively get all the leaf text nodes in order of appearance, as array.
     *
     */
    getTextsAsArray() {
        let array: Text[] = [];

        this.nodes.forEach((node: any) => {
            if (node.object == "text") {
                array.push(node);
            } else {
                array = array.concat(node.getTextsAsArray());
            }
        });

        return array;
    }

    /**
     * Get all of the text nodes in a `range`.
     *
     * @param {Range} range
     */
    getTextsAtRange(range: Range) {
        range = range.normalize(this);
        if (range.isUnset) return List();
        const { startKey, endKey } = range;
        const list = List(
            this.getTextsBetweenPositionsAsArray(
                startKey as string,
                endKey as string
            )
        );

        return list;
    }

    /**
     * Get all of the text nodes in a `range` as an array.
     */
    getTextsAtRangeAsArray(range: Range): Text[] {
        range = range.normalize(this);
        if (range.isUnset) return [];
        const { startKey, endKey } = range;
        const texts: Text[] = this.getTextsBetweenPositionsAsArray(
            startKey as string,
            endKey as string
        ) as Text[];
        return texts;
    }

    /**
     * Get all of the text nodes in a `range` as an array.
     * PERF: use key in arguments for cache
     *
     * @param {string} startKey
     * @param {string} endKey
     */
    getTextsBetweenPositionsAsArray(startKey: string, endKey: string) {
        const startText = this.getDescendant(startKey) as any;

        // PERF: the most common case is when the range is in a single text node,
        // where we can avoid a lot of iterating of the tree.
        if (startKey == endKey) return [startText];

        const endText = this.getDescendant(endKey) as any;
        const texts = this.getTextsAsArray();
        const start = texts.indexOf(startText);
        const end = texts.indexOf(endText, start);
        const ret = texts.slice(start, end + 1);
        return ret;
    }

    /**
     * Check if the node has block children.
     *
     */
    hasBlockChildren(): boolean {
        return !!(
            this.nodes && this.nodes.find((n: any) => n.object === "block")
        );
    }

    /**
     * Check if a child node exists.
     *
     * @param {List|String} path
     */
    hasChild(path: List<number> | string) {
        const child = this.getChild(path);
        return !!child;
    }

    /**
     * Check if a node has inline children.
     *
     */
    hasInlineChildren(): boolean {
        return !!(
            this.nodes &&
            this.nodes.find(
                (n: any) => n.object === "inline" || n.object === "text"
            )
        );
    }

    /**
     * Recursively check if a child node exists.
     *
     * @param {List|String} path
     */
    hasDescendant(path: List<number> | string): boolean {
        const descendant = this.getDescendant(path);
        return !!descendant;
    }

    /**
     * Recursively check if a node exists.
     *
     * @param {List|String} path
     */
    hasNode(path: List<number> | string): boolean {
        const node = this.getNode(path);
        return !!node;
    }

    /**
     * Check if a node has a void parent.
     *
     * @param {List|String} path
     */
    hasVoidParent(path: List<number> | string): boolean {
        const closest = this.getClosestVoid(path);
        return !!closest;
    }

    /**
     * Insert a `node`.
     *
     * @param {List|String} path
     * @param {Node} node
     */
    insertNode(path: List<number> | string, node: Block | Inline) {
        path = this.resolvePath(path);
        const index = path.last();
        const parentPath = PathUtils.lift(path);
        let parent: any = this.assertNode(parentPath);
        const nodes = parent.nodes.splice(index, 0, node);
        parent = (parent as any).set("nodes", nodes);
        const ret = this.replaceNode(parentPath, parent);
        return ret;
    }

    /**
     * Insert `text` at `offset` in node by `path`.
     *
     * @param {List|String} path
     * @param {Number} offset
     * @param {String} text
     * @param {Set} marks
     */
    insertText(
        path: List<number> | string,
        offset: number,
        text: string,
        marks: Set<Mark>
    ) {
        let node = this.assertDescendant(path);
        path = this.resolvePath(path);
        node = node.insertText(offset, text, marks);
        const ret = this.replaceNode(path, node);
        return ret;
    }

    /**
     * Check whether the node is a leaf block.
     *
     */
    isLeafBlock() {
        return (
            this.object === "block" &&
            this.nodes.every((n: any) => n.object !== "block")
        );
    }

    /**
     * Check whether the node is a leaf inline.
     *
     */
    isLeafInline() {
        return (
            this.object === "inline" &&
            this.nodes.every((n: any) => n.object !== "inline")
        );
    }

    /**
     * Map all child nodes, updating them in their parents. This method is
     * optimized to not return a new node if no changes are made.
     *
     * @param {Function} iterator
     */
    mapChildren(iterator) {
        let { nodes } = this;

        nodes.forEach((node, i) => {
            const ret = iterator(node, i, this.nodes);
            if (ret !== node) nodes = nodes.set(ret.key, ret);
        });

        const ret = (this as any).set("nodes", nodes);
        return ret;
    }

    /**
     * Map all descendant nodes, updating them in their parents. This method is
     * optimized to not return a new node if no changes are made.
     *
     * @param {Function} iterator
     */
    mapDescendants(iterator) {
        let { nodes } = this;

        nodes.forEach((node: any, index: number) => {
            let ret = node;
            if (ret.object !== "text") ret = ret.mapDescendants(iterator);
            ret = iterator(ret, index, this.nodes);
            if (ret === node) return;

            nodes = nodes.set(index, ret);
        });

        const ret = (this as any).set("nodes", nodes);
        return ret;
    }

    /**
     * Merge a node backwards its previous sibling.
     *
     * @param {List|Key} path
     */
    mergeNode(path) {
        const b = this.assertNode(path) as any;
        path = this.resolvePath(path);

        if (path.last() === 0) {
            throw new Error(
                `Unable to merge node because it has no previous sibling: ${b}`
            );
        }

        const withPath = PathUtils.decrement(path);
        const a = this.assertNode(withPath) as any;

        if (a.object !== b.object) {
            throw new Error(
                `Unable to merge two different kinds of nodes: ${a} and ${b}`
            );
        }

        const newNode =
            a.object === "text"
                ? a.mergeText(b)
                : a.set("nodes", a.nodes.concat(b.nodes));

        let ret: any = this;
        ret = ret.removeNode(path);
        ret = ret.removeNode(withPath);
        ret = ret.insertNode(withPath, newNode as any);
        return ret;
    }

    /**
     * Move a node by `path` to `newPath`.
     *
     * A `newIndex` can be provided when move nodes by `key`, to account for not
     * being able to have a key for a location in the tree that doesn't exist yet.
     *
     * @param {List|Key} path
     * @param {List|Key} newPath
     * @param {Number} newIndex
     */
    moveNode(path, newPath, newIndex = 0): any {
        const node = this.assertNode(path);
        path = this.resolvePath(path);
        newPath = this.resolvePath(newPath, newIndex);

        const newParentPath = PathUtils.lift(newPath);
        this.assertNode(newParentPath);

        const [p, np] = PathUtils.crop(path, newPath);
        const position = PathUtils.compare(p, np);

        // If the old path ends above and before a node in the new path, then
        // removing it will alter the target, so we need to adjust the new path.
        if (path.size < newPath.size && position === -1) {
            newPath = PathUtils.decrement(newPath, 1, p.size - 1);
        }

        let ret: any = this;
        ret = ret.removeNode(path);
        ret = ret.insertNode(newPath, node);
        return ret;
    }

    /**
     * Normalize the node with a `schema`.
     *
     * @param {Schema} schema
     */
    normalize(schema) {
        return schema.normalizeNode(this);
    }

    /**
     * Attempt to "refind" a node by a previous `path`, falling back to looking
     * it up by `key` again.
     *
     * @param {List|String} path
     * @param {String} key
     */
    refindNode(path: List<number> | string, key: string): any | null {
        const node = this.getDescendant(path);
        const found = node && node.key === key ? node : this.getDescendant(key);
        return found as any;
    }

    /**
     * Attempt to "refind" the path to a node by a previous `path`, falling back
     * to looking it up by `key`.
     *
     * @param {List|String} path
     * @param {String} key
     */
    refindPath(path: List<number> | string, key: string) {
        const node = this.getDescendant(path);
        const found = node && node.key === key ? path : this.getPath(key);
        return found;
    }

    /**
     * Regenerate the node's key.
     *
     */
    regenerateKey() {
        const key = KeyUtils.create();
        const node = (this as any).set("key", key);
        return node;
    }

    /**
     * Remove mark from text at `offset` and `length` in node.
     *
     * @param {List} path
     * @param {Number} offset
     * @param {Number} length
     * @param {Mark} mark
     * @return {Node}
     */
    removeMark(
        path: List<number> | string,
        offset: number,
        length: number,
        mark: Mark
    ) {
        let node: any = this.assertDescendant(path) as Text;
        path = this.resolvePath(path);
        node = node.removeMark(offset, length, mark);
        const ret = this.replaceNode(path, node);
        return ret;
    }

    /**
     * Remove a node.
     *
     * @param {List|String} path
     */
    removeNode(path) {
        this.assertDescendant(path);
        path = this.resolvePath(path);
        const deep = path.flatMap(x => List(["nodes", x]));
        const ret = (this as any).deleteIn(deep);
        return ret;
    }

    /**
     * Remove `text` at `offset` in node.
     */
    removeText(
        path: List<number> | string,
        offset: number,
        text: string = ""
    ): any {
        let node: any = this.assertDescendant(path);
        node = node.removeText(offset, text.length);
        const ret: any = this.replaceNode(path, node);
        return ret;
    }

    /**
     * Replace a `node` in the tree.
     */
    replaceNode(
        path: string | List<number>,
        node: any | Block | Inline | Text
    ): any | Block | Inline | Text {
        path = this.resolvePath(path);

        if (!path) {
            throw new Error(
                `Unable to replace a node because it could not be found in the first place: ${path}`
            );
        }

        if (!path.size) return node;
        this.assertNode(path);
        const deep = path.flatMap(x => List(["nodes", x]));
        const ret = (this as any).setIn(deep, node);
        return ret;
    }

    /**
     * Resolve a path from a path list or key string.
     *
     * An `index` can be provided, in which case paths created from a key string
     * will have the index pushed onto them. This is helpful in cases where you
     * want to accept either a `path` or a `key, index` combination for targeting
     * a location in the tree that doesn't exist yet, like when inserting.
     */
    resolvePath(path: List<number> | string, index?: number): List<number> {
        let ret: List<number> | null;
        if (typeof path === "string") {
            ret = this.getPath(path) as List<number>;

            if (index != null) {
                path = (path as any).concat(index);
            }
        } else {
            ret = PathUtils.create(path);
        }

        return ret as List<number>;
    }

    /**
     *
     * @param point
     */
    resolvePoint(point) {
        point = Point.create(point);
        point = point.normalize(this);
        return point;
    }

    /**
     * Resolve a `range`, relative to the node, ensuring that the keys and
     * offsets in the range exist and that they are synced with the paths.
     *
     * @param {Range|Object} range
     */
    resolveRange(range: any | Range) {
        range = Range.create(range);
        range = range.normalize(this);
        return range;
    }

    /**
     * Set `properties` on a node.
     *
     * @param {List|String} path
     * @param {Object} properties
     */
    setNode(path: List<number> | string, properties: any) {
        let node: any = this.assertNode(path);
        node = node.merge(properties);
        const ret = this.replaceNode(path, node);
        return ret;
    }

    /**
     * Set `properties` on `mark` on text at `offset` and `length` in node.
     *
     * @param {List|String} path
     * @param {Number} offset
     * @param {Number} length
     * @param {Mark} mark
     * @param {Object} properties
     */
    setMark(path, offset, length, mark, properties) {
        let node: any = this.assertNode(path);
        node = node.updateMark(offset, length, mark, properties);
        const ret = this.replaceNode(path, node);
        return ret;
    }

    /**
     * Split a node by `path` at `position` with optional `properties` to apply
     * to the newly split node.
     *
     * @param {List|String} path
     * @param {Number} position
     * @param {Object} properties
     */
    splitNode(path, position, properties?: any) {
        const child = this.assertNode(path) as any;
        path = this.resolvePath(path);
        let a;
        let b;

        if (child.object === "text") {
            [a, b] = child.splitText(position);
        } else {
            const befores = child.nodes.take(position);
            const afters = child.nodes.skip(position);
            a = child.set("nodes", befores);
            b = (child.set("nodes", afters) as any).regenerateKey();
        }

        if (properties && child.object !== "text") {
            b = b.merge(properties);
        }

        let ret: any = this;
        ret = ret.removeNode(path);
        ret = ret.insertNode(path, b);
        ret = ret.insertNode(path, a);
        return ret;
    }

    /**
     * Validate the node against a `schema`.
     *
     * @param {Schema} schema
     */
    validate(schema) {
        return schema.validateNode(this);
    }

    /**
     * Deprecated.
     */
    getNodeAtPath(path: List<number> | string) {
        logger.deprecate(
            `0.35.0`,
            "The `Node.getNodeAtPath` method has been combined into `Node.getNode`."
        );

        return this.getNode(path);
    }

    getDescendantAtPath(path: List<number> | string) {
        logger.deprecate(
            `0.35.0`,
            "The `Node.getDescendantAtPath` has been combined into `Node.getDescendant`."
        );

        return this.getDescendant(path);
    }

    getKeys() {
        logger.deprecate(`0.35.0`, "The `Node.getKeys` method is deprecated.");

        const keys: string[] = this.getKeysAsArray();
        return Set(keys);
    }

    getKeysAsArray() {
        logger.deprecate(
            `0.35.0`,
            "The `Node.getKeysAsArray` method is deprecated."
        );

        const dict = this.getKeysToPathsTable();
        const keys: string[] = [];

        for (const key in dict) {
            if (this.key !== key) {
                keys.push(key);
            }
        }

        return keys;
    }

    /**
     * true if the node has both descendants in that order, false otherwise. The
     * order is depth-first, post-order
     * @param first
     * @param second
     */
    areDescendantsSorted(first, second) {
        logger.deprecate(
            `0.35.0`,
            "The `Node.areDescendantsSorted` method is deprecated. Use the new `PathUtils.compare` helper instead."
        );

        first = KeyUtils.create(first);
        second = KeyUtils.create(second);

        const keys: string[] = this.getKeysAsArray().filter(
            k => k !== this.key
        );
        const firstIndex = keys.indexOf(first);
        const secondIndex = keys.indexOf(second);
        if (firstIndex == -1 || secondIndex == -1) return null;

        return firstIndex < secondIndex;
    }

    isInRange(range) {
        logger.deprecate(
            `0.35.0`,
            "The `Node.isInRange` method is deprecated. Use the new `PathUtils.compare` helper instead."
        );

        range = range.normalize(this);

        const node = this;
        const { startKey, endKey, isCollapsed } = range;

        // PERF: solve the most common cast where the start or end key are inside
        // the node, for collapsed selections.
        if (
            node.key == startKey ||
            node.key == endKey ||
            node.hasDescendant(startKey) ||
            node.hasDescendant(endKey)
        ) {
            return true;
        }

        // PERF: if the selection is collapsed and the previous check didn't return
        // true, then it must be false.
        if (isCollapsed) {
            return false;
        }

        // Otherwise, look through all of the leaf text nodes in the range, to see
        // if any of them are inside the node.
        const texts = node.getTextsAtRange(range) as List<Text>;
        let memo = false;

        texts.forEach((text: Text) => {
            if (node.hasDescendant(text.key)) memo = true;
            return memo;
        });

        return memo;
    }

    // Mix in assertion variants.

    /**
     * assert that a node has a child by key and return it
     * @param path
     */
    assertChild(path: List<number> | string) {
        const ret = this.getChild(path);
        if (!ret) {
            throw new Error(
                `\`Node.assert method\` could not find node with path or key: ${path}`
            );
        }
        return ret;
    }

    assertDepth(path: List<number> | string, startAt = 1) {
        const ret = this.getDepth(path, startAt);
        if (!ret) {
            throw new Error(
                `\`Node.assert method\` could not find node with path or key: ${path}`
            );
        }
        return ret;
    }

    assertDescendant(key: string | List<number>) {
        const ret = this.getDescendant(key);
        if (!ret) {
            throw new Error(
                `\`Node.assert method\` could not find node with path or key: ${key}`
            );
        }
        return ret;
    }

    assertNode(path: List<number> | string) {
        const ret = this.getNode(path);
        if (!ret) {
            throw new Error(
                `\`Node.assert method\` could not find node with path or key: ${path}`
            );
        }
        return ret;
    }

    assertParent() {
        const ret = this.assertParent();
        if (!ret) {
            throw new Error(
                `\`Node.assert method\` could not find node with path or key`
            );
        }
        return ret;
    }

    assertPath(path: List<number> | string) {
        const ret = this.getPath(path);
        if (!ret) {
            throw new Error(
                `\`Node.assert method\` could not find node with path or key: ${path}`
            );
        }
        return ret;
    }
}

memoize(Node.prototype, [
    "getBlocksAsArray",
    "getBlocksAtRangeAsArray",
    "getBlocksByTypeAsArray",
    "getDecorations",
    "getFirstInvalidDescendant",
    "getFirstText",
    "getFragmentAtRange",
    "getInlinesAsArray",
    "getInlinesAtRangeAsArray",
    "getInlinesByTypeAsArray",
    "getMarksAsArray",
    "getMarksAtPosition",
    "getOrderedMarksBetweenPositions",
    "getInsertMarksAtRange",
    "getKeysToPathsTable",
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
    "validate"
]);

Object.getOwnPropertyNames(Node.prototype).forEach(method => {
    if (method === "constructor") return;
    Block.prototype[method] = Node.prototype[method];
    Inline.prototype[method] = Node.prototype[method];
    Document.prototype[method] = Node.prototype[method];
});

Block.createChildren = Node.createList;
Inline.createChildren = Node.createList;
Document.createChildren = Node.createList;

export default Node;
