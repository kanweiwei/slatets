import { isArray, isEqual, unionWith, isPlainObject } from "lodash-es";
import MODEL_TYPES, { isType } from "../constants/model-types";
import Data from "./data";

class Mark {
  type: string;
  data: Data;

  constructor(obj?: any) {
    if (!obj) {
      throw new Error(
        `new Error(obj) accpets obj with type and marks, but get ${obj}`
      );
    }
    const { type, data = {} } = obj;
    this.type = type;
    this.data = Data.create(data);
  }

  /**
   * 静态方法
   */
  static create(attrs: any = {}) {
    if (attrs instanceof Mark) {
      return attrs;
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

  static createSet(elements: any[] = []): Mark[] {
    if (isArray(elements)) {
      const marks = unionWith(elements.map(Mark.create), isEqual);
      return marks;
    }

    if (elements == null) {
      return [];
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
      data,
    });

    return mark;
  }

  static isMark = isType.bind(null, "MARK");

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
      data: this.data.toJSON(),
    };

    return object;
  }
}

Mark.prototype[MODEL_TYPES.MARK] = true;

export default Mark;
