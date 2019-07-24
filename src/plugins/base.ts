import {
    plugin,
    RecordedArguments,
    RecordedType,
    UnknownRecording,
    ExpectationSetter,
} from '../plugin-api';
import { AnyRecording } from '../recording';

export interface BaseExpectations<T extends AnyRecording> {
    return: (value: RecordedType<T>) => ExpectationSetter<T>;
    useValue: (v: RecordedType<T>) => ExpectationSetter<T>;
    throw: (e: any) => ExpectationSetter<T>;
    call: (cb: (...args: RecordedArguments<T>) => RecordedType<T>) => ExpectationSetter<T>;
    callThrough: () => ExpectationSetter<T>;
    useGetter: (cb: () => RecordedType<T>) => ExpectationSetter<T>;
    useActual: () => ExpectationSetter<T>;
}

declare module "../plugin-api" {
    interface ExpectationSetter<T extends UnknownRecording> extends BaseExpectations<T> { }
}

plugin.registerExpectations((api): BaseExpectations<UnknownRecording> => {
    return {
        call(cb) {
            api.answer((runtime) => cb.apply(undefined, runtime.args));
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
            api.answer((runtime) => runtime.getOriginalTarget());
            return api.chain();
        },
        useGetter(cb) {
            api.answer(cb);
            return api.chain();
        },
        useValue(value) {
            api.answer(() => value);
            return api.chain();
        },
        useActual() {
            api.answer((runtime) => runtime.getOriginalTarget());
            return api.chain();
        }
    };
});
