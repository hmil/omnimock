import { WithMetadata, getMetadata, setMetadata, hasMetadata } from './metadata';
import { AnyFunction } from './base-types';

interface MatcherMetadata {
    /** Returns true if actual matches this matcher, or an error message otherwise */
    match(actual: unknown): true | string;
    name: string;
}

export interface IMatcher extends WithMetadata<'matcher', MatcherMetadata> {
}

export function isMatcher(t: unknown): t is IMatcher {
    return typeof t === 'object' && t != null && hasMetadata(t, 'matcher');
}

export function fmt(strings: TemplateStringsArray, ...values: unknown[]): string {
    const result = [strings[0]];
    let i = 1;
    for (const value of values) {
        result.push(typeof value !== 'string' ? formatObjectForHumans(value) : value, strings[i++]);
    }
    return result.join('');
}

function formatObjectForHumans(obj: unknown): string {
    if (isMatcher(obj)) {
        return `<${getMetadata(obj, 'matcher').name}>`;
    }
    if (typeof obj === 'object' && obj != null) {
        const ctrName = obj.constructor.name;
        if (ctrName && ctrName !== 'Object') {
            return ctrName;
        }
    }
    return JSON.stringify(obj);
}


function typeMatcher<T>(predicate: (t: unknown) => t is T, type: string): IMatcher & T {
    return matcher((actual) => predicate(actual) || `expected ${type} but got ${typeof actual}`, `any ${type}`) as IMatcher & T;
}

function matcher(match: (candidate: unknown) => true | string, name: string): IMatcher {
    return setMetadata({} as IMatcher, 'matcher', {match, name });
}

interface Indexable {
    [k: string]: unknown;
}

export function same<T>(expected: T): T & IMatcher {
    return Object.assign({}, expected, matcher((actual) => actual === expected ||
            fmt`expected ${actual} to be the same instance as ${expected}`, fmt`same(${expected})`));
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
    }, fmt`arrayEq(${expected})`));
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
    }, fmt`objectEq(${expected})`));
}

export function anything(): IMatcher & any {
    return matcher(() => true, 'anything');
}

export function anyNumber(): number & IMatcher {
    return typeMatcher((a): a is number => typeof a === 'number', 'number');
}

export function anyBoolean(): boolean & IMatcher {
    return typeMatcher((a): a is boolean => typeof a === 'boolean', 'boolean');
}

export function anyString(): string & IMatcher {
    return typeMatcher((a): a is string => typeof a === 'string', 'string');
}

export function anyFunction(): AnyFunction & IMatcher {
    return typeMatcher((a): a is AnyFunction => typeof a === 'function', 'function');
}

export function anyObject(): any & IMatcher {
    return typeMatcher((a): a is object => typeof a === 'object', 'object');
}

export function anySymbol(): symbol & IMatcher {
    return typeMatcher((a): a is symbol => typeof a === 'symbol', 'symbol');
}

export function anyArray(): any[] & IMatcher {
    return typeMatcher((a): a is any[] => Array.isArray(a), 'array');
}

export function jsonEq<T>(expected: T): T & IMatcher {
    return Object.assign({}, expected, matcher((actual) => {
        const serializedExpected = JSON.stringify(expected);
        const serializedActual = JSON.stringify(actual);

        return serializedActual === serializedExpected || `expected ${serializedExpected} but got ${serializedActual}`;
    }, fmt`jsonEq(${expected})`));
}

export function match(expected: unknown, actual: unknown): true | string {
    if (isMatcher(expected)) {
        return getMetadata(expected, 'matcher').match(actual);
    } else if (typeof expected === 'object') {

        if (expected == null) {
            return actual === expected || fmt`expected ${actual} to be ${expected}.`; // null or undefined
        }

        if (expected instanceof Array) {
            return getMetadata(arrayEq(expected), 'matcher').match(actual);
        }

        if (expected.constructor !== Object) {
            // Non basic object types are compared by strict equality
            return getMetadata(same(expected), 'matcher').match(actual);
        }

        return getMetadata(objectEq(expected), 'matcher').match(actual);
    } else {
        return getMetadata(jsonEq(expected), 'matcher').match(actual);
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
