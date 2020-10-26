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
import { Key } from "..";
import NodeInterface from "./node";

/**
 * @abstract 抽象类
 * 范围、选区
 */
abstract class BaseRange {
  /**
   * 锚点
   */
  public abstract anchor: Point;

  /**
   * 焦点
   */
  public abstract focus: Point;

  /**
   * 选区是否收缩
   */
  get isCollapsed(): boolean {
    return (
      this.anchor === this.focus ||
      (isEqual(this.anchor.key, this.focus.key) &&
        this.anchor.offset === this.focus.offset)
    );
  }

  /**
   * 选区是否展开
   */
  get isExpanded(): boolean {
    return !this.isCollapsed;
  }

  /**
   * 是否是反向选区
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
   * 是否是默认方向的选区
   */
  get isForward(): boolean {
    const { isBackward } = this;
    const isForward = isBackward == null ? null : !isBackward;
    return isForward;
  }

  /**
   * 选区是否无效
   */
  get isUnset(): boolean {
    const { anchor, focus } = this;
    const isUnset = anchor.isUnset || focus.isUnset;
    return isUnset;
  }

  /**
   * 选区是否有效
   */
  get isSet(): boolean {
    return !this.isUnset;
  }

  /**
   * 起点
   */
  get start(): Point {
    return this.isBackward ? this.focus : this.anchor;
  }

  /**
   * 终点
   */
  get end(): Point {
    return this.isBackward ? this.anchor : this.focus;
  }

  /**
   * 反转选区
   */
  flip(): RangeInterface {
    const range = this.setPoints([this.focus, this.anchor]);
    return range;
  }

  /**
   * 向后移动选区 `n` 个字符
   * @param n
   */
  moveForward(n: number): RangeInterface {
    return this.updatePoints((point) => point.moveForward(n));
  }

  /**
   * 先前移动选区 `n` 个字符
   * @param n
   */
  moveBackward(n: number): RangeInterface {
    return this.updatePoints((point) => point.moveBackward(n));
  }

  /**
   * 锚点向前移动 `n` 个字符
   * @param n
   */
  moveAnchorBackward(n: number): RangeInterface {
    const range = this.setAnchor(this.anchor.moveBackward(n));
    return range;
  }

  /**
   * 锚点向后移动 `n` 个字符
   * @param n
   */
  moveAnchorForward(n: number): RangeInterface {
    const range = this.setAnchor(this.anchor.moveForward(n));
    return range;
  }

  /**
   * 锚点移动到 `path` `offset` 指定的节点位置
   * @param path 节点路径/id
   * @param offset 偏移
   */
  moveAnchorTo(path: Path | Key, offset: number): RangeInterface;

  /**
   * 锚点移动到`offset` 指定的节点位置
   * @param offset 偏移
   */
  moveAnchorTo(offset: number): RangeInterface;

  moveAnchorTo(path: Path | Key | number, offset?: number): RangeInterface {
    const range = this.setAnchor(this.anchor.moveTo(path, offset));
    return range;
  }

  /**
   * 锚点移动到 `node` 节点的开头
   * @param node 节点
   */
  moveAnchorToStartOfNode(node: NodeInterface): RangeInterface {
    const range = this.setAnchor(this.anchor.moveToStartOfNode(node));
    return range;
  }

  /**
   * 锚点移动到 `node` 节点的末尾
   * @param node
   */
  moveAnchorToEndOfNode(node: NodeInterface): RangeInterface {
    const range = this.setAnchor(this.anchor.moveToEndOfNode(node));
    return range;
  }

  /**
   * 终点向前移动 `n` 个字符
   * @param  n
   */
  moveEndBackward(n: number): RangeInterface {
    const range = this.setEnd(this.end.moveBackward(n));
    return range;
  }

  /**
   * 终点向后移动 `n` 个字符
   * @param  n
   */
  moveEndForward(n: number): RangeInterface {
    const range = this.setEnd(this.end.moveForward(n));
    return range;
  }

