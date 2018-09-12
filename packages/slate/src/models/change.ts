import Debug from "debug";
import isPlainObject from "is-plain-object";
import logger from "slate-dev-logger";
import pick from "lodash/pick";
import { List } from "immutable";

import MODEL_TYPES from "../constants/model-types";
import Changes from "../changes";
import Operation from "./operation";
import apply from "../operations/apply";
import Value from "./value";

/**
 * Debug.
 *
 * @type {Function}
 */

const debug = Debug("slate:change");

/**
 * Change.
 *
 * @type {Change}
 */

class Change {
    public value: Value;
    public operations: List<Operation>;
    public flags: any;
    /**
     * Check if `any` is a `Change`.
     *
     * @param {Any} any
     * @return {Boolean}
     */

    static isChange(obj) {
        return !!(obj && obj[MODEL_TYPES.CHANGE]);
    }

    /**
     * Create a new `Change` with `attrs`.
     *
     * @param {Object} attrs
     *   @property {Value} value
     */

    constructor(attrs: any = {}) {
        const { value } = attrs;
        this.value = value;
        this.operations = List();

        this.flags = {
            normalize: true,
            ...pick(attrs, ["merge", "save", "normalize"])
        };
    }

    /**
     * Object.
     *
     * @return {String}
     */

    get object() {
        return "change";
    }

    get kind() {
        logger.deprecate(
            "slate@0.32.0",
            "The `kind` property of Slate objects has been renamed to `object`."
        );
        return this.object;
    }

    /**
     * Apply an `operation` to the current value, saving the operation to the
     * history if needed.
     *
     * @param {Operation|Object} operation
     * @param {Object} options
     * @return {Change}
     */
    applyOperation(operation, options: any = {}) {
        const { operations, flags } = this;
        let { value } = this;
        let { history } = value;

        // Add in the current `value` in case the operation was serialized.
        if (isPlainObject(operation)) {
            operation = { ...operation, value };
        }

        operation = Operation.create(operation);

        // Default options to the change-level flags, this allows for setting
        // specific options for all of the operations of a given change.
        options = { ...flags, ...options };

        // Derive the default option values.
        const {
            merge = operations.size == 0 ? null : true,
            save = true,
            skip = null
        } = options;

        // Apply the operation to the value.
        debug("apply", { operation, save, merge });
        value = apply(value, operation);

        // If needed, save the operation to the history.
        if (history && save) {
            history = history.save(operation, { merge, skip });
            value = (value as any).set("history", history);
        }

        // Update the mutable change object.
        this.value = value;
        this.operations = operations.push(operation);
        return this;
    }

    /**
     * Apply a series of `operations` to the current value.
     *
     * @param {Array|List} operations
     * @param {Object} options
     * @return {Change}
     */

    applyOperations(operations, options) {
        operations.forEach(op => this.applyOperation(op, options));
        return this;
    }

    /**
     * Call a change `fn` with arguments.
     *
     * @param {Function} fn
     * @param {Mixed} ...args
     * @return {Change}
     */

    call(fn, ...args) {
        fn(this, ...args);
        return this;
    }

    /**
     * Applies a series of change mutations, deferring normalization to the end.
     *
     * @param {Function} fn
     * @return {Change}
     */

    withoutNormalization(fn) {
        const original = this.flags.normalize;
        this.setOperationFlag("normalize", false);
        fn(this);
        this.setOperationFlag("normalize", original);
        // this.normalizeDocument()
        return this;
    }

    /**
     * Set an operation flag by `key` to `value`.
     *
     * @param {String} key
     * @param {Any} value
     * @return {Change}
     */

    setOperationFlag(key, value) {
        this.flags[key] = value;
        return this;
    }

    /**
     * Get the `value` of the specified flag by its `key`. Optionally accepts an `options`
     * object with override flags.
     *
     * @param {String} key
     * @param {Object} options
     * @return {Change}
     */

    getFlag(key, options = {}) {
        return options[key] !== undefined ? options[key] : this.flags[key];
    }

    /**
     * Unset an operation flag by `key`.
     *
     * @param {String} key
     * @return {Change}
     */

