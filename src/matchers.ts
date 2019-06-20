import { fmt } from './utils';

interface IMatcher {
    __EASYMOCK_MATCHER: {
        /** Returns true if actual matches this matcher, or an error message otherwise */
        match(actual: unknown): true | string;
    };
}

function matcher(match: (candidate: unknown) => true | string): IMatcher {
    return {
        __EASYMOCK_MATCHER: { match }
    };
}

function isMatcher(t: unknown): t is IMatcher {
    return typeof t === 'object' && t != null && '__EASYMOCK_MATCHER' in t;
}

interface Indexable {
    [k: string]: unknown;
}

export function same<T>(expected: T): T & IMatcher {
    return Object.assign({}, expected, matcher((actual) => actual === expected ||
            fmt`expected ${actual} to be the same instance as ${expected}`));
}

export function arrayEq<T extends any[]>(expected: T): T & IMatcher {
    return Object.assign(expected.slice() as T, matcher((actual) => {
        if (!(actual instanceof Array)) {
            return fmt`expected array type but got ${actual}`;
        }

        if (expected.length !== actual.length) {
            return `array length differ: expected ${expected.length} but got ${actual.length}`;
        }

        for (let i = 0 ; i < expected.length ; i++) {
            const matched = match(expected[i], actual[i]);
            if (matched !== true) {
                return `element $${i} mismatches: ${indentMessage(matched)}`;
            }
        }

        return true;
    }));
}

export function objectEq<T extends object>(expectedUnsafe: T): T & IMatcher {
    const expected = Object.assign({}, expectedUnsafe);
    const expectedKeys = Object.keys(expected).sort();

    return Object.assign({}, expected, matcher((actual) => {
        if (typeof actual !== 'object') {
            return fmt`expected variable of type object but was ${typeof actual}`;
        }

        if (actual == null) {
            return fmt`expected non null variable but got ${actual}.`;
        }

        const actualKeys = Object.keys(actual).sort();
        const diff = keySetDifference(expectedKeys, actualKeys);

        if (diff.add.length > 0) {
            return `actual object is missing the following properties: ${diff.add.map(k => '"' + k + '"').join(', ')}`;
        }
        if (diff.remove.length > 0) {
            return `actual object contains unexpected properties: ${diff.remove.map(k => '"' + k + '"').join(', ')}`;
        }

        const errors: string[] = [];
        for (const key of expectedKeys) {
            const matched = match((expected as Indexable)[key], (actual as Indexable)[key]);
            if (matched !== true) {
                errors.push(`- [${key}]: ${indentMessage(matched)}`);
            }
        }

        if (errors.length > 0) {
            return `object mismatch:\n${errors.join('\n')}`;
        }

        return true;
    }));
}

export function jsonEq<T>(expected: T): T & IMatcher {
    return Object.assign({}, expected, matcher((actual) => {
        const serializedExpected = JSON.stringify(expected);
        const serializedActual = JSON.stringify(actual);

        return serializedActual === serializedExpected || `expected ${serializedExpected} but got ${serializedActual}`;
    }));
}

export function match(expected: unknown, actual: unknown): true | string {
    if (isMatcher(expected)) {
        return expected.__EASYMOCK_MATCHER.match(actual);
    } else if (typeof expected === 'object') {

        if (expected == null) {
            return actual === expected || fmt`expected ${actual} to be ${expected}.`; // null or undefined
        }

        if (expected instanceof Array) {
            return arrayEq(expected).__EASYMOCK_MATCHER.match(actual);
        }

        if (expected.constructor !== Object) {
            // Non basic object types are compared by strict equality
            return same(expected).__EASYMOCK_MATCHER.match(actual);
        }

        return objectEq(expected).__EASYMOCK_MATCHER.match(actual);
    } else {
        return jsonEq(expected).__EASYMOCK_MATCHER.match(actual);
    }
}

function indentMessage(message: string): string {
    return message.replace('\n', '\n    ');
}

/**
 * Computes the key set difference to get from `from` to `to`.
 *
 * The diff consists in a set of keys to add and a set of keys to remove.
 *
 * Assumes to and from are sorted
 */
function keySetDifference(to: string[], from: string[]): { add: string[], remove: string[] } {
    const add: string[] = [];
    const remove: string[] = [];
    let i = 0;
    let j = 0;

    while (true) {
        if (i >= to.length) {
            if (j >= from.length) {
                return {add, remove}; // Done
            }
            return {
                remove,
                add: remove.concat(from.slice(i)) // There are unmatched elements remaining in to
            };
        }
        if (j >= from.length) {
            return {
                add,
                remove: remove.concat(from.slice(i)) // Some keys are missing in `to`
            };
        }
        if (to[i] < from[j]) {
            add.push(to[i]); // to[i] is definitely not in from
            i++;
        } else if (to[i] > from[j]) {
            remove.push(from[j]); // from[j] is definitely not in to
            j++;
        } else {
            // It's a match!
            i++;
            j++;
        }
    }
}
