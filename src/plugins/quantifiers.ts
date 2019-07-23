import {
    plugin,
    UnknownRecording,
    ExpectationSetter,
} from '../plugin-api';

interface Quantifiers<T extends UnknownRecording> {
    times(n: number): ExpectationSetter<T>;
    atLeastOnce(): ExpectationSetter<T>;
    atMostOnce(): ExpectationSetter<T>;
    once(): ExpectationSetter<T>;
}

declare module "../plugin-api" {
    interface ExpectationSetter<T extends UnknownRecording> extends Quantifiers<T> { }
}

plugin.registerExpectations((api): Quantifiers<UnknownRecording> => {
    return {
        atLeastOnce() {
            return api.chain();
        },
        atMostOnce() {
            return api.chain();
        },
        once() {
            return api.chain();
        },
        times(n: number) {
            return api.chain();
        }
    };
});
