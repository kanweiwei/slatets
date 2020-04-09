import React from "react";

import Leaf from "./leaf";
import { Block, Decoration, PathUtils } from "@zykj/slate";
import { List } from "immutable";

interface TextInterface {
  block: Block;
  decorations: List<Decoration>;
  editor: any;
  node: any;
  parent: any;
  style: any;
}

const Text = (props: TextInterface) => {
  const renderLeaf = (leaves, leaf, index, offset) => {
    const { block, node, parent, editor } = props;
    const { text, marks } = leaf;

    return (
      <Leaf
        key={`${node.key}-${index}`}
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

  const { decorations, editor, node, style = null } = props;
  const { value } = editor;
  const { document } = value;
  const { key } = node;

  const decs = decorations.filter((d) => {
    const { start, end } = d;

    // If either of the decoration's keys match, include it.
    if (start.key === key || end.key === key) return true;

    // Otherwise, if the decoration is in a single node, it's not ours.
    if (start.key === end.key) return false;

    // If the node's path is before the start path, ignore it.
    const path = document.assertPath(key);
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

  return (
    <span data-key={key} style={style}>
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
