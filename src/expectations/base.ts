import { registerCallExpectationFactory, registerGetterExpectationFactory } from '../expectations';

export interface BaseCallExpectation<Args extends unknown[], Ret> {
    return(value: Ret): void;
    throw(e: any): void;
    call(cb: (...args: Args) => Ret): void;
}


export interface BaseGetterExpectation<T> {
    useValue(v: T): void;
    callFake(cb: () => T): void;
};

declare module "." {
    interface CallExpectation<Args, Ret> extends BaseCallExpectation<Args, Ret> { }
    interface GetterExpectation<T> extends BaseGetterExpectation<T> { }
}

registerCallExpectationFactory<BaseCallExpectation<unknown[], unknown>>((recording) => ({
    call(cb) {
        recording.answer((args) => cb(...args));
    },
    return(value) {
        recording.answer(() => value);
    },
    throw(e) {
        recording.answer(() => { throw e });
    }
}));

registerGetterExpectationFactory<BaseGetterExpectation<unknown>>((recording) => ({
    callFake(cb) {
        recording.answer(cb);
    },
    useValue(value) {
        recording.answer(() => value);
    }
}));
