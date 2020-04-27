// @ts-nocheck
import logger from "slate-dev-logger";

import mixin from "../utils/mixin";
import Decoration from "../models/decoration";
import { Path } from "./path";
import Point from "../models/point";
import Range from "../models/range";
import Selection from "../models/selection";
import { isEqual } from "lodash-es";
import { List } from "immutable";

class RangeInterface {
  /**
   * Check whether the range is collapsed.
   */
  get isCollapsed(): boolean {
    return (
      this.anchor === this.focus ||
      (isEqual(this.anchor.key, this.focus.key) &&
        this.anchor.offset === this.focus.offset)
    );
  }

  /**
   * Check whether the range is expanded.
   */
  get isExpanded(): boolean {
    return !this.isCollapsed;
  }

  /**
   * Check whether the range is backward.
   */
  get isBackward(): boolean {
    const { isUnset, anchor, focus } = this;

    if (isUnset) {
      return null;
    }

    if (isEqual(anchor.key, focus.key)) {
      return anchor.offset > focus.offset;
    }

    const isBackward = Path.isBefore(focus.path, anchor.path);
    return isBackward;
  }

  /**
   * Check whether the range is forward.
   */
  get isForward(): boolean {
    const { isBackward } = this;
    const isForward = isBackward == null ? null : !isBackward;
    return isForward;
  }

  /**
   * Check whether the range isn't set.
   */
  get isUnset(): boolean {
    const { anchor, focus } = this;
    const isUnset = anchor.isUnset || focus.isUnset;
    return isUnset;
  }

  /**
   * Check whether the range is set.
   */
  get isSet(): boolean {
    return !this.isUnset;
  }

  /**
   * Get the start point.
   */
  get start(): Point {
    return this.isBackward ? this.focus : this.anchor;
  }

  /**
   * Get the end point.
   */
  get end(): Point {
    return this.isBackward ? this.anchor : this.focus;
  }

  /**
   * Flip the range.
   */
  flip(): RangeInterface {
    const range = this.setPoints([this.focus, this.anchor]);
    return range;
  }

  /**
   * Move the anchor and focus offsets forward `n` characters.
   * @param n
   */
  moveForward(n: number): RangeInterface {
    return this.updatePoints((point) => point.moveForward(n));
  }

  /**
   * Move the anchor and focus offsets backward `n` characters.
   * @param n
   */
  moveBackward(n: number): RangeInterface {
    return this.updatePoints((point) => point.moveBackward(n));
  }

  /**
   * Move the anchor offset backward `n` characters.
   * @param n
   */
  moveAnchorBackward(n: number): RangeInterface {
    const range = this.setAnchor(this.anchor.moveBackward(n));
    return range;
  }

  /**
   * Move the anchor offset forward `n` characters.
   * @param n
   */
  moveAnchorForward(n: number): RangeInterface {
    const range = this.setAnchor(this.anchor.moveForward(n));
    return range;
  }

  /**
   * Move the range's anchor point to a new `path` and `offset`.
   *
   * Optionally, the `path` can be a key string, or omitted entirely in which
   * case it would be the offset number.
   */
  moveAnchorTo(path: List<number>, offset: number): RangeInterface {
    const range = this.setAnchor(this.anchor.moveTo(path, offset));
    return range;
  }

  /**
   * Move the range's anchor point to the start of a `node`.
   */
  moveAnchorToStartOfNode(node): RangeInterface {
    const range = this.setAnchor(this.anchor.moveToStartOfNode(node));
    return range;
  }

  /**
   * Move the range's anchor point to the end of a `node`.
   *
   * @param  node
   */
  moveAnchorToEndOfNode(node): RangeInterface {
    const range = this.setAnchor(this.anchor.moveToEndOfNode(node));
    return range;
  }

  /**
   * Move the end offset backward `n` characters.
   *
   * @param  n
   */
  moveEndBackward(n: number): RangeInterface {
    const range = this.setEnd(this.end.moveBackward(n));
    return range;
  }

  /**
   * Move the end offset forward `n` characters.
   *
   * @param  n
   */
  moveEndForward(n: number): RangeInterface {
    const range = this.setEnd(this.end.moveForward(n));
    return range;
  }

