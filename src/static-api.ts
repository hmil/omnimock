/*
 * Top-level API
 */
import { AnyFunction, ConstructorType } from './base-types';
import { OmniMockError } from './error';
import { GetMetadata, hasMetadata } from './metadata';
import {
    createBackedMock,
    createClassOrFunctionMock,
    createVirtualMock,
    debugMock,
    getMockInstance,
    Mock,
    resetMock,
    verifyMock,
} from './mocks';
import { createExpectationSetter, ExpectationSetter } from './plugin-api';
import { Recording, RECORDING_METADATA_KEY, UnknownRecording } from './recording';


/**
 * Creates a mock for a class, an interface or an object instance.
 * 
 * @example
 * 
 * ```
 * // Mock an interface
 * const mockedInterface = mock<SomeInterface>()
 * 
 * // Passing a name helps generate better error messages
 * const mockedInterface = mock<SomeInterface>('someInterface')
 * 
 * // Mock a class
 * const mockedClass = mock(MyClass)
 * 
 * // Construct and mock a class (allows using `.andCallThrough()`)
 * const mockedClass = mock(MyClass, ['parameters', 'of the', 'constructor'])
 * 
 * // Mock an object (allows `.andCallThrough()`)
 * const mockedObject = mock(someObject)
 * ```
 */
export function mock<T>(name?: string): Mock<T>;
export function mock<T>(ctr: ConstructorType<T>): Mock<T>;
export function mock<T extends AnyFunction>(backing: T): Mock<T>;
export function mock<T extends object>(backing: Partial<T>): Mock<T>;
export function mock<T extends AnyFunction | object>(toMock: string | Partial<T> | undefined): Mock<T> {
    if (toMock === undefined) {
        toMock = 'virtual mock';
    }
    if (typeof toMock === 'string') {
        return createVirtualMock(toMock);
    }
    if (typeof toMock === 'function') {
        return createClassOrFunctionMock(toMock as AnyFunction);
    }
    return createBackedMock(toMock);
}

/**
 * Shorthand for `instance(mock<T>())`.
 * 
 * Useful when you need an object but you don't expect it to be used.
 */
export function mockInstance<T>(name?: string, config?: (m: Mock<T>) => void): T;
export function mockInstance<T extends AnyFunction>(backing: T, config?: (m: Mock<T>) => void): T;
export function mockInstance<T extends object>(backing: Partial<T>, config?: (m: Mock<T>) => void): T;
export function mockInstance<T extends AnyFunction | object>(
        backingOrName: string | Partial<T> | undefined, config?: (m: Mock<T>) => void): T {
    const builder = mock<T>((backingOrName || {}) as T);
    if (config) {
        config(builder);
    }
    return instance(builder);
}

/**
 * Wrap a call or a member access on a mock to set expectations.
 * 
 * @example
 * 
 * ```
 * const mockedFoo = mock(Foo)
 * 
 * // Mock the return value of a function
 * when(mockedFoo.getMessage()).return('some message')
 * 
 * // Call a fake function when the method is invoked
 * when(mockedFoo.getMessage()).call(() => 'some message')
 * 
 * // Return a fake value when a member is accessed
 * when(mockedFoo.getMessage).useValue(() => 'someMessage')
 * ```
 */
export function when<T extends Recording<any>>(t: T): ExpectationSetter<T>;
export function when(t: object): 
        OmniMockError<'`when` needs to be invoked on a mock. Did you forget to `mock()` your object?'>;
export function when<T extends Recording<any>>(t: object):
        ExpectationSetter<T> |
        OmniMockError<'`when` needs to be invoked on a mock. Did you forget to `mock()` your object?'> {

    if (!hasMetadata<RECORDING_METADATA_KEY, GetMetadata<RECORDING_METADATA_KEY, UnknownRecording>>(t, 'recording')) {
        throw new Error('`when` needs to be invoked on a mock. Did you forget to `mock()` your object?');
    }
    return createExpectationSetter(t);
}

/**
 * Returns the proxy instance controlled by this mock.
 */
export function instance<T>(t: Mock<T>): T {
    return getMockInstance(t);
}

/**
 * Checks that all expected calls were received.
 * 
 * Throws an error if any expected call was not received.
 */
export function verify(t: Mock<unknown>): void {
    return verifyMock(t);
}

/**
 * Resets all expected calls on this mock.
 */
export function reset(t: Mock<unknown>): void {
    return resetMock(t);
}

/**
 * Return a string representing all assertions set on this mock.
 * 
 * Use only for debugging purposes. The format of this string may change without notice.
 */
export function debug(t: Mock<unknown>): string {
    return debugMock(t);
}
