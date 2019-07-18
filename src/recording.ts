import { WithMetadata, withMetadata, createMetadata } from './metadata';
import { AnyFunction } from 'base-types';

export interface RecordedCall<Ctx, Fn extends AnyFunction, Args extends any[], Ret>
        extends WithMetadata<'call', { args: Args, ret: Ret}> {
    type: 'call';
    ctx: Ctx;
    fnProvider: () => Fn; // Wrap fn in a provider because accessing it can trigger some getter logic in the backing instance.
    answer: (cb: (args: Args) => Ret) => void;
};

export function recordedCall<Ctx, Fn extends AnyFunction, Args extends any[], Ret>(
        ctx: Ctx, fnProvider: () => Fn, answer: (cb: (args: Args) => Ret) => void): RecordedCall<Ctx, Fn, Args, Ret> {
    return withMetadata({ 
        type: 'call',
        ctx,
        fnProvider,
        answer 
    }, createMetadata('call', { args: {} as Args, ret: {} as Ret}));
}


export interface RecordedGetter<Inst, Key extends keyof Inst, T> {
    type: 'getter',
    inst: Inst,
    key: Key,
    answer: (cb: () => T) => void;
}
export function recordedGetter<Inst, Key extends keyof Inst, T>(
        inst: Inst,
        key: Key,
        answer: (cb: () => T) => void): RecordedGetter<Inst, Key, T> {
    return {
        type: 'getter',
        answer,
        inst,
        key
    };
}

export type Recording = RecordedCall<unknown, AnyFunction, unknown[], unknown> | RecordedGetter<unknown, never, unknown>;

export function isRecordedCall(t: unknown): t is RecordedCall<unknown, AnyFunction, unknown[], unknown> {
    return (typeof t === 'object' || typeof t === 'function') && t != null && 'type' in t && (t as RecordedCall<any, any, any, any>)['type'] === 'call';
}

export function isRecordedGetter(t: unknown): t is RecordedGetter<object, never, unknown> {
    return (typeof t === 'object' || typeof t === 'function') && t != null && 'type' in t && (t as RecordedGetter<any, any, any>)['type'] === 'getter';
}

export function isRecording(t: unknown): t is Recording {
    return isRecordedCall(t) || isRecordedGetter(t); 
}