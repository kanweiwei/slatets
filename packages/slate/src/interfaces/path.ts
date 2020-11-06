export type Path = Array<number>;

export const Path = {
  /**
   * Compare paths `a` and `b` to see which is before or after.
   */
  compare(a: Path, b: Path) {
    // PERF: if the paths are the same we can exit early.
    if (a.length !== b.length) return null;

    for (let i = 0; i < a.length; i++) {
      const av = a[i];
      const bv = b[i];

      // If a's value is ever less than b's, it's before.
      if (av < bv) return -1;

      // If b's value is ever less than a's, it's after.
      if (av > bv) return 1;
    }

    // Otherwise they were equal the whole way, it's the same.
    return 0;
  },

  /**
   * Create a path from `attrs`.
   */
  create(attrs: Path): Path {
    if (attrs == null) {
      return [];
    }

    if (Array.isArray(attrs)) {
      return attrs;
    }

    throw new Error(
      `Paths can only be created from arrays, but you passed: ${attrs}`
    );
  },

  /**
   * 裁剪路径
   * @param a {Path}
   * @param b {Path}
   * @param size 最小路径的长度
   */
  crop(a: Path, b: Path, size = Math.min(a.length, b.length)): [Path, Path] {
    const ca = a.slice(0, size);
    const cb = b.slice(0, size);
    return [ca, cb];
  },

  /**
   * 缩减路径，默认缩减最后一个
   * @param path
   * @param n
   * @param index
   */
  decrement(path: Path, n: number = 1, index: number = path.length - 1) {
    return Path.increment(path, 0 - n, index);
  },

  /**
   * 增加路径，默认在尾部增加
   * @param path
   * @param n
   * @param index
   */
  increment(path: Path, n: number = 1, index: number = path.length - 1) {
    const value = path[index];
    const newValue = value + n;
    const newPath = path.slice();
    newPath[index] = newValue;
    return newPath;
  },

  /**
   * path 是否是 target 的父级
   * @param path
   * @param target
   */
  isAbove(path: Path, target: Path) {
    const [p, t] = Path.crop(path, target);
    return path.length < target.length && Path.compare(p, t) === 0;
  },

  /**
   * 文档中，path 对应的节点 是否在 target 对应节点 的后面
   * @param path
   * @param target
   */
  isAfter(path: Path, target: Path) {
    const [p, t] = Path.crop(path, target);
    return Path.compare(p, t) === 1;
  },

  /**
   * 文档中，path 对应的节点 是否在 target 对应节点 的前面
   * @param path
   * @param target
   */
  isBefore(path: Path, target: Path) {
    const [p, t] = Path.crop(path, target);
    return Path.compare(p, t) === -1;
  },

  /**
   * 用于生成所有的祖先元素的路径(包括自身)
   * [1,2,3,4,5]
   *
   * [
   *  [1],
   *  [1, 2],
   *  [1, 2, 3]
   *  [1, 2, 3, 4],
   *  [1, 2, 3, 4, 5]
   * ]
   * @param path
   * @param options
   */
  levels(
    path: Path,
    options: {
      reverse?: boolean;
    } = {}
  ): Path[] {
    const { reverse = false } = options;
    const list: Path[] = [];

    for (let i = 0; i <= path.length; i++) {
      list.push(path.slice(0, i));
    }

    if (reverse) {
      list.reverse();
    }

    return list;
  },

  /**
   * 父级路径
   * @param path
   */
  lift(path: Path) {
    const parent = path.slice(0, -1);
    return parent;
  },

  /**
   * a b 路径的最大长度
   * @param a
   * @param b
   */
  max(a: Path, b: Path) {
    const n = Math.max(a.length, b.length);
    return n;
  },

  /**
   * a b 路径的最小长度
   * @param a
   * @param b
   */
  min(a: Path, b: Path) {
    const n = Math.min(a.length, b.length);
    return n;
  },

  /**
   * 获取 a b 路径的相同祖先路径
   * @param a
   * @param b
   */
  relate(a: Path, b: Path) {
    const array: any[] = [];

    for (let i = 0; i < a.length && i < b.length; i++) {
      const av = a[i];
      const bv = b[i];

      // If the values aren't equal, they've diverged and don't share an ancestor.
      if (av !== bv) break;

      // Otherwise, the current value is still a common ancestor.
      array.push(av);
    }

    const path = Path.create(array);
    return path;
  },

  /**
   * 是否相等
   * @param path
   * @param another
   */
  equals(path: Path, another: Path): boolean {
    return (
      path.length === another.length && path.every((n, i) => n === another[i])
    );
  },

  relative(path: Path, ancestor: Path) {
    if (!Path.isAbove(ancestor, path) && !Path.equals(path, ancestor)) {
      throw new Error(
        `Cannot get the relative path of [${path}] inside ancestor [${ancestor}], because it is not above or equal to the path.`
      );
    }
    return path.slice(ancestor.length);
  },
};
