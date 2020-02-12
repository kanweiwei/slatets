import isPlainObject from "is-plain-object";
import logger from "slate-dev-logger";
import { List, Record, Set } from "immutable";

import MODEL_TYPES from "../constants/model-types";
import Mark from "./mark";

import PathUtils from "../utils/path-utils";
import Point from "./point";

const DEFAULTS: any = {
  anchor: Point.create(),
  focus: Point.create(),
  isAtomic: false,
  isFocused: false,
  marks: null
};

class Range extends Record(DEFAULTS) {
  /**
   * 属性
   */
  public anchor: Point;
  public focus: Point;
  public isAtomic: boolean;
  public isFocused: boolean;
  public marks: Set<Mark>;

  /**
   * 静态方法
   */
  static create(attrs: any = {}): Range {
    if (Range.isRange(attrs)) {
      return attrs;
    }

    if (isPlainObject(attrs)) {
      return Range.fromJSON(attrs);
    }

    throw new Error(
      `\`Range.create\` only accepts objects or ranges, but you passed it: ${attrs}`
    );
  }

  static createList(elements = []): List<Range> {
    if (List.isList(elements) || Array.isArray(elements)) {
      const list = List(elements.map(Range.create));
      return list;
    }

    throw new Error(
      `\`Range.createList\` only accepts arrays or lists, but you passed it: ${elements}`
    );
  }

  static createProperties(a: any = {}) {
    if (Range.isRange(a)) {
      return {
        anchor: Point.createProperties(a.anchor),
        focus: Point.createProperties(a.focus),
        isAtomic: a.isAtomic,
        isFocused: a.isFocused,
        marks: a.marks
      };
    }

    if (isPlainObject(a)) {
      const p: any = {};
      if ("anchor" in a) p.anchor = Point.create(a.anchor);
      if ("focus" in a) p.focus = Point.create(a.focus);
      if ("isAtomic" in a) p.isAtomic = a.isAtomic;
      if ("isFocused" in a) p.isFocused = a.isFocused;
      if ("marks" in a)
        p.marks = a.marks == null ? null : Mark.createSet(a.marks);
      return p;
    }

    throw new Error(
      `\`Range.createProperties\` only accepts objects or ranges, but you passed it: ${a}`
    );
  }

  static fromJSON(object: any): Range {
    let {
      anchor,
      focus,
      isAtomic = false,
      isFocused = false,
      marks = null
    } = object;

    if (
      !anchor &&
      (object.anchorKey || object.anchorOffset || object.anchorPath)
    ) {
      logger.deprecate(
        "0.37.0",
        "`Range` objects now take a `Point` object as an `anchor` instead of taking `anchorKey/Offset/Path` properties. But you passed:",
        object
      );

      anchor = {
        key: object.anchorKey,
        offset: object.anchorOffset,
        path: object.anchorPath
      };
    }

    if (!focus && (object.focusKey || object.focusOffset || object.focusPath)) {
      logger.deprecate(
        "0.37.0",
        "`Range` objects now take a `Point` object as a `focus` instead of taking `focusKey/Offset/Path` properties. But you passed:",
        object
      );

      focus = {
        key: object.focusKey,
        offset: object.focusOffset,
        path: object.focusPath
      };
    }

    const range = new Range({
      anchor: Point.fromJSON(anchor || {}),
      focus: Point.fromJSON(focus || {}),
      isAtomic,
      isFocused,
      marks: marks == null ? null : Set(marks.map(Mark.fromJSON))
    });

    return range;
  }

  static fromJS = Range.fromJSON;

  static isRange(obj) {
    return !!(obj && obj[MODEL_TYPES.RANGE]);
  }

  static isRangeList(item: any) {
    return List.isList(item) && item.every((item: any) => Range.isRange(item));
  }

  /**
   * 计算属性
   */
  get object(): "range" {
    return "range";
  }

