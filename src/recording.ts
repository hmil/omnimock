import { WithMetadata, withMetadata, createMetadata } from './metadata';

export interface RecordedCall<Args extends any[], Ret> extends WithMetadata<'call', { args: Args, ret: Ret}> {
    type: 'call';
    answer: (cb: (args: Args) => Ret) => void;
};

export function recordedCall<Args extends any[], Ret>(answer: (cb: (args: Args) => Ret) => void): RecordedCall<Args, Ret> {
    return withMetadata({ 
        type: 'call',
        answer 
    }, createMetadata('call', { args: {} as Args, ret: {} as Ret}));
}


export interface RecordedGetter<T> {
    type: 'getter',
    answer: (cb: () => T) => void;
}
export function recordedGetter<T>(answer: (cb: () => T) => void): RecordedGetter<T> {
    return {
        type: 'getter',
        answer
    };
}

export type Recording = RecordedCall<unknown[], unknown> | RecordedGetter<unknown>;

export function isRecordedCall(t: unknown): t is RecordedCall<unknown[], unknown> {
    return (typeof t === 'object' || typeof t === 'function') && t != null && 'type' in t && (t as RecordedCall<any, any>)['type'] === 'call';
}

export function isRecordedGetter(t: unknown): t is RecordedGetter<unknown> {
    return (typeof t === 'object' || typeof t === 'function') && t != null && 'type' in t && (t as RecordedGetter<any>)['type'] === 'getter';
}

export function isRecording(t: unknown): t is Recording {
    return isRecordedCall(t) || isRecordedGetter(t); 
}