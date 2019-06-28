import { IMocksContext } from './mocks-control';
import { fmt } from './utils';

export class Invocation {
    constructor(
            public readonly instance: unknown,
            public readonly method: PropertyKey,
            public readonly args: unknown[]
    ) {}

    toString() {
        return fmt`${this.instance}.${this.method.toString()}(${this.args.map(a => fmt`${a}`).join(',')})`;
    }
}

export function recordedInvocation(context: IMocksContext, instance: unknown, method: PropertyKey, args: unknown[]) {
    return {
        __EASYMOCK_RECORDED_CALL: 'This return value has been stubbed because the call was made in "record" state. '
            + 'If you are seeing this message, then you either forgot to call `control.replay()`, or something you are '
            + 'not aware of calls into your mocks during the setup of your test.',
        invocation: new Invocation(instance, method, args),
        context
    };
}


export type RecordedInvocation = ReturnType<typeof recordedInvocation>;

export function isRecordedCall(t: unknown): t is RecordedInvocation {
    return typeof t === 'object' && t != null && t.hasOwnProperty('__EASYMOCK_RECORDED_CALL');
}
