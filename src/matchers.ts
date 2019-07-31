import { AnyFunction, ConstructorType, Indexable } from './base-types';
import { fmt } from './formatting';
import { isMatcher, Matcher, MATCHER_KEY } from './matcher';
import { getMetadata, setMetadata } from './metadata';


// ===================================
// Basic matchers
// ===================================

/**
 * Creates a generic matcher.
 * 
 * @param match The comparison function. Returns true if the candidate matches, otherwise returns a string describing
 *              why the candidate did not match.
 * @param name Name of this matcher.
 * 
 * @example
 * ```ts
 * const theAnswer = matching(
 *     (t: number) => t === 42 || 'This is not the answer',
 *     'answer to life');
 * 
 * match(theAnswer, 22) // 'This is not the answer'
 * match(theAnswer, 42) // true
 * ```
 */
// tslint:disable-next-line: no-shadowed-variable
export function matching<T>(match: (candidate: T) => true | string, name: string): Matcher<T> {
    return setMetadata({} as Matcher<T>, MATCHER_KEY, { match, name });
}

/**
 * Matches variables by strict equality (===)
 */
export function same<T>(expected: T): Matcher<T> {
    return matching(
            actual => actual === expected || fmt`expected ${actual} to be the same instance as ${expected}`,
            fmt`same(${expected})`);
}

/**
 * Matches variables by weak equality (==)
 */
export function weakEquals<T extends Comparable>(ref: T): Matcher<T> {
    // tslint:disable-next-line: triple-equals
    return matching(candidate => (candidate == ref) || `${candidate} is not equal to ${ref}`, `== ${ref}`);
}

/**
 * Matches any argument, including omitted arguments.
 */
export function anything(): Matcher<any> {
    return matching(() => true, 'anything');
}

/**
 * Matches an object which is an `instanceof` the expected type.
 */
export function instanceOf<T>(ctr: ConstructorType<T>): Matcher<T> {
    return matching(
            actual => actual instanceof ctr || fmt`${actual} is not an instance of ${ctr}`,
            fmt`instanceOf(${ctr})`);
}

// ===================================
// Type matchers
// ===================================

function typeMatcher<T>(predicate: (t: unknown) => t is T, type: string): Matcher<T> {
    return matching(
            actual => predicate(actual) || `expected ${type} but got ${typeof actual}`,
            `any ${type}`);
}

/**
 * Matches any variable of type number.
 */
export function anyNumber(): Matcher<number> {
    return typeMatcher((a): a is number => typeof a === 'number', 'number');
}

/**
 * Matches any variable of type boolean.
 */
export function anyBoolean(): Matcher<boolean> {
    return typeMatcher((a): a is boolean => typeof a === 'boolean', 'boolean');
}

/**
 * Matches any variable of type string.
 */
export function anyString(): Matcher<string> {
    return typeMatcher((a): a is string => typeof a === 'string', 'string');
}

/**
 * Matches any variable of type function.
 */
export function anyFunction(): Matcher<AnyFunction> {
    return typeMatcher((a): a is AnyFunction => typeof a === 'function', 'function');
}

/**
 * Matches any variable of type object.
 */
export function anyObject(): Matcher<any> {
    return typeMatcher((a): a is object => typeof a === 'object', 'object');
}

/**
 * Matches any variable of type symbol.
 */
export function anySymbol(): Matcher<symbol> {
    return typeMatcher((a): a is symbol => typeof a === 'symbol', 'symbol');
}

/**
 * Matches any variable of type array.
 */
export function anyArray(): Matcher<any[]> {
    return typeMatcher((a): a is any[] => Array.isArray(a), 'array');
}


// ===================================
// Combinatorial matchers
// ===================================

/**
 * Matches variables which match any of the provided arguments.
 * This is effectively a logical "OR" operation for matchers.
 */
export function anyOf<T>(...args: T[]): Matcher<T> {
    const formattedArgs = args.map(a => fmt`${a}`).join(',');
    return matching(actual => {
        return args.reduce<string | true>(
                (prev, curr) => prev === true || match(curr, actual),
                fmt`${actual}` + `did not match any of ${formattedArgs}`);
    }, `anyOf(${formattedArgs})`);
}

/**
 * Matches variables which match all of the provided arguments.
 * This is effectively a logical "AND" operation for matchers.
 */
export function allOf<T>(...args: T[]): Matcher<T> {
    const formattedArgs = args.map(a => fmt`${a}`).join(',');
    return matching(actual => {
        return args.reduce<string | true>(
                (prev, curr) => prev !== true ? prev : match(curr, actual),
                true);
    }, `allOf(${formattedArgs})`);
}


// ===================================
// Comparatorial matchers
// ===================================

type Comparable = string | number;

/**
 * Matches any variable strictly greater than the provided reference.
 */
export function greaterThan<T extends Comparable>(ref: T): Matcher<T> {
    return matching(candidate =>
            (candidate > ref) || `${candidate} is no greater than ${ref}`,
            `greater than ${ref}`);
}