  get kind(): "range" {
    logger.deprecate(
      "slate@0.32.0",
      "The `kind` property of Slate objects has been renamed to `object`."
    );
    return this.object;
  }

  get isBlurred(): boolean {
    return !this.isFocused;
  }

  get isCollapsed(): boolean {
    return (
      this.anchor === this.focus ||
      (this.anchor.key === this.focus.key &&
        this.anchor.offset === this.focus.offset)
    );
  }

  get isExpanded(): boolean {
    return !this.isCollapsed;
  }

  get isBackward(): boolean | null {
    const { isUnset, anchor, focus } = this;

    if (isUnset) {
      return null;
    }

    if (anchor.key === focus.key) {
      return (anchor.offset as Number) > (focus.offset as Number);
    }

    const isBackward = PathUtils.isBefore(focus.path, anchor.path);
    return isBackward;
  }

  get isForward(): boolean | null {
    const { isBackward } = this;
    const isForward = isBackward == null ? null : !isBackward;
    return isForward;
  }

  get isUnset(): boolean {
    const { anchor, focus } = this;
    const isUnset = anchor.isUnset || focus.isUnset;
    return isUnset;
  }

  get isSet(): boolean {
    return !this.isUnset;
  }

  get start(): Point {
    return this.isBackward ? this.focus : this.anchor;
  }

  get end(): Point {
    return this.isBackward ? this.anchor : this.focus;
  }

  flip(): Range {
    const range = this.setPoints([this.focus, this.anchor]) as any;
    return range;
  }

  moveForward(n: number): Range {
    return this.updatePoints(point => point.moveForward(n));
  }

  moveBackward(n: number): Range {
    return this.updatePoints(point => point.moveBackward(n));
  }

  moveAnchorBackward(n: number): Range {
    const range = this.setAnchor(this.anchor.moveBackward(n)) as Range;
    return range;
  }

  moveAnchorForward(n: number): Range {
    const range = this.setAnchor(this.anchor.moveForward(n)) as Range;
    return range;
  }

  moveAnchorTo(path: List<number> | string, offset = 0): Range {
    const range = this.setAnchor(this.anchor.moveTo(path, offset)) as Range;
    return range;
  }

  moveAnchorToStartOfNode(node: any): Range {
    const range = this.setAnchor(this.anchor.moveToStartOfNode(node)) as Range;
    return range;
  }

  moveAnchorToEndOfNode(node) {
    const range = this.setAnchor(this.anchor.moveToEndOfNode(node));
    return range;
  }

  moveEndBackward(n) {
    const range = this.setEnd(this.end.moveBackward(n));
    return range;
  }

  moveEndForward(n) {
    const range = this.setEnd(this.end.moveForward(n));
    return range;
  }

  moveEndTo(path, offset = 0) {
    const range = this.setEnd(this.end.moveTo(path, offset));
    return range;
  }

  moveEndToStartOfNode(node) {
    const range = this.setEnd(this.end.moveToStartOfNode(node));
    return range;
  }

  moveEndToEndOfNode(node) {
    const range = this.setEnd(this.end.moveToEndOfNode(node));
    return range;
  }

  moveFocusBackward(n) {
    const range = this.setFocus(this.focus.moveBackward(n));
    return range;
  }

  moveFocusForward(n) {
    const range = this.setFocus(this.focus.moveForward(n));
    return range;
  }

  moveFocusTo(path, offset = 0) {
    const range = this.setFocus(this.focus.moveTo(path, offset));
    return range;
  }

  moveFocusToStartOfNode(node) {
    const range = this.setFocus(this.focus.moveToStartOfNode(node));
    return range;
  }

  moveFocusToEndOfNode(node) {
    const range = this.setFocus(this.focus.moveToEndOfNode(node));
    return range;
  }

  moveStartBackward(n) {
    const range = this.setStart(this.start.moveBackward(n));
    return range;
  }

  moveStartForward(n) {
    const range = this.setStart(this.start.moveForward(n));
    return range;
  }

