import isPlainObject from "is-plain-object";
import logger from "slate-dev-logger";
import { List, Record, Set } from "immutable";

import MODEL_TYPES from "../constants/model-types";
import Mark from "./mark";

const DEFAULTS: any = {
    marks: Set(),
    text: ""
};

class Leaf extends Record(DEFAULTS) {
    /**
     * 属性
     */
    public marks: Set<Mark>;
    public text: string;

    /**
     * 静态方法
     */
    static create(attrs: any = {}): Leaf {
        if (Leaf.isLeaf(attrs)) {
            return attrs;
        }

        if (typeof attrs == "string") {
            attrs = { text: attrs };
        }

        if (isPlainObject(attrs)) {
            return Leaf.fromJSON(attrs);
        }

        throw new Error(
            `\`Leaf.create\` only accepts objects, strings or leaves, but you passed it: ${attrs}`
        );
    }

    // 重新处理一遍叶节点，相邻的 `Leaf` 有相同的 marks 则合并这两个 `Leaf` 节点
    static createLeaves(leaves: List<Leaf>): List<Leaf> {
        if (leaves.size <= 1) return leaves;

        let invalid = false;

        // TODO: we can make this faster with [List] and then flatten
        const result = List().withMutations(cache => {
            // Search from the leaves left end to find invalid node;
            leaves.findLast(
                (leaf: Leaf): any => {
                    const firstLeaf = cache.first() as Leaf;

                    // If the first leaf of cache exist, check whether the first leaf is connectable with the current leaf
                    if (firstLeaf) {
                        // If marks equals, then the two leaves can be connected
                        if (firstLeaf.marks.equals(leaf.marks)) {
                            invalid = true;
                            cache.set(
                                0,
                                firstLeaf.set(
                                    "text",
                                    `${leaf.text}${firstLeaf.text}`
                                )
                            );
                            return;
                        }

                        // If the cached leaf is empty, drop the empty leaf with the upcoming leaf
                        if (firstLeaf.text === "") {
                            invalid = true;
                            cache.set(0, leaf);
                            return;
                        }

                        // If the current leaf is empty, drop the leaf
                        if (leaf.text === "") {
                            invalid = true;
                            return;
                        }
                    }

                    cache.unshift(leaf);
                }
            );
        });

        if (!invalid) return leaves;
        return result as List<Leaf>;
    }

    // 从指定的文字位置分割
    static splitLeaves(leaves: List<Leaf>, offset: number): Array<List<Leaf>> {
        if (offset < 0) return [List(), leaves];

        if (leaves.size === 0) {
            return [List(), List()];
        }

        let endOffset = 0;
        let index = -1;
        let left, right;

        leaves.find((leaf: Leaf) => {
            index++;
            const startOffset = endOffset;
            const { text } = leaf;
            endOffset += text.length;

            if (endOffset < offset) return false;
            if (startOffset > offset) return false;

            const length = offset - startOffset;
            left = leaf.set("text", text.slice(0, length)) as Leaf;
            right = leaf.set("text", text.slice(length)) as Leaf;
            return true;
        });

        if (!left) return [leaves, List()];

        if (left.text === "") {
            if (index === 0) {
                return [List.of(left), leaves];
            }

            return [List(leaves.take(index)), List(leaves.skip(index))];
        }

        if (right.text === "") {
            if (index === leaves.size - 1) {
                return [leaves, List.of(right)];
            }

            return [List(leaves.take(index + 1)), List(leaves.skip(index + 1))];
        }

        return [
            List(leaves.take(index)).push(left) as List<Leaf>,
            List(leaves.skip(index + 1)).unshift(right) as List<Leaf>
        ];
    }

    static createList(elements: Array<any> | List<any> = List()): List<Leaf> {
        if (Array.isArray(elements)) {
            elements = List(elements);
        }
        if (List.isList(elements)) {
            const list: List<Leaf> = List(elements.map(Leaf.create));
            return list;
        }

        throw new Error(
            `\`Leaf.createList\` only accepts arrays or lists, but you passed it: ${elements}`
        );
    }

    static fromJSON(object: { text: string; marks: any[] }): Leaf {
        const { text = "", marks = [] } = object;

        const leaf = new Leaf({
            text,
            marks: Set(marks.map(Mark.fromJSON))
        });

        return leaf;
    }

    static fromJS = Leaf.fromJSON;

    static isLeaf(obj: any) {
        return !!(obj && obj[MODEL_TYPES.LEAF]);
    }

    static isLeafList(any): boolean {
        return List.isList(any) && any.every(item => Leaf.isLeaf(item));
    }
    /**
     * Object.
     *
     * @return {String}
     */
    get object() {
        return "leaf";
    }

    get kind() {
        logger.deprecate(
            "slate@0.32.0",
            "The `kind` property of Slate objects has been renamed to `object`."
        );
        return this.object;
    }

    updateMark(mark: Mark, newMark: Mark): this {
        const { marks } = this;
        if (newMark.equals(mark)) return this;
        if (!marks.has(mark)) return this;
        const newMarks = marks.withMutations(collection => {
            collection.remove(mark).add(newMark);
        });
        return this.set("marks", newMarks) as this;
    }

    addMarks(set: Array<Mark>): this {
        const { marks } = this;
        return this.set("marks", marks.union(set)) as this;
    }

    removeMark(mark: Mark): this {
        const { marks } = this;
        return this.set("marks", marks.remove(mark)) as this;
    }

    toJSON() {
        const object = {
            object: this.object,
            text: this.text,
            marks: this.marks.toArray().map(m => m.toJSON())
        };

        return object;
    }

    toJS() {
        return this.toJSON();
    }
}

Leaf.prototype[MODEL_TYPES.LEAF] = true;

export default Leaf;
