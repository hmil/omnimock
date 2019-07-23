import {
    mockObjectNotSupported,
    plugin,
    TsMockError,
    GetterRecording,
    IfMethod,
    IfVirtual,
    isGetterRecording,
    isMethodCallRecording,
    MethodCallRecording,
    RecordedArguments,
    RecordedType,
    UnknownRecording,
    ExpectationSetter,
} from '../plugin-api';
import { ExpectationSetterApi } from '../expectations';
import { AnyRecording } from '../recording';

export interface BaseMethodCallExpectations<T extends AnyRecording> {
    return: IfMethod<T, (value: RecordedType<T>) => ExpectationSetter<T>, undefined>;
    throw: IfMethod<T, (e: any) => ExpectationSetter<T>, undefined>;
    call: IfMethod<T, (cb: (...args: RecordedArguments<T>) => RecordedType<T>) => ExpectationSetter<T>, undefined>
    callThrough: IfMethod<T, IfVirtual<T, TsMockError<'`callThrough` is not available on virtual mocks'>, () => ExpectationSetter<T>>, undefined>;
}

export interface BaseGetterExpectations<T extends AnyRecording> {
    useValue: IfMethod<T, undefined, (v: RecordedType<T>) => ExpectationSetter<T>>;
    useGetter: IfMethod<T, undefined, (cb: () => RecordedType<T>) => ExpectationSetter<T>>;
    useActual: IfMethod<T, undefined, IfVirtual<T, TsMockError<'`useActual` is not available on virtual mocks'>, () => ExpectationSetter<T>>>;
}

function baseCallExpectation(api: ExpectationSetterApi<MethodCallRecording>): BaseMethodCallExpectations<MethodCallRecording> {
    return {
        call(cb) {
            api.answer((_ctx, _tgt, ctx, args) => cb.apply(ctx, args));
            return api.chain();
        },
        return(value) {
            api.answer(() => value);
            return api.chain();
        },
        throw(e) {
            api.answer(() => { throw e });
            return api.chain();
        },
        callThrough() {
            api.answer((_, getOriginal) => getOriginal());
            return api.chain();
        }
    };
}

function baseGetterExpectation(api: ExpectationSetterApi<GetterRecording>): BaseGetterExpectations<GetterRecording> {
    return {
        useGetter(cb) {
            api.answer(cb);
            return api.chain();
        },
        useValue(value) {
            api.answer(() => value);
            return api.chain();
        },
        useActual() {
            api.answer((_, getOriginal) => getOriginal());
            return api.chain();
        }
    };
};

declare module "../plugin-api" {
    interface ExpectationSetter<T extends UnknownRecording> extends BaseMethodCallExpectations<T>, BaseGetterExpectations<T> { }
}

plugin.registerExpectations((api): any => {
    if (isMethodCallRecording(api.recording)) {
        return baseCallExpectation(api as any);
    } else if (isGetterRecording(api.recording)) {
        return baseGetterExpectation(api as any);
    }
    return mockObjectNotSupported('base');
});
