/**
 * **experimental**
 * 
 * The plugin authoring API. Lets third-party module augment the features of omnimock.
 * 
 * All runtime components of the api are wrapped in the `plugin` object to avoid any confusion.
 * All types are exported from the top-level.
 * 
 * ```ts
 * import { plugin, ExpectationSetter } from 'omnimock';
 * 
 * declare module "omnimock" {
 *     interface ExpectationSetter<...> extends MyCustomExpectationSetter<...>
 * }
 * plugin.registerExpectations(...);
 * ```
 */
import { ExpectationHandler, MockExpectations } from './expectations';
import { GetMetadata, getMetadata } from './metadata';
import { AnyRecording, RecordedArguments, RecordedType, RECORDING_METADATA_KEY, UnknownRecording } from './recording';

export { OmniMockError } from './error';
export * from './range';
export {
    GetterRecording,
    IfMethod,
    MethodCallRecording,
    RecordedArguments,
    RecordedType,
    UnknownRecording
} from './recording';

export const plugin = {
    registerExpectations,
};

export function mockObjectNotSupported(pluginName: string): never {
    throw new Error(`Failed to load expectation setters on this mock object. Possible causes are:
- The object you are trying to mock was not obtained from the 'mock()' function.
- The plugin '${pluginName}' is not compatible with this version of omnimock.`);
}

// tslint:disable-next-line: no-empty-interface
export interface ExpectationSetter<T extends UnknownRecording> { }

/**
 * @internal
 */
export function createExpectationSetter(recording: UnknownRecording): ExpectationSetter<UnknownRecording> {
    const api: ExpectationSetterApi<UnknownRecording> = 
            new ExpectationSetterApi(getMetadata(recording, 'recording'), () => setter);
    const setter = expectationSetterFactories
        .map<ExpectationSetter<UnknownRecording>>(f => f(api) as ExpectationSetter<UnknownRecording>)
        .reduce((prev, curr) => ({ ...prev, ...curr}), {} as ExpectationSetter<UnknownRecording>);
    return setter;
}

class ExpectationSetterApi<T extends AnyRecording> {

    constructor(
            private readonly recording: GetMetadata<RECORDING_METADATA_KEY, T>,
            public readonly chain: () => ExpectationSetter<T>) {
    }

    answer(cb: ExpectationHandler<RecordedArguments<T>, RecordedType<T>>): void {
        this.recording.expect();
        this.recording.expectations.addExpectation(this.recording.args, cb);
    }

    get expectations(): MockExpectations<RecordedArguments<T>, RecordedType<T>> {
        return this.recording.expectations;
    }
}

type ExpectationSetterFactory<T extends UnknownRecording> =
    (api: ExpectationSetterApi<T>) => Partial<ExpectationSetter<T>>;

const expectationSetterFactories: Array<ExpectationSetterFactory<UnknownRecording>> = [];

function registerExpectations(factory: ExpectationSetterFactory<UnknownRecording>): void {
    expectationSetterFactories.push(factory as any);
}

