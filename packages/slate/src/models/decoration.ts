import isPlainObject from "is-plain-object";
import { List, Record } from "immutable";

import Mark from "./mark";
import MODEL_TYPES from "../constants/model-types";
import Point from "./point";
import Range from "./range";
import RangeInterface from "../interfaces/range";
import mixin from "../utils/mixin";
import { Path, Key } from "..";
import NodeInterface from "../interfaces/node";

const DEFAULTS = {
  anchor: Point.create(),
  focus: Point.create(),
  mark: undefined,
};

class Decoration extends Record(DEFAULTS) implements RangeInterface {
  anchor: Point;
  focus: Point;
  mark: Mark;

  // Create a new `Decoration` with `attrs`.
  static create(attrs: any | Decoration | Range = {}): Decoration {
    if (Decoration.isDecoration(attrs)) {
      return attrs;
    }

    if (Range.isRange(attrs)) {
      return Decoration.fromJSON(Range.createProperties(attrs));
    }

    if (isPlainObject(attrs)) {
      return Decoration.fromJSON(attrs);
    }

    throw new Error(
      `\`Decoration.create\` only accepts objects or decorations, but you passed it: ${attrs}`
    );
  }

  // Create a list of `Ranges` from `elements`.
  static createList(
    elements: Array<Decoration | any> | List<Decoration | any> = []
  ) {
    if (List.isList(elements) || Array.isArray(elements)) {
      // @ts-ignore
      const list = List(elements.map(Decoration.create));
      return list;
    }

    throw new Error(
      `\`Decoration.createList\` only accepts arrays or lists, but you passed it: ${elements}`
    );
  }

  // Create a dictionary of settable decoration properties from `attrs`.
  static createProperties(a: any | Decoration = {}) {
    if (Decoration.isDecoration(a)) {
      return {
        anchor: Point.createProperties(a.anchor),
        focus: Point.createProperties(a.focus),
        mark: Mark.create(a.mark),
      };
    }

    if (isPlainObject(a)) {
      const p: any = {};
      if ("anchor" in a) p.anchor = Point.create(a.anchor);
      if ("focus" in a) p.focus = Point.create(a.focus);
      if ("mark" in a) p.mark = Mark.create(a.mark);
      return p;
    }

    throw new Error(
      `\`Decoration.createProperties\` only accepts objects or decorations, but you passed it: ${a}`
    );
  }

  // Create a `Decoration` from a JSON `object`.
  static fromJSON(object: any) {
    const { anchor, focus } = object;
    let { mark } = object;

    const decoration = new Decoration({
      anchor: Point.fromJSON(anchor || {}),
      focus: Point.fromJSON(focus || {}),
      mark: Mark.fromJSON(mark),
    });

    return decoration;
  }

  // Check if an `obj` is a `Decoration`.
  static isDecoration(obj: any) {
    return !!(obj && obj[MODEL_TYPES.DECORATION]);
  }

  get object() {
    return "decoration";
  }

  // Set new `properties` on the decoration.
  setProperties(properties: any | Range | Selection) {
    properties = Decoration.createProperties(properties);
    const { anchor, focus, mark } = properties;
    const props: any = {};

    if (anchor) {
      props.anchor = Point.create(anchor);
    }

    if (focus) {
      props.focus = Point.create(focus);
    }

    if (mark) {
      props.mark = Mark.create(mark);
    }

    const decoration = this.merge(props);
    return decoration;
  }

  // Return a JSON representation of the decoration.
  toJSON(options?: any): any;

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

Decoration.prototype[MODEL_TYPES.DECORATION] = true;

export default Decoration;
