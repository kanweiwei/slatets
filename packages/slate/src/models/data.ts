import isPlainObject from "is-plain-object";
import { Map } from "immutable";

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

    static fromJSON(object): Map<any, any> {
        return Map(object);
    }
    // alias 'fromJSON'
    static fromJS = Data.fromJSON;
}

export default Data;
