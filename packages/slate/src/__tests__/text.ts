import Text from "../models/text";
import Key from "../utils/key-utils";
import Leaf from "../models/leaf";
import Mark from "../models/mark";
describe("test Text", () => {
  test("constructor", () => {
    const obj1 = {};
    const t1 = new Text(obj1);
    expect(t1).toBeInstanceOf(Text);
    expect(t1.key).toBeInstanceOf(Key);
    expect(t1.leaves).toEqual([]);

    const obj2 = {
      leaves: [
        {
          text: "abc",
          marks: [{ type: "bold" }],
        },
      ],
    };
    const t2 = new Text(obj2);
    expect(t2.leaves.length).toBe(1);
    expect(t2.leaves[0]).toBeInstanceOf(Leaf);
    expect(t2.leaves[0].text).toBe("abc");
  });

  test("create", () => {
    const t1 = Text.create("abc");
    expect(t1.leaves.length).toBe(1);
    expect(t1.leaves[0]).toBeInstanceOf(Leaf);
    expect(Text.create(t1) === t1).toBeTruthy();

    const obj = {
      leaves: [
        {
          text: "abc",
          marks: [{ type: "bold" }],
        },
      ],
    };
    const t2 = Text.create(obj);
    expect(t2).toBeInstanceOf(Text);
    expect(Text.create()).toBeInstanceOf(Text);
    expect(t2).toMatchSnapshot();
  });

  test("createList", () => {
    const elements = [
      {
        leaves: [
          {
            text: "hello",
          },
        ],
      },
      {
        leaves: [
          {
            text: "world",
          },
        ],
      },
    ];
    const texts = Text.createList(elements);
    expect(texts.length).toBe(2);
    expect(texts.every((n) => Text.isText(n))).toBeTruthy();
    expect(texts).toMatchSnapshot();
  });

  test("fromJSON", () => {
    const leaves = [
      {
        text: "abc",
        marks: [
          {
            type: "bold",
          },
        ],
      },
    ];
    const t = Text.fromJSON({ leaves });
    expect(t).toBeInstanceOf(Text);
    expect(t.getText()).toBe("abc");
    expect(t.key).toBeInstanceOf(Key);
    expect(t).toMatchSnapshot();
  });

  test("isText", () => {
    const t = Text.create("abc");
    expect(t).toBeInstanceOf(Text);
    expect(Text.isText(t)).toBeTruthy();
    expect(Text.isText({})).toBeFalsy();
    expect(t).toMatchSnapshot();
  });

  test("isTextList", () => {
    const ts = ["A", "B"].map(Text.create);
    expect(Text.isTextList(ts)).toBeTruthy();
    expect(Text.isTextList([])).toBeTruthy();
    expect(Text.isTextList([{}])).toBeFalsy();
  });

  test("getText", () => {
    const t = Text.create("hello world");
    expect(t.getText()).toBe("hello world");
  });

  test("isEmpty", () => {
    const t = Text.create("");
    expect(t.isEmpty).toBeTruthy();
  });

  test("search leaf at offset", () => {
    const t = Text.create({
      leaves: [
        {
          text: "hello",
        },
        {
          text: "world",
        },
      ],
    });
    let leaf = t.searchLeafAtOffset(5).leaf;
    expect(leaf?.text).toBe("hello");
    expect(t.searchLeafAtOffset(5)).toMatchSnapshot();
    leaf = t.searchLeafAtOffset(6).leaf;
    expect(leaf?.text).toBe("world");
    expect(t.searchLeafAtOffset(6)).toMatchSnapshot();
  });

  test("addMark", () => {
    let t = Text.create({
      leaves: [
        {
          text: "hello",
        },
        {
          text: "world",
        },
      ],
    });
    t = t.addMark(3, 2, Mark.create("bold"));
    expect(t).toMatchObject({
      object: "text",
      leaves: [
        {
          text: "hel",
          marks: [],
          object: "leaf",
        },
        {
          text: "lo",
          object: "leaf",
          marks: [
            {
              type: "bold",
              object: "mark",
              data: {},
            },
          ],
        },
        {
          text: "world",
          object: "leaf",
          marks: [],
        },
      ],
    });
    expect(t).toMatchSnapshot();
  });

  test("addMarks", () => {
    let t = Text.create({
      leaves: [
        {
          text: "hello",
        },
        {
          text: "world",
        },
      ],
    });
    t = t.addMarks(3, 2, [Mark.create("bold"), Mark.create("underline")]);
    expect(t).toMatchObject({
      object: "text",
      leaves: [
        {
          text: "hel",
          marks: [],
          object: "leaf",
        },
        {
          text: "lo",
          object: "leaf",
          marks: [
            {
              type: "bold",
              object: "mark",
              data: {},
            },
            {
              type: "underline",
              object: "mark",
              data: {},
            },
          ],
        },
        {
          text: "world",
          object: "leaf",
          marks: [],
        },
      ],
    });
    expect(t).toMatchSnapshot();
  });

  test("getLeaves without decorations", () => {
    const t = Text.create({
      leaves: [
        {
          text: "hello",
        },
        {
          text: " world",
        },
      ],
    });
    const leaves = t.getLeaves();
    expect(leaves).toMatchObject([
      {
        text: "hello",
      },
      {
        text: " world",
      },
    ]);
  });

  test("getLeaves with decorations", () => {});
});
