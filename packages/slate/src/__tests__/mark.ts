import Mark from "../models/mark";
import Data from "../models/data";

describe("test Mark model", () => {
  test("constructor", () => {
    const mark = new Mark({
      type: "bold",
      data: {
        fontWeight: 200,
      },
    });
    expect(mark).toBeInstanceOf(Mark);
    expect(mark.type).toBe("bold");
    expect(mark.data).toBeInstanceOf(Data);
    expect(mark.data).toEqual({ fontWeight: 200 });
  });

  test("create", () => {
    expect(Mark.create(new Mark({ type: "bold" }))).toBeInstanceOf(Mark);
    expect(Mark.create("bold")).toBeInstanceOf(Mark);
    expect(Mark.create({ type: "bold" })).toBeInstanceOf(Mark);
    expect(() => Mark.create()).toThrow(Error);
  });

  test("createSet", () => {
    const arr = [
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
        type: "bold",
        data: {
          fontWeight: 400,
        },
      },
    ];
    const set = Mark.createSet(arr);
    expect(set.length).toBe(2);
  });

  test("createProperties", () => {
    const mark = new Mark({
      type: "bold",
      data: {
        fontWeight: 200,
      },
    });
    const obj = Mark.createProperties(mark);
    expect(obj).not.toBeInstanceOf(Mark);
    expect(obj.data).toBeInstanceOf(Data);
  });

  test("fromJSON", () => {
    expect(
      Mark.fromJSON({
        type: "bold",
        data: {
          fontWeight: 200,
        },
      })
    ).toBeInstanceOf(Mark);

    expect(
      Mark.fromJSON({
        type: "bold",
        data: new Data({
          fontWeight: 200,
        }),
      })
    ).toBeInstanceOf(Mark);
  });

  test("isMark", () => {
    const mark = new Mark({ type: "bold" });
    expect(Mark.isMark(mark)).toBe(true);
    expect(Mark.isMark({})).toBe(false);
  });

  test("toJSON", () => {
    const obj = new Mark({
      type: "bold",
      data: {
        fontWeight: 200,
      },
    });
    expect(obj.toJSON()).not.toBeInstanceOf(Mark);
    expect(obj.toJSON().type).toBe("bold");
    expect(obj.toJSON().data).not.toBeInstanceOf(Data);
  });
});
