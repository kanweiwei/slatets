import { List } from "immutable";

export type Path = List<number>;

export const Path = {
  /**
   * Compare paths `a` and `b` to see which is before or after.
   */

  compare(a: Path, b: Path) {
    // PERF: if the paths are the same we can exit early.
    if (a.size !== b.size) return null;

    for (let i = 0; i < a.size; i++) {
      const av = a.get(i);
      const bv = b.get(i);

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

  create(attrs: Path | number[]): Path {
    if (attrs == null) {
      return List();
    }

    if (List.isList(attrs)) {
      return attrs as Path;
    }

    if (Array.isArray(attrs)) {
      return List(attrs);
    }

    throw new Error(
      `Paths can only be created from arrays or lists, but you passed: ${attrs}`
    );
  },

  /**
   * Crop paths `a` and `b` to an equal size, defaulting to the shortest.
   */

  crop(a: Path, b: Path, size = Math.min(a.size, b.size)): [Path, Path] {
    const ca = a.slice(0, size).toList();
    const cb = b.slice(0, size).toList();
    return [ca, cb];
  },

  /**
   * Decrement a `path` by `n` at `index`, defaulting to the last index.
   */

  decrement(path: Path, n: number = 1, index: number = path.size - 1) {
    return Path.increment(path, 0 - n, index);
  },

  /**
   * Increment a `path` by `n` at `index`, defaulting to the last index.
   */

  increment(path: Path, n: number = 1, index: number = path.size - 1) {
    const value = path.get(index);
    const newValue = value + n;
    const newPath = path.set(index, newValue);
    return newPath;
  },

  /**
   * Is a `path` above another `target` path?
   */

  isAbove(path: Path, target: Path) {
    const [p, t] = Path.crop(path, target);
    return path.size < target.size && Path.compare(p, t) === 0;
  },

  /**
   * Is a `path` after another `target` path in a document?
   */

  isAfter(path: Path, target: Path) {
    const [p, t] = Path.crop(path, target);
    return Path.compare(p, t) === 1;
  },

  /**
   * Is a `path` before another `target` path in a document?
   */

  isBefore(path: Path, target: Path) {
    const [p, t] = Path.crop(path, target);
    return Path.compare(p, t) === -1;
  },

  /**
   *
   */

  levels(
    path: Path,
    options: {
      reverse?: boolean;
    } = {}
  ): Path[] {
    const { reverse = false } = options;
    const list: Path[] = [];

    for (let i = 0; i <= path.size; i++) {
      list.push(path.slice(0, i).toList());
    }

    if (reverse) {
      list.reverse();
    }

    return list;
  },

  /**
   * Lift a `path` to refer to its parent.
   */

  lift(path: Path) {
    const parent = path.slice(0, -1);
    return parent;
  },

  /**
   * Get the maximum length of paths `a` and `b`.
   */

  max(a: Path, b: Path) {
    const n = Math.max(a.size, b.size);
    return n;
  },

  /**
   * Get the minimum length of paths `a` and `b`.
   */

  min(a: Path, b: Path) {
    const n = Math.min(a.size, b.size);
    return n;
  },

  /**
   * Get the common ancestor path of path `a` and path `b`.
   */

  relate(a: Path, b: Path) {
    const array: any[] = [];

    for (let i = 0; i < a.size && i < b.size; i++) {
      const av = a.get(i);
      const bv = b.get(i);

      // If the values aren't equal, they've diverged and don't share an ancestor.
      if (av !== bv) break;

      // Otherwise, the current value is still a common ancestor.
      array.push(av);
    }

    const path = Path.create(array);
    return path;
  },

  equals(path: Path, another: Path): boolean {
    return path.size === another.size && path.every((n, i) => n === another[i]);
  },

  relative(path: Path, ancestor: Path) {
    if (!Path.isAbove(ancestor, path) && !Path.equals(path, ancestor)) {
      throw new Error(
        `Cannot get the relative path of [${path}] inside ancestor [${ancestor}], because it is not above or equal to the path.`
      );
    }
    return path.slice(ancestor.size);
  },
};
