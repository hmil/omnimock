import { AnyFunction, ConstructorType, Indexable } from './base-types';
import { fmt, formatArgArray, indent, setStringFormat } from './formatting';
import { isMatcher, Matcher, MATCHER_KEY, MatcherMetadata } from './matcher';
import { getMetadata, setMetadata } from './metadata';


// ===================================
// Basic matchers
// ===================================

/**
 * Determines whether a candidate matches some criterion.
 * 
 * Returns true if `candidate` matches the criterion,
 * otherwise returns a string explaining why it did not match.
 */
export type MatchingLogic<T> = (candidate: T) => true | string;

/**
 * Creates a generic matcher.
 * 
 * @param match The matching logic.
 * @param name Name of this matcher.
 * @param key Set of data to key this matcher.
 * 
 * @example
 * ```ts
 * const theAnswer = createMatcher(
 *     (t: number) => t === 42 || 'This is not the answer',
 *     'answer to life',
 *     {});
 * 
 * match(theAnswer, 22) // 'This is not the answer'
 * match(theAnswer, 42) // true
 * ```
 */
// tslint:disable-next-line: no-shadowed-variable
export function createMatcher<T>(data: MatcherMetadata<any>): Matcher<T> {
    function toString() {
        return `<${getMetadata(target, MATCHER_KEY).name}>`;
    }
    const target = {
        toString
    } as Matcher<T>;
    setMetadata(target, MATCHER_KEY, data);
    setStringFormat(target as any, toString);
    return target;
}

/**
 * Arbitrary matcher. Use this when no other matcher does the job.
 *
 * Use either a function or a regexp. If a function is provided, it is passed the
 * input value and must return true if and only if the input value matches.
 *
 * ```ts
 * // Matches strings whose third character is the letter 'o'
 * matching<string>(value => value.charAt(2) !== 'o');
 * ```
 */
export function matching(rx: RegExp): Matcher<string>;
export function matching<T>(matcher: (value: T) => boolean): Matcher<T>;
export function matching<T>(matcherOrRx: ((value: T) => boolean) | RegExp) {
    if (matcherOrRx instanceof RegExp) {
        return createMatcher<T>(new RxMatcher(matcherOrRx));
    }
    return createMatcher<T>(new MatchingMatcher(matcherOrRx)); // Matchers created this way are always unique
}
class MatchingMatcher implements MatcherMetadata<MatchingMatcher> {
    /** @override */ name = 'custom matcher';
    constructor(private matcher: (value: any) => boolean) { }
    /** @override */ equals(other: MatchingMatcher): boolean {
        return this.matcher === other.matcher;
    }
    /** @override */ match(actual: unknown): string | true {
        return this.matcher(actual) || fmt`${actual} did not match the custom matching logic`;
    }
}
class RxMatcher implements MatcherMetadata<RxMatcher> {
    /** @override */ name = this.rx.toString();
    constructor(private rx: RegExp) { }
    /** @override */ equals(other: RxMatcher): boolean {
        return this.rx.toString() === other.rx.toString();
    }
    /** @override */ match(actual: string): string | true {
        return this.rx.test(actual) || fmt`${actual} did not match the custom matching logic`;
    }
}

/**
 * Negates a matcher.
 */
export function not<T>(t: T | Matcher<T>) {
    return createMatcher<T>(new NotMatcher(t));
}
class NotMatcher implements MatcherMetadata<NotMatcher> {
    constructor(private t: unknown) { }
    /** @override */ get name() {
        return fmt`not(${this.t})`;
    }
    /** @override */ equals(other: NotMatcher): boolean {
        return match(other.t, this.t) === true;
    }
    /** @override */ match(actual: unknown): string | true {
        return match(this.t, actual) !== true || fmt`${actual} doesn't match not(${this.t})`;
    }
}

/**
 * Matches variables by strict equality (===)
 */
export function same<T>(expected: T): Matcher<T> {
    return createMatcher(new SameMatcher(expected));
}
class SameMatcher implements MatcherMetadata<SameMatcher> {
    constructor(private expected: unknown) { }
    /** @override */ get name() {
        return fmt`same(${this.expected})`;
    }
    /** @override */ equals(other: SameMatcher): boolean {
        return other.expected === this.expected;
    }
    /** @override */ match(actual: unknown): string | true {
        return this.expected === actual || fmt`expect ${actual} to be the same instance as ${this.expected}`;
    }
}

/**
 * Matches variables by weak equality (==)
 */
