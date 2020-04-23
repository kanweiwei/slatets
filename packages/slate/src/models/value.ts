// @ts-nocheck
import isPlainObject from "is-plain-object";
import logger from "slate-dev-logger";
import { Record, Set, List, Map } from "immutable";
import Decoration from "./decoration";
import MODEL_TYPES from "../constants/model-types";
import PathUtils from "../utils/path-utils";
import Change from "./change";
import Data from "./data";
import Document from "./document";
import History from "./history";
import Selection from "./selection";
import Schema from "./schema";
import { isEqual } from "lodash-es";
import Mark from "./mark";

/**
 * Default properties.
 *
 * @type {Object}
 */

const DEFAULTS = {
  data: Map(),
  decorations: List(),
  document: Document.create(),
  history: History.create(),
  schema: Schema.create(),
  selection: Selection.create(),
};

/**
 * Value.
 *
 * @type {Value}
 */

class Value extends Record(DEFAULTS) {
  public data: Map<any, any>;
  public decorations: any;
  public document: Document;
  public history: History;
  public schema: Schema;
  public selection: Selection;

  /**
   * Create a new `Value` with `attrs`.
   */
  static create(attrs: any = {}, options: any = {}) {
    if (Value.isValue(attrs)) {
      return attrs;
    }

    if (isPlainObject(attrs)) {
      return Value.fromJSON(attrs, options);
    }

    throw new Error(
      `\`Value.create\` only accepts objects or values, but you passed it: ${attrs}`
    );
  }

  /**
   * Create a dictionary of settable value properties from `attrs`.
   */
  static createProperties(a: any = {}) {
    if (Value.isValue(a)) {
      return {
        data: a.data,
        decorations: a.decorations,
        schema: a.schema,
      };
    }

    if (isPlainObject(a)) {
      const p: any = {};
      if ("data" in a) p.data = Data.create(a.data);
      if ("decorations" in a)
        p.decorations = Decoration.createList(a.decorations);
      if ("schema" in a) p.schema = Schema.create(a.schema);
      return p;
    }

    throw new Error(
      `\`Value.createProperties\` only accepts objects or values, but you passed it: ${a}`
    );
  }

  /**
   * Create a `Value` from a JSON `object`.
   *
   * @param {Object} object
   * @param {Object} options
   *   @property {Boolean} normalize
   *   @property {Array} plugins
   * @return {Value}
   */
  static fromJSON(object: any, options: any = {}) {
    let { document = {}, selection = {}, schema = {}, history = {} } = object;
    let data = Map();
    document = Document.fromJSON(document);
    selection = Selection.fromJSON(selection);
    schema = Schema.fromJSON(schema);
    history = History.fromJSON(history);

    // Allow plugins to set a default value for `data`.
    if (options.plugins) {
      for (const plugin of options.plugins) {
        if (plugin.data) {
          logger.deprecate(
            "0.39.0",
            "The plugin `data` property is deprecated."
          );

          data = data.merge(plugin.data);
        }
      }
    }

    // Then merge in the `data` provided.
    if ("data" in object) {
      data = data.merge(object.data);
    }

    selection = document.createSelection(selection);

    if (selection.isUnset) {
      // const text = document.getFirstText();
      // if (text) selection = selection.moveToStartOfNode(text);
      // selection = document.createSelection(selection);
    }

    selection = document.createSelection(selection);

    let value = new Value({
      data,
      document,
      selection,
      schema,
      history,
    });

    // if (options.normalize !== false) {
    //   value = value.change({ save: false }).normalize().value;
    // }

    return value;
  }

  static isValue(value: any) {
    return !!(value && value[MODEL_TYPES.VALUE]);
  }

  get object() {
    return "value";
  }

  /**
   * Get the current start text node's closest block parent.
   */
  get startBlock(): Block {
    return (
      this.selection.start.key &&
      this.document.getClosestBlock(this.selection.start.key)
    );
  }

  /**
   * Get the current end text node's closest block parent.
   */
  get endBlock(): Block {
    return (
      this.selection.end.key &&
      this.document.getClosestBlock(this.selection.end.key)
    );
  }