  moveStartTo(path, offset = 0) {
    const range = this.setStart(this.start.moveTo(path, offset));
    return range;
  }

  moveStartToStartOfNode(node) {
    const range = this.setStart(this.start.moveToStartOfNode(node));
    return range;
  }

  moveStartToEndOfNode(node) {
    const range = this.setStart(this.start.moveToEndOfNode(node));
    return range;
  }

  moveTo(path, offset) {
    return this.updatePoints(point => point.moveTo(path, offset));
  }

  moveToAnchor() {
    const range = this.setFocus(this.anchor);
    return range;
  }

  moveToEnd() {
    const range = this.setStart(this.end);
    return range;
  }

  moveToEndOfNode(node) {
    return this.updatePoints(point => point.moveToEndOfNode(node));
  }

  moveToFocus() {
    const range = this.setAnchor(this.focus);
    return range;
  }

  moveToRangeOfNode(start, end = start) {
    const range = this.setPoints([
      this.anchor.moveToStartOfNode(start),
      this.focus.moveToEndOfNode(end)
    ]);

    return range;
  }

  moveToStart() {
    const range = this.setEnd(this.start);
    return range;
  }

  moveToStartOfNode(node): Range {
    return this.updatePoints(point => point.moveToStartOfNode(node));
  }

  normalize(node: any): Range {
    return this.updatePoints(point => point.normalize(node));
  }

  setAnchor(anchor: Point): Range {
    const range = this.set("anchor", anchor) as Range;
    return range;
  }

  setEnd(point: Point): Range {
    const range = this.isBackward
      ? (this.setAnchor(point) as Range)
      : (this.setFocus(point) as Range);
    return range;
  }

  setFocus(focus: Point): Range {
    const range = this.set("focus", focus) as Range;
    return range;
  }

  setIsAtomic(value: boolean): Range {
    const range = this.set("isAtomic", value) as Range;
    return range;
  }

  setIsFocused(value: boolean): Range {
    const range = this.set("isFocused", value) as Range;
    return range;
  }

  setPoints(values: Point[]): Range {
    const [anchor, focus] = values;
    const range = this.set("anchor", anchor).set("focus", focus) as Range;
    return range;
  }

  /**
   * Set the anchor and focus points with `updator` callback
   *
   * @param {Function} updator
   * @return {Range}
   */
  updatePoints(updator) {
    let { anchor, focus } = this;
    anchor = updator(anchor);
    focus = updator(focus);
    return this.merge({ anchor, focus }) as Range;
  }

  setStart(point: Point): Range {
    const range = this.isBackward
      ? (this.setFocus(point) as Range)
      : (this.setAnchor(point) as Range);
    return range;
  }

  setProperties(properties: any): Range {
    properties = Range.createProperties(properties);
    const { anchor, focus, ...props } = properties;

    if (anchor) {
      props.anchor = Point.create(anchor);
    }

    if (focus) {
      props.focus = Point.create(focus);
    }

    const range = this.merge(props) as Range;
    return range;
  }

  toRange() {
    const properties = Range.createProperties(this);
    const range = Range.create(properties);
    return range;
  }

  toJSON(options: any = {}): any {
    const object: any = {
      object: this.object,
      anchor: this.anchor.toJSON(options),
      focus: this.focus.toJSON(options),
      isAtomic: this.isAtomic,
      isFocused: this.isFocused,
      marks:
        this.marks == null ? null : this.marks.toArray().map(m => m.toJSON())
    };

    return object;
  }

  toJS(): any {
    return this.toJSON();
  }

  get anchorKey() {
    logger.deprecate(
      "0.37.0",
      "The `range.anchorKey` property has been deprecated, use `range.anchor.key` instead."
    );

    return this.anchor.key;
  }

  get anchorOffset() {
    logger.deprecate(
      "0.37.0",
      "The `range.anchorOffset` property has been deprecated, use `range.anchor.offset` instead."
    );

    return this.anchor.offset;
  }

