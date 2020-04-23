import isPlainObject from "is-plain-object";
import { List, Record } from "immutable";

import Mark from "./mark";
import MODEL_TYPES from "../constants/model-types";
import Point from "./point";
import Range from "./range";

const DEFAULTS = {
  anchor: Point.create(),
  focus: Point.create(),
  mark: undefined,
};

class Decoration extends Record(DEFAULTS) {
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
  toJSON(options: any = {}) {
    const object = {
      object: this.object,
      anchor: this.anchor.toJSON(options),
      focus: this.focus.toJSON(options),
      mark: this.mark.toJSON(options),
    };

    return object;
  }
}

Decoration.prototype[MODEL_TYPES.DECORATION] = true;

export default Decoration;
