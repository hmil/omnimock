import { TsMockError } from '../error';
import { registerCallExpectationFactory } from '../expectations';

interface PromiseCallExpectation<T> {
    resolve: T extends Promise<infer PType> ?
            (t: PType) => void :
            TsMockError<"This method does not return a promise, you cannot use 'resolve()' here.">;
    reject: T extends Promise<unknown> ?
            (t: any) => void :
            TsMockError<"This method does not return a promise, you cannot use 'reject()' here.">;
}

declare module "." {
    interface CallExpectation<Args extends unknown[], Ret> extends PromiseCallExpectation<Ret> { }
}

registerCallExpectationFactory<PromiseCallExpectation<Promise<unknown>>>((recording) => ({
    resolve(value) {
        recording.answer(() => Promise.resolve(value));
    },
    reject(e) {
        recording.answer(() => Promise.reject(e));
    }
}));
