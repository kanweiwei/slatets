import React from "react";

import OffsetKey from "../utils/offset-key";
import { Leaf, Mark } from "@zykj/slate";
import { List } from "immutable";

interface LeafInterface {
  block: any;
  editor: any;
  index: number;
  leaves: List<Leaf>;
  marks: List<Mark>;
  node: any;
  offset: number;
  parent: any;
  text: string;
}

const Leaf = (props: LeafInterface) => {
  const renderMarks = () => {
    const { marks, node, offset, text, editor } = props;
    const { stack } = editor;
    const leaf = renderText();
    const attributes = {
      "data-slate-leaf": true,
    };

    return marks.reduce((children, mark) => {
      const props = {
        editor,
        mark,
        marks,
        node,
        offset,
        text,
        children,
        attributes,
      };
      const element = stack.$$find("renderMark", props);
      return element || children;
    }, leaf);
  };

  const renderText = () => {
    const { block, node, editor, parent, text, index, leaves } = props;
    const { value } = editor;
    const { schema } = value;

    // COMPAT: Render text inside void nodes with a zero-width space.
    // So the node can contain selection but the text is not visible.
    if (schema.isVoid(parent)) {
      return <span data-slate-zero-width="z">{"\u200B"}</span>;
    }

    // COMPAT: If this is the last text node in an empty block, render a zero-
    // width space that will convert into a line break when copying and pasting
    // to support expected plain text.
    if (
      text === "" &&
      parent.object === "block" &&
      parent.text === "" &&
      parent.nodes.size === 1
    ) {
      return <span data-slate-zero-width="n">{"\u200B"}</span>;
    }

    // COMPAT: If the text is empty, it's because it's on the edge of an inline
    // void node, so we render a zero-width space so that the selection can be
    // inserted next to it still.
    if (text === "") {
      return <span data-slate-zero-width="z">{"\u200B"}</span>;
    }

    // COMPAT: Browsers will collapse trailing new lines at the end of blocks,
    // so we need to add an extra trailing new lines to prevent that.
    const lastText = block.getLastText();
    const lastChar = text.charAt(text.length - 1);
    const isLastText = node === lastText;
    const isLastLeaf = index === leaves.size - 1;
    if (isLastText && isLastLeaf && lastChar === "\n") return `${text}\n`;

    // Otherwise, just return the text.
    return text;
  };

  const { node, index } = props;
  const offsetKey = OffsetKey.stringify({
    key: node.key,
    index,
  });

  return <span data-offset-key={offsetKey}>{renderMarks()}</span>;
};

const MemoLeaf = React.memo(Leaf, (pre, next) => {
  // If any of the regular properties have changed, re-render.
  if (
    next.index != pre.index ||
    next.marks != pre.marks ||
    next.text != pre.text ||
    next.parent != pre.parent
  ) {
    return false;
  }

  return true;
});

export default MemoLeaf;
