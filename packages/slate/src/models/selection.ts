import isPlainObject from "is-plain-object";
import { Record, Set } from "immutable";

import MODEL_TYPES from "../constants/model-types";
import Mark from "./mark";
import Point from "./point";
import Range from "./range";
import RangeInterface from "../interfaces/baseRange";
import { Path } from "../interfaces/path";
import NodeInterface from "../interfaces/baseNode";
import { Key } from "..";
import mixin from "../utils/mixin";

/**
 * Default properties.
 *
 * @type {Object}
 */

const DEFAULTS = {
  anchor: Point.create(),
  focus: Point.create(),
  isFocused: false,
  marks: null,
};

/**
 * Selection.
 *
 * @type {Selection}
 */

class Selection extends Record(DEFAULTS) implements RangeInterface {
  public anchor: Point;
  public focus: Point;
  public isFocused: boolean;
  public marks: Set<Mark>;

  // Create a new `Selection` with `attrs`.
  static create(attrs: Selection | Range | any = {}): Selection {
    if (Selection.isSelection(attrs)) {
      return attrs;
    }

    if (Range.isRange(attrs)) {
      return Selection.fromJSON(Range.createProperties(attrs));
    }

    if (isPlainObject(attrs)) {
      return Selection.fromJSON(attrs);
    }

    throw new Error(
      `\`Selection.create\` only accepts objects, ranges or selections, but you passed it: ${attrs}`
    );
  }

  // Create a dictionary of settable selection properties from `attrs`.
  static createProperties(a: any | Selection = {}) {
    if (Selection.isSelection(a)) {
      return {
        anchor: Point.createProperties(a.anchor),
        focus: Point.createProperties(a.focus),
        isFocused: a.isFocused,
        marks: a.marks,
      };
    }

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
      if ("isFocused" in a) p.isFocused = a.isFocused;
      if ("marks" in a)
        p.marks = a.marks == null ? null : Mark.createSet(a.marks);
      return p;
    }

    throw new Error(
      `\`Selection.createProperties\` only accepts objects, ranges or selections, but you passed it: ${a}`
    );
  }

  // Create a `Selection` from a JSON `object`.
  static fromJSON(object: any) {
    let { anchor, focus, isFocused = false, marks = null } = object;

    const selection = new Selection({
      anchor: Point.fromJSON(anchor || {}),
      focus: Point.fromJSON(focus || {}),
      isFocused,
      marks: marks == null ? null : Set(marks.map(Mark.fromJSON)),
    });

    return selection;
  }

  // Check if an `obj` is a `Selection`.
  static isSelection(obj: any) {
    return !!(obj && obj[MODEL_TYPES.SELECTION]);
  }

  get object() {
    return "selection";
  }

  // Check whether the selection is blurred.
  get isBlurred() {
    return !this.isFocused;
  }

  // Set the `isFocused` property to a new `value`.
  setIsFocused(value: boolean) {
    const selection = this.set("isFocused", value);
    return selection;
  }

  // Set the `marks` property to a new set of `marks`.
  setMarks(marks: Set<Mark>) {
    const selection = this.set("marks", marks);
    return selection;
  }

  // Set new `properties` on the selection.
  setProperties(properties: any) {
    properties = Selection.createProperties(properties);
    const { anchor, focus, ...props } = properties;

    if (anchor) {
      props.anchor = Point.create(anchor);
    }

    if (focus) {
      props.focus = Point.create(focus);
    }

    const selection = this.merge(props);
    return selection;
  }

  // Return a JSON representation of the selection.
  toJSON(options: any = {}) {
    const object = {
      object: this.object,
      anchor: this.anchor.toJSON(options),
      focus: this.focus.toJSON(options),
      isFocused: this.isFocused,
      marks:
        this.marks == null ? null : this.marks.toArray().map((m) => m.toJSON()),
    };

    return object;
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

Selection.prototype[MODEL_TYPES.SELECTION] = true;

export default Selection;
