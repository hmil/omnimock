/*
 * Top-level API
 */

import { getMetadata } from './metadata';
import { TsMockError } from './error';
import { RecordedCall, RecordedGetter } from './recording';
import { CallExpectation, GetterExpectation, createExpectation, AnyExpectation } from './expectations';
import { ConstructorType } from './base-types';
import { Mock, mockClass, mockInterface, mockObject } from './mocks';

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
export function mock<T extends ConstructorType>(constructor: T, ...args: ConstructorParameters<T>): Mock<InstanceType<T>>;
export function mock<T extends object>(inst: T): Mock<T>;
export function mock<T extends object>(toMock: string | ConstructorType | T | undefined, ...args: unknown[]): Mock<T> {
    if (toMock == undefined) {
        toMock = 'stub';
    }
    if (typeof toMock === 'function') {
        return mockClass(toMock as ConstructorType, args);
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
export function when<T extends RecordedGetter<any>>(t: T): T extends RecordedGetter<infer U> ? GetterExpectation<U> : never;
export function when<T extends RecordedCall<any[], any>>(t: T): T extends RecordedCall<infer Args, infer Ret> ? CallExpectation<Args, Ret> : never;
export function when(t: unknown): TsMockError<'`when` needs to be invoked on a mock. Did you forget to `mock()` your object?'>;
export function when(t: any): AnyExpectation | TsMockError<'`when` needs to be invoked on a mock. Did you forget to `mock()` your object?'> {
    return createExpectation(t);
}

/**
 * Returns the proxy instance controlled by this mock.
 */
export function instance<T>(t: Mock<T>): T {
    return getMetadata(t);
}
