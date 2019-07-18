import { isRecordedGetter, isRecordedCall, RecordedGetter, RecordedCall } from '../recording';
import { FnType } from '../base-types';

export interface CallExpectation<Inst, Args extends unknown[], Ret> { };
export interface GetterExpectation<Inst, T> { };

interface CallExpectationFactory<T> {
    (recording: RecordedCall<unknown, FnType<unknown[], unknown>, unknown[], unknown>): T;
}

interface GetterExpectationFactory<T> {
    (recording: RecordedGetter<object, never, unknown>): T;
}

const callExpectationFactories: CallExpectationFactory<any>[] = [];
const getterExpectationFactories: GetterExpectationFactory<any>[] = [];

function createGetterExpectation(recording: RecordedGetter<object, never, unknown>): GetterExpectation<unknown, unknown> {
    return getterExpectationFactories
            .map(f => f(recording))
            .reduce((prev, curr) => ({ ...prev, ...curr }), {} as GetterExpectation<any, any>);
}

function createCallExpectation(recording: RecordedCall<unknown, FnType<unknown[], unknown>, unknown[], unknown>): CallExpectation<unknown, unknown[], unknown> {
    return callExpectationFactories
            .map(f => f(recording))
            .reduce((prev, curr) => ({ ...prev, ...curr }), {} as CallExpectation<any, any, any>);
}

export function registerCallExpectationFactory<T>(factory: CallExpectationFactory<T>): void {
    callExpectationFactories.push(factory);
}

export function registerGetterExpectationFactory<T>(factory: GetterExpectationFactory<T>): void {
    getterExpectationFactories.push(factory);
}

export type AnyExpectation = CallExpectation<unknown, unknown[], unknown> | GetterExpectation<unknown, unknown>;

export function createExpectation<T>(recording: T): GetterExpectation<unknown, unknown> | CallExpectation<unknown, unknown[], unknown> {
    if (isRecordedGetter(recording)) {
        return createGetterExpectation(recording);
    }
    if (isRecordedCall(recording)) {
        return createCallExpectation(recording);
    }
    throw new Error('`when` needs to be invoked on a mock. Did you forget to `mock()` your object?' + JSON.stringify(recording));
}