import MODEL_TYPES from "../constants/model-types";
import { keys, isPlainObject } from "lodash-es";

class Data {
  constructor(object: any = {}) {
    if (object) {
      keys(object).forEach((key) => {
        this[key] = object[key];
      });
    }
  }

  static create(attrs: Data | any = {}): Data {
    if (attrs instanceof Data) {
      return attrs;
    }

    if (isPlainObject(attrs)) {
      return Data.fromJSON(attrs);
    }

    throw new Error(
      `\`Data.create\` only accepts objects or Data, but you passed it: ${attrs}`
    );
  }

  static isData(obj?: any) {
    return !!(obj && obj[MODEL_TYPES.DATA]);
  }

  static fromJSON(object: any): Data {
    return new Data(object);
  }

  toJSON() {
    const obj = {};
    keys(this).map((key) => {
      obj[key] = this[key];
    });
    return obj;
  }
}

Data.prototype[MODEL_TYPES.DATA] = true;

export default Data;
