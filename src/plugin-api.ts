/**
 * The plugin authoring API. Lets third-party module augment the features of tsmock.
 * 
 * All runtime components of the api are wrapped in the `plugin` object to avoid any confusion.
 * All types are exported from the top-level.
 * 
 * ```ts
 * import { plugin, ExpectationSetter } from 'tsmock';
 * 
 * declare module "tsmock" {
 *     interface ExpectationSetter<...> extends MyCustomExpectationSetter<...>
 * }
 * plugin.registerExpectations(...);
 * ```
 */
import { registerExpectations } from './expectations';


export { ExpectationSetter, ExpectationSetterFactory } from './expectations';
export { TsMockError } from './error';
export { 
    UnknownRecording, 
    RecordedType, 
    GetterRecording,
    IfMethod,
    IfVirtual,
    isGetterRecording,
    isMethodCallRecording,
    MethodCallRecording,
    RecordedArguments, } from './recording';

export const plugin = {
    registerExpectations,
};

export function mockObjectNotSupported(pluginName: string): never {
    throw new Error(`Failed to load expectation setters on this mock object. Possible causes are:
- The object you are trying to mock was not obtained from the 'mock()' function.
- The plugin '${pluginName}' is not compatible with this version of tsmock.`)
}