  get anchorPath() {
    logger.deprecate(
      "0.37.0",
      "The `range.anchorPath` property has been deprecated, use `range.anchor.path` instead."
    );

    return this.anchor.path;
  }

  get focusKey() {
    logger.deprecate(
      "0.37.0",
      "The `range.focusKey` property has been deprecated, use `range.focus.key` instead."
    );

    return this.focus.key;
  }

  get focusOffset() {
    logger.deprecate(
      "0.37.0",
      "The `range.focusOffset` property has been deprecated, use `range.focus.offset` instead."
    );

    return this.focus.offset;
  }

  get focusPath() {
    logger.deprecate(
      "0.37.0",
      "The `range.focusPath` property has been deprecated, use `range.focus.path` instead."
    );

    return this.focus.path;
  }

  get startKey() {
    logger.deprecate(
      "0.37.0",
      "The `range.startKey` property has been deprecated, use `range.start.key` instead."
    );

    return this.start.key;
  }

  get startOffset() {
    logger.deprecate(
      "0.37.0",
      "The `range.startOffset` property has been deprecated, use `range.start.offset` instead."
    );

    return this.start.offset;
  }

  get startPath() {
    logger.deprecate(
      "0.37.0",
      "The `range.startPath` property has been deprecated, use `range.start.path` instead."
    );

    return this.start.path;
  }

  get endKey() {
    logger.deprecate(
      "0.37.0",
      "The `range.endKey` property has been deprecated, use `range.end.key` instead."
    );

    return this.end.key;
  }

  get endOffset() {
    logger.deprecate(
      "0.37.0",
      "The `range.endOffset` property has been deprecated, use `range.end.offset` instead."
    );

    return this.end.offset;
  }

  get endPath() {
    logger.deprecate(
      "0.37.0",
      "The `range.endPath` property has been deprecated, use `range.end.path` instead."
    );

    return this.end.path;
  }

  hasAnchorAtStartOf(node) {
    logger.deprecate(
      "0.37.0",
      "The `Range.hasAnchorAtStartOf` method is deprecated, please use `Range.anchor.isAtStartOfNode` instead."
    );

    return this.anchor.isAtStartOfNode(node);
  }

  hasAnchorAtEndOf(node) {
    logger.deprecate(
      "0.37.0",
      "The `Range.hasAnchorAtEndOf` method is deprecated, please use `Range.anchor.isAtEndOfNode` instead."
    );

    return this.anchor.isAtEndOfNode(node);
  }

  hasAnchorBetween(node, start, end) {
    logger.deprecate(
      "0.37.0",
      "The `Range.hasAnchorBetween` method is deprecated, please use the `Range.anchor` methods and properties directly instead."
    );

    return (
      (this.anchor.offset as Number) <= end &&
      start <= (this.anchor.offset as Number) &&
      this.anchor.isInNode(node)
    );
  }

  hasAnchorIn(node) {
    logger.deprecate(
      "0.37.0",
      "The `Range.hasAnchorAtEndOf` method is deprecated, please use `Range.anchor.isInNode` instead."
    );

    return this.anchor.isInNode(node);
  }

  hasEdgeAtStartOf(node) {
    logger.deprecate(
      "0.37.0",
      "The `Range.hasEdgeAtStartOf` method is deprecated."
    );

    return (
      this.anchor.isAtStartOfNode(node) || this.focus.isAtStartOfNode(node)
    );
  }

  hasEdgeAtEndOf(node) {
    logger.deprecate(
      "0.37.0",
      "The `Range.hasEdgeAtEndOf` method is deprecated."
    );

    return this.anchor.isAtEndOfNode(node) || this.focus.isAtEndOfNode(node);
  }

  hasEdgeBetween(node, start, end) {
    logger.deprecate(
      "0.37.0",
      "The `Range.hasEdgeBetween` method is deprecated."
    );

    return (
      ((this.anchor.offset as Number) <= end &&
        start <= (this.anchor.offset as Number) &&
        this.anchor.isInNode(node)) ||
      ((this.focus.offset as Number) <= end &&
        start <= (this.focus.offset as Number) &&
        this.focus.isInNode(node))
    );
  }