  /**
   * 终点移动到指定位置
   * @param path
   * @param offset
   */
  moveEndTo(path: Path | Key, offset: number): RangeInterface;

  /**
   * 终点移动到指定位置
   * @param offset
   */
  moveEndTo(offset: number): RangeInterface;

  moveEndTo(path: Path | Key | number, offset?: number): RangeInterface {
    const range = this.setEnd(this.end.moveTo(path, offset));
    return range;
  }

  /**
   * 终点移动到节点开头
   * @param node
   */
  moveEndToStartOfNode(node: NodeInterface) {
    const range = this.setEnd(this.end.moveToStartOfNode(node));
    return range;
  }

  /**
   * 终点移动到节点末尾
   * @param  node
   */
  moveEndToEndOfNode(node: NodeInterface) {
    const range = this.setEnd(this.end.moveToEndOfNode(node));
    return range;
  }

  /**
   * 焦点向前移动 `n` 个字符
   * @param  n
   */
  moveFocusBackward(n: number) {
    const range = this.setFocus(this.focus.moveBackward(n));
    return range;
  }

  /**
   * 焦点向后移动 `n` 个字符
   * @param n
   */
  moveFocusForward(n: number) {
    const range = this.setFocus(this.focus.moveForward(n));
    return range;
  }

  /**
   * 焦点移动指定位置
   * @param path
   * @param offset
   */
  moveFocusTo(path: Path | Key, offset: number): RangeInterface;

  /**
   * 焦点移动到指定位置
   * @param offset
   */
  moveFocusTo(offset: number): RangeInterface;

  moveFocusTo(path: Path | Key | number, offset?: number) {
    const range = this.setFocus(this.focus.moveTo(path, offset));
    return range;
  }

  /**
   * 焦点移动到节点开头
   * @param node
   */
  moveFocusToStartOfNode(node: NodeInterface) {
    const range = this.setFocus(this.focus.moveToStartOfNode(node));
    return range;
  }

  /**
   * 焦点移动到节点末尾
   * @param node
   */
  moveFocusToEndOfNode(node: NodeInterface) {
    const range = this.setFocus(this.focus.moveToEndOfNode(node));
    return range;
  }

  /**
   * 起点向前移动 n 个字符
   * @param n
   */
  moveStartBackward(n: number) {
    const range = this.setStart(this.start.moveBackward(n));
    return range;
  }

  /**
   * 起点向后移动 n 个字符
   * @param n
   */
  moveStartForward(n: number) {
    const range = this.setStart(this.start.moveForward(n));
    return range;
  }

  /**
   * 起点移动到指定位置
   * @param path
   * @param offset
   */
  moveStartTo(path: Path | Key, offset: number): RangeInterface;

  /**
   * 起点移动到指定位置
   * @param offset
   */
  moveStartTo(offset: number): RangeInterface;

  moveStartTo(path: Path | Key | number, offset?: number) {
    const range = this.setStart(this.start.moveTo(path, offset));
    return range;
  }

  /**
   * 起点移动到节点开头
   * @param node
   */
  moveStartToStartOfNode(node: NodeInterface) {
    const range = this.setStart(this.start.moveToStartOfNode(node));
    return range;
  }

  /**
   * 起点移动到节点末尾
   * @param node
   */
  moveStartToEndOfNode(node: NodeInterface) {
    const range = this.setStart(this.start.moveToEndOfNode(node));
    return range;
  }

  /**
   * 移动到指定位置
   * @param path
   * @param offset
   */
  moveTo(path: Path | Key, offset: number): RangeInterface;

  /**
   * 移动到指定位置
   * @param offset
   */
  moveTo(offset: number): RangeInterface;

  moveTo(path: Path | Key | number, offset?: number) {
    return this.updatePoints((point: Point) => point.moveTo(path, offset));
  }