/**
 * Matches any variable strictly smaller than the provided reference.
 */
export function smallerThan<T extends Comparable>(ref: T): Matcher<T> {
    return matching(
            candidate => (candidate < ref) || `${candidate} is no smaller than ${ref}`,
            `smaller than ${ref}`);
}

/**
 * Matches any variable greater than or equal to the provided reference.
 */
export function greaterThanOrEqual<T extends Comparable>(ref: T): Matcher<T> {
    return matching(
            candidate => (candidate >= ref) || `${candidate} is no greater than nor equals ${ref}`,
            `greater than or equal to ${ref}`);
}

/**
 * Matches any variable smaller than or equal to the provided reference.
 */
export function smallerThanOrEqual<T extends Comparable>(ref: T): Matcher<T> {
    return matching(
            candidate => (candidate <= ref) || `${candidate} is no smaller than nor equals ${ref}`,
            `smaller than or equal to ${ref}`);
}

/**
 * Matches any variable strictly equal to the provided reference.
 */
export function equals<T extends Comparable>(ref: T): Matcher<T> {
    return matching(
            candidate => (candidate === ref) || `${candidate} is not strictly equal to ${ref}`,
            `=== ${ref}`);
}

type RangeBound<T extends Comparable> = T | {
    value: T;
    exclusive: boolean;
};

/**
 * Matches any variable between min and max.
 * 
 * Both min and max are inclusive in the range by default, but can be made exclusive 
 * by passing `exclusive: true` as shown below.
 * 
 * ```ts
 * between(0, { value: 10, exclusive: true })
 * ``` 
 */
export function between(min: RangeBound<number>, max: RangeBound<number>): Matcher<number>;
export function between(min: RangeBound<string>, max: RangeBound<string>): Matcher<string>;
export function between<T extends Comparable>(min: RangeBound<T>, max: RangeBound<T>): Matcher<T> {
    const [ minValue, includeMin ] = (typeof min === 'object' && 'exclusive' in min) ?
            [ min.value, !min.exclusive] :
            [ min, true ];
    const [ maxValue, includeMax ] = (typeof max === 'object' && 'exclusive' in max) ?
            [ max.value, !max.exclusive] :
            [ max, true ];
    const rangeText = `${includeMin ? '[' : ']'}${minValue} ; ${maxValue}${includeMax ? ']' : '['}`;

    return matching(candidate => (
        (candidate > minValue || includeMin && candidate === minValue) &&
        (candidate < maxValue || includeMax && candidate === maxValue)
    ) || `${candidate} is not in range ${rangeText}`, `range ${rangeText}`);
}


// ===================================
// Complex matchers
// ===================================

/**
 * Matches an object whose JSON representation is the same as that of the expected.
 */
export function jsonEq<T>(expected: T): Matcher<T> {
    return Object.assign({}, expected, matching(actual => {
        const serializedExpected = JSON.stringify(expected);
        const serializedActual = JSON.stringify(actual);

        return serializedActual === serializedExpected || `expected ${serializedExpected} but got ${serializedActual}`;
    }, fmt`jsonEq(${expected})`));
}

/**
 * Matches an array which has the same number of elements as the expected array and whose elements match those in the
 * expected array.  
 * The expected array can contain nested matchers.
 */
export function arrayEq<T extends any[]>(expected: T): Matcher<T> {
    return Object.assign(expected.slice() as T, matching(actual => {
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

function indentMessage(message: string): string {
    return message.replace('\n', '\n    ');
}

/**
 * Matches an object by performing a recursive match against each member.
 * The set of members of the expected object must be the same as those of the actual object.
 */
export function objectEq<T extends object>(expectedUnsafe: T): Matcher<T> {
    const expected = Object.assign({}, expectedUnsafe);
    const expectedKeys = Object.keys(expected).sort();

    return Object.assign({}, expected, matching(actual => {
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


// ===================================
// Matching API
// ===================================

/**
 * Tests if `actual` matches `expected`.
 * 
 * @return true if there is a match, otherwise a string with the reason why it did not match.
 */
export function match(expected: unknown, actual: unknown): true | string {
    if (isMatcher(expected)) {
        return getMetadata(expected, MATCHER_KEY).match(actual);
    } else if (typeof expected === 'object' || typeof expected === 'function') {

        if (expected == null) {
            return actual === expected || fmt`expected ${actual} to be ${expected}.`; // null or undefined
        }

        if (expected instanceof Array) {
            return getMetadata(arrayEq(expected), MATCHER_KEY).match(actual);
        }

        if (expected.constructor !== Object) {
            // Non basic object types are compared by strict equality
            return getMetadata(same(expected), MATCHER_KEY).match(actual);
        }

        return getMetadata(objectEq(expected), MATCHER_KEY).match(actual);
    } else {
        return getMetadata(jsonEq(expected), MATCHER_KEY).match(actual);
    }
}