  hasEdgeIn(node) {
    logger.deprecate(
      "0.37.0",
      "The `Range.hasEdgeAtEndOf` method is deprecated."
    );

    return this.anchor.isInNode(node) || this.focus.isInNode(node);
  }

  hasEndAtStartOf(node) {
    logger.deprecate(
      "0.37.0",
      "The `Range.hasEndAtStartOf` method is deprecated, please use `Range.end.isAtStartOfNode` instead."
    );

    return this.end.isAtStartOfNode(node);
  }

  hasEndAtEndOf(node) {
    logger.deprecate(
      "0.37.0",
      "The `Range.hasEndAtEndOf` method is deprecated, please use `Range.end.isAtEndOfNode` instead."
    );

    return this.end.isAtEndOfNode(node);
  }

  hasEndBetween(node, start, end) {
    logger.deprecate(
      "0.37.0",
      "The `Range.hasEndBetween` method is deprecated, please use the `Range.end` methods and properties directly instead."
    );

    return (
      (this.end.offset as Number) <= end &&
      start <= (this.end.offset as Number) &&
      this.end.isInNode(node)
    );
  }

  hasEndIn(node) {
    logger.deprecate(
      "0.37.0",
      "The `Range.hasEndAtEndOf` method is deprecated, please use `Range.end.isInNode` instead."
    );

    return this.end.isInNode(node);
  }

  hasFocusAtEndOf(node) {
    logger.deprecate(
      "0.37.0",
      "The `Range.hasFocusAtEndOf` method is deprecated, please use `Range.focus.isAtEndOfNode` instead."
    );

    return this.focus.isAtEndOfNode(node);
  }

  hasFocusAtStartOf(node) {
    logger.deprecate(
      "0.37.0",
      "The `Range.hasFocusAtStartOf` method is deprecated, please use `Range.focus.isAtStartOfNode` instead."
    );

    return this.focus.isAtStartOfNode(node);
  }

  hasFocusBetween(node, start, end) {
    logger.deprecate(
      "0.37.0",
      "The `Range.hasFocusBetween` method is deprecated, please use the `Range.focus` methods and properties directly instead."
    );

    return (
      start <= (this.focus.offset as Number) &&
      (this.focus.offset as Number) <= end &&
      this.focus.isInNode(node)
    );
  }

  hasFocusIn(node) {
    logger.deprecate(
      "0.37.0",
      "The `Range.hasFocusAtEndOf` method is deprecated, please use `Range.focus.isInNode` instead."
    );

    return this.focus.isInNode(node);
  }

  hasStartAtStartOf(node) {
    logger.deprecate(
      "0.37.0",
      "The `Range.hasStartAtStartOf` method is deprecated, please use `Range.start.isAtStartOfNode` instead."
    );

    return this.start.isAtStartOfNode(node);
  }

  hasStartAtEndOf(node) {
    logger.deprecate(
      "0.37.0",
      "The `Range.hasStartAtEndOf` method is deprecated, please use `Range.start.isAtEndOfNode` instead."
    );

    return this.start.isAtEndOfNode(node);
  }

  hasStartBetween(node, start, end) {
    logger.deprecate(
      "0.37.0",
      "The `Range.hasStartBetween` method is deprecated, please use the `Range.start` methods and properties directly instead."
    );

    return (
      (this.start.offset as Number) <= end &&
      start <= (this.start.offset as Number) &&
      this.start.isInNode(node)
    );
  }

  hasStartIn(node) {
    logger.deprecate(
      "0.37.0",
      "The `Range.hasStartAtEndOf` method is deprecated, please use `Range.start.isInNode` instead."
    );

    return this.start.isInNode(node);
  }

