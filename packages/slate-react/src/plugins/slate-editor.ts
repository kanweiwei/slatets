import { Document, NODE_TO_INDEX, NODE_TO_PARENT } from "@zykj/slate";
import { List } from "immutable";

const slateEditor = {
  findPath(node: Node): List<number> {
    let path: List<number> = List();
    let child = node;

    while (true) {
      const parent = NODE_TO_PARENT.get(child);

      if (parent == null) {
        if (Document.isDocument(child)) {
          return path;
        } else {
          break;
        }
      }

      const i = NODE_TO_INDEX.get(child);

      if (i == null) {
        break;
      }

      path = path.unshift(i);
      child = parent;
    }

    throw new Error(
      `Unable to find the path for Slate node: ${JSON.stringify(node)}`
    );
  },
};

export default slateEditor;