  /**
   * Get the current anchor text node's closest block parent.
   */
  get anchorBlock(): Block {
    return (
      this.selection.anchor.key &&
      this.document.getClosestBlock(this.selection.anchor.key)
    );
  }

  /**
   * Get the current focus text node's closest block parent.
   */
  get focusBlock(): Block {
    return (
      this.selection.focus.key &&
      this.document.getClosestBlock(this.selection.focus.key)
    );
  }

  /**
   * Get the current start text node's closest inline parent.
   */
  get startInline(): Inline {
    return (
      this.selection.start.key &&
      this.document.getClosestInline(this.selection.start.key)
    );
  }

  /**
   * Get the current end text node's closest inline parent.
   */
  get endInline(): Inline {
    return (
      this.selection.end.key &&
      this.document.getClosestInline(this.selection.end.key)
    );
  }

  /**
   * Get the current anchor text node's closest inline parent.
   */
  get anchorInline(): Inline {
    return (
      this.selection.anchor.key &&
      this.document.getClosestInline(this.selection.anchor.key)
    );
  }

  /**
   * Get the current focus text node's closest inline parent.
   */
  get focusInline(): Inline {
    return (
      this.selection.focus.key &&
      this.document.getClosestInline(this.selection.focus.key)
    );
  }

  /**
   * Get the current start text node.
   */
  get startText(): Text {
    return (
      this.selection.start.key &&
      this.document.getDescendant(this.selection.start.key)
    );
  }

  /**
   * Get the current end node.
   */
  get endText(): Text {
    return (
      this.selection.end.key &&
      this.document.getDescendant(this.selection.end.key)
    );
  }

  /**
   * Get the current anchor node.
   */
  get anchorText(): Text {
    return (
      this.selection.anchor.key &&
      this.document.getDescendant(this.selection.anchor.key)
    );
  }

  /**
   * Get the current focus node.
   */
  get focusText(): Text {
    return (
      this.selection.focus.key &&
      this.document.getDescendant(this.selection.focus.key)
    );
  }

  /**
   * Get the next block node.
   */
  get nextBlock(): Block {
    return (
      this.selection.end.key &&
      this.document.getNextBlock(this.selection.end.key)
    );
  }

  /**
   * Get the previous block node.
   */
  get previousBlock(): Block {
    return (
      this.selection.start.key &&
      this.document.getPreviousBlock(this.selection.start.key)
    );
  }

  /**
   * Get the next inline node.
   *
   * @return {Inline}
   */
  //   todo
  //   get nextInline() {
  //     return (
  //       this.selection.end.key &&
  //       this.document.getNextInline(this.selection.end.key)
  //     )
  //   }

  /**
   * Get the previous inline node.
   *
   * @return {Inline}
   */
  // todo
  //   get previousInline() {
  //     return (
  //       this.selection.start.key &&
  //       this.document.getPreviousInline(this.selection.start.key)
  //     )
  //   }

  /**
   * Get the next text node.
   */
  get nextText(): Text {
    return (
      this.selection.end.key &&
      this.document.getNextText(this.selection.end.key)
    );
  }

  /**
   * Get the previous text node.
   */
  get previousText(): Text {
    return (
      this.selection.start.key &&
      this.document.getPreviousText(this.selection.start.key)
    );
  }

  /**
   * Get the marks of the current selection.
   */
  get marks(): Set<Mark> {
    return this.selection.isUnset
      ? Set()
      : this.selection.marks || this.document.getMarksAtRange(this.selection);
  }

  /**
   * Get the active marks of the current selection.
   */
  get activeMarks(): Set<Mark> {
    return this.selection.isUnset
      ? Set()
      : this.selection.marks ||
          this.document.getActiveMarksAtRange(this.selection);
  }

  /**
   * Get the block nodes in the current selection.
   */
  get blocks(): List<Block> {
    return this.selection.isUnset
      ? List()
      : this.document.getBlocksAtRange(this.selection);
  }

  /**
   * Get the fragment of the current selection.
   */
  get fragment(): Document {
    return this.selection.isUnset
      ? Document.create()
      : this.document.getFragmentAtRange(this.selection);
  }