export function weakEquals<T extends Comparable>(ref: T): Matcher<T> {
    // tslint:disable-next-line: triple-equals
    return createMatcher(new WeakEqualsMatcher(ref));
}
class WeakEqualsMatcher implements MatcherMetadata<WeakEqualsMatcher> {
    constructor(private expected: unknown) { }
    /** @override */ get name() {
        return fmt`== ${this.expected}`;
    }
    /** @override */ equals(other: WeakEqualsMatcher): boolean {
        return other.expected === this.expected;
    }
    /** @override */ match(actual: unknown): string | true {
        // tslint:disable-next-line: triple-equals
        return actual == this.expected || `${actual} is not equal to ${this.expected}`;
    }
}

/**
 * Matches any argument, including omitted arguments.
 */
export function anything(): Matcher<any> {
    return createMatcher(anythingMatcher);
}
const anythingMatcher = new class AnythingMatcher implements MatcherMetadata<AnythingMatcher> {
    /** @override */ get name() {
        return 'anything';
    }
    /** @override */ equals(other: AnythingMatcher): boolean {
        return this === other;
    }
    /** @override */ match(_actual: unknown): string | true {
        return true;
    }
}();

/**
 * Matches an object which is an `instanceof` the expected type.
 */
export function instanceOf<T>(ctr: ConstructorType<T>): Matcher<T> {
    return createMatcher(new InstanceOfMatcher(ctr));
}
class InstanceOfMatcher implements MatcherMetadata<InstanceOfMatcher> {
    constructor(private ctr: ConstructorType<any>) { }
    /** @override */ get name() {
        return fmt`instanceOf(${this.ctr})`;
    }
    /** @override */ equals(other: InstanceOfMatcher): boolean {
        return other.ctr === this.ctr;
    }
    /** @override */ match(actual: unknown): string | true {
        return actual instanceof this.ctr || fmt`${actual} is not an instance of ${this.ctr}`;
    }
}

// ===================================
// Type matchers
// ===================================

function typeMatcher<T>(type: string): Matcher<T> {
    return createMatcher(new TypeMatcher(type));
}
class TypeMatcher implements MatcherMetadata<TypeMatcher> {
    constructor(private type: string) { }
    /** @override */ get name() {
        return fmt`any ${this.type}`;
    }
    /** @override */ equals(other: TypeMatcher): boolean {
        return other.type === this.type;
    }
    /** @override */ match(actual: unknown): string | true {
        return typeof actual === this.type || `expected ${this.type} but got ${typeof actual}`;
    }
}

/**
 * Matches any variable of type number.
 */
export function anyNumber(): Matcher<number> {
    return typeMatcher('number');
}

/**
 * Matches any variable of type boolean.
 */
export function anyBoolean(): Matcher<boolean> {
    return typeMatcher('boolean');
}

/**
 * Matches any variable of type string.
 */
export function anyString(): Matcher<string> {
    return typeMatcher('string');
}

/**
 * Matches any variable of type function.
 */
export function anyFunction(): Matcher<AnyFunction> {
    return typeMatcher('function');
}

/**
 * Matches any variable of type object.
 */
export function anyObject(): Matcher<any> {
    return typeMatcher('object');
}

/**
 * Matches any variable of type symbol.
 */
export function anySymbol(): Matcher<symbol> {
    return typeMatcher('symbol');
}

/**
 * Matches any variable of type array.
 */
export function anyArray(): Matcher<any[]> {
    return createMatcher(anyArrayMatcher);
}
const anyArrayMatcher = new class AnyArrayMatcher implements MatcherMetadata<AnyArrayMatcher> {
    /** @override */ get name() {
        return fmt`any array`;
    }
    /** @override */ equals(other: AnyArrayMatcher): boolean {
        return this === other;
    }
    /** @override */ match(actual: unknown): string | true {
        return Array.isArray(actual) || `expected an array but got ${typeof actual}`;
    }
}();

/**
 * Matches a parameter which was not passed.
 * 
 * See also `functionArguments`
 */
export function absent(): Matcher<any> {
    return createMatcher(absentMatcher);
}
const absentMatcher = new class AbsentMatcher implements MatcherMetadata<AbsentMatcher> {
    /** @override */ get name() {
        return fmt`absent`;
    }
    /** @override */ equals(other: AbsentMatcher): boolean {
        return this === other;
    }
    /** @override */ match(actual: unknown): string | true {
        return actual === undefined || `unexpected argument ${typeof actual}`;
    }
}();

/**
 * Matches a set of arguments.
 *
 * Similar to arrayEq but it works with `absent()` to match omitted arguments
 */
