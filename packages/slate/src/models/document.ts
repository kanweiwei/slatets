import { List, Map } from "immutable";
import isPlainObject from "is-plain-object";
import { Path } from "..";
import MODEL_TYPES from "../constants/model-types";
import NodeInterface from "../interfaces/baseNode";
import Key from "../utils/key-utils";
import mixin from "../utils/mixin";
import Data from "./data";
import Node from "./node";
import Range from "./range";

/**
 * 文档节点
 */
class Document extends Node implements NodeInterface {
  constructor(obj) {
    super();
    this.key = obj.key;
    this.nodes = obj.nodes;
    this.data = obj.data;
  }

  public key: Key;

  public data: Data = new Data();

  public nodes: Array<Node> = [];

  public parent = null;

  get object(): "document" {
    return "document";
  }

  /**
   * 创建文档节点
   * @param attrs
   */
  static create(attrs: any = {}) {
    if (Document.isDocument(attrs)) {
      return attrs;
    }

    if (List.isList(attrs) || Array.isArray(attrs)) {
      attrs = { nodes: attrs };
    }

    if (isPlainObject(attrs)) {
      return Document.fromJSON(attrs);
    }

    throw new Error(
      `\`Document.create\` only accepts objects, arrays, lists or documents, but you passed it: ${attrs}`
    );
  }

  /**
   * 使用json对象创建文档节点
   * @param object
   */
  static fromJSON(object: any) {
    if (Document.isDocument(object)) {
      return object;
    }

    const { data = {}, key = Key.create(), nodes = [] } = object;

    const document = new Document({
      key,
      data: Map(data),
      nodes: Node.createList(nodes),
    });

    return document;
  }

  /**
   * 判断是否是文档节点
   * @param obj
   */
  static isDocument(obj: any) {
    return !!(obj && obj[MODEL_TYPES["DOCUMENT"]]);
  }

  toJSON(options: any = {}) {
    const object: any = {
      object: this.object,
      data: this.data.toJSON(),
      nodes: this.nodes.map((n) => n.toJSON(options)),
    };

    if (options.preserveKeys) {
      object.key = this.key;
    }

    return object;
  }

  // 获取选区内的文档片段
  getFragmentAtRange(range: Range): Document {
    if (range.isUnset) {
      return Document.create();
    }

    const { start, end } = range;
    let node = this;
    let targetPath = end.path;
    let targetPosition = end.offset;
    let mode = "end";
    while (targetPath && targetPath.length) {
      const index = targetPath.last();

      node = node.splitNode(targetPath, targetPosition);
      targetPosition = index + 1;
      targetPath = Path.lift(targetPath);

      if (!targetPath.size && mode === "end") {
        targetPath = start.path;
        targetPosition = start.offset;
        mode = "start";
      }
    }

    const startIndex = start.path.first() + 1;
    const endIndex = end.path.first() + 2;

    const nodes = node.nodes.slice(startIndex, endIndex);
    const fragment = Document.create({ nodes });
    return fragment;
  }
}

Document.prototype[MODEL_TYPES.DOCUMENT] = true;

mixin(NodeInterface, [Document]);

export default Document;