  /**
   * Get the inline nodes in the current selection.
   */
  get inlines(): List<Inline> {
    return this.selection.isUnset
      ? List()
      : this.document.getInlinesAtRange(this.selection);
  }

  /**
   * Get the text nodes in the current selection.
   */
  get texts(): List<Text> {
    return this.selection.isUnset
      ? List()
      : this.document.getTextsAtRange(this.selection);
  }

  change(attrs = {}) {
    return new Change({ ...attrs, value: this });
  }

  /**
   * Add mark to text at `offset` and `length` in node by `path`.
   */
  addMark(
    path: List<number> | Key,
    offset: number,
    length: number,
    mark: Mark
  ) {
    let value = this;
    let { document } = value;
    document = document.addMark(path, offset, length, mark);
    value = this.set("document", document) as this;
    return value;
  }

  /**
   * Insert a `node`.
   */
  insertNode(path: List<number> | Key, node: any) {
    let value: any = this;
    let { document } = value;
    document = document.insertNode(path, node);
    value = value.set("document", document);

    value = value.mapRanges((range) =>
      range.updatePoints((point) => point.setPath(null))
    );

    return value;
  }

  /**
   * Insert `text` at `offset` in node by `path`.
   */
  insertText(
    path: List<number> | Key,
    offset: number,
    text: string,
    marks: Set<Mark>
  ) {
    let value: any = this;
    let { document, schema } = value;
    document = document.insertText(path, offset, text, marks);
    value = value.set("document", document);

    // Update any ranges that were affected.
    const node = document.getNode(path);

    value = value.mapRanges((range) => {
      const { anchor, focus, isBackward } = range;
      const isAtomic =
        Decoration.isDecoration(range) && schema.isAtomic(range.mark);

      if (
        isEqual(anchor.key, node.key) &&
        (anchor.offset > offset ||
          (anchor.offset === offset && (!isAtomic || !isBackward)))
      ) {
        range = range.moveAnchorForward(text.length);
      }

      if (
        isEqual(focus.key, node.key) &&
        (focus.offset > offset ||
          (focus.offset == offset && (!isAtomic || isBackward)))
      ) {
        range = range.moveFocusForward(text.length);
      }

      return range;
    });

    value = value.clearAtomicRanges(node.key, offset);
    return value;
  }

  /**
   * Merge a node backwards its previous sibling.
   */
  mergeNode(path: List<number> | Key) {
    let value: any = this;
    const { document } = value;
    const newDocument = document.mergeNode(path);
    path = document.resolvePath(path);
    const withPath = PathUtils.decrement(path);
    const one = document.getNode(withPath);
    const two = document.getNode(path);
    value = value.set("document", newDocument);

    value = value.mapRanges((range) => {
      if (two.object === "text") {
        const max = one.text.length;

        if (isEqual(range.anchor.key, two.key)) {
          range = range.moveAnchorTo(one.key, max + range.anchor.offset);
        }

        if (isEqual(range.focus.key, two.key)) {
          range = range.moveFocusTo(one.key, max + range.focus.offset);
        }
      }

      range = range.updatePoints((point) => point.setPath(null));

      return range;
    });

    return value;
  }

  /**
   * Move a node by `path` to `newPath`.
   *
   * A `newIndex` can be provided when move nodes by `key`, to account for not
   * being able to have a key for a location in the tree that doesn't exist yet.
   */
  moveNode(
    path: List<number> | Key,
    newPath: List<number> | Key,
    newIndex: number = 0
  ) {
    let value: any = this;
    let { document } = value;
    document = document.moveNode(path, newPath, newIndex);
    value = value.set("document", document);

    value = value.mapRanges((range) =>
      range.updatePoints((point) => point.setPath(null))
    );

    return value;
  }

  /**
   * Remove mark from text at `offset` and `length` in node.
   */
  removeMark(
    path: List<number> | Key,
    offset: number,
    length: number,
    mark: Mark
  ) {
    let value: any = this;
    let { document } = value;
    document = document.removeMark(path, offset, length, mark);
    value = this.set("document", document);
    return value;
  }