  isAtStartOf(node) {
    logger.deprecate(
      "0.37.0",
      "The `Range.isAtStartOf` method is deprecated, please use `Range.isCollapsed` and `Point.isAtStartOfNode` instead."
    );

    return this.isCollapsed && this.anchor.isAtStartOfNode(node);
  }

  isAtEndOf(node) {
    logger.deprecate(
      "0.37.0",
      "The `Range.isAtEndOf` method is deprecated, please use `Range.isCollapsed` and `Point.isAtEndOfNode` instead."
    );

    return this.isCollapsed && this.anchor.isAtEndOfNode(node);
  }

  blur() {
    logger.deprecate(
      "0.37.0",
      "The `Range.blur` method is deprecated, please use `Range.merge` directly instead."
    );

    return this.merge({ isFocused: false }) as Range;
  }

  deselect() {
    logger.deprecate(
      "0.37.0",
      "The `Range.deselect` method is deprecated, please use `Range.create` to create a new unset range instead."
    );

    return Range.create() as Range;
  }

  moveAnchorOffsetTo(o) {
    logger.deprecate(
      "0.37.0",
      "The `Range.moveAnchorOffsetTo` method is deprecated, please use `Range.moveAnchorTo(offset)` instead."
    );

    return this.moveAnchorTo(o);
  }

  moveFocusOffsetTo(fo) {
    logger.deprecate(
      "0.37.0",
      "The `Range.moveFocusOffsetTo` method is deprecated, please use `Range.moveFocusTo(offset)` instead."
    );

    return this.moveFocusTo(fo);
  }

  moveStartOffsetTo(o) {
    logger.deprecate(
      "0.37.0",
      "The `Range.moveStartOffsetTo` method is deprecated, please use `Range.moveStartTo(offset)` instead."
    );

    return this.moveStartTo(o);
  }

  moveEndOffsetTo(o) {
    logger.deprecate(
      "0.37.0",
      "The `Range.moveEndOffsetTo` method is deprecated, please use `Range.moveEndTo(offset)` instead."
    );

    return this.moveEndTo(o);
  }

  moveOffsetsTo(ao, fo = ao) {
    logger.deprecate(
      "0.37.0",
      "The `Range.moveOffsetsTo` method is deprecated, please use `Range.moveAnchorTo` and `Range.moveFocusTo` in sequence instead."
    );

    return (this.moveAnchorTo(ao) as this).moveFocusTo(fo);
  }

  moveAnchorToStartOf(node) {
    logger.deprecate(
      "0.37.0",
      "The `Range.moveAnchorToStartOf` method is deprecated, please use `Range.moveAnchorToStartOfNode` instead."
    );

    return this.moveAnchorToStartOfNode(node);
  }

  moveAnchorToEndOf(node) {
    logger.deprecate(
      "0.37.0",
      "The `Range.moveAnchorToEndOf` method is deprecated, please use `Range.moveAnchorToEndOfNode` instead."
    );

    return this.moveAnchorToEndOfNode(node);
  }

  moveFocusToStartOf(node) {
    logger.deprecate(
      "0.37.0",
      "The `Range.moveFocusToStartOf` method is deprecated, please use `Range.moveFocusToStartOfNode` instead."
    );

    return this.moveFocusToStartOfNode(node);
  }

  moveFocusToEndOf(node) {
    logger.deprecate(
      "0.37.0",
      "The `Range.moveFocusToEndOf` method is deprecated, please use `Range.moveFocusToEndOfNode` instead."
    );

    return this.moveFocusToEndOfNode(node);
  }

  moveToStartOf(node) {
    logger.deprecate(
      "0.37.0",
      "The `Range.moveToStartOf` method is deprecated, please use `Range.moveToStartOfNode` instead."
    );

    return this.moveToStartOfNode(node);
  }

  moveToEndOf(node) {
    logger.deprecate(
      "0.37.0",
      "The `Range.moveToEndOf` method is deprecated, please use `Range.moveToEndOfNode` instead."
    );

    return this.moveToEndOfNode(node);
  }

