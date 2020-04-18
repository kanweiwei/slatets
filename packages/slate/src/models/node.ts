import isPlainObject from "is-plain-object";
import logger from "slate-dev-logger";

import { List } from "immutable";

import Data from "./data";
import Block from "./block";
import Inline from "./inline";
import Document from "./document";
import { isType } from "../constants/model-types";
import Text from "./text";
import Key from "../utils/key-utils";

/**
 * A pseudo-model that is used for its static methods only.
 */
class Node {
  public key: Key;
  public nodes: List<any>;
  public text: string;

  public object: "document" | "block" | "inline" | "text";

  /**
   * craete a new Node width attrs
   * @param attrs
   */
  static create(attrs: any = {}) {
    if (Node.isNode(attrs)) {
      return attrs;
    }

    if (isPlainObject(attrs)) {
      let { object, kind } = attrs;

      if (!object && kind) {
        logger.deprecate(
          "slate@0.32.0",
          "The `kind` property of Slate objects has been renamed to `object`."
        );

        object = kind;
      }

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
   * create a list of Nodes from an Array or a List
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
   * create a Node from a JSON value
   * @param value
   */
  static fromJSON(value: any): Block | Inline | Document | Text {
    let { object, kind } = value;

    if (!object && kind) {
      logger.deprecate(
        "slate@0.32.0",
        "The `kind` property of Slate objects has been renamed to `object`."
      );

      object = kind;
    }

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
   * check if any is a Node
   * @param any
   */
  static isNode(any: any) {
    return !!["BLOCK", "DOCUMENT", "INLINE", "TEXT"].find((type: string) =>
      isType(type, any)
    );
  }

  /**
   * check if any is a list of nodes
   * @param any
   */
  static isNodeList(any: any): boolean {
    return List.isList(any) && any.every((item) => Node.isNode(item));
  }
}

export default Node;
