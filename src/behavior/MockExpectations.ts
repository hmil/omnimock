import { Range, ZERO_OR_MORE } from '../range';
import { Behavior, ExpectationHandler, RuntimeContext } from './Behavior';

interface UnmatchedExpectation<Arg extends unknown[] | undefined, Ret> {
    expectation: Behavior<Arg, Ret>;
    reason: string;
}

export interface BehaviorMatchResult<Arg extends unknown[] | undefined, Ret> {
    unmatched: Array<UnmatchedExpectation<Arg, Ret>>;
    remaining: Array<Behavior<Arg, Ret>>;
    matched?: Behavior<Arg, Ret>;
}

export class MockBehaviors<Args extends unknown[] | undefined, Ret> {

    private expectations: Array<Behavior<Args, Ret>> = [];

    constructor(public readonly path: string) { }

    public get size() {
        return this.expectations.length;
    }

    addExpectation(args: Args, handler: ExpectationHandler<Args, Ret>): void {
        this.expectations.push(new Behavior(this.path, args, ZERO_OR_MORE, handler));
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

    match(context: RuntimeContext<Args, Ret>): BehaviorMatchResult<Args, Ret> {
        const remaining = this.expectations.slice();
        const unmatched: Array<UnmatchedExpectation<Args, Ret>> = [];
        let matched: Behavior<Args, Ret> | undefined;

        while (remaining.length > 0) {
            const current = remaining.splice(0, 1)[0];
            const matchResult = current.match(context);
            if (matchResult === true) {
                matched = current;
                break;
            }
            unmatched.push({
                expectation: current,
                reason: matchResult
            });
        }

        return {
            remaining,
            unmatched,
            matched
        };
    }

    toString(): string {
        return this.expectations.map(e => `${e.toString()}`).join('\n');
    }

    getAllUnsatisfied(): Array<Behavior<Args, Ret>> {
        return this.expectations.filter(e => !e.isSatisfied());
    }

    hasExpecting(): boolean {
        return this.expectations.some(e => e.isExpecting());
    }

    reset(): void {
        this.expectations.length = 0;
    }
}