  moveToRangeOf(start: any, end?: any) {
    logger.deprecate(
      "0.37.0",
      "The `Range.moveToRangeOf` method is deprecated, please use `Range.moveToRangeOfNode` instead."
    );

    return this.moveToRangeOfNode(start, end);
  }

  collapseToAnchor() {
    logger.deprecate(
      "0.37.0",
      "The `Range.collapseToAnchor` method is deprecated, please use `Range.moveToAnchor` instead."
    );

    return this.moveToAnchor();
  }

  collapseToEnd() {
    logger.deprecate(
      "0.37.0",
      "The `Range.collapseToEnd` method is deprecated, please use `Range.moveToEnd` instead."
    );

    return this.moveToEnd();
  }

  collapseToFocus() {
    logger.deprecate(
      "0.37.0",
      "The `Range.collapseToFocus` method is deprecated, please use `Range.moveToFocus` instead."
    );

    return this.moveToFocus();
  }

  collapseToStart() {
    logger.deprecate(
      "0.37.0",
      "The `Range.collapseToStart` method is deprecated, please use `Range.moveToStart` instead."
    );

    return this.moveToStart();
  }

  move(n = 1) {
    logger.deprecate(
      "0.37.0",
      "The `Range.move` method is deprecated, please use `Range.moveForward` or `Range.moveBackward` instead."
    );

    return n > 0 ? this.moveForward(n) : this.moveBackward(-n);
  }

  moveAnchor(n = 1) {
    logger.deprecate(
      "0.37.0",
      "The `Range.moveAnchor` method is deprecated, please use `Range.moveAnchorForward` or `Range.moveAnchorBackward` instead."
    );

    return n > 0 ? this.moveAnchorForward(n) : this.moveAnchorBackward(-n);
  }
  moveEnd(n = 1) {
    logger.deprecate(
      "0.37.0",
      "The `Range.moveEnd` method is deprecated, please use `Range.moveEndForward` or `Range.moveEndBackward` instead."
    );

    return n > 0 ? this.moveEndForward(n) : this.moveEndBackward(-n);
  }

  moveFocus(n = 1) {
    logger.deprecate(
      "0.37.0",
      "The `Range.moveFocus` method is deprecated, please use `Range.moveFocusForward` or `Range.moveFocusBackward` instead."
    );

    return n > 0 ? this.moveFocusForward(n) : this.moveFocusBackward(-n);
  }

  moveStart(n = 1) {
    logger.deprecate(
      "0.37.0",
      "The `Range.moveStart` method is deprecated, please use `Range.moveStartForward` or `Range.moveStartBackward` instead."
    );

    return n > 0 ? this.moveStartForward(n) : this.moveStartBackward(-n);
  }

  /**
   * mix
   */
  collapseTo: (path, offset) => Range;
  collapseToStartOf: (node) => Range;
  collapseToEndOf: (node) => Range;
  extend: (n?: number) => Range;
  extendTo: (path, offset?: number) => Range;
  extendToStartOf: (node) => Range;
  extendToEndOf: (node) => Range;
}

/**
 * Mix in some aliases for convenience / parallelism with the browser APIs.
 */

const ALIAS_METHODS = [
  ["collapseTo", "moveTo"],
  ["collapseToStartOf", "moveToStartOfNode"],
  ["collapseToEndOf", "moveToEndOfNode"],
  ["extend", "moveFocus"],
  ["extendTo", "moveFocusTo"],
  ["extendToStartOf", "moveFocusToStartOfNode"],
  ["extendToEndOf", "moveFocusToEndOfNode"]
];

ALIAS_METHODS.forEach(([alias, method]) => {
  Range.prototype[alias] = function(...args) {
    logger.deprecate(
      "0.37.0",
      `The \`Range.${alias}\` method is deprecated, please use \`Range.${method}\` instead.`
    );

    return this[method](...args);
  };
});

Range.prototype[MODEL_TYPES.RANGE] = true;

export default Range;
