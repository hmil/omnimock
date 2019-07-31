import { formatArgArray } from './formatting';
import { match } from './matchers';
import { Range, ZERO_OR_MORE } from './range';

interface RuntimeContext<Args, Ret> {
    getOriginalContext: () => object | undefined;
    getOriginalTarget: () => Ret;
    context: unknown;
    args: Args;
}

export type ExpectationHandler<Args, Ret> = (context: RuntimeContext<Args, Ret>) => Ret;

interface MatchedExpectation<T> {
    result: T;
}

interface UnmatchedExpectation {
    error: string;
}

class MockExpectation<Args extends unknown[] | undefined, Ret> {

    private actualCalls: number = 0;

    constructor(
            private readonly args: Args,
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
        return `${this.methodSignature()} : expected ${this.expectedCalls.toString()}, received ${this.actualCalls}`;
    }

    isSatisfied(): boolean {
        return this.expectedCalls.contains(this.actualCalls);
    }

    private methodSignature(): string {
        return this.args === undefined ? '' : `(${formatArgArray(this.args)})`;
    }
}

export type ExpectationHandlingResult<T> = MatchedExpectation<T> | UnmatchedExpectation;

export class MockExpectations<Args extends unknown[] | undefined, Ret> {

    private expectations: Array<MockExpectation<Args, Ret>> = [];

    constructor(public readonly path: string) { }

    public get size() {
        return this.expectations.length;
    }

    addExpectation(args: Args, handler: ExpectationHandler<Args, Ret>): void {
        this.expectations.push(new MockExpectation(args, ZERO_OR_MORE, handler));
    }

    setLastExpectationRange(range: Range) {
        if (this.expectations.length === 0) {
            throw new Error('No behavior defined.' +
                    'You need to first define a behavior with for instance .return() or .useValue(),'
                    + ' then specify how many times that call was expected.');
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
            // TODO: Better error message showing all attempted expectations
            return { error: 'No matching expectations' };
        }
        return { result: matching.handle(context) };
    }

    toString(): string {
        return this.expectations.map(e => `${this.path}${e.toString()}`).join('\n');
    }

    getAllUnsatisfied(): Array<MockExpectation<Args, Ret>> {
        return this.expectations.filter(e => !e.isSatisfied());
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
     * Keep the order of insertion to help debug matching issues
     */
    private allExpectations: Array<MockExpectations<unknown[] | undefined, unknown>> = [];

    addExpectations(expectation: MockExpectations<unknown[] | undefined, unknown>) {
        this.allExpectations.push(expectation);
    }

    toString(): string {
        return this.allExpectations.filter(e => e.size > 0).map(e => `\n- ${e.path}:\n${e.toString()}`).join('\n');
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
        this.allExpectations.forEach(e => {
            e.reset();
        });
    }
}
