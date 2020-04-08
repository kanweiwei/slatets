// import Debug from "debug";
import React, { useRef, useEffect } from "react";
import logger from "slate-dev-logger";

import Void from "./void";
import Text from "./text";
import getChildrenDecorations from "../utils/get-children-decorations";
import { List } from "immutable";
import { useIsomorphicLayoutEffect } from "../hooks";
import {
  KEY_TO_ELEMENT,
  NODE_TO_ELEMENT,
  ELEMENT_TO_NODE,
} from "../utils/weak-maps";

/**
 * Debug.
 *
 * @type {Function}
 */

// const DebugNode = Debug("slate:node");

/**
 * Node.
 *
 * @type {Component}
 */

interface NodeProps {
  block: any;
  decorations: List<any>;
  editor: any;
  isFocused: boolean;
  isSelected: boolean;
  node: any;
  parent: any;
  readOnly: any;
}

const Node = (props: NodeProps) => {
  // const debug = (message, ...args) => {
  //   const { node } = props;
  //   const { key, type } = node;
  //   DebugNode(message, `${key} (${type})`, ...args);
  // };
  // Attributes that the developer must mix into the element in their
  // custom node renderer component.
  const {
    editor,
    isSelected,
    isFocused,
    node,
    decorations,
    parent,
    readOnly,
  } = props;

  const ref = useRef<HTMLElement>(null);
  const key = node.key;

  useEffect(() => {
    if (ref.current) {
      KEY_TO_ELEMENT.set(key, ref.current);
      NODE_TO_ELEMENT.set(node, ref.current);
      ELEMENT_TO_NODE.set(ref.current, node);
    } else {
      KEY_TO_ELEMENT.delete(key);
      NODE_TO_ELEMENT.delete(node);
    }
    console.log(KEY_TO_ELEMENT, NODE_TO_ELEMENT, ELEMENT_TO_NODE);
  });

  const renderNode = (child, isSelected, decorations) => {
    const { block, editor, node, readOnly, isFocused } = props;
    const Component = child.object == "text" ? Text : Node;

    return (
      <Component
        block={node.object == "block" ? node : block}
        decorations={decorations}
        editor={editor}
        isSelected={isSelected}
        isFocused={isFocused && isSelected}
        key={child.key}
        node={child}
        parent={node}
        readOnly={readOnly}
      />
    );
  };

  const { value } = editor;
  const { selection, schema } = value;
  const { stack } = editor;
  const indexes = node.getSelectionIndexes(selection, isSelected);
  const decs = decorations.concat(node.getDecorations(stack));
  const childrenDecorations = getChildrenDecorations(node, decs);

  let children: any[] = [];

  node.nodes.forEach((child, i) => {
    const isChildSelected = !!indexes && indexes.start <= i && i < indexes.end;

    children.push(renderNode(child, isChildSelected, childrenDecorations[i]));
  });

  const attributes: any = { "data-key": node.key, ref };

  // If it's a block node with inline children, add the proper `dir` attribute
  // for text direction.
  if (node.object == "block" && node.nodes.first().object != "block") {
    const direction = node.getTextDirection();
    if (direction == "rtl") attributes.dir = "rtl";
  }

  const nodeProps = {
    key: node.key,
    editor,
    isFocused,
    isSelected,
    node,
    parent,
    readOnly,
  };

  let placeholder = stack.$$find("renderPlaceholder", nodeProps);

  if (placeholder) {
    placeholder = React.cloneElement(placeholder, {
      key: `${node.key}-placeholder`,
    });

    children = [placeholder, ...children];
  }

  const element = stack.$$find("renderNode", {
    ...nodeProps,
    attributes,
    children,
  });

  return schema.isVoid(node) ? <Void {...props}>{element}</Void> : element;
};

const MemoNode = React.memo(Node, (pre, next) => {
  const props = pre;
  // const { stack } = props.editor;
  // const shouldUpdate = stack.$$find("shouldNodeComponentUpdate", props, next);
  const n = next;
  const p = props;

  // If the `Component` has a custom logic to determine whether the component
  // needs to be updated or not, return true if it returns true. If it returns
  // false, we need to ignore it, because it shouldn't be allowed it.
  // if (shouldUpdate != null) {
  //   if (shouldUpdate) {
  //     return true;
  //   }

  //   if (shouldUpdate === false) {
  //     logger.warn(
  //       "Returning false in `shouldNodeComponentUpdate` does not disable Slate's internal `shouldComponentUpdate` logic. If you want to prevent updates, use React's `shouldComponentUpdate` instead."
  //     );
  //   }
  // }

  // If the `readOnly` status has changed, re-render in case there is any
  // user-land logic that depends on it, like nested editable contents.
  if (n.readOnly != p.readOnly) return false;

  // If the node has changed, update. PERF: There are cases where it will have
  // changed, but it's properties will be exactly the same (eg. copy-paste)
  // which this won't catch. But that's rare and not a drag on performance, so
  // for simplicity we just let them through.
  if (n.node != p.node) return false;

  // If the selection value of the node or of some of its children has changed,
  // re-render in case there is any user-land logic depends on it to render.
  // if the node is selected update it, even if it was already selected: the
  // selection value of some of its children could have been changed and they
  // need to be rendered again.
  if (n.isSelected || p.isSelected) return false;
  if (n.isFocused || p.isFocused) return false;

  // If the decorations have changed, update.
  if (!n.decorations.equals(p.decorations)) return false;

  return true;
});

export default MemoNode;