  /**
   * Move the range's end point to a new `path` and `offset`.
   *
   * Optionally, the `path` can be a key string, or omitted entirely in which
   * case it would be the offset number.
   *
   * @param  path
   * @param  offset
   */
  moveEndTo(path: List<number>, offset: number) {
    const range = this.setEnd(this.end.moveTo(path, offset));
    return range;
  }

  /**
   * Move the range's end point to the start of a `node`.
   *
   * @param node
   */
  moveEndToStartOfNode(node) {
    const range = this.setEnd(this.end.moveToStartOfNode(node));
    return range;
  }

  /**
   * Move the range's end point to the end of a `node`.
   *
   * @param  node
   */
  moveEndToEndOfNode(node) {
    const range = this.setEnd(this.end.moveToEndOfNode(node));
    return range;
  }

  /**
   * Move the focus offset backward `n` characters.
   *
   * @param  n
   */
  moveFocusBackward(n) {
    const range = this.setFocus(this.focus.moveBackward(n));
    return range;
  }

  /**
   * Move the focus offset forward `n` characters.
   *
   * @param n
   */
  moveFocusForward(n) {
    const range = this.setFocus(this.focus.moveForward(n));
    return range;
  }

  /**
   * Move the range's focus point to a new `path` and `offset`.
   *
   * Optionally, the `path` can be a key string, or omitted entirely in which
   * case it would be the offset number.
   *
   * @param {List|String} path
   * @param {Number} offset
   */
  moveFocusTo(path: List<number>, offset: number) {
    const range = this.setFocus(this.focus.moveTo(path, offset));
    return range;
  }

  /**
   * Move the range's focus point to the start of a `node`.
   *
   * @param  node
   */
  moveFocusToStartOfNode(node) {
    const range = this.setFocus(this.focus.moveToStartOfNode(node));
    return range;
  }

  /**
   * Move the range's focus point to the end of a `node`.
   *
   * @param node
   */
  moveFocusToEndOfNode(node) {
    const range = this.setFocus(this.focus.moveToEndOfNode(node));
    return range;
  }

  /**
   * Move the start offset backward `n` characters.
   *
   * @param n
   */
  moveStartBackward(n: number) {
    const range = this.setStart(this.start.moveBackward(n));
    return range;
  }

  /**
   * Move the start offset forward `n` characters.
   *
   * @param {Number} n
   */
  moveStartForward(n: number) {
    const range = this.setStart(this.start.moveForward(n));
    return range;
  }

  /**
   * Move the range's start point to a new `path` and `offset`.
   *
   * Optionally, the `path` can be a key string, or omitted entirely in which
   * case it would be the offset number.
   *
   * @param {List|String} path
   * @param {Number} offset
   */
  moveStartTo(path: List<number>, offset: number) {
    const range = this.setStart(this.start.moveTo(path, offset));
    return range;
  }

  /**
   * Move the range's start point to the start of a `node`.
   * @param node
   */
  moveStartToStartOfNode(node) {
    const range = this.setStart(this.start.moveToStartOfNode(node));
    return range;
  }

  /**
   * Move the range's start point to the end of a `node`.
   * @param node
   */
  moveStartToEndOfNode(node) {
    const range = this.setStart(this.start.moveToEndOfNode(node));
    return range;
  }

  /**
   * Move range's points to a new `path` and `offset`.
   */
  moveTo(path: List<number>, offset: number) {
    return this.updatePoints((point) => point.moveTo(path, offset));
  }

  /**
   * Move the focus point to the anchor point.
   */
  moveToAnchor() {
    const range = this.setFocus(this.anchor);
    return range;
  }

  /**
   * Move the start point to the end point.
   */
  moveToEnd() {
    const range = this.setStart(this.end);
    return range;
  }

  /**
   * Move the range's points to the end of a `node`.
   * @paramnode
   */
  moveToEndOfNode(node) {
    return this.updatePoints((point) => point.moveToEndOfNode(node));
  }

  /**
   * Move the anchor point to the focus point.
   */
  moveToFocus() {
    const range = this.setAnchor(this.focus);
    return range;
  }

  /**
   * Move to the entire range of `start` and `end` nodes.
   *
   * @param {Node} start
   * @param {Node} end (optional)
   */
  moveToRangeOfNode(start, end = start) {
    const range = this.setPoints([
      this.anchor.moveToStartOfNode(start),
      this.focus.moveToEndOfNode(end),
    ]);

    return range;
  }

