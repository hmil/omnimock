import {
    AT_LEAST_ONCE,
    AT_MOST_ONCE,
    ExpectationSetter,
    NEVER,
    ONCE,
    plugin,
    Range,
    UnknownRecording,
    ZERO_OR_MORE,
} from '../plugin-api';

interface Quantifiers<T extends UnknownRecording> {
    times(n: number): ExpectationSetter<T>;
    atLeastOnce(): ExpectationSetter<T>;
    atMostOnce(): ExpectationSetter<T>;
    once(): ExpectationSetter<T>;
    anyTimes(): ExpectationSetter<T>;
    never(): ExpectationSetter<T>;
}

declare module '../plugin-api' {
    interface ExpectationSetter<T extends UnknownRecording> extends Quantifiers<T> { }
}

plugin.registerExpectations((api): Quantifiers<UnknownRecording> => {
    return {
        atLeastOnce() {
            api.expectations.setLastExpectationRange(AT_LEAST_ONCE);
            return api.chain();
        },
        atMostOnce() {
            api.expectations.setLastExpectationRange(AT_MOST_ONCE);
            return api.chain();
        },
        once() {
            api.expectations.setLastExpectationRange(ONCE);
            return api.chain();
        },
        times(n: number) {
            api.expectations.setLastExpectationRange(new Range(n));
            return api.chain();
        },
        anyTimes() {
            api.expectations.setLastExpectationRange(ZERO_OR_MORE);
            return api.chain();
        },
        never() {
            api.expectations.setLastExpectationRange(NEVER);
            return api.chain();
        }
    };
});
