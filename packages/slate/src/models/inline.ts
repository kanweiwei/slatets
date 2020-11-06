import isPlainObject from "is-plain-object";

import MODEL_TYPES from "../constants/model-types";
import Key from "../utils/key-utils";
import Node from "./node";
import Text from "./text";
import Data from "./data";
import BaseNode from "../interfaces/baseNode";

/**
 * Inline
 * @type {Inline}
 */
class Inline extends BaseNode {
  // 计算属性
  get object(): "inline" {
    return "inline";
  }

  constructor(data) {
    super(data);
    this.key = data.key;
    this.nodes = data.nodes;
    this.data = data.data;
    this.parent = data.parent;
  }

  static create(properties: any = {}): Inline {
    if (Inline.isInline(properties)) {
      return properties;
    }

    if (typeof properties == "string") {
      properties = { type: properties };
    }

    if (isPlainObject(properties)) {
      return Inline.fromJSON(properties);
    }

    throw new Error(`\`Inline.create\` only accepts objects, strings or inlines, but you passed it: ${properties}`);
  }

  static createList(elements: Array<any>): Array<Inline> {
    if (!elements) {
      elements = [];
    }
    if (Array.isArray(elements)) {
      const list = elements.map(Inline.create);
      return list;
    }

    throw new Error(`\`Inline.createList\` only accepts arrays or lists, but you passed it: ${elements}`);
  }

  static fromJSON(obj: any) {
    if (Inline.isInline(obj)) {
      return obj;
    }

    const { data = {}, isVoid = false, key = Key.create(), nodes = [], type } = obj;

    if (typeof type != "string") {
      throw new Error("`Inline.fromJS` requires a `type` string.");
    }

    const inline = new Inline({
      key,
      type,
      isVoid: !!isVoid,
      data: Data.create(data),
      nodes: nodes.length === 0 && !!isVoid ? [Text.create("")] : Node.createList(nodes),
    });

    return inline;
  }

  static isInline(obj) {
    return !!(obj && obj[MODEL_TYPES.INLINE]);
  }

  static isInlineList(any) {
    return Array.isArray(any) && any.every((item) => Inline.isInline(item));
  }

  // 成员方法
  toJSON(options: any = {}): any {
    const object: any = {
      object: this.object,
      type: this.type,
      isVoid: this.isVoid,
      data: this.data.toJSON(),
      nodes: this.nodes.map((n: any) => n.toJSON(options)),
    };

    if (options.preserveKeys) {
      object.key = this.key;
    }

    return object;
  }
}

Inline.prototype[MODEL_TYPES.INLINE] = true;

export default Inline;
