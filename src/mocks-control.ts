import { IMocksControlState, RecordState, ReplayState } from './mocks-control-state';
import { MocksProxyHandler } from './mocks-proxy-handler';
import { ObjectMethodsFilter, InterfaceMethodsFilter } from './object-methods-filter';
import { IExpectationSetters } from './expectation-setter';
import { Invocation } from './recorded-call';
import { MocksBehavior } from './mocks-behavior';
import { Range, ONCE, ZERO_OR_MORE, AT_LEAST_ONCE } from './range';

interface ConstructorType<T> {
    new(...args: any[]): T;
}

type InstOrSelf<T> = T extends ConstructorType<infer Inst> ? Inst : T;

export interface IMocksControl {
    mock<T>(name?: string): T;
    mock<T extends object>(constructor: ConstructorType<T>): T;
    mock<T extends object>(itf: T): InstOrSelf<T>;
    replay(): void;
    reset(): void;
    verify(): void;
}

export interface IMocksContext {
    getState(): IMocksControlState;
    expect<T>(invocation: Invocation): IExpectationSetters<T>;
}

export class MocksControl implements IMocksControl, IMocksContext, IExpectationSetters<any> {
    private behavior: MocksBehavior = new MocksBehavior();

    private state: IMocksControlState = new RecordState(this, this.behavior);

    /** @override */
    
    mock<T extends object>(constructorOrName?: ConstructorType<T> | string): T {
        if (constructorOrName == undefined) {
            constructorOrName = 'stub';
        }
        if (typeof constructorOrName === 'function') {
            return new Proxy<T>(createMockClass(constructorOrName), new MocksProxyHandler(this, constructorOrName, new ObjectMethodsFilter()));
        }
        if (typeof constructorOrName === 'string') {
            const dummyCtx = {
                [constructorOrName]: function() {}
            };
            return new Proxy<T>({} as T, new MocksProxyHandler(this, dummyCtx[constructorOrName], new InterfaceMethodsFilter()));
        }
        throw new Error('Invalid arguments passed to `mock` funciton. Please refer to the docs.');
    }

    /** @override */
    replay() {
        this.state.replay();
        this.state = new ReplayState(this, this.behavior);
    }

    /** @override */
    reset() {
        this.behavior = new MocksBehavior();
        this.state = new RecordState(this, this.behavior);
    }

    /** @override */
    verify() {
        this.state.verify();
    }

    /** @override */
    getState() {
        return this.state;
    }

    /** @override */
    expect(invocation: Invocation) {
        this.state.expect(invocation);
        return this;
    }

    /** @override */
    andReturn(val: any): IExpectationSetters<any> {
        this.state.andReturn(val);
        return this;
    }

    /** @override */
    andVoid(): IExpectationSetters<any> {
        this.state.andVoid();
        return this;
    }

    /** @override */
    andThrow(e: any): IExpectationSetters<any> {
        this.state.andThrow(e);
        return this;
    }

    /** @override */
    once(): IExpectationSetters<any> {
        this.state.times(ONCE);
        return this;
    }

    /** @override */
    anyTimes(): IExpectationSetters<any> {
        this.state.times(ZERO_OR_MORE);
        return this;
    }

    /** @override */
    atLeastOnce(): IExpectationSetters<any> {
        this.state.times(AT_LEAST_ONCE);
        return this;
    }

    /** @override */
    times(count: number): IExpectationSetters<any> {
        this.state.times(new Range(count));
        return this;
    }

}

function createMockClass<T extends ConstructorType<any>>(klass: T): InstanceType<T> {
    class Ctr extends klass {
    }
    return new Ctr();
}