  // Remove a node by `path`.
  removeNode(path: List<number> | Key): Value {
    let value: Value = this;
    let { document } = value;
    const node = document.getNode(path);
    const first = node.object == "text" ? node : node.getFirstText() || node;
    const last = node.object == "text" ? node : node.getLastText() || node;
    const prev = document.getPreviousText(first.key);
    const next = document.getNextText(last.key);

    document = document.removeNode(path);
    value = value.set("document", document);

    value = value.mapRanges((range) => {
      const { start, end } = range;

      if (node.hasNode(start.key)) {
        range = prev
          ? range.moveStartTo(prev.key, prev.text.length)
          : next
          ? range.moveStartTo(next.key, 0)
          : range.unset();
      }

      if (node.hasNode(end.key)) {
        range = prev
          ? range.moveEndTo(prev.key, prev.text.length)
          : next
          ? range.moveEndTo(next.key, 0)
          : range.unset();
      }

      range = range.updatePoints((point) => point.setPath(null));

      return range;
    });

    return value;
  }

  /**
   * Remove `text` at `offset` in node by `path`.
   */
  removeText(path: List<number> | Key, offset: number, text: string) {
    let value: any = this;
    let { document } = value;
    document = document.removeText(path, offset, text);
    value = value.set("document", document);

    const node = document.getNode(path);
    const { length } = text;
    const rangeOffset = offset + length;
    value = value.clearAtomicRanges(node.key, offset, offset + length);

    value = value.mapRanges((range) => {
      const { anchor, focus } = range;

      if (isEqual(anchor.key, node.key)) {
        range =
          anchor.offset >= rangeOffset
            ? range.moveAnchorBackward(length)
            : anchor.offset > offset
            ? range.moveAnchorTo(anchor.key, offset)
            : range;
      }

      if (isEqual(focus.key, node.key)) {
        range =
          focus.offset >= rangeOffset
            ? range.moveFocusBackward(length)
            : focus.offset > offset
            ? range.moveFocusTo(focus.key, offset)
            : range;
      }

      return range;
    });

    return value;
  }

  /**
   * Set `properties` on a node.
   */
  setNode(path: List<number> | Key, properties: any) {
    let value: any = this;
    let { document } = value;
    document = document.setNode(path, properties);
    value = value.set("document", document);
    return value;
  }

  /**
   * Set `properties` on `mark` on text at `offset` and `length` in node.
   */
  setMark(
    path: List<number> | Key,
    offset: number,
    length: number,
    mark: Mark,
    properties: any
  ) {
    let value: any = this;
    let { document } = value;
    document = document.setMark(path, offset, length, mark, properties);
    value = value.set("document", document);
    return value;
  }

  /**
   * Set `properties` on the value.
   */
  setProperties(properties: any) {
    let value = this;
    const { document } = value;
    const { data, decorations, history, schema } = properties;
    const props: any = {};

    if (data) {
      props.data = data;
    }

    if (history) {
      props.history = history;
    }

    if (schema) {
      props.schema = schema;
    }

    if (decorations) {
      props.decorations = decorations.map((d) => {
        return d.isSet ? d : document.resolveDecoration(d);
      });
    }

    value = value.merge(props);
    return value;
  }

  /**
   * Set `properties` on the selection.
   */
  setSelection(properties: any) {
    let value: any = this;
    let { document, selection } = value;
    const next = selection.setProperties(properties);
    selection = document.resolveSelection(next);
    value = value.set("selection", selection);
    return value;
  }

  /**
   * Split a node by `path` at `position` with optional `properties` to apply
   * to the newly split node.
   */
  splitNode(path: List<number> | Key, position: number, properties: any) {
    let value: any = this;
    const { document } = value;
    const newDocument = document.splitNode(path, position, properties);
    const node = document.getNode(path);
    value = value.set("document", newDocument);

    value = value.mapRanges((range) => {
      const next = newDocument.getNextText(node.key);
      const { start, end } = range;

      // If the start was after the split, move it to the next node.
      if (isEqual(node.key, start.key) && position <= start.offset) {
        range = range.moveStartTo(next.key, start.offset - position);
      }

      // If the end was after the split, move it to the next node.
      if (isEqual(node.key, end.key) && position <= end.offset) {
        range = range.moveEndTo(next.key, end.offset - position);
      }

      range = range.updatePoints((point) => point.setPath(null));

      return range;
    });

    return value;
  }