  /**
   * 移动到锚点
   */
  moveToAnchor() {
    const range = this.setFocus(this.anchor);
    return range;
  }

  /**
   * 移动到终点
   */
  moveToEnd() {
    const range = this.setStart(this.end);
    return range;
  }

  /**
   * 移动到节点末尾
   * @param param0
   */
  moveToEndOfNode([node, path]) {
    return this.updatePoints((point: Point) =>
      point.moveToEndOfNode([node, path])
    );
  }

  /**
   * 移动到焦点
   */
  moveToFocus() {
    const range = this.setAnchor(this.focus);
    return range;
  }

  /**
   * 移动到节点的范围
   * @param {Node} start
   * @param {Node} end (optional)
   */
  moveToRangeOfNode(start: NodeInterface, end: NodeInterface = start) {
    const range = this.setPoints([
      this.anchor.moveToStartOfNode(start),
      this.focus.moveToEndOfNode(end),
    ]);

    return range;
  }

  /**
   * 移动到起点
   */
  moveToStart() {
    const range = this.setEnd(this.start);
    return range;
  }

  /**
   * 移动到节点的开头
   * @param node
   */
  moveToStartOfNode([node, path]: [NodeInterface, Path]) {
    return this.updatePoints((point) => point.moveToStartOfNode([node, path]));
  }

  /**
   * 整理节点，确保选区的锚点和焦点在 text 节点上
   *
   * @param node
   */
  normalize(node: NodeInterface) {
    return this.updatePoints((point: Point) => point.normalize(node));
  }

  /**
   * 设置锚点
   * @param anchor
   */
  setAnchor(anchor: Point) {
    this.anchor = anchor;
    return this;
  }

  /**
   * 设置终点
   * @param point
   */
  setEnd(point: Point) {
    const range = this.isBackward
      ? this.setAnchor(point)
      : this.setFocus(point);
    return range;
  }

  /**
   * 设置焦点
   * @param focus
   */
  setFocus(focus: Point) {
    this.focus = focus;
    return this;
  }

  /**
   * 设置端点
   *
   * 第一个是锚点，第二个是焦点
   * @param values
   */
  setPoints(values: [Point, Point]) {
    const [anchor, focus] = values;
    this.setAnchor(anchor).setFocus(focus);
    return this;
  }

  /**
   * 更新端点
   * @param updater
   */
  updatePoints(updater: Function) {
    let { anchor, focus } = this;
    anchor = updater(anchor);
    focus = updater(focus);
    return this.setPoints([anchor, focus]);
  }

  /**
   * 设置起点
   * @param point
   */
  setStart(point: Point) {
    const range = this.isBackward
      ? this.setFocus(point)
      : this.setAnchor(point);
    return range;
  }

