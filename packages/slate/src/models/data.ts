import isPlainObject from "is-plain-object";
import { Map } from "immutable";
import MODEL_TYPES from "../constants/model-types"

class Data {
    static create(attrs: any = {}): Map<any, any> {
        if (Map.isMap(attrs)) {
            return attrs;
        }

        if (isPlainObject(attrs)) {
            return Data.fromJSON(attrs);
        }

        throw new Error(
            `\`Data.create\` only accepts objects or maps, but you passed it: ${attrs}`
        );
    }

    static isData(obj) {
        return !!(obj && obj[MODEL_TYPES.DATA]);
    }

    static fromJSON(object): Map<any, any> {
        return Map(object);
    }
    // alias 'fromJSON'
    static fromJS = Data.fromJSON;
}

Data.prototype[MODEL_TYPES.CHANGE] = true;

export default Data;