    unsetOperationFlag(key) {
        delete this.flags[key];
        return this;
    }

    // at-current-range
    deleteBackward;
    deleteCharBackward;
    deleteLineBackward;
    deleteWordBackward;
    deleteForward;
    deleteCharForward;
    deleteWordForward;
    deleteLineForward;
    setBlocks;
    setInlines;
    splitInline;
    unwrapBlock;
    unwrapInline;
    wrapBlock;
    wrapInline;
    setBlock;
    setInline;
    addMark;
    addMarks;
    "delete";
    insertBlock;
    insertFragment;
    insertInline;
    insertText;
    removeMark;
    replaceMark;
    splitBlock;
    toggleMark;
    wrapText;

    // at-range
    addMarkAtRange;
    addMarksAtRange;
    deleteAtRange;
    deleteCharBackwardAtRange;
    deleteLineBackwardAtRange;
    deleteWordBackwardAtRange;
    deleteBackwardAtRange;
    deleteCharForwardAtRange;
    deleteLineForwardAtRange;
    deleteWordForwardAtRange;
    deleteForwardAtRange;
    insertBlockAtRange;
    insertFragmentAtRange;
    insertInlineAtRange;
    insertTextAtRange;
    removeMarkAtRange;
    setBlocksAtRange;
    setBlockAtRange;
    setInlinesAtRange;
    setInlineAtRange;
    splitBlockAtRange;
    splitInlineAtRange;
    toggleMarkAtRange;
    unwrapBlockAtRange;
    unwrapInlineAtRange;
    wrapBlockAtRange;
    wrapInlineAtRange;
    wrapTextAtRange;

    // by-path
    addMarkByPath;
    insertFragmentByPath;
    insertNodeByPath;
    insertTextByPath;
    mergeNodeByPath;
    moveNodeByPath;
    removeMarkByPath;
    removeAllMarksByPath;
    removeNodeByPath;
    removeTextByPath;
    replaceNodeByPath;
    replaceTextByPath;
    setMarkByPath;
    setNodeByPath;
    setTextByPath;
    splitNodeByPath;
    splitDescendantsByPath;
    unwrapInlineByPath;
    unwrapBlockByPath;
    unwrapNodeByPath;
    wrapBlockByPath;
    wrapInlineByPath;
    wrapNodeByPath;
    moveNodeByKey;
    splitDescendantsByKey;

    // on-history
    redo;
    undo;

