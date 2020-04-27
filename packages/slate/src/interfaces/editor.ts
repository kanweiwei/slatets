import { List } from "immutable";

export const editor = {
  getBlocks() {
    const array = editor.getBlocksAsArray();
    return List(array);
  },
  getBlocksAtRange(range: Range) {},

  getBlocksAsArray() {
    return this.nodes.reduce(
      (
        array: any[],
        child: {
          object: string;
          isLeafBlock: () => any;
          getBlocksAsArray: () => any;
        }
      ) => {
        if (child.object != "block") return array;
        if (!child.isLeafBlock()) return array.concat(child.getBlocksAsArray());
        array.push(child);
        return array;
      },
      []
    );
  },
};
