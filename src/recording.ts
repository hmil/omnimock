import { GetMetadata, WithMetadata, setMetadata } from './metadata';
import { MockExpectations } from 'expectations';

export type RecordingType = 'getter' | 'call';

export const RECORDING_METADATA_KEY = 'recording';
export type RECORDING_METADATA_KEY = typeof RECORDING_METADATA_KEY;

export interface RecordingMetadata<Type extends RecordingType, Args extends unknown[] | undefined, Ret> {
    readonly type: Type;
    readonly args: Args;
    readonly ret: Ret;
    readonly expectations: MockExpectations<Args, Ret>;
    /**
     * Creates the chain of mocks required to reach the current object.
     */
    expect(): void;
}

type UnknownMetadata = RecordingMetadata<RecordingType, unknown[], unknown>;
type AnyMetadata = RecordingMetadata<RecordingType, any, any>;

export interface Recording<T extends AnyMetadata> extends WithMetadata<RECORDING_METADATA_KEY, T> { };

// export type Recording<Inst, Args extends unknown[], Ret> = MethodCallRecording<Inst, Args, Ret> | GetterRecording<Inst, Ret>;

export type AnyRecording = Recording<AnyMetadata>;
export type UnknownRecording = Recording<UnknownMetadata>;
export type MethodCallRecording = Recording<RecordingMetadata<'call', unknown[], unknown>>;
export type AnyMethodCallRecording = Recording<RecordingMetadata<'call', any, any>>;
export type GetterRecording = Recording<RecordingMetadata<'getter', unknown[], unknown>>;

// Type-level operators to access expectation setter data.
export type RecordedType<T> = T extends Recording<infer Metadata> ? Metadata['ret'] : never;
export type RecordedArguments<T extends UnknownRecording> = GetMetadata<RECORDING_METADATA_KEY, T>['args'];
export type IfMethod<T, Then, Else> = T extends AnyMethodCallRecording ? Then : Else;

export function isMethodCallRecording(api: AnyMetadata): api is GetMetadata<RECORDING_METADATA_KEY, MethodCallRecording> {
    return api.type === 'call';
}

export function isGetterRecording(api: AnyMetadata): api is GetMetadata<RECORDING_METADATA_KEY, GetterRecording> {
    return api.type === 'getter';
}

export function createRecording<T extends GetMetadata<RECORDING_METADATA_KEY, UnknownRecording>>(data: T): Recording<T> {
    return setMetadata({} as Recording<T>, RECORDING_METADATA_KEY, data);
}
