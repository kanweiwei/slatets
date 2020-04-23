import isPlainObject from "is-plain-object";
import { List, Record } from "immutable";

import MODEL_TYPES from "../constants/model-types";

import Decoration from "./decoration";
import Point from "./point";
import Selection from "./selection";

const DEFAULTS: any = {
  anchor: Point.create(),
  focus: Point.create(),
};

class Range extends Record(DEFAULTS) {
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
      Decoration.isDecoration(obj) ||
      Selection.isSelection(obj)
    );
  }

  static isRangeList(item: any) {
    return List.isList(item) && item.every((item: any) => Range.isRange(item));
  }

  get object(): "range" {
    return "range";
  }
}

Range.prototype[MODEL_TYPES.RANGE] = true;

export default Range;