export function functionArguments(expected: any[]): Matcher<any[]> {
    return createMatcher(new ArgumentsMatcher(expected));
}
class ArgumentsMatcher implements MatcherMetadata<ArgumentsMatcher> {
    constructor(private expected: any[]) { }

    /** @override */ get name() {
        return fmt`args(${this.expected})`;
    }
    /** @override */ equals(other: ArgumentsMatcher): boolean {
        return match(this.expected, other.expected) === true;
    }
    /** @override */ match(actual: unknown): string | true {
        if (!(actual instanceof Array)) {
            return fmt`expected argument array but got ${actual}`;
        }

        if (this.expected.length < actual.length) {
            return `too many arguments provided: expected ${this.expected.length} but got ${actual.length}`;
        }

        for (let i = 0 ; i < this.expected.length ; i++) {
            const matched = match(this.expected[i], actual[i]);
            if (matched !== true) {
                return `argument $${i} doesn't match: ${indent(matched)}`;
            }
        }

        return true;
    }
}

// ===================================
// Combinatorial matchers
// ===================================

/**
 * Matches variables which match any of the provided arguments.
 * This is effectively a logical "OR" operation for matchers.
 */
export function anyOf<T>(...args: T[]): Matcher<T> {
    return createMatcher(new AnyOfMatcher(args));
}
class AnyOfMatcher implements MatcherMetadata<AnyOfMatcher> {

    private formattedArgs = formatArgArray(this.args);

    constructor(private args: any[]) { }

    /** @override */ get name() {
        return `anyOf(${this.formattedArgs})`;
    }
    /** @override */ equals(other: AnyOfMatcher): boolean {
        return match(this.args, other.args) === true;
    }
    /** @override */ match(actual: unknown): string | true {
        return this.args.reduce<string | true>(
            (prev, curr) => prev === true || match(curr, actual),
            fmt`${actual}` + `did not match any of ${this.formattedArgs}`);
    }
}

/**
 * Matches variables which match all of the provided arguments.
 * This is effectively a logical "AND" operation for matchers.
 */
export function allOf<T>(...args: T[]): Matcher<T> {
    return createMatcher(new AllOfMatcher(args));
}
class AllOfMatcher implements MatcherMetadata<AllOfMatcher> {

    private formattedArgs = formatArgArray(this.args);

    constructor(private args: any[]) { }

    /** @override */ get name() {
        return `allOf(${this.formattedArgs})`;
    }
    /** @override */ equals(other: AllOfMatcher): boolean {
        return match(this.args, other.args) === true;
    }
    /** @override */ match(actual: unknown): string | true {
        return this.args.reduce<string | true>(
            (prev, curr) => prev !== true ? prev : match(curr, actual),
            true);
    }
}


// ===================================
// Comparatorial matchers
// ===================================

type Comparable = string | number;

/**
 * Matches any variable strictly greater than the provided reference.
 */
export function greaterThan<T extends Comparable>(ref: T): Matcher<T> {
    return createMatcher(new GreaterThanMatcher(ref));
}
class GreaterThanMatcher implements MatcherMetadata<GreaterThanMatcher> {
    constructor(private ref: Comparable) { }

    /** @override */ get name() {
        return fmt`greater than ${this.ref}`;
    }
    /** @override */ equals(other: GreaterThanMatcher): boolean {
        return match(this.ref, other.ref) === true;
    }
    /** @override */ match(actual: Comparable): string | true {
        return (actual > this.ref) || `${actual} is no greater than ${this.ref}`;
    }
}

/**
 * Matches any variable strictly smaller than the provided reference.
 */
export function smallerThan<T extends Comparable>(ref: T): Matcher<T> {
    return createMatcher(new SmallerThanMatcher(ref));
}
class SmallerThanMatcher implements MatcherMetadata<SmallerThanMatcher> {
    constructor(private ref: Comparable) { }

    /** @override */ get name() {
        return fmt`smaller than ${this.ref}`;
    }
    /** @override */ equals(other: SmallerThanMatcher): boolean {
        return match(this.ref, other.ref) === true;
    }
    /** @override */ match(actual: Comparable): string | true {
        return (actual < this.ref) || `${actual} is no smaller than ${this.ref}`;
    }
}

/**
 * Matches any variable greater than or equal to the provided reference.
 */
