import isPlainObject from "is-plain-object";

import { List } from "immutable";

import Data from "./data";
import Block from "./block";
import Inline from "./inline";
import Document from "./document";
import { isType } from "../constants/model-types";
import Text from "./text";
import Key from "../utils/key-utils";

/**
 * 节点抽象类
 */
abstract class Node {
  constructor() {}

  /**
   * 节点id
   */
  public abstract key: Key;

  /**
   * 子节点
   */
  public abstract nodes: Array<Node>;

  /**
   * 文本
   */
  public abstract text: string;

  /**
   * 节点类型
   */
  public abstract object: "document" | "block" | "inline" | "text";

  /**
   * 节点附加属性
   */
  public data?: Data;

  /**
   * 父节点
   */
  public abstract parent: Node | null;

  /**
   * 创建一个节点
   * @param attrs
   */
  static create(attrs: any = {}) {
    if (Node.isNode(attrs)) {
      return attrs;
    }

    if (isPlainObject(attrs)) {
      let { object } = attrs;

      switch (object) {
        case "block":
          return Block.create(attrs);
        case "document":
          return Document.create(attrs);
        case "inline":
          return Inline.create(attrs);
        case "text":
          return Text.create(attrs);

        default: {
          throw new Error("`Node.create` requires a `object` string.");
        }
      }
    }

    throw new Error(
      `\`Node.create\` only accepts objects or nodes but you passed it: ${attrs}`
    );
  }

  /**
   * 创建一个节点列表
   * @param elements
   */
  static createList(elements: List<any> | Array<any> = []): List<any> {
    if (Array.isArray(elements)) {
      elements = List(elements);
    }
    if (List.isList(elements)) {
      const list = List(elements.map(Node.create));
      return list;
    }

    throw new Error(
      `\`Node.createList\` only accepts lists or arrays, but you passed it: ${elements}`
    );
  }

  /**
   * create a dictionary of settable node properties from attrs
   * @param attrs
   */
  static createProperties(
    attrs: any = {}
  ): { data?: Data; isVoid?: boolean; type: string } {
    if (Block.isBlock(attrs) || Inline.isInline(attrs)) {
      return {
        data: attrs.data,
        isVoid: attrs.isVoid,
        type: attrs.type,
      };
    }

    if (typeof attrs === "string") {
      return { type: attrs };
    }

    if (isPlainObject(attrs)) {
      const props: any = {};
      if ("type" in attrs) props.type = attrs.type;
      if ("data" in attrs) props.data = Data.create(attrs.data);
      if ("isVoid" in attrs) props.isVoid = attrs.isVoid;
      return props;
    }

    throw new Error(
      `\`Node.createProperties\` only accepts objects, strings, blocks or inlines, but you passed it: ${attrs}`
    );
  }

  /**
   * json对象创建节点
   * @param value
   */
  static fromJSON(value: any): Block | Inline | Document | Text {
    let { object } = value;

    switch (object) {
      case "block":
        return Block.fromJSON(value);
      case "document":
        return Document.fromJSON(value);
      case "inline":
        return Inline.fromJSON(value);
      case "text":
        return Text.fromJSON(value);

      default: {
        throw new Error(
          `\`Node.fromJSON\` requires an \`object\` of either 'block', 'document', 'inline' or 'text', but you passed: ${value}`
        );
      }
    }
  }

  /**
   * 判断是否是节点
   * @param any
   */
  static isNode(any: any) {
    return !!["BLOCK", "DOCUMENT", "INLINE", "TEXT"].find((type: string) =>
      isType(type, any)
    );
  }

  /**
   * 判断是否是节点列表
   * @param any
   */
  static isNodeList(any: any): boolean {
    return List.isList(any) && any.every((item) => Node.isNode(item));
  }

  /**
   * 转成普通对象
   * @param options
   */
  public abstract toJSON(options: any): any;
}

export default Node;
