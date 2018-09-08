import isPlainObject from "is-plain-object";
import logger from "slate-dev-logger";
import { Record, List } from "immutable";

import KeyUtils from "../utils/key-utils";
import PathUtils from "../utils/path-utils";
import MODEL_TYPES from "../constants/model-types";

/**
 * default properties
 */
const DEFAULTS: any = {
    key: null,
    offset: null,
    path: null
};

class Point extends Record(DEFAULTS) {
    public key: string | null;
    public offset: number | null;
    public path: List<number> | null;

    get object() {
        return "point";
    }

    get isSet() {
        return this.key != null && this.offset != null && this.path != null;
    }

    get isUnset() {
        return !this.isSet;
    }

    static create(attrs: any = {}) {
        if (Point.isPoint(attrs)) {
            return attrs;
        }

        if (isPlainObject(attrs)) {
            return Point.fromJSON(attrs);
        }

        throw new Error(
            `\`Point.create\` only accepts objects or points, but you passed it: ${attrs}`
        );
    }

    static createProperties(a: any = {}) {
        if (Point.isPoint(a)) {
            return {
                key: a.key,
                offset: a.offset,
                path: a.path
            };
        }

        if (isPlainObject(a)) {
            const p: any = {};
            if ("key" in a) p.key = a.key;
            if ("offset" in a) p.offset = a.offset;
            if ("path" in a) p.path = PathUtils.create(a.path);

            // If only a path is set, or only a key is set, ensure that the other is
            // set to null so that it can be normalized back to the right value.
            // Otherwise we won't realize that the path and key don't match anymore.
            if ("path" in a && !("key" in a)) p.key = null;
            if ("key" in a && !("path" in a)) p.path = null;

            return p;
        }

        throw new Error(
            `\`Point.createProperties\` only accepts objects or points, but you passed it: ${a}`
        );
    }

    static fromJSON(object) {
        const { key = null, offset = null, path = null } = object;

        const point = new Point({
            key,
            offset,
            path: PathUtils.create(path)
        });

        return point;
    }

    static fromJS = Point.fromJSON;

    static isPoint(obj) {
        return !!(obj && obj[MODEL_TYPES.POINT]);
    }

    isAtEndOfNode(node: any) {
        if (this.isUnset) return false;
        const last = node.getLastText();
        const is = this.key === last.key && this.offset === last.text.length;
        return is;
    }

    isAtStartOfNode(node: any) {
        if (this.isUnset) return false;

        // PERF: Do a check for a `0` offset first since it's quickest.
        if (this.offset != 0) return false;

        const first = node.getFirstText();
        const is = this.key === first.key;
        return is;
    }

    isInNode(node: any) {
        if (this.isUnset) return false;
        if (node.object === "text" && node.key === this.key) return true;
        if (node.hasNode(this.key)) return true;
        return false;
    }

    moveBackward(n = 1) {
        if (n === 0) return this;
        if (n < 0) return this.moveForward(-n);
        const point = this.setOffset((this.offset as number) - n);
        return point;
    }

    moveForward(n = 1) {
        if (n === 0) return this;
        if (n < 0) return this.moveBackward(-n);
        const point = this.setOffset((this.offset as number) + n);
        return point;
    }

    moveTo(path: number | string | List<number> | null, offset = 0) {
        let key = this.key;

        if (typeof path === "number") {
            offset = path;
            path = this.path;
        } else if (typeof path === "string") {
            key = path;
            path = key === this.key ? this.path : null;
        } else {
            key = this.path && path && path.equals(this.path) ? this.key : null;
        }

        const point = this.merge({ key, path, offset });
        return point;
    }

    moveToStartOfNode(node) {
        const first = node.getFirstText();
        const point = this.moveTo(first.key, 0);
        return point;
    }

    moveToEndOfNode(node) {
        const last = node.getLastText();
        const point = this.moveTo(last.key, last.text.length);
        return point;
    }

    normalize(node) {
        // If both the key and path are null, there's no reference to a node, so
        // make sure it is entirely unset.
        if (this.key == null && this.path == null) {
            return this.setOffset(null);
        }

        const { key, offset, path } = this;
        const target = node.getNode(key || path);

        if (!target) {
            logger.warn(
                "A point's `path` or `key` invalid and was reset:",
                this
            );

            const text = node.getFirstText();
            if (!text) return Point.create();

            const point = this.merge({
                key: text.key,
                offset: 0,
                path: node.getPath(text.key)
            });

            return point;
        }

        if (target.object !== "text") {
            logger.warn(
                "A point should not reference a non-text node:",
                target
            );

            const text = target.getTextAtOffset(offset);
            const before = target.getOffset(text.key);
            const point = this.merge({
                offset: (offset as number) - before,
                key: text.key,
                path: node.getPath(text.key)
            });

            return point;
        }

        if (target && path && key && key !== target.key) {
            logger.warn(
                "A point's `key` did not match its `path`:",
                this,
                target
            );
        }

        const point = this.merge({
            key: target.key,
            path: path == null ? node.getPath(target.key) : path,
            offset: offset == null ? 0 : Math.min(offset, target.text.length)
        });

        return point;
    }

    setKey(key) {
        if (key !== null) {
            key = KeyUtils.create(key);
        }

        const point = this.set("key", key);
        return point;
    }

    setOffset(offset) {
        const point = this.set("offset", offset);
        return point;
    }

    setPath(path) {
        if (path !== null) {
            path = PathUtils.create(path);
        }

        const point = this.set("path", path);
        return point;
    }

    toJSON(options: any = {}) {
        const object: any = {
            object: this.object,
            key: this.key,
            offset: this.offset,
            path: this.path && this.path.toArray()
        };

        if (!options.preserveKeys) {
            delete object.key;
        }

        return object;
    }

    /**
     * Alias `toJS`.
     */
    toJS(options: any = {}) {
        return this.toJSON(options);
    }
}

Point.prototype[MODEL_TYPES.POINT] = true;

export default Point;
