/**
 * Define a Slate error.
 */
class SlateError extends Error {
  code: any;
  node: any;
  nodePath: any;

  child: any;
  childPath: any;

  key: any;
  mark: any;
  next: any;
  nextPath: any;

  previous: any;
  prevPath: any;

  constructor(code, attrs = {}) {
    super(code);
    this.code = code;

    for (const key in attrs) {
      this[key] = attrs[key];
    }

    if ((Error as any).captureStackTrace) {
      (Error as any).captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error().stack;
    }
  }
}

export default SlateError;
