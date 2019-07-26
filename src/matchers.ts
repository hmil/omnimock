import { WithMetadata, getMetadata, setMetadata, hasMetadata } from './metadata';
import { AnyFunction, ConstructorType } from './base-types';

interface MatcherMetadata {
    /** Returns true if actual matches this matcher, or an error message otherwise */
    match(actual: unknown): true | string;
    name: string;
    /** Hash is used to compare matchers */
    hash: string;
}

export type Matcher<T> = T & WithMetadata<'matcher', MatcherMetadata>;

export function isMatcher(t: unknown): t is Matcher<typeof t> {
    return typeof t === 'object' && t != null && hasMetadata(t, 'matcher');
}

export function fmt(strings: TemplateStringsArray, ...values: unknown[]): string {
    return [strings[0], ...values.map((value, i) => formatObjectForHumans(value) + strings[i + 1])].join('');
}

function substitute(_key: string, obj: unknown): unknown {
    if (isMatcher(obj)) {
        return `<${getMetadata(obj, 'matcher').name}>`;
    }
    if (typeof obj === 'object' && obj != null) {
        const ctrName = obj.constructor.name;
        if (ctrName && ctrName !== 'Object') {
            return ctrName;
        }
    }
    if (typeof obj === 'function') {
        // This may be one of our mocks
        return `function ${obj.constructor.name}`;
    }
    return obj;
}

function formatObjectForHumans(obj: unknown): string {
    return JSON.stringify(substitute('root', obj), substitute);
}


function typeMatcher<T>(predicate: (t: unknown) => t is T, type: string): Matcher<T> {
    return matching((actual) => predicate(actual) || `expected ${type} but got ${typeof actual}`, `any ${type}`);
}

function matching<T>(match: (candidate: T) => true | string, name: string): Matcher<T> {
    return setMetadata({} as Matcher<T>, 'matcher', { match, name });
}

interface Indexable {
    [k: string]: unknown;
}

export function same<T>(expected: T): Matcher<T> {
    return matching((actual) => actual === expected || fmt`expected ${actual} to be the same instance as ${expected}`, fmt`same(${expected})`);
}

type Comparable = string | number;
export function greaterThan<T extends Comparable>(ref: T): Matcher<T> {
    return matching((candidate) => (candidate > ref) || `${candidate} is no greater than ${ref}`, `greater than ${ref}`);
}
export function smallerThan<T extends Comparable>(ref: T): Matcher<T> {
    return matching((candidate) => (candidate < ref) || `${candidate} is no smaller than ${ref}`, `smaller than ${ref}`);
}
export function greaterThanOrEqual<T extends Comparable>(ref: T): Matcher<T> {
    return matching((candidate) => (candidate >= ref) || `${candidate} is no greater than nor equals ${ref}`, `greater than or equal to ${ref}`);
}
export function smallerThanOrEqual<T extends Comparable>(ref: T): Matcher<T> {
    return matching((candidate) => (candidate <= ref) || `${candidate} is no smaller than nor equals ${ref}`, `smaller than or equal to ${ref}`);
}
export function equals<T extends Comparable>(ref: T): Matcher<T> {
    return matching((candidate) => (candidate === ref) || `${candidate} is not strictly equal to ${ref}`, `=== ${ref}`);
}
export function weakEquals<T extends Comparable>(ref: T): Matcher<T> {
    return matching((candidate) => (candidate == ref) || `${candidate} is not equal to ${ref}`, `== ${ref}`);
}
export function between(min: number | { value: number, exclusive: true }, max: number | { value: number, exclusive: true }): Matcher<number>;
export function between(min: string | { value: string, exclusive: true }, max: string | { value: string, exclusive: true }): Matcher<string>;
export function between<T extends Comparable>(min: T | { value: T, exclusive: true }, max: T | { value: T, exclusive: true }): Matcher<T> {
    const [ minValue, includeMin ] = (typeof min === 'object' && 'exclusive' in min) ? [ min.value, !min.exclusive] : [ min, true ];
    const [ maxValue, includeMax ] = (typeof max === 'object' && 'exclusive' in max) ? [ max.value, !max.exclusive] : [ max, true ];
    const rangeText = `${includeMin ? '[' : ']'}${minValue} ; ${maxValue}${includeMax ? ']' : '['}`;

    return matching((candidate) => (
        (candidate > minValue || includeMin && candidate === minValue) &&
        (candidate < maxValue || includeMax && candidate === maxValue)
    ) || `${candidate} is not in range ${rangeText}`, `range ${rangeText}`);
}


export function arrayEq<T extends any[]>(expected: T): Matcher<T> {
    return Object.assign(expected.slice() as T, matching((actual) => {
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

export function objectEq<T extends object>(expectedUnsafe: T): Matcher<T> {
    const expected = Object.assign({}, expectedUnsafe);
    const expectedKeys = Object.keys(expected).sort();

    return Object.assign({}, expected, matching((actual) => {
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

export function anything(): Matcher<any> {
    return matching(() => true, 'anything');
}

export function anyNumber(): Matcher<number> {
    return typeMatcher((a): a is number => typeof a === 'number', 'number');
}

export function anyBoolean(): Matcher<boolean> {
    return typeMatcher((a): a is boolean => typeof a === 'boolean', 'boolean');
}

export function anyString(): Matcher<string> {
    return typeMatcher((a): a is string => typeof a === 'string', 'string');
}

export function anyFunction(): Matcher<AnyFunction> {
    return typeMatcher((a): a is AnyFunction => typeof a === 'function', 'function');
}

export function anyObject(): Matcher<any> {
    return typeMatcher((a): a is object => typeof a === 'object', 'object');
}

export function anySymbol(): Matcher<symbol> {
    return typeMatcher((a): a is symbol => typeof a === 'symbol', 'symbol');
}

export function anyArray(): Matcher<any[]> {
    return typeMatcher((a): a is any[] => Array.isArray(a), 'array');
}

export function jsonEq<T>(expected: T): Matcher<T> {
    return Object.assign({}, expected, matching((actual) => {
        const serializedExpected = JSON.stringify(expected);
        const serializedActual = JSON.stringify(actual);

        return serializedActual === serializedExpected || `expected ${serializedExpected} but got ${serializedActual}`;
    }, fmt`jsonEq(${expected})`));
}

export function anyOf<T>(...args: T[]): Matcher<T> {
    const formattedArgs = args.map(a => fmt`${a}`).join(',');
    return matching((actual) => {
        return args.reduce<string | true>((prev, curr) => prev === true || match(curr, actual), fmt`${actual}` + `did not match any of ${formattedArgs}`);
    }, `anyOf(${formattedArgs})`);
}

export function allOf<T>(...args: T[]): Matcher<T> {
    const formattedArgs = args.map(a => fmt`${a}`).join(',');
    return matching((actual) => {
        return args.reduce<string | true>((prev, curr) => prev !== true ? prev : match(curr, actual), true);
    }, `allOf(${formattedArgs})`);
}

export function instanceOf<T>(ctr: ConstructorType<T>): Matcher<T> {
    return matching((actual) => actual instanceof ctr || fmt`${actual} is not an instance of ${ctr}`, fmt`instanceOf(${ctr})`)
}

export function match(expected: unknown, actual: unknown): true | string {
    if (isMatcher(expected)) {
        return getMetadata(expected, 'matcher').match(actual);
    } else if (typeof expected === 'object' || typeof expected === 'function') {

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
