import { Invocation, recordedInvocation } from './recorded-call';
import { IMocksContext } from './mocks-control';
import { IExpectationSetters } from '.';
import { MocksBehavior } from './mocks-behavior';
import { voidInvocationResult, InvocationResult, StaticInvocationResult, ThrowingInvocationResult } from './invocation-result';
import { Range, ONCE } from './range';

export interface IMocksControlState {

    invoke(target: unknown, prop: PropertyKey, args: unknown[]): unknown;

    expect(invocation: Invocation): void;

    replay(): void;

    verify(): void;

    andReturn(val: any): void;
    andVoid(): void;
    andThrow(e: any): void;
    times(n: Range): void;
}

export class RecordState implements IMocksControlState {

    private lastInvocation: Invocation | null = null;
    private lastResult: InvocationResult<any> = voidInvocationResult;

    constructor(private context: IMocksContext, private behavior: MocksBehavior) { }

    /** @override */
    verify(): void {
        throw new Error('Calling verify is not allowed in record state.');
    }

    /** @override */
    expect(invocation: Invocation): void {
        this.closeMethod();
        this.lastInvocation = invocation;
    }

    /** @override */
    invoke(target: unknown, prop: PropertyKey, args: unknown[]): unknown {
        return recordedInvocation(this.context, target, prop, args);
    }

    /** @override */
    replay(): void {
        this.closeMethod();
    }

    /** @override */
    andReturn(val: unknown): void {
        this.lastResult = new StaticInvocationResult(val);
    }

    /** @override */
    andThrow(err: any): void {
        this.lastResult = new ThrowingInvocationResult(err);
    }

    /** @override */
    times(range: Range): void {
        if (this.lastInvocation == null) {
            throw new Error('method call on the mock needed before invoking `times`');
        }
        this.behavior.addExpected(this.lastInvocation, this.lastResult, range);
        this.lastInvocation = null;
        this.lastResult = voidInvocationResult;
    }

    /** @override */
    andVoid(): void {
        throw new Error('Method not implemented.');
    }

    private closeMethod(): void {
        if (this.lastInvocation == null && this.lastResult === voidInvocationResult) {
            return;
        }
        this.times(ONCE);
    }
}

export class ReplayState implements IMocksControlState {

    constructor(private context: IMocksContext, private behavior: MocksBehavior) { }

    /** @override */
    verify(): void {
        this.behavior.verify();
    }

    /** @override */
    invoke(target: unknown, prop: PropertyKey, args: unknown[]): unknown  {
        const invocation = recordedInvocation(this.context, target, prop, args);
        const resultOrError = this.behavior.addActual(invocation.invocation);

        if (resultOrError instanceof Error) {
            throw resultOrError;
        }
        return resultOrError.answer();
    }

    /** @override */
    expect(_invocation: Invocation): IExpectationSetters<any> {
        throw new Error('This method must not be called in replay state.');
    }

    /** @override */
    replay() {
        throw new Error('This method must not be called in replay state.');
    }

    /** @override */
    andReturn(): IExpectationSetters<any> {
        throw new Error('This method must not be called in replay state.');
    }

    /** @override */
    andThrow(): IExpectationSetters<any> {
        throw new Error('This method must not be called in replay state.');
    }

    /** @override */
    times(): IExpectationSetters<any> {
        throw new Error('This method must not be called in replay state.');
    }

    /** @override */
    andVoid(): IExpectationSetters<any> {
        throw new Error('This method must not be called in replay state.');
    }
}
