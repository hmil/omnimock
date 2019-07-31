import { OmniMockError, suppressCompileTimeError } from '../error';
import { ExpectationSetter, plugin, RecordedType, UnknownRecording } from '../plugin-api';

interface PromiseExpectations<T extends UnknownRecording> {
    /**
     * Resolves the promise with the value provided.
     */
    resolve: RecordedType<T> extends Promise<infer PType> ?
            (t: PType) => ExpectationSetter<UnknownRecording> :
            OmniMockError<'This method does not return a promise, you cannot use \'resolve()\' here.'>;
    /**
     * Rejects the promise with the reason provided.
     */
    reject: RecordedType<T> extends Promise<unknown> ?
            (t: any) => ExpectationSetter<UnknownRecording> :
            OmniMockError<'This method does not return a promise, you cannot use \'reject()\' here.'>;
}

declare module '../plugin-api' {
    interface ExpectationSetter<T extends UnknownRecording> extends PromiseExpectations<T> { }
}

plugin.registerExpectations((api): PromiseExpectations<UnknownRecording> => {
    return {
        resolve: suppressCompileTimeError((value: RecordedType<typeof api>) => {
            api.answer(() => Promise.resolve(value));
            return api.chain();
        }),
        reject: suppressCompileTimeError((value: RecordedType<typeof api>) => {
            api.answer(() => Promise.reject(value));
            return api.chain();
        })
    };
});