export function greaterThanOrEqual<T extends Comparable>(ref: T): Matcher<T> {
    return createMatcher(new GreaterThanOrEqualMatcher(ref));
}
class GreaterThanOrEqualMatcher implements MatcherMetadata<GreaterThanOrEqualMatcher> {
    constructor(private ref: Comparable) { }

    /** @override */ get name() {
        return fmt`greater than or equal to ${this.ref}`;
    }
    /** @override */ equals(other: GreaterThanOrEqualMatcher): boolean {
        return match(this.ref, other.ref) === true;
    }
    /** @override */ match(actual: Comparable): string | true {
        return (actual >= this.ref) || `${actual} is no greater than nor equals ${this.ref}`;
    }
}

/**
 * Matches any variable smaller than or equal to the provided reference.
 */
export function smallerThanOrEqual<T extends Comparable>(ref: T): Matcher<T> {
    return createMatcher(new SmallerThanOrEqualMatcher(ref));
}
class SmallerThanOrEqualMatcher implements MatcherMetadata<SmallerThanOrEqualMatcher> {
    constructor(private ref: Comparable) { }

    /** @override */ get name() {
        return fmt`smaller than or equal to ${this.ref}`;
    }
    /** @override */ equals(other: SmallerThanOrEqualMatcher): boolean {
        return match(this.ref, other.ref) === true;
    }
    /** @override */ match(actual: Comparable): string | true {
        return (actual <= this.ref) || `${actual} is no smaller than nor equals ${this.ref}`;
    }
}

/**
 * Matches any variable strictly equal to the provided reference.
 */
export function equals<T extends Comparable>(ref: T): Matcher<T> {
    return createMatcher(new EqualsMatcher(ref));
}
class EqualsMatcher implements MatcherMetadata<EqualsMatcher> {
    constructor(private ref: Comparable) { }

    /** @override */ get name() {
        return fmt`=== ${this.ref}`;
    }
    /** @override */ equals(other: EqualsMatcher): boolean {
        return match(this.ref, other.ref) === true;
    }
    /** @override */ match(actual: Comparable): string | true {
        return (actual === this.ref) || `${actual} is not strictly equal to ${this.ref}`;
    }
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

    return createMatcher(new BetweenMatcher(minValue, includeMin, maxValue, includeMax));
}
class BetweenMatcher implements MatcherMetadata<BetweenMatcher> {
    private rangeText = `${this.includeMin ? '[' : ']'}${this.minValue} ; ${
                this.maxValue}${this.includeMax ? ']' : '['}`;

    constructor(
        private minValue: Comparable,
        private includeMin: boolean,
        private maxValue: Comparable,
        private includeMax: boolean) { }

    /** @override */ get name() {
        return `range ${this.rangeText}`;
    }
    /** @override */ equals(other: BetweenMatcher): boolean {
        return this.includeMax === other.includeMax &&
                this.includeMin === other.includeMin &&
                this.minValue === other.minValue &&
                this.maxValue === other.maxValue;
    }
    /** @override */ match(actual: Comparable): string | true {
        return (
            (actual > this.minValue || this.includeMin && actual === this.minValue) &&
            (actual < this.maxValue || this.includeMax && actual === this.maxValue)
        ) || `${actual} is not in range ${this.rangeText}`;
    }
}


// ===================================
// Complex matchers
// ===================================

/**
 * Matches an object whose JSON representation is the same as that of the expected.
 */
export function jsonEq<T>(expected: T): Matcher<T> {
    return createMatcher(new JsonEqualMatcher(expected));
}
class JsonEqualMatcher implements MatcherMetadata<JsonEqualMatcher> {
    constructor(private expected: unknown) { }

    /** @override */ get name() {
        return fmt`jsonEq(${this.expected})`;
    }
    /** @override */ equals(other: JsonEqualMatcher): boolean {
        return match(this.expected, other.expected) === true;
    }
    /** @override */ match(actual: unknown): string | true {

        const serializedExpected = JSON.stringify(this.expected);
        const serializedActual = JSON.stringify(actual);
        return serializedActual === serializedExpected || `expected ${serializedExpected} but got ${serializedActual}`;
    }
}

/**
 * Matches an array which has the same number of elements as the expected array and whose elements match those in the
 * expected array.  
 * The expected array can contain nested matchers.
 */
export function arrayEq<T extends any[]>(expected: T): Matcher<T> {
    return createMatcher(new ArrayEqualMatcher(expected));
}
class ArrayEqualMatcher implements MatcherMetadata<ArrayEqualMatcher> {
    constructor(private expected: any[]) { }

