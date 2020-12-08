import { formatSignature } from '../formatting';
import { functionArguments, match } from '../matchers';
import { Range } from '../range';

export interface RuntimeContext<Args, Ret> {
    getOriginalTarget?: () => Ret;
    context: unknown;
    args: Args;
}

export interface SuccessfulHandlingResult<Ret> {
    result: Ret;
}
export interface FailureHandlingResult {
    error: true;
}
export type HandlingResult<Ret> = SuccessfulHandlingResult<Ret> | FailureHandlingResult;

export function isFailure(t: HandlingResult<any>): t is FailureHandlingResult {
    return 'error' in t;
}


export type ExpectationHandler<Args, Ret> = (context: RuntimeContext<Args, Ret>) => Ret;

export interface ObservedCall {
    signature: string;
    // stack: string;
}

export class Behavior<Args extends unknown[] | undefined, Ret> {

    /**
     * Signatures of actual calls.
     */
    public readonly actualCalls: ObservedCall[] = [];

    constructor(
            private readonly path: string,
            private readonly args: Args,
            public expectedCalls: Range,
            private readonly handler: ExpectationHandler<Args, Ret>) { }

    match(context: RuntimeContext<Args, Ret>): true | string {
        const matcher = this.args == null ? this.args : functionArguments(this.args as any[]);
        return match(matcher, context.args);
    }

    handle(context: RuntimeContext<Args, Ret>): HandlingResult<Ret> {
        this.actualCalls.push({
            signature: `${formatSignature(this.path, context.args)}`,
            // stack: new Error()
        });
        if (this.expectedCalls.getMaximum() < this.actualCalls.length) {
            return {
                error: true
            };
        }
        return {
            result: this.handler(context)
        };
    }

    getSignature(): string {
        return formatSignature(this.path, this.args);
    }

    toString(): string {
        return `${this.getSignature()} : ` +
                `expected ${this.expectedCalls.toString()}, ` +
                `received ${this.actualCalls.length}`;
    }

    isSatisfied(): boolean {
        return this.expectedCalls.contains(this.actualCalls.length);
    }

    /**
     * Returns true when this behavior also acts as an expectation (ie. the minimum number of calls is > 0)
     */
    isExpecting(): boolean {
        return this.expectedCalls.hasFixedCount() || this.expectedCalls.getMinimum() > 0;
    }
}
