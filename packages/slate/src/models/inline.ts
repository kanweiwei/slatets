import isPlainObject from "is-plain-object";
import logger from "slate-dev-logger";
import { List, Map, Record } from "immutable";

import MODEL_TYPES from "../constants/model-types";
import KeyUtils from "../utils/key-utils";

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
    public isVoid: string;
    public data: Map<any, any>;
    public nodes: List<any>;

    static create(attrs: any = {}): Inline {
        if (Inline.isInline(attrs)) {
            return attrs;
        }

        if (typeof attrs == "string") {
            attrs = { type: attrs };
        }

        if (isPlainObject(attrs)) {
            return Inline.fromJSON(attrs);
        }

        throw new Error(
            `\`Inline.create\` only accepts objects, strings or inlines, but you passed it: ${attrs}`
        );
    }

    static createList(elements: Array<any> = []): List<Inline> {
        if (List.isList(elements) || Array.isArray(elements)) {
            const list = List(elements.map(Inline.create));
            return list;
        }

        throw new Error(
            `\`Inline.createList\` only accepts arrays or lists, but you passed it: ${elements}`
        );
    }

    static fromJSON(object) {
        if (Inline.isInline(object)) {
            return object;
        }

        const {
            data = {},
            isVoid = false,
            key = KeyUtils.create(),
            nodes = [],
            type
        } = object;

        if (typeof type != "string") {
            throw new Error("`Inline.fromJS` requires a `type` string.");
        }

        const inline = new Inline({
            key,
            type,
            isVoid: !!isVoid,
            data: Map(data),
            nodes: Inline.createChildren(nodes)
        });

        return inline;
    }

    /**
     * fromJSON的别名
     */
    static fromJS = Inline.fromJSON;

    static isInline(obj) {
        return !!(obj && obj[MODEL_TYPES.INLINE]);
    }

    static isInlineList(any) {
        return List.isList(any) && any.every(item => Inline.isInline(item));
    }

    static createChildren: (nodes) => List<any>;

    get object(): "inline" {
        return "inline";
    }

    get kind(): "inline" {
        logger.deprecate(
            "slate@0.32.0",
            "The `kind` property of Slate objects has been renamed to `inline`."
        );
        return this.object;
    }

    isEmpty() {
        return !this.isVoid && !this.nodes.some(child => !child.isEmpty());
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
            nodes: this.nodes.toArray().map((n: any) => n.toJSON(options))
        };

        if (options.preserveKeys) {
            object.key = this.key;
        }

        return object;
    }

    /**
     * Alias `toJS`.
     */
    toJS(options: any = {}) {
        return this.toJSON(options);
    }

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