    /** @override */ get name() {
        return fmt`arrayEq(${this.expected})`;
    }
    /** @override */ equals(other: ArrayEqualMatcher): boolean {
        return match(this.expected, other.expected) === true;
    }
    /** @override */ match(actual: unknown): string | true {
        if (!(actual instanceof Array)) {
            return fmt`expected array type but got ${actual}`;
        }

        if (this.expected.length !== actual.length) {
            return `array length differ: expected ${this.expected.length} but got ${actual.length}`;
        }

        for (let i = 0 ; i < this.expected.length ; i++) {
            const matched = match(this.expected[i], actual[i]);
            if (matched !== true) {
                return `element $${i} doesn't match: ${indent(matched)}`;
            }
        }

        return true;
    }
}

/**
 * Matches an object by performing a recursive match against each member.
 * The set of members of the expected object must be the same as those of the actual object.
 */
export function objectEq<T extends object>(expectedUnsafe: T): Matcher<T> {
    // TODO: deep clone
    const expected = Object.assign({}, expectedUnsafe);

    return createMatcher(new ObjectEqualMatcher(expected));
}
class ObjectEqualMatcher implements MatcherMetadata<ObjectEqualMatcher> {
    private expectedKeys = Object.keys(this.expected).sort();

    constructor(private expected: object) { }

    /** @override */ get name() {
        return fmt`objectEq(${this.expected})`;
    }
    /** @override */ equals(other: ObjectEqualMatcher): boolean {
        return match(this.expected, other.expected) === true;
    }
    /** @override */ match(actual: unknown): string | true {
        if (typeof actual !== 'object') {
            return fmt`expected variable of type object but was ${typeof actual}`;
        }

        if (actual == null) {
            return fmt`expected non null variable but got ${actual}.`;
        }

        const actualKeys = Object.keys(actual).sort();
        const diff = keySetDifference(this.expectedKeys, actualKeys);

        if (diff.add.length > 0) {
            return `actual object is missing the following properties: ${diff.add.map(k => '"' + k + '"').join(', ')}`;
        }
        if (diff.remove.length > 0) {
            return `actual object contains unexpected properties: ${diff.remove.map(k => '"' + k + '"').join(', ')}`;
        }

        const errors: string[] = [];
        for (const key of this.expectedKeys) {
            const matched = match((this.expected as Indexable)[key], (actual as Indexable)[key]);
            if (matched !== true) {
                errors.push(`- [${key}]: ${indent(matched)}`);
            }
        }

        if (errors.length > 0) {
            return `object doesn't match:\n${errors.join('\n')}`;
        }

        return true;
    }
}

/**
 * Matches any object which contains at least members matching the reference's members.
 */
export function contains<T extends object>(expectedUnsafe: Partial<T>): Matcher<T> {
    const expected = Object.assign({}, expectedUnsafe);
    return createMatcher(new ContainsMatcher(expected));
}
class ContainsMatcher implements MatcherMetadata<ContainsMatcher> {
    constructor(private expected: object) { }

    /** @override */ get name() {
        return fmt`objectContaining(${this.expected})`;
    }
    /** @override */ equals(other: ContainsMatcher): boolean {
        return match(this.expected, other.expected) === true;
    }
    /** @override */ match(actual: unknown): string | true {
        const errors: string[] = [];
        for (const key of Object.keys(this.expected)) {
            const matched = match((this.expected as Indexable)[key], (actual as Indexable)[key]);
            if (matched !== true) {
                errors.push(`- [${key}]: ${indent(matched)}`);
            }
        }

        if (errors.length > 0) {
            return `object doesn't match:\n${errors.join('\n')}`;
        }

        return true;
    }
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
                add,
                remove: remove.concat(from.slice(i)) // There are unmatched elements remaining in `from`
            };
        }
        if (j >= from.length) {
            return {
                add: add.concat(to.slice(i)), // Some keys are missing in `from`
                remove
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
        const expectedMatcher = getMetadata(expected, MATCHER_KEY);
        if (isMatcher(actual)) {
            const actualMatcher = getMetadata(actual, MATCHER_KEY);
            return expectedMatcher.name === actualMatcher.name && expectedMatcher.equals(actualMatcher) || 
                    `matcher ${expectedMatcher.name} differs from ${actualMatcher.name}`;
        }
        return expectedMatcher.match(actual);
    } else if (typeof expected === 'object' || typeof expected === 'function') {

        if (expected == null) { // null or undefined
            return actual === expected || fmt`expected ${actual} to be ${expected}.`;
        }

        if (Array.isArray(expected)) {
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
