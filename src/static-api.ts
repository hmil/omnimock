/*
 * Top-level API
 */
import { AnyFunction, ConstructorType } from './base-types';
import { OmniMockError } from './error';
import { GetMetadata, hasMetadata } from './metadata';
import {
    createBackedMock,
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
 * Manually create a mock.
 * 
 * The `mock` function should be preferred as it provides a lean interface to create mocks for
 * the most common use cases.
 * Only use this function for edge cases where the `mock` function is not sufficient.
 */
export function createMock<T extends object | AnyFunction>(name: string, cfg?: {
    prototype?: any,
    backing?: Partial<T> | T
}): Mock<T> {
    const config = cfg == null ? {} : cfg;
    const prototype = config.prototype == null ? null : config.prototype;
    if (config.backing !== undefined) {
        return createBackedMock<T>(name, config.backing, prototype || config.backing.constructor.prototype);
    }

    return createVirtualMock<T>(name, prototype);
}

/**
 * Creates a mock for a class, an interface or an object instance.
 * 
 * Remember to use `instance()` before feeding your mock to your tested code.
 * 
 * @example
 * 
 * ```
 * // Create a virtual mock
 * mock<SomeType>('someTypeMock')
 * 
 * // Create a backed mock of a class
 * mock('myClassMock', new MyClass());
 * 
 * // Create a backed mock from a partial object definition
 * mock<MyObjectType>('myObject', {
 *     foo: 'bar'
 * });
 * 
 * // Create a backed mock from a constructor and partial definition (supports instanceof)
 * mock(MyObjectClass, {
 *     foo: 'bar'
 * });
 * 
 * // Create a backed mock of a function
 * mock('myFunction', (s: string) => s.charCodeAt(1));
 * 
 * // Creates a virtual mock with the name and type inferred from a constructor
 * // Warning: Does not work with abstract classes and interfaces!
 * mock(SomeClass)
 * ```
 */
export function mock<T>(name: string): Mock<T>;                                     // 1
export function mock<T>(ctr: ConstructorType<T>, backing?: Partial<T>): Mock<T>;    // 2
export function mock<T extends AnyFunction>(name: string, backing: T): Mock<T>;     // 3
export function mock<T extends object>(name: string, backing: Partial<T>): Mock<T>; // 4
export function mock<T extends AnyFunction | object>(
        nameOrTarget: string | ConstructorType<T>, 
        backing?: Partial<T> | T
): Mock<T> {
    const name = (typeof nameOrTarget !== 'string') ? nameOrTarget.name || 'anonymous class' : nameOrTarget;
    if (typeof nameOrTarget === 'function') { // constructor-based mock (form 2)
        return createMock<T>(name, { prototype: nameOrTarget.prototype, backing });
    }
    if (backing !== undefined) { // Named backed mock (form 3 or 4)
        const prototype = typeof backing === 'function' ? backing.prototype : backing.constructor.prototype;
        return createMock<T>(name, { backing, prototype });
    }
    return createMock<T>(name); // Named virtual mock (form 1)
}

/**
 * Shorthand for `instance(mock<T>())`.
 * 
 * Useful when you need an object but you don't expect it to be used.
 */
export function mockInstance<T>(name: string): T;
export function mockInstance<T>(ctr: ConstructorType<T>, backing?: Partial<T>, config?: (m: Mock<T>) => void): T;
export function mockInstance<T extends AnyFunction>(name: string, backing: T, config?: (m: Mock<T>) => void): T;
export function mockInstance<T extends object>(name: string, backing: Partial<T>, config?: (m: Mock<T>) => void): T;
export function mockInstance<T extends AnyFunction | object>(
        nameOrTarget: string | ConstructorType<T> | T, 
        backing?: Partial<T> | T, 
        config?: (m: Mock<T>) => void): T {
    // TypeScript has a hard time following here with all the overloads.
    const builder = mock<T>(nameOrTarget as string, backing as T);
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
