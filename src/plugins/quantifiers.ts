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
    /** Expect this behavior exactly n times  */
    times(n: number): ExpectationSetter<T>;
    /** Expect this behavior 1 or more times */
    atLeastOnce(): ExpectationSetter<T>;
    /** Expect this behavior 0 or one times */
    atMostOnce(): ExpectationSetter<T>;
    /** Expect this behavior exactly one time */
    once(): ExpectationSetter<T>;
    /** Expect this behavior 0 or more times */
    anyTimes(): ExpectationSetter<T>;
    /** Expect this behavior exactly 0 times */
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
