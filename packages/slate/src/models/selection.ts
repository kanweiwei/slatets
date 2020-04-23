import isPlainObject from "is-plain-object";
import { Record, Set } from "immutable";

import MODEL_TYPES from "../constants/model-types";
import Mark from "./mark";
import Point from "./point";
import Range from "./range";

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

class Selection extends Record(DEFAULTS) {
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
}

Selection.prototype[MODEL_TYPES.SELECTION] = true;

export default Selection;
