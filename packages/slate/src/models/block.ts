import isPlainObject from "is-plain-object";
import logger from "slate-dev-logger";
import { List, Map, Record } from "immutable";

import MODEL_TYPES, { isType } from "../constants/model-types";
import generateKey from "../utils/generate-key";
import Inline from "./inline";
import Text from "./text";

import Node from "./node";
import { TNode } from "./node";
import applyMixins from "../utils/applyMixins";
import Mark from "./mark";

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
 * Block
 * @type {Block}
 */
class Block extends Record(DEFAULTS) implements Node {
    public key: string;
    public type: string;
    public isVoid: string;
    public data: Map<any, any>;
    public nodes: List<Block & Inline & Text>;

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

    static createList(attrs: Array<any>): List<Block> {
        if (List.isList(attrs) || Array.isArray(attrs)) {
            const list: List<Block> = List(attrs.map(Block.create));
            return list;
        }

        throw new Error(
            `\`Block.createList\` only accepts arrays or lists, but you passed it: ${attrs}`
        );
    }

    static fromJSON(obj) {
        if (Block.isBlock(obj)) {
            return obj;
        }

        const {
            data = {},
            isVoid = false,
            key = generateKey(),
            nodes = [],
            type
        } = obj;

        if (typeof type !== "string") {
            throw new Error("`Block.fromJSON` requires a `type` string.");
        }

        const block = new Block({
            key,
            type,
            isVoid: !!isVoid,
            data: Map(data),
            nodes: Block.createChildren(nodes)
        });
        return block;
    }

    /**
     * fromJSON的别名
     */
    static fromJS = Block.fromJSON;

    static isBlock: (item: any) => boolean = isType.bind(null, "BLOCK");
    /**
     * 确认参数any是否是一个block组成的list
     */
    static isBlockList(any) {
        return (
            List.isList(any) && any.every((item: any) => Block.isBlock(item))
        );
    }

    static createChildren = Node.createList;

    get object(): "block" {
        return "block";
    }

    get kind(): "block" {
        logger.deprecate(
            "slate@0.32.0",
            "The `kind` property of Slate objects has been renamed to `object`."
        );
        return this.object;
    }

    // 所有子节点的text拼接后的结果
    get text(): string {
        return this.getText();
    }

    toJSON(options: any = {}): any {
        const object: any = {
            object: this.object,
            type: this.type,
            isVoid: this.isVoid,
            data: (this.data as any).toJSON(),
            nodes: this.nodes.toArray().map(n => n.toJSON(options))
        };

        if (options.hasOwnProperty("preserveKeys")) {
            object.key = this.key;
        }

        return object;
    }

    toJS(options = {}) {
        return this.toJSON(options);
    }

    isEmpty() {
        return (
            !this.isVoid && !this.nodes.some((child: TNode) => !child.isEmpty())
        );
    }

    addMark: (
        path: List<number> | string,
        offset: number,
        length: number,
        mark: Mark
    ) => TNode | Block | Inline;
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

applyMixins(Block, [Node]);

Block.prototype[MODEL_TYPES.BLOCK] = true;

export default Block;
