/*
 * Top-level API
 */
import { ConstructorType, NotAConstructorType, AnyFunction } from './base-types';
import { TsMockError } from './error';
import { Mock, mockClass, mockInterface, mockObject, getMockInstance, verifyMock, resetMock } from './mocks';
import { Recording, UnknownRecording, RECORDING_METADATA_KEY } from './recording';
import { hasMetadata, GetMetadata } from './metadata';
import { createExpectationSetter, ExpectationSetter } from './plugin-api';


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
export function mock<T extends ConstructorType<any>>(constructor: T, ...args: ConstructorParameters<T>): Mock<InstanceType<T>>;
export function mock<T extends AnyFunction>(name?: string): Mock<T>;
export function mock<T>(inst: NotAConstructorType<
        T extends AnyFunction ? TsMockError<'This function is not a constructor. Use a virtual mock to mock a function.'> : T, 
        TsMockError<'You need to pass additional parameters after the constructor like this: `mock(Ctr, ...args)`. Missing parameters:' & (T extends ConstructorType<any> ? ConstructorParameters<T> : never)>>
    ): Mock<T>;
export function mock<T extends object>(toMock: string | ConstructorType<any> | T | undefined, ...args: unknown[]): Mock<T> {
    if (toMock == undefined) {
        toMock = 'stub';
    }
    if (typeof toMock === 'function') {
        return mockClass(toMock as { new (...args: any[]): T }, args);
    }
    if (typeof toMock === 'string') {
        return mockInterface(toMock);
    }
    return mockObject(toMock);
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
export function when(t: object): TsMockError<'`when` needs to be invoked on a mock. Did you forget to `mock()` your object?'>;
export function when<T extends Recording<any>>(t: object): ExpectationSetter<T> | TsMockError<'`when` needs to be invoked on a mock. Did you forget to `mock()` your object?'> {
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