import isPlainObject from "is-plain-object";
import { Map, Record, Set } from "immutable";

import MODEL_TYPES, { isType } from "../constants/model-types";
import Data from "./data";
// import memoize from "../utils/memoize";

/**
 * Default properties.
 *
 * @type {Object}
 */

const DEFAULTS = {
  data: Map(),
  type: undefined,
};

/**
 * Mark.
 *
 * @type {Mark}
 */

class Mark extends Record(DEFAULTS) {
  /**
   * 属性
   */
  public type: undefined | string;
  public data: Map<any, any>;

  /**
   * 静态方法
   */
  static create(attrs: any = {}) {
    if (Mark.isMark(attrs)) {
      return attrs as Mark;
    }

    if (typeof attrs == "string") {
      attrs = { type: attrs };
    }

    if (isPlainObject(attrs)) {
      return Mark.fromJSON(attrs);
    }

    throw new Error(
      `\`Mark.create\` only accepts objects, strings or marks, but you passed it: ${attrs}`
    );
  }

  static createSet(elements: Array<any> | Set<any> = []): Set<Mark> {
    if (Array.isArray(elements)) {
      elements = Set(elements);
    }
    if (Set.isSet(elements)) {
      const marks: Set<Mark> = Set(elements.map(Mark.create));
      return marks;
    }

    if (elements == null) {
      return Set();
    }

    throw new Error(
      `\`Mark.createSet\` only accepts sets, arrays or null, but you passed it: ${elements}`
    );
  }

  static createProperties(attrs: any = {}) {
    if (Mark.isMark(attrs)) {
      return {
        data: attrs.data,
        type: attrs.type,
      };
    }

    if (typeof attrs == "string") {
      return { type: attrs };
    }

    if (isPlainObject(attrs)) {
      const props: any = {};
      if ("type" in attrs) props.type = attrs.type;
      if ("data" in attrs) props.data = Data.create(attrs.data);
      return props;
    }

    throw new Error(
      `\`Mark.createProperties\` only accepts objects, strings or marks, but you passed it: ${attrs}`
    );
  }

  static fromJSON(object: { data?: any; type: string }): Mark {
    const { data = {}, type } = object;

    if (typeof type != "string") {
      throw new Error("`Mark.fromJS` requires a `type` string.");
    }

    const mark = new Mark({
      type,
      data: Map(data),
    });

    return mark;
  }

  static isMark = isType.bind(null, "MARK");

  static isMarkSet(any: any): boolean {
    return Set.isSet(any) && any.every((item) => Mark.isMark(item));
  }

  get object() {
    return "mark";
  }

  /**
   * 实例方法
   */
  toJSON(options: any = {}) {
    const object: any = {
      object: this.object,
      type: this.type,
      data: (this.data as any).toJSON(),
    };

    return object;
  }
}

/**
 * Attach a pseudo-symbol for type checking.
 */

Mark.prototype[MODEL_TYPES.MARK] = true;

/**
 * Memoize read methods.
 */

// memoize(Mark.prototype, ["getComponent"]);

/**
 * Export.
 *
 * @type {Mark}
 */

export default Mark;