  // Map all range objects to apply adjustments with an `iterator`.
  mapRanges(iterator: Function) {
    let value: any = this;
    const { document, selection, decorations } = value;

    let sel = selection.isSet ? iterator(selection) : selection;
    if (!sel) sel = selection.unset();
    if (sel !== selection) sel = document.createSelection(sel);
    value = value.set("selection", sel);
    let decs = decorations.map((decoration) => {
      let n = decoration.isSet ? iterator(decoration) : decoration;
      if (n && n !== decoration) n = document.createDecoration(n);
      return n;
    });

    decs = decs.filter((decoration) => !!decoration);
    value = value.set("decorations", decs);

    return value;
  }

  // Remove any atomic ranges inside a `key`, `offset` and `length`.
  clearAtomicRanges(key: string, from: number, to: number | null = null) {
    let value = this;
    const { schema } = value;

    value = this.mapRanges((range) => {
      if (!Decoration.isDecoration(range)) return range;
      const { start, end, mark } = range;
      const isAtomic = schema.isAtomic(mark);
      if (!isAtomic) return range;
      if (start.key !== key) return range;

      if (start.offset < from && (end.key !== key || end.offset > from)) {
        return null;
      }

      if (
        to !== null &&
        start.offset < to &&
        (end.key !== key || end.offset > to)
      ) {
        return null;
      }

      return range;
    });

    return value;
  }

  // Return a JSON representation of the value.
  toJSON(options: any = {}) {
    const object: any = {
      object: this.object,
      document: this.document.toJSON(options),
    };

    if (options.preserveData) {
      object.data = (this.data as any).toJSON(options);
    }

    if (options.preserveDecorations) {
      object.decorations = this.decorations
        .toArray()
        .map((d) => d.toJSON(options));
    }

    if (options.preserveHistory) {
      object.history = this.history.toJSON(options);
    }

    if (options.preserveSelection) {
      object.selection = this.selection.toJSON(options);
    }

    if (options.preserveSchema) {
      object.schema = this.schema.toJSON(options);
    }

    return object;
  }

  get hasUndos() {
    return this.history.undos.size > 0;
  }

  get hasRedos() {
    return this.history.redos.size > 0;
  }

  get isBlurred() {
    return this.selection.isBlurred;
  }

  get isFocused() {
    return this.selection.isFocused;
  }

  isEmpty() {
    if (this.selection.isCollapsed) return true;
    if (this.selection.end.offset != 0 && this.selection.start.offset != 0)
      return false;
    return this.fragment.isEmpty;
  }

  get isInVoid() {
    if (this.selection.isExpanded) return false;
    return this.document.hasVoidParent(this.selection.start.key, this.schema);
  }
  get isCollapsed() {
    return this.selection.isCollapsed;
  }

  get isExpanded() {
    return this.selection.isExpanded;
  }

  get isBackward() {
    return this.selection.isBackward;
  }

  get isForward() {
    return this.selection.isForward;
  }

  get startKey() {
    return this.selection.start.key;
  }

  get endKey() {
    return this.selection.end.key;
  }

  get startPath() {
    return this.selection.start.path;
  }

  get endPath() {
    return this.selection.end.path;
  }

  get startOffset() {
    return this.selection.start.offset;
  }

  get endOffset() {
    return this.selection.end.offset;
  }

  get anchorKey() {
    return this.selection.anchor.key;
  }

  get focusKey() {
    return this.selection.focus.key;
  }

  get anchorPath() {
    return this.selection.anchor.path;
  }

  get focusPath() {
    return this.selection.focus.path;
  }

  get anchorOffset() {
    return this.selection.anchor.offset;
  }

  get focusOffset() {
    return this.selection.focus.offset;
  }
}

Value.prototype[MODEL_TYPES.VALUE] = true;

export default Value;