  /**
   * Move the end point to the start point.
   */
  moveToStart() {
    const range = this.setEnd(this.start);
    return range;
  }

  /**
   * Move the range's points to the start of a `node`.
   * @param node
   */
  moveToStartOfNode(node) {
    return this.updatePoints((point) => point.moveToStartOfNode(node));
  }

  /**
   * Normalize the range, relative to a `node`, ensuring that the anchor
   * and focus nodes of the range always refer to leaf text nodes.
   *
   * @param node
   */
  normalize(node) {
    return this.updatePoints((point: Point) => point.normalize(node));
  }

  /**
   * Set the anchor point to a new `anchor`.
   *
   * @param anchor
   */
  setAnchor(anchor) {
    const range = this.set("anchor", anchor);
    return range;
  }

  /**
   * Set the end point to a new `point`.
   * @param  point
   */
  setEnd(point: Point) {
    const range = this.isBackward
      ? this.setAnchor(point)
      : this.setFocus(point);
    return range;
  }

  /**
   * Set the focus point to a new `focus`.
   *
   * @param focus
   */
  setFocus(focus) {
    const range = this.set("focus", focus);
    return range;
  }

  /**
   * Set the anchor and focus points to new `values`.
   *
   * @param values
   */
  setPoints(values) {
    const [anchor, focus] = values;
    const range = this.set("anchor", anchor).set("focus", focus);
    return range;
  }

  /**
   * Set the anchor and focus points with `updater` callback
   * @param updater
   */
  updatePoints(updater) {
    let { anchor, focus } = this;
    anchor = updater(anchor);
    focus = updater(focus);
    return this.merge({ anchor, focus });
  }

  /**
   * Set the start point to a new `point`.
   * @param point
   */
  setStart(point) {
    const range = this.isBackward
      ? this.setFocus(point)
      : this.setAnchor(point);
    return range;
  }

  /**
   * Set new `properties` on the range.
   * @param properties
   */
  setProperties(properties) {
    properties = Range.createProperties(properties);
    const { anchor, focus, ...props } = properties;

    if (anchor) {
      props.anchor = Point.create(anchor);
    }

    if (focus) {
      props.focus = Point.create(focus);
    }

    const range = this.merge(props);
    return range;
  }

  /**
   * Return a JSON representation of the range.
   * @param options
   */
  toJSON(options = {}) {
    const object = {
      object: this.object,
      anchor: this.anchor.toJSON(options),
      focus: this.focus.toJSON(options),
    };

    return object;
  }

  /**
   * Return a `Range` instance from any range-like instance.
   * @return {Range}
   */
  toRange() {
    const properties = Range.createProperties(this);
    const range = Range.create(properties);
    return range;
  }

  /**
   * Unset the range.
   * @return {Range}
   */
  unset() {
    const range = this.updatePoints((p) => p.unset());
    return range;
  }

  get anchorKey() {
    return this.anchor.key;
  }

  get anchorOffset() {
    return this.anchor.offset;
  }

  get anchorPath() {
    return this.anchor.path;
  }

  get focusKey() {
    return this.focus.key;
  }

  get focusOffset() {
    return this.focus.offset;
  }

  get focusPath() {
    return this.focus.path;
  }

  get startKey() {
    return this.start.key;
  }

  get startOffset() {
    return this.start.offset;
  }

  get startPath() {
    return this.start.path;
  }

  get endKey() {
    return this.end.key;
  }

  get endOffset() {
    return this.end.offset;
  }

  get endPath() {
    return this.end.path;
  }

  hasAnchorAtStartOf(node) {
    return this.anchor.isAtStartOfNode(node);
  }

  hasAnchorAtEndOf(node) {
    return this.anchor.isAtEndOfNode(node);
  }

  hasAnchorBetween(node, start, end) {
    return (
      this.anchor.offset <= end &&
      start <= this.anchor.offset &&
      this.anchor.isInNode(node)
    );
  }

  hasAnchorIn(node) {
    return this.anchor.isInNode(node);
  }

  hasEdgeAtStartOf(node) {
    return (
      this.anchor.isAtStartOfNode(node) || this.focus.isAtStartOfNode(node)
    );
  }

