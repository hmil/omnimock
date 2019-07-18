import { registerCallExpectationFactory, registerGetterExpectationFactory } from '../expectations';
import { TsMockError } from 'error';

export interface BaseCallExpectation<Inst, Args extends unknown[], Ret> {
    return(value: Ret): void;
    throw(e: any): void;
    call(cb: (...args: Args) => Ret): void;
    callThrough: Inst extends undefined ? TsMockError<'`callThrough` is not available on virtual mocks'> : () => void;
}

export interface BaseGetterExpectation<Inst, T> {
    useValue(v: T): void;
    useGetter(cb: () => T): void;
    useActual: Inst extends undefined ? TsMockError<'`useActual` is not available on virtual mocks'> : () => void;
};

declare module "." {
    interface CallExpectation<Inst, Args, Ret> extends BaseCallExpectation<Inst, Args, Ret> { }
    interface GetterExpectation<Inst, T> extends BaseGetterExpectation<Inst, T> { }
}

registerCallExpectationFactory<BaseCallExpectation<unknown, unknown[], unknown>>((recording) => ({
    call(cb) {
        recording.answer((args) => cb(...args));
    },
    return(value) {
        recording.answer(() => value);
    },
    throw(e) {
        recording.answer(() => { throw e });
    },
    callThrough() {
        recording.answer((args) => recording.fnProvider().apply(recording.ctx, args));
    }
}));

registerGetterExpectationFactory<BaseGetterExpectation<unknown, unknown>>((recording) => ({
    useGetter(cb) {
        recording.answer(cb);
    },
    useValue(value) {
        recording.answer(() => value);
    },
    useActual() {
        recording.answer(() => recording.inst[recording.key]);
    }
}));
