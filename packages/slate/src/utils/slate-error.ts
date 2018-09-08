/**
 * Define a Slate error.
 */
class SlateError extends Error {
    public code: any;
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