  /**
   * 更新属性
   * @param properties
   */
  setProperties(properties: any) {
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
   * 转成普通对象
   * @param options
   */
  toJSON(options: any = {}) {
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
    const range = this.updatePoints((p: Point) => p.unset());
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

  /**
   * 锚点是否在节点的开头
   * @param node
   */
  hasAnchorAtStartOf(node: NodeInterface) {
    return this.anchor.isAtStartOfNode(node);
  }

  /**
   * 锚点是否在节点的末尾
   * @param node
   */
  hasAnchorAtEndOf(node: NodeInterface) {
    return this.anchor.isAtEndOfNode(node);
  }

  /**
   * 锚点是否在节点的中间
   * @param node
   * @param start
   * @param end
   */
  hasAnchorBetween(node: NodeInterface, start: number, end: number) {
    return (
      this.anchor.offset <= end &&
      start <= this.anchor.offset &&
      this.anchor.isInNode(node)
    );
  }

  /**
   * 锚点是否在节点内
   */
  hasAnchorIn(node: NodeInterface) {
    return this.anchor.isInNode(node);
  }

  /**
   * 锚点或焦点是否在节点的开头
   * @param node
   */
  hasEdgeAtStartOf(node: NodeInterface) {
    return (
      this.anchor.isAtStartOfNode(node) || this.focus.isAtStartOfNode(node)
    );
  }

  /**
   * 锚点或焦点是否在节点的末尾
   * @param node
   */
  hasEdgeAtEndOf(node: NodeInterface) {
    return this.anchor.isAtEndOfNode(node) || this.focus.isAtEndOfNode(node);
  }

  /**
   * 锚点是否在节点的中间
   * @param node
   * @param start
   * @param end
   */
  hasEdgeBetween(node: NodeInterface, start: number, end: number) {
    return (
      (this.anchor.offset <= end &&
        start <= this.anchor.offset &&
        this.anchor.isInNode(node)) ||
      (this.focus.offset <= end &&
        start <= this.focus.offset &&
        this.focus.isInNode(node))
    );
  }

  /**
   * 边界是否在节点内
   * @param node
   */
  hasEdgeIn(node: NodeInterface) {
    return this.anchor.isInNode(node) || this.focus.isInNode(node);
  }

  /**
   * 终点是否在节点开头
   * @param node
   */
  hasEndAtStartOf(node: NodeInterface) {
    return this.end.isAtStartOfNode(node);
  }

  /**
   * 终点是否在节点末尾
   * @param node
   */
  hasEndAtEndOf(node: NodeInterface) {
    return this.end.isAtEndOfNode(node);
  }

  /**
   * 终点是否在节点中间
   * @param node
   * @param start
   * @param end
   */
  hasEndBetween(node: NodeInterface, start: number, end: number) {
    return (
      this.end.offset <= end &&
      start <= this.end.offset &&
      this.end.isInNode(node)
    );
  }

  /**
   * 终点是否在节点内
   * @param node
   */
  hasEndIn(node: NodeInterface) {
    return this.end.isInNode(node);
  }

  /**
   * 焦点是否在节点末尾
   * @param node
   */
  hasFocusAtEndOf(node: NodeInterface) {
    return this.focus.isAtEndOfNode(node);
  }

  /**
   * 焦点是否在节点开头
   * @param node
   */
  hasFocusAtStartOf(node: NodeInterface) {
    return this.focus.isAtStartOfNode(node);
  }

  /**
   * 焦点是否在节点中间
   * @param node
   * @param start
   * @param end
   */
  hasFocusBetween(node: NodeInterface, start: number, end: number) {
    return (
      start <= this.focus.offset &&
      this.focus.offset <= end &&
      this.focus.isInNode(node)
    );
  }

  /**
   * 焦点在节点内
   * @param node
   */
  hasFocusIn(node: NodeInterface) {
    return this.focus.isInNode(node);
  }

  /**
   * 起点是否在节点开头
   * @param node
   */
  hasStartAtStartOf(node: NodeInterface) {
    return this.start.isAtStartOfNode(node);
  }

  /**
   * 起点是否在节点末尾
   * @param node
   */
  hasStartAtEndOf(node: NodeInterface) {
    return this.start.isAtEndOfNode(node);
  }

  /**
   * 起点是否在节点中间
   */
  hasStartBetween(node: NodeInterface, start: number, end: number) {
    return (
      this.start.offset <= end &&
      start <= this.start.offset &&
      this.start.isInNode(node)
    );
  }

  /**
   * 起点是否在节点内
   * @param node
   */
  hasStartIn(node: NodeInterface) {
    return this.start.isInNode(node);
  }

  /**
   * 是否在节点开头
   * @param node
   */
  isAtStartOf(node: NodeInterface) {
    return this.isCollapsed && this.anchor.isAtStartOfNode(node);
  }

  /**
   * 是否在节点末尾
   * @param node
   */
  isAtEndOf(node: NodeInterface) {
    return this.isCollapsed && this.anchor.isAtEndOfNode(node);
  }

  /**
   * 失去焦点
   */
  blur() {
    this.isFocused = false;
    return this;
  }

  /**
   * 取消选择
   */
  deselect() {
    return Range.create();
  }

  /**
   * 锚点的偏移移动到 o
   * @param o
   */
  moveAnchorOffsetTo(o: number) {
    return this.moveAnchorTo(o);
  }

  /**
   * 焦点的偏移移动到 o
   * @param fo
   */
  moveFocusOffsetTo(fo: number) {
    return this.moveFocusTo(fo);
  }

  /**
   * 起点的偏移移动到 o
   * @param o
   */
  moveStartOffsetTo(o: number) {
    return this.moveStartTo(o);
  }

  /**
   * 终点的偏移移动到 o
   * @param o
   */
  moveEndOffsetTo(o: number) {
    return this.moveEndTo(o);
  }

  /**
   * 移动偏移
   * @param ao
   * @param fo
   */
  moveOffsetsTo(ao: number, fo: number = ao) {
    return this.moveAnchorTo(ao).moveFocusTo(fo);
  }

  /**
   * 锚点移动到节点开头
   * @param node
   */
  moveAnchorToStartOf(node: NodeInterface) {
    return this.moveAnchorToStartOfNode(node);
  }

  /**
   * 锚点移动到节点末尾
   * @param node
   */
  moveAnchorToEndOf(node: NodeInterface) {
    return this.moveAnchorToEndOfNode(node);
  }

  /**
   * 焦点移动到节点开头
   * @param node
   */
  moveFocusToStartOf(node: NodeInterface) {
    return this.moveFocusToStartOfNode(node);
  }

  /**
   * 焦点移动到节点末尾
   * @param node
   */
  moveFocusToEndOf(node: NodeInterface) {
    return this.moveFocusToEndOfNode(node);
  }

  /**
   * 移动节点开头
   * @param node
   */
  moveToStartOf(node: NodeInterface) {
    return this.moveToStartOfNode(node);
  }

  /**
   * 移动到节点的末尾
   * @param node
   */
  moveToEndOf(node: NodeInterface) {
    return this.moveToEndOfNode(node);
  }

  /**
   * 移动到 start 节点的开头，end 节点的末尾
   *
   * @param start
   * @param end (optional)
   */
  moveToRangeOf(start: NodeInterface, end: NodeInterface = start) {
    return this.moveToRangeOfNode(start, end);
  }

  /**
   * 收缩到锚点
   */
  collapseToAnchor() {
    return this.moveToAnchor();
  }

  /**
   * 收缩到终点
   */
  collapseToEnd() {
    return this.moveToEnd();
  }

  /**
   * 收缩到焦点
   */
  collapseToFocus() {
    return this.moveToFocus();
  }

  /**
   * 收缩到起点
   */
  collapseToStart() {
    return this.moveToStart();
  }

  /**
   * 移动光标 n 个偏移
   * @param n
   */
  move(n: number = 1) {
    return n > 0 ? this.moveForward(n) : this.moveBackward(-n);
  }

  /**
   * 移动锚点
   * @param n
   */
  moveAnchor(n: number = 1) {
    return n > 0 ? this.moveAnchorForward(n) : this.moveAnchorBackward(-n);
  }

  /**
   * 移动终点
   * @param n
   */
  moveEnd(n: number = 1) {
    return n > 0 ? this.moveEndForward(n) : this.moveEndBackward(-n);
  }

  /**
   * 移动焦点
   * @param n
   */
  moveFocus(n: number = 1) {
    return n > 0 ? this.moveFocusForward(n) : this.moveFocusBackward(-n);
  }

  /**
   * 移动起点
   * @param n
   */
  moveStart(n: number = 1) {
    return n > 0 ? this.moveStartForward(n) : this.moveStartBackward(-n);
  }
}

export default BaseRange;
