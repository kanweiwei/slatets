import Data from "../models/data";
import { keys } from "lodash-es";

describe("test Data model", () => {
  test("constructor", () => {
    let obj = {
      name: "xx",
    };
    let data = new Data(obj);
    expect(data).toEqual(obj);
    expect(keys(data)).toEqual(["name"]);
  });

  test("create", () => {
    expect(Data.create({})).toBeInstanceOf(Data);
    expect(Data.create(new Data())).toBeInstanceOf(Data);
    expect(() => Data.create("")).toThrow(Error);
    expect(() => Data.create(null)).toThrow(Error);
  });

  test("isData", () => {
    expect(Data.isData(null)).toEqual(false);
    expect(Data.isData(new Data())).toEqual(true);
    expect(Data.isData({})).toEqual(false);
  });

  test("fromJSON", () => {
    expect(Data.fromJSON({})).toBeInstanceOf(Data);
    expect(Data.fromJSON({ name: "xx" })).toEqual({ name: "xx" });
  });

  test("toJSON", () => {
    const data = new Data({
      name: "xx",
    });
    expect(data.toJSON()).toEqual({ name: "xx" });
    expect(data.toJSON()).not.toEqual({
      name: "xx",
      DATA: "@@__SLATE_DATA__@@",
    });
  });
});
