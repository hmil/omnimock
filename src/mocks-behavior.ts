import { Invocation } from './recorded-call';
import { InvocationResult } from './invocation-result';
import { match } from './matchers';
import { Range } from './range';

class InvocationResults<T> {

    private actualCount = 0;

    constructor(
            public readonly result: InvocationResult<T>,
            public readonly expectedCount: Range) {
    }

    hasValidCallCount(): boolean {
        return this.expectedCount.contains(this.actualCount);
    }

    addActual() {
        this.actualCount ++;
    }

    getCurrentActualCount() {
        return this.actualCount;
    }
}

class ExpectedInvocationAndResults<T> {
    constructor(
            private expectedInvocation: Invocation,
            private result: InvocationResults<T>) {
    }

    matches(actual: Invocation): boolean {
        return this.expectedInvocation.method === actual.method && this.expectedInvocation.instance === actual.instance &&
            this.argsMatches(actual.args);
    }

    addInvocation(): void {
        this.result.addActual();
    }

    verify(): boolean {
        return this.result.hasValidCallCount();
    }

    getResult(): InvocationResult<T> {
        return this.result.result;
    }

    toString() {
        return `${this.expectedInvocation.toString()} matched ${this.result.getCurrentActualCount()} times of ${this.result.expectedCount} expected`;
    }

    private argsMatches(actual: unknown[]): boolean {
        if (this.expectedInvocation.args.length !== actual.length) {
            // console.info(`Expected ${this.expectedInvocation.args.length} argument(s) but got ${actual.length}.`);
            return false;
        }
        for (let i = 0 ; i < actual.length ; i++) {
            const matched = match(this.expectedInvocation.args[i], actual[i]);
            if (matched !== true) {
                // console.info(matched);
                return false;
            }
        }
        return true;
    }
}

export class MocksBehavior {

    private expectations: Array<ExpectedInvocationAndResults<any>> = [];

    addExpected(expected: Invocation, result: InvocationResult<any>, count: Range) {
        this.expectations.push(new ExpectedInvocationAndResults(expected, new InvocationResults(result, count)));
    }

    addActual(actual: Invocation): InvocationResult<any> | Error {
        for (const expectation of this.expectations) {
            if (expectation.matches(actual)) {
                expectation.addInvocation();
                return expectation.getResult();
            }
        }

        const expectationsString = this.expectations.length === 0 ?
                    'No expectations were set' :
                    'Expected:\n' + this.expectations.map(e => e.toString()).join('\n');
        return new Error(`Unmatched method call: ${actual.toString()}. ${expectationsString}`);
    }

    verify(): void {
        for (const expectation of this.expectations) {
            if (!expectation.verify()) {
                throw new Error(`Failed to verify expectation: ${expectation.toString()}`);
            }
        }
    }


}
