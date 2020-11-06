import isPlainObject from "is-plain-object";

import MODEL_TYPES from "../constants/model-types";
import RangeInterface from "../interfaces/baseRange";

import Point from "./point";

/**
 * 实体类 基类
 * 范围
 */
class Range extends RangeInterface {
  constructor(attrs: any) {
    super();
    this.anchor = Point.create(attrs.anchor);
    this.focus = Point.create(attrs.focus);
  }

  /**
   * 起点
   */
  public anchor: Point = Point.create();

  /**
   * 终点
   */
  public focus: Point = Point.create();

  get object(): "range" {
    return "range";
  }

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

  static createList(elements = []): Array<Range> {
    if (Array.isArray(elements)) {
      const list = elements.map(Range.create);
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
    return (
      Array.isArray(item) && item.every((item: any) => Range.isRange(item))
    );
  }
}

Range.prototype[MODEL_TYPES.RANGE] = true;

export default Range;
