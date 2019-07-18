import { isRecordedGetter, isRecordedCall, RecordedGetter, RecordedCall } from '../recording';

export interface CallExpectation<Args extends unknown[], Ret> { };
export interface GetterExpectation<T> { };

interface CallExpectationFactory<T> {
    (recording: RecordedCall<unknown[], unknown>): T;
}

interface GetterExpectationFactory<T> {
    (recording: RecordedGetter<unknown>): T;
}

const callExpectationFactories: CallExpectationFactory<any>[] = [];
const getterExpectationFactories: GetterExpectationFactory<any>[] = [];

function createGetterExpectation(recording: RecordedGetter<unknown>): GetterExpectation<unknown> {
    return getterExpectationFactories
            .map(f => f(recording))
            .reduce((prev, curr) => ({ ...prev, ...curr }), {} as GetterExpectation<any>);
}

function createCallExpectation(recording: RecordedCall<unknown[], unknown>): CallExpectation<unknown[], unknown> {
    return callExpectationFactories
            .map(f => f(recording))
            .reduce((prev, curr) => ({ ...prev, ...curr }), {} as CallExpectation<any, any>);
}

export function registerCallExpectationFactory<T>(factory: CallExpectationFactory<T>): void {
    callExpectationFactories.push(factory);
}

export function registerGetterExpectationFactory<T>(factory: GetterExpectationFactory<T>): void {
    getterExpectationFactories.push(factory);
}

export type AnyExpectation = CallExpectation<unknown[], unknown> | GetterExpectation<unknown>;

export function createExpectation<T>(recording: T): GetterExpectation<unknown> | CallExpectation<unknown[], unknown> {
    if (isRecordedGetter(recording)) {
        return createGetterExpectation(recording);
    }
    if (isRecordedCall(recording)) {
        return createCallExpectation(recording);
    }
    throw new Error('`when` needs to be invoked on a mock. Did you forget to `mock()` your object?' + JSON.stringify(recording));
}