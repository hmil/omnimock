/*
 * Functional programing utilities.
 */

/**
 * Creates a singleton which is lazilly instantiated by the provided creator function.
 */
export function lazySingleton<Args extends any[], T>(creator: (...args: Args) => T) {
    let inst: T | undefined;
    return (...args: Args) => {
        if (inst === undefined) {
            inst = creator(...args);
        }
        return inst;
    };
}

/**
 * Equivalent to `val === undefined ? mapping(val) : undefined`
 */
export function undefinedOr<T, U>(t: T | undefined, mapping: (t: T) => U): U | undefined {
    if (t === undefined) {
        return undefined;
    }
    return mapping(t);
}