    // on-selection
    blur;
    deselect;
    focus;
    flip;
    moveAnchorBackward;
    moveAnchorForward;
    moveAnchorTo;
    moveAnchorToEndOfBlock;
    moveAnchorToEndOfInline;
    moveAnchorToEndOfDocument;
    moveAnchorToEndOfNextBlock;
    moveAnchorToEndOfNextInline;
    moveAnchorToEndOfNextText;
    moveAnchorToEndOfNode;
    moveAnchorToEndOfPreviousBlock;
    moveAnchorToEndOfPreviousInline;
    moveAnchorToEndOfPreviousText;
    moveAnchorToEndOfText;
    moveAnchorToStartOfBlock;
    moveAnchorToStartOfDocument;
    moveAnchorToStartOfInline;
    moveAnchorToStartOfNextBlock;
    moveAnchorToStartOfNextInline;
    moveAnchorToStartOfNextText;
    moveAnchorToStartOfNode;
    moveAnchorToStartOfPreviousBlock;
    moveAnchorToStartOfPreviousInline;
    moveAnchorToStartOfPreviousText;
    moveAnchorToStartOfText;
    moveBackward;
    moveEndBackward;
    moveEndForward;
    moveEndTo;
    moveEndToEndOfBlock;
    moveEndToEndOfDocument;
    moveEndToEndOfInline;
    moveEndToEndOfNextBlock;
    moveEndToEndOfNextInline;
    moveEndToEndOfNextText;
    moveEndToEndOfNode;
    moveEndToEndOfPreviousBlock;
    moveEndToEndOfPreviousInline;
    moveEndToEndOfPreviousText;
    moveEndToEndOfText;
    moveEndToStartOfBlock;
    moveEndToStartOfDocument;
    moveEndToStartOfInline;
    moveEndToStartOfNextBlock;
    moveEndToStartOfNextInline;
    moveEndToStartOfNextText;
    moveEndToStartOfNode;
    moveEndToStartOfPreviousBlock;
    moveEndToStartOfPreviousInline;
    moveEndToStartOfPreviousText;
    moveEndToStartOfText;
    moveFocusBackward;
    moveFocusForward;
    moveFocusTo;
    moveFocusToEndOfBlock;
    moveFocusToEndOfDocument;
    moveFocusToEndOfInline;
    moveFocusToEndOfNextBlock;
    moveFocusToEndOfNextInline;
    moveFocusToEndOfNextText;
    moveFocusToEndOfNode;
    moveFocusToEndOfPreviousBlock;
    moveFocusToEndOfPreviousInline;
    moveFocusToEndOfPreviousText;
    moveFocusToEndOfText;
    moveFocusToStartOfBlock;
    moveFocusToStartOfDocument;
    moveFocusToStartOfInline;
    moveFocusToStartOfNextBlock;
    moveFocusToStartOfNextInline;
    moveFocusToStartOfNextText;
    moveFocusToStartOfNode;
    moveFocusToStartOfPreviousBlock;
    moveFocusToStartOfPreviousInline;
    moveFocusToStartOfPreviousText;
    moveFocusToStartOfText;
    moveForward;
    moveStartBackward;
    moveStartForward;
    moveStartTo;
    moveStartToEndOfBlock;
    moveStartToEndOfDocument;
    moveStartToEndOfInline;
    moveStartToEndOfNextBlock;
    moveStartToEndOfNextInline;
    moveStartToEndOfNextText;
    moveStartToEndOfNode;
    moveStartToEndOfPreviousBlock;
    moveStartToEndOfPreviousInline;
    moveStartToEndOfPreviousText;
    moveStartToEndOfText;
    moveStartToStartOfBlock;
    moveStartToStartOfDocument;
    moveStartToStartOfInline;
    moveStartToStartOfNextBlock;
    moveStartToStartOfNextInline;
    moveStartToStartOfNextText;
    moveStartToStartOfNode;
    moveStartToStartOfPreviousBlock;
    moveStartToStartOfPreviousInline;
    moveStartToStartOfPreviousText;
    moveStartToStartOfText;
    moveTo;
    moveToAnchor;
    moveToEnd;
    moveToEndOfBlock;
    moveToEndOfDocument;
    moveToEndOfInline;
    moveToEndOfNextBlock;
    moveToEndOfNextInline;
    moveToEndOfNextText;
    moveToEndOfNode;
    moveToEndOfPreviousBlock;
    moveToEndOfPreviousInline;
    moveToEndOfPreviousText;
    moveToEndOfText;
    moveToFocus;
    moveToRangeOfDocument;
    moveToRangeOfNode;
    moveToStart;
    moveToStartOfBlock;
    moveToStartOfDocument;
    moveToStartOfInline;
    moveToStartOfNextBlock;
    moveToStartOfNextInline;
    moveToStartOfNextText;
    moveToStartOfNode;
    moveToStartOfPreviousBlock;
    moveToStartOfPreviousInline;
    moveToStartOfPreviousText;
    moveToStartOfText;
    select;
    setAnchor;
    setEnd;
    setFocus;
    setStart;
    snapshotSelection;
    moveOffsetsTo;

    // on-value
    setValue;

    // with-schema
    normalize;
    normalizeDocument;
    normalizeNodeByKey;
    normalizeAncestorsByKey;
    normalizeParentByKey;
    normalizeNodeByPath;
    normalizeParentByPath;
}

/**
 * Attach a pseudo-symbol for type checking.
 */

Change.prototype[MODEL_TYPES.CHANGE] = true;

/**
 * Add a change method for each of the changes.
 */

Object.keys(Changes).forEach(type => {
    Change.prototype[type] = function(...args) {
        debug(type, { args });
        this.call(Changes[type], ...args);
        return this;
    };
});

/**
 * Export.
 *
 * @type {Change}
 */

export default Change;
