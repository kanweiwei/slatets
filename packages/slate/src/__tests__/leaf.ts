import Leaf from "../models/leaf";
import Mark from "../models/mark";

function getLeafSet() {
  let leafArr = [
    {
      text: "he",
    },
    {
      text: "l",
      marks: [
        {
          type: "bold",
        },
      ],
    },
    {
      text: "l",
      marks: [
        {
          type: "bold",
        },
      ],
    },
    { text: "o" },
    {
      text: " world",
    },
  ];
  const leafs = Leaf.createList(leafArr);
  const leafSet = Leaf.createLeaves(leafs);
  return leafSet;
}

describe("test Leaf moel", () => {
  test("constructor", () => {
    const leaf = new Leaf({
      text: "abc",
      marks: [
        {
          type: "bold",
          data: {
            fontWeight: 200,
          },
        },
        {
          type: "bold",
          data: {
            fontWeight: 200,
          },
        },
        {
          type: "small",
        },
      ],
    });
    expect(leaf).toBeInstanceOf(Leaf);
    expect(leaf.marks.length).toBe(2);
  });

  test("create", () => {
    expect(Leaf.create("abc")).toBeInstanceOf(Leaf);
    expect(Leaf.create("abc").text).toBe("abc");
    expect(Leaf.create({ text: "abc" })).toBeInstanceOf(Leaf);
    expect(() => Leaf.create()).not.toThrow(Error);
  });

  test("createLeaves", () => {
    const leafSet = getLeafSet();
    expect(leafSet.every((l) => Leaf.isLeaf(l))).toBe(true);
    expect(leafSet.length).toBe(3);
    expect(leafSet.reduce((s, n) => s + n.text, "")).toBe("hello world");
  });

  test("split leaves, offset = 0", () => {
    const leafs = getLeafSet();
    const arr = Leaf.splitLeaves(leafs, 0);
    expect(arr.length).toBe(2);
    expect(arr[0].length).toBe(1);
    expect(arr[1].length).toBe(3);
  });

  test("split leaves, offset = 1", () => {
    const leafs = getLeafSet();
    const arr = Leaf.splitLeaves(leafs, 1);
    expect(arr.length).toBe(2);
    expect(arr[0].length).toBe(1);
    expect(arr[1].length).toBe(3);
  });

  test("split leaves, offset = 2", () => {
    const leafs = getLeafSet();
    const arr = Leaf.splitLeaves(leafs, 2);

    expect(arr.length).toBe(2);
    expect(arr[0].length).toBe(1);
    expect(arr[1].length).toBe(2);
  });

  test("fromJSON", () => {
    const leaf = Leaf.fromJSON({
      text: "abc",
      marks: [
        {
          type: "bold",
        },
      ],
    });
    expect(leaf).toBeInstanceOf(Leaf);
    expect(leaf.marks.length).toBe(1);
    expect(leaf.marks[0]).toBeInstanceOf(Mark);
  });

  test("isLeaf", () => {
    const leaf = Leaf.create("abc");
    expect(Leaf.isLeaf(leaf)).toBe(true);
    expect(Leaf.isLeaf({})).toBe(false);
  });

  test("update mark", () => {
    const leaf = Leaf.create({
      text: "hello world",
      marks: [
        {
          type: "bold",
        },
        {
          type: "small",
        },
      ],
    });

    let newLeaf = leaf.updateMark(Mark.create("bold"), Mark.create("italic"));
    newLeaf = leaf.updateMark(Mark.create("bold"), Mark.create("delete"));
    expect(newLeaf.marks.some((m) => m.type === "italic")).toBe(true);
    expect(newLeaf.marks.some((m) => m.type === "bold")).toBe(false);
    expect(newLeaf.marks.some((m) => m.type === "delete")).toBe(false);
    expect(newLeaf.marks.map((m) => m.type)).toEqual(["small", "italic"]);
  });

  test("add mark", () => {
    const leaf = Leaf.create({
      text: "hello world",
      marks: [
        {
          type: "bold",
        },
        {
          type: "small",
        },
      ],
    });
    let newLeaf = leaf.addMark(Mark.create("bold"));
    expect(newLeaf.marks.length).toBe(2);
    newLeaf = newLeaf.addMark(Mark.create("italic"));
    expect(newLeaf.marks.length).toBe(3);
  });

  test("add marks", () => {
    const leaf = Leaf.create({
      text: "hello world",
      marks: [
        {
          type: "bold",
        },
        {
          type: "small",
        },
      ],
    });
    let newLeaf = leaf.addMarks(["bold", "italic"].map(Mark.create));
    expect(newLeaf.marks.length).toBe(3);
  });

  test("remove Mark", () => {
    const leaf = Leaf.create({
      text: "hello world",
      marks: [
        {
          type: "bold",
        },
        {
          type: "bold",
          data: {
            fontWeight: 200,
          },
        },
        {
          type: "small",
        },
      ],
    });
    const newLeaf = leaf.removeMark(Mark.create("bold"));
    expect(newLeaf.marks.some((m) => m.type === "bold")).toBe(true);
    expect(newLeaf.marks.length).toBe(2);
  });

  test("toJSON", () => {
    const obj = {
      text: "abc",
      marks: [
        {
          type: "bold",
        },
      ],
    };
    const leaf = Leaf.create(obj);
    expect(leaf.toJSON().object).toBe("leaf");
    expect(leaf.toJSON().marks).toEqual([
      {
        type: "bold",
        object: "mark",
        data: {},
      },
    ]);
    expect(leaf.toJSON().marks[0]).not.toBeInstanceOf(Mark);
  });
});
