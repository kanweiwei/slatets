import React, { useRef } from "react";

import Leaf from "./leaf";
import {
  Block,
  Decoration,
  PathUtils,
  KEY_TO_ELEMENT,
  NODE_TO_ELEMENT,
  ELEMENT_TO_NODE,
  NODE_TO_PARENT,
  NODE_TO_INDEX,
  NODE_TO_KEY,
  KEY_TO_NODE,
} from "@zykj/slate";
import { List } from "immutable";
import { isEqual } from "lodash-es";
import { useIsomorphicLayoutEffect } from "../hooks";

interface TextInterface {
  block: Block;
  decorations: List<Decoration>;
  editor: any;
  node: any;
  parent: any;
  index: number;
  readOnly?: boolean;
  style?: any;
}

const Text = (props: TextInterface) => {
  const renderLeaf = (leaves, leaf, index, offset) => {
    const { block, node, parent, editor } = props;
    const { text, marks } = leaf;

    return (
      <Leaf
        key={`${node.key.id}-${index}`}
        block={block}
        editor={editor}
        index={index}
        marks={marks}
        node={node}
        offset={offset}
        parent={parent}
        leaves={leaves}
        text={text}
      />
    );
  };

  const { decorations, editor, node, style = null, index } = props;
  const { value } = editor;
  const { document } = value;
  const { key } = node;

  const decs = decorations.filter((d) => {
    const { start, end } = d;

    // If either of the decoration's keys match, include it.
    if (isEqual(start.key, key) || isEqual(end.key, key)) return true;

    // Otherwise, if the decoration is in a single node, it's not ours.
    if (isEqual(start.key, key)) return false;

    // If the node's path is before the start path, ignore it.
    const path = document.getPath(key);
    if (PathUtils.compare(path, start.path) === -1) return false;

    // If the node's path is after the end path, ignore it.
    if (PathUtils.compare(path, end.path) === 1) return false;

    // Otherwise, include it.
    return true;
  });

  // PERF: Take advantage of cache by avoiding arguments
  const leaves = decs.size === 0 ? node.getLeaves() : node.getLeaves(decs);
  let offset = 0;

  const children = leaves.map((leaf, i) => {
    const child = renderLeaf(leaves, leaf, i, offset);
    offset += leaf.text.length;
    return child;
  });

  const ref = useRef<HTMLSpanElement>(null);

  useIsomorphicLayoutEffect(() => {
    if (ref.current) {
      KEY_TO_ELEMENT.set(key, ref.current);
      NODE_TO_ELEMENT.set(node, ref.current);
      ELEMENT_TO_NODE.set(ref.current, node);
      NODE_TO_INDEX.set(node, index);

      NODE_TO_PARENT.set(node, props.parent);
      NODE_TO_KEY.set(node, key);
      KEY_TO_NODE.set(key, node);
    } else {
      KEY_TO_ELEMENT.delete(key);
      NODE_TO_ELEMENT.delete(node);
    }
  });

  return (
    <span data-key={key.id} style={style} ref={ref}>
      {children}
    </span>
  );
};

const MemoText = React.memo(Text, (pre, next) => {
  const n = next;
  const p = pre;

  // If the node has changed, update. PERF: There are cases where it will have
  // changed, but it's properties will be exactly the same (eg. copy-paste)
  // which this won't catch. But that's rare and not a drag on performance, so
  // for simplicity we just let them through.
  if (n.node != p.node) return false;

  if (n.parent.object == "block") {
    const pLast = p.parent.nodes.last();
    const nLast = n.parent.nodes.last();
    if (p.node == pLast && n.node != nLast) return false;
  }

  // Re-render if the current decorations have changed.
  if (!n.decorations.equals(p.decorations)) return false;

  return true;
});

export default MemoText;