  hasEdgeAtEndOf(node) {
    return this.anchor.isAtEndOfNode(node) || this.focus.isAtEndOfNode(node);
  }

  hasEdgeBetween(node, start, end) {
    return (
      (this.anchor.offset <= end &&
        start <= this.anchor.offset &&
        this.anchor.isInNode(node)) ||
      (this.focus.offset <= end &&
        start <= this.focus.offset &&
        this.focus.isInNode(node))
    );
  }

  hasEdgeIn(node) {
    return this.anchor.isInNode(node) || this.focus.isInNode(node);
  }

  hasEndAtStartOf(node) {
    return this.end.isAtStartOfNode(node);
  }

  hasEndAtEndOf(node) {
    return this.end.isAtEndOfNode(node);
  }

  hasEndBetween(node, start, end) {
    return (
      this.end.offset <= end &&
      start <= this.end.offset &&
      this.end.isInNode(node)
    );
  }

  hasEndIn(node) {
    return this.end.isInNode(node);
  }

  hasFocusAtEndOf(node) {
    return this.focus.isAtEndOfNode(node);
  }

  hasFocusAtStartOf(node) {
    return this.focus.isAtStartOfNode(node);
  }

  hasFocusBetween(node, start, end) {
    return (
      start <= this.focus.offset &&
      this.focus.offset <= end &&
      this.focus.isInNode(node)
    );
  }

  hasFocusIn(node) {
    return this.focus.isInNode(node);
  }

  hasStartAtStartOf(node) {
    return this.start.isAtStartOfNode(node);
  }

  hasStartAtEndOf(node) {
    return this.start.isAtEndOfNode(node);
  }

  hasStartBetween(node, start, end) {
    return (
      this.start.offset <= end &&
      start <= this.start.offset &&
      this.start.isInNode(node)
    );
  }

  hasStartIn(node) {
    return this.start.isInNode(node);
  }

  isAtStartOf(node) {
    return this.isCollapsed && this.anchor.isAtStartOfNode(node);
  }

  isAtEndOf(node) {
    return this.isCollapsed && this.anchor.isAtEndOfNode(node);
  }

  blur() {
    return this.merge({ isFocused: false });
  }

  deselect() {
    return Range.create();
  }

  moveAnchorOffsetTo(o) {
    return this.moveAnchorTo(o);
  }

  moveFocusOffsetTo(fo) {
    return this.moveFocusTo(fo);
  }

  moveStartOffsetTo(o) {
    return this.moveStartTo(o);
  }

  moveEndOffsetTo(o) {
    return this.moveEndTo(o);
  }

  moveOffsetsTo(ao, fo = ao) {
    return this.moveAnchorTo(ao).moveFocusTo(fo);
  }

  moveAnchorToStartOf(node) {
    return this.moveAnchorToStartOfNode(node);
  }

  moveAnchorToEndOf(node) {
    return this.moveAnchorToEndOfNode(node);
  }

  moveFocusToStartOf(node) {
    return this.moveFocusToStartOfNode(node);
  }

  moveFocusToEndOf(node) {
    return this.moveFocusToEndOfNode(node);
  }

  moveToStartOf(node) {
    return this.moveToStartOfNode(node);
  }

  moveToEndOf(node) {
    return this.moveToEndOfNode(node);
  }

  moveToRangeOf(...args) {
    return this.moveToRangeOfNode(...args);
  }

  collapseToAnchor() {
    return this.moveToAnchor();
  }

  collapseToEnd() {
    return this.moveToEnd();
  }

  collapseToFocus() {
    return this.moveToFocus();
  }

  collapseToStart() {
    return this.moveToStart();
  }

  move(n = 1) {
    return n > 0 ? this.moveForward(n) : this.moveBackward(-n);
  }

  moveAnchor(n = 1) {
    return n > 0 ? this.moveAnchorForward(n) : this.moveAnchorBackward(-n);
  }

  moveEnd(n = 1) {
    return n > 0 ? this.moveEndForward(n) : this.moveEndBackward(-n);
  }

  moveFocus(n = 1) {
    return n > 0 ? this.moveFocusForward(n) : this.moveFocusBackward(-n);
  }

  moveStart(n = 1) {
    return n > 0 ? this.moveStartForward(n) : this.moveStartBackward(-n);
  }
}

mixin(RangeInterface, [Decoration, Range, Selection]);
