import React from "react";

import Text from "./text";
import { Block, Decoration } from "@zykj/slate";
import { List } from "immutable";

interface VoidInterface {
  block: Block;
  children: any;
  editor: any;
  node: any;
  parent: any;
  readOnly: boolean;
  decorations: List<Decoration>;
}

const Void: React.FC<VoidInterface> = (props: VoidInterface) => {
  const renderText = () => {
    const { block, decorations, node, readOnly, editor } = props;
    const [child] = node.getFirstText();
    return (
      <Text
        block={node.object == "block" ? node : block}
        decorations={decorations}
        editor={editor}
        key={child.key.id}
        node={child}
        parent={node}
        readOnly={readOnly}
      />
    );
  };

  const { children, node, readOnly } = props;
  const Tag = node.object == "block" ? "div" : "span";
  const style: any = {
    height: "0",
    color: "transparent",
    outline: "none",
    position: "absolute",
  };

  const spacer = (
    <Tag data-slate-spacer style={style}>
      {renderText()}
    </Tag>
  );

  const content = (
    <Tag contentEditable={readOnly ? void 0 : false}>{children}</Tag>
  );

  return (
    <Tag
      data-slate-void
      data-key={node.key.id}
      contentEditable={readOnly || node.object == "block" ? void 0 : false}
    >
      {readOnly ? null : spacer}
      {content}
    </Tag>
  );
};

export default Void;
