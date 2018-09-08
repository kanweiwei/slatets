import isPlainObject from "is-plain-object";
import logger from "slate-dev-logger";
import { Map, Record, Set } from "immutable";

import MODEL_TYPES, { isType } from "../constants/model-types";
import Data from "./data";
import memoize from "../utils/memoize";

const DEFAULTS: any = {
    data: Map(),
    type: void 0
};

class Mark extends Record(DEFAULTS) {
    public type: string;
    public data: Map<any, any>;

    static create(attrs: any = {}): Mark {
        if (Mark.isMark(attrs)) {
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

    static createSet(elements: any[]): Set<Mark> {
        if (Set.isSet(elements) || Array.isArray(elements)) {
            const marks = Set(elements.map(Mark.create));
            return marks;
        }

        if (elements == null) {
            return Set();
        }

        throw new Error(
            `\`Mark.createSet\` only accepts sets, arrays or null, but you passed it: ${elements}`
        );
    }

    static createProperties(attrs: any = {}): { data?: any; type: string } {
        if (Mark.isMark(attrs)) {
            return {
                data: attrs.data,
                type: attrs.type
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

    static fromJSON(object: any) {
        const { data = {}, type } = object;

        if (typeof type != "string") {
            throw new Error("`Mark.fromJS` requires a `type` string.");
        }

        const mark = new Mark({
            type,
            data: Map(data)
        });

        return mark;
    }

    static fromJS = Mark.fromJSON;

    static isMark: (item: any) => boolean = isType.bind(null, "MARK");

    static isMarkSet(any) {
        return Set.isSet(any) && any.every(item => Mark.isMark(item));
    }

    get object(): "mark" {
        return "mark";
    }

    get kind(): "mark" {
        logger.deprecate(
            "slate@0.32.0",
            "The `kind` property of Slate objects has been renamed to `object`."
        );
        return this.object;
    }

    toJSON() {
        const object: any = {
            object: this.object,
            type: this.type,
            data: (this.data as any).toJSON()
        };

        return object;
    }

    toJS() {
        return this.toJSON();
    }
}

Mark.prototype[MODEL_TYPES.MARK] = true;

memoize(Mark.prototype, ["getComponent"]);

export default Mark;
