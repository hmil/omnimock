import { Range, ZERO_OR_MORE } from './range';
import { match, fmt } from './matchers';

interface RuntimeContext<Args, Ret> {
    getOriginalContext: () => object | undefined;
    getOriginalTarget: () => Ret;
    context: unknown;
    args: Args;
}

export interface ExpectationHandler<Args, Ret> {
    (context: RuntimeContext<Args, Ret>): Ret;
}

interface MatchedExpectation<T> {
    result: T;
}

interface UnmatchedExpectation {
    error: string;
}


class MockExpectation<Args extends unknown[], Ret> {

    private actualCalls: number = 0;

    constructor(
            private args: Args,
            private isGetter: boolean,
            public expectedCalls: Range,
            private readonly handler: ExpectationHandler<Args, Ret>) { }

    matches(context: RuntimeContext<Args, Ret>): boolean {
        return match(this.args, context.args) === true;
    }

    handle(context: RuntimeContext<Args, Ret>): Ret {
        this.actualCalls ++;
        if (this.expectedCalls.getMaximum() < this.actualCalls) {
            throw new Error(`Unexpected call: TODO: better error message`);
        }
        return this.handler(context);
    }

    toString(): string {
        return `${this.isGetter ? '' : this.methodSignature()} : expected ${this.expectedCalls.toString()}, received ${this.actualCalls}`;
    }

    isSatisfied(): boolean {
        return this.expectedCalls.contains(this.actualCalls);
    }

    private methodSignature(): string {
        return `(${this.args.map(a => fmt`${a}`).join(', ')})`
    }
}

export type ExpectationHandlingResult<T> = MatchedExpectation<T> | UnmatchedExpectation;

export class MockExpectations<Args extends unknown[], Ret> {

    constructor(public readonly path: string,
                private isGetter: boolean) { }

    private expectations: Array<MockExpectation<Args, Ret>> = [];

    addExpectation(args: Args, handler: ExpectationHandler<Args, Ret>): void {
        this.expectations.push(new MockExpectation(args, this.isGetter, ZERO_OR_MORE, handler));
    }

    setLastExpectationRange(range: Range) {
        if (this.expectations.length === 0) {
            throw new Error('No behavior defined. You need to first define a behavior with for instance .return() or .useValue(), then specify how many times that call was expected.')
        }
        const lastExpectation = this.expectations[this.expectations.length - 1];
        lastExpectation.expectedCalls = range;
    }

    resetExpectations() {
        this.expectations.length = 0;
    }

    handle(context: RuntimeContext<Args, Ret>): ExpectationHandlingResult<Ret> {
        const matching = this.firstMatchingExpectation(context);
        if (matching == null) {
            return { error: 'No matching expectations' }; // TODO: Better error message showing all attempted expectations
        }
        return { result: matching.handle(context) };
    }

    toString(): string {
        return this.expectations.map(e => `${this.path}${e.toString()}`).join('\n');
    }

    getAllUnsatisfied(): MockExpectation<Args, Ret>[] {
        return this.expectations.filter(e => !e.isSatisfied())
    }

    reset(): void {
        this.expectations.length = 0;
    }

    private firstMatchingExpectation(context: RuntimeContext<Args, Ret>): MockExpectation<Args, Ret> | null {
        for (const exp of this.expectations) {
            if (exp.matches(context)) {
                return exp;
            }
        }
        return null;
    }
}

/**
 * Gathers all expectations set within a context.
 */
export class ExpectationsRegistry {

    /**
     * To be kept alphabetically sorted by expectation path.
     */
    private allExpectations: Array<MockExpectations<unknown[], unknown>> = [];

    addExpectations(expectation: MockExpectations<unknown[], unknown>) {
        const insertIndex = this.findIndexToInsert(expectation);
        this.allExpectations.splice(insertIndex, 0, expectation);
    }

    toString(): string {
        return this.allExpectations.map(e => e.toString()).filter(nonEmptyString).join('\n');
    }

    verify(): void {
        const unsatisfied = this.allExpectations
                .map(e => e.getAllUnsatisfied().map(expectation => e.path + expectation.toString()))
                .filter(e => e.length > 0)
                .reduce((prev, curr) => prev.concat(curr), []);
        if (unsatisfied.length > 0) {
            throw new Error(`There are ${unsatisfied.length} unsatisfied expectations:\n` +
                    unsatisfied.map((s, idx) => `${idx}. ${s.toString()}`).join('\n'));
        }
    }

    reset(): void {
        this.allExpectations.forEach((e) => {
            e.reset();
        });
    }

    private findIndexToInsert(expectation: MockExpectations<unknown[], unknown>) {
        const first = this.allExpectations.find((exp) => exp.path >= expectation.path);
        if (first == null) {
            return this.allExpectations.length;
        }
        return this.allExpectations.indexOf(first);
    }
}

function nonEmptyString(t: string) {
    return t !== '';
}
