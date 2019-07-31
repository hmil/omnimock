import { MockExpectations } from 'expectations';
import { GetMetadata, WithMetadata } from './metadata';

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

export interface Recording<T extends AnyMetadata> extends WithMetadata<RECORDING_METADATA_KEY, T> { }

export type AnyRecording = Recording<AnyMetadata>;
export type UnknownRecording = Recording<UnknownMetadata>;
export type MethodCallRecording = Recording<RecordingMetadata<'call', unknown[], unknown>>;
export type AnyMethodCallRecording = Recording<RecordingMetadata<'call', any, any>>;
export type GetterRecording = Recording<RecordingMetadata<'getter', unknown[], unknown>>;

// Type-level operators to access expectation setter data.
export type RecordedType<T> = T extends Recording<infer Metadata> ? Metadata['ret'] : never;
export type RecordedArguments<T extends UnknownRecording> = GetMetadata<RECORDING_METADATA_KEY, T>['args'];
export type IfMethod<T, Then, Else> = T extends AnyMethodCallRecording ? Then : Else;
