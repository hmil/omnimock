import { IMocksControl, MocksControl } from './mocks-control';
import { IExpectationSetters } from './expectation-setter';
import { isRecordedCall } from './recorded-call';

export { IMocksControl, IExpectationSetters };
export * from './matchers';

export function createControl(): IMocksControl {
    return new MocksControl();
}

export function expect<T>(record: T): IExpectationSetters<T> {
    if (!isRecordedCall(record)) {
        throw new Error('expect() must be called on the result of a mock invocation');
    }
    return record.context.expect(record.invocation);
}
