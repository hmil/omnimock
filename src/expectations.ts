import { UnknownRecording, RecordedArguments, RecordedType, AnyRecording, RECORDING_METADATA_KEY } from './recording';
import { GetMetadata, getMetadata } from './metadata';

export class ExpectationSetterApi<T extends AnyRecording> {

    constructor(
            public readonly recording: GetMetadata<RECORDING_METADATA_KEY, T>,
            public readonly chain: () => ExpectationSetter<T>) {
    }

    answer(cb: (getOriginalContext: () => object | undefined, getOriginal: () => T, ctx: unknown, args: RecordedArguments<T>) => RecordedType<T>): void {
        this.recording.expect();
        this.recording.expectations[0] = cb;
    }
}

export interface ExpectationSetter<T extends UnknownRecording> { };

export interface ExpectationSetterFactory<T extends UnknownRecording> {
    (api: ExpectationSetterApi<T>): Partial<ExpectationSetter<T>>;
}

const expectationSetterFactories: ExpectationSetterFactory<UnknownRecording>[] = [];

export function registerExpectations(plugin: ExpectationSetterFactory<UnknownRecording>): void {
    expectationSetterFactories.push(plugin as any);
}

export function createExpectationSetter(recording: UnknownRecording): ExpectationSetter<UnknownRecording> {
    const api: ExpectationSetterApi<UnknownRecording> = new ExpectationSetterApi(getMetadata(recording, 'recording'), () => setter);
    const setter = expectationSetterFactories
        .map<ExpectationSetter<UnknownRecording>>(f => f(api) as ExpectationSetter<UnknownRecording>)
        .reduce((prev, curr) => ({ ...prev, ...curr}), {} as ExpectationSetter<UnknownRecording>);
    return setter;
}
