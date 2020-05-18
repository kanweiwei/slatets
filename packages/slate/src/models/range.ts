import isPlainObject from "is-plain-object";
import { List, Record } from "immutable";

import MODEL_TYPES from "../constants/model-types";

import Point from "./point";
import RangeInterface from "../interfaces/range";
import { Path, Key } from "..";
import NodeInterface from "../interfaces/node";

const DEFAULTS: any = {
  anchor: Point.create(),
  focus: Point.create(),
};

class Range extends Record(DEFAULTS) implements RangeInterface {
  /**
   * 属性
   */
  public anchor: Point;
  public focus: Point;

  /**
   * 静态方法
   */
  static create(attrs: any = {}) {
    if (Range.isRange(attrs)) {
      if (attrs.object === "range") {
        return attrs as Range;
      } else {
        return Range.fromJSON(Range.createProperties(attrs));
      }
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
      // @ts-ignore
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
      };
    }

    if (isPlainObject(a)) {
      const p: any = {};
      if ("anchor" in a) p.anchor = Point.create(a.anchor);
      if ("focus" in a) p.focus = Point.create(a.focus);
      return p;
    }

    throw new Error(
      `\`Range.createProperties\` only accepts objects, decorations, ranges or selections, but you passed it: ${a}`
    );
  }

  static fromJSON(object: any): Range {
    let { anchor, focus } = object;

    const range = new Range({
      anchor: Point.fromJSON(anchor || {}),
      focus: Point.fromJSON(focus || {}),
    });

    return range;
  }

  static isRange(obj: any) {
    return (
      !!(obj && obj[MODEL_TYPES.RANGE]) ||
      !!(obj && obj[MODEL_TYPES.DECORATION]) ||
      !!(obj && obj[MODEL_TYPES.SELECTION])
    );
  }

  static isRangeList(item: any) {
    return List.isList(item) && item.every((item: any) => Range.isRange(item));
  }

  get object(): "range" {
    return "range";
  }

  // 通用
  isCollapsed: boolean;
  isExpanded: boolean;
  isBackward: boolean;
  isForward: boolean;
  isSet: boolean;
  start: Point;
  end: Point;
  flip(): RangeInterface;
  moveForward(n: number): RangeInterface;
  moveBackward(n: number): RangeInterface;
  moveAnchorBackward(n: number): RangeInterface;
  moveAnchorForward(n: number): RangeInterface;
  moveAnchorTo(path: Path | Key | number, offset?: number): RangeInterface;
  moveAnchorToStartOfNode(node: NodeInterface): RangeInterface;
  moveAnchorToEndOfNode(node: NodeInterface): RangeInterface;
  moveEndBackward(n: number): RangeInterface;
  moveEndForward(n: number): RangeInterface;
  moveEndTo(path: Path | Key | number, offset?: number): RangeInterface;
  moveEndToStartOfNode(node: NodeInterface): RangeInterface;
  moveEndToEndOfNode(node: NodeInterface): RangeInterface;
  moveFocusBackward(n: number): RangeInterface;
  moveFocusForward(n: number): RangeInterface;
  moveFocusTo(path: Path | Key | number, offset?: number): RangeInterface;
  moveFocusToStartOfNode(node: NodeInterface): RangeInterface;
  moveFocusToEndOfNode(node: NodeInterface): RangeInterface;
  moveStartBackward(n: number): RangeInterface;
  moveStartForward(n: number): RangeInterface;
  moveStartTo(path: Path | Key | number, offset: number): RangeInterface;
  moveStartToStartOfNode(node: NodeInterface): RangeInterface;
  moveStartToEndOfNode(node: NodeInterface): RangeInterface;
  moveTo(path: Path | Key | number, offset: number): RangeInterface;
  moveToAnchor(): RangeInterface;
  moveToEnd(): RangeInterface;
  moveToEndOfNode(node: NodeInterface): RangeInterface;
  moveToFocus(): RangeInterface;
  moveToRangeOfNode(start: NodeInterface, end: NodeInterface): RangeInterface;
  moveToStart(): RangeInterface;
  moveToStartOfNode(node: NodeInterface): RangeInterface;
  normalize(node: NodeInterface): RangeInterface;
  setAnchor(anchor: Point): RangeInterface;
  setEnd(point: Point): RangeInterface;
  setFocus(focus: Point): RangeInterface;
  setPoints(values: [Point, Point]): RangeInterface;
  updatePoints(updater: Function): RangeInterface;
  setStart(point: Point): RangeInterface;
  setProperties(properties: any): RangeInterface;
  toJSON(options?: any): any;
  toRange(): Range;
  unset(): RangeInterface;
  anchorKey: Key;
  anchorOffset: Number;
  anchorPath: Path;
  focusKey: Key;
  focusOffset: number;
  focusPath: Path;
  startKey: Key;
  startOffset: number;
  startPath: Path;
  endKey: Key;
  endOffset: number;
  endPath: Path;
  hasAnchorAtStartOf(node: NodeInterface): boolean;
  hasAnchorAtEndOf(node: NodeInterface): boolean;
  hasAnchorBetween(node: NodeInterface, start: number, end: number): boolean;
  hasAnchorIn(node: NodeInterface): boolean;
  hasEdgeAtStartOf(node: NodeInterface): boolean;
  hasEdgeAtEndOf(node: NodeInterface): boolean;
  hasEdgeBetween(node: NodeInterface, start: number, end: number): boolean;
  hasEdgeIn(node: NodeInterface): boolean;
  hasEndAtStartOf(node: NodeInterface): boolean;
  hasEndAtEndOf(node: NodeInterface): boolean;
  hasEndBetween(node: NodeInterface): boolean;
  hasEndIn(node: NodeInterface): boolean;
  hasFocusAtEndOf(node: NodeInterface): boolean;
  hasFocusAtStartOf(node: NodeInterface): boolean;
  hasFocusBetween(node: NodeInterface, start: number, end: number): boolean;
  hasFocusIn(node: NodeInterface): boolean;
  hasStartAtStartOf(node: NodeInterface): boolean;
  hasStartAtEndOf(node: NodeInterface): boolean;
  hasStartBetween(node: NodeInterface, start: number, end: number): boolean;
  hasStartIn(node: NodeInterface): RangeInterface;
  isAtStartOf(node: NodeInterface): RangeInterface;
  isAtEndOf(node: NodeInterface): RangeInterface;
  blur(): RangeInterface;
  deselect(): Range;
  moveAnchorOffsetTo(o: number): RangeInterface;
  moveFocusOffsetTo(o: number): RangeInterface;
  moveStartOffsetTo(o: number): RangeInterface;
  moveEndOffsetTo(o: number): RangeInterface;
  moveOffsetsTo(ao: number, fo?: number): RangeInterface;
  moveAnchorToStartOf(node: NodeInterface): RangeInterface;
  moveAnchorToEndOf(node: NodeInterface): RangeInterface;
  moveFocusToStartOf(node: NodeInterface): RangeInterface;
  moveFocusToEndOf(node: NodeInterface): RangeInterface;
  moveToStartOf(node: NodeInterface): RangeInterface;
  moveToEndOf(node: NodeInterface): RangeInterface;
  moveToRangeOf(...args: any[]): RangeInterface;
  collapseToAnchor(): RangeInterface;
  collapseToEnd(): RangeInterface;
  collapseToFocus(): RangeInterface;
  collapseToStart(): RangeInterface;
  move(n?: number): RangeInterface;
  moveAnchor(n?: number): RangeInterface;
  moveEnd(n?: number): RangeInterface;
  moveFocus(n?: number): RangeInterface;
  moveStart(n?: number): RangeInterface;
}

Range.prototype[MODEL_TYPES.RANGE] = true;

export default Range;
