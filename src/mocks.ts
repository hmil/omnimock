import { AnyFunction, ConstructorType, FnType } from './base-types';
import { ExpectationsRegistry, MockExpectations } from './expectations';
import { formatArgArray, humanReadableObjectPropertyAccess } from './formatting';
import { Matcher } from './matcher';
import { jsonEq, match } from './matchers';
import { getMetadata, METADATA_KEY, setMetadata, WithMetadata } from './metadata';
import { GetterRecording, Recording, RecordingMetadata, RecordingType } from './recording';

export const MOCK_METADATA_KEY = 'mock';
export type MOCK_METADATA_KEY = typeof MOCK_METADATA_KEY;

/**
 * Creates a class with a dynamic name.
 */
function createClassWithName<T>(name: string) {
    return { [name]: class { } }[name] as ConstructorType<T>;
}

const FILTERED_PROPS = Object.getOwnPropertyNames(Object.prototype);

function instanceProxyHandlerFactory(
        getOriginalTarget: () => unknown,
        getOriginalContext: () => object | undefined,
        originalConstructor: AnyFunction | undefined,
        expectedMemberAccess: Map<string, MockExpectations<unknown[] | undefined, unknown>>,
        expectedCalls: MockExpectations<unknown[] | undefined, unknown>
): ProxyHandler<any> {
    return {
        getPrototypeOf(target: AnyFunction) {
            if (originalConstructor != null && originalConstructor.prototype != null) {
                return originalConstructor.prototype;
            } else {
                return Reflect.getPrototypeOf(target);
            }
        },

        apply(_target: AnyFunction, thisArg: object, argArray?: unknown[]): any {
            function getOriginal() {
                const originalTarget = getOriginalTarget();
                try {
                    return Reflect.apply(originalTarget as AnyFunction, getOriginalContext(), argArray || []);
                } catch (e) {
                    throw new Error(`Cannot call ${originalTarget}.\nReason: ${e}`);
                }
            }
            const result = expectedCalls.handle({
                args: argArray || [],
                context: thisArg,
                getOriginalContext: getOriginalTarget as () => object,
                getOriginalTarget: getOriginal
            });
            if ('error' in result) {
                throw new Error(`Unexpected method call: ${expectedCalls.path}(${formatArgArray(argArray)})`);
            }
            return result.result;
        },

        ownKeys(_target): PropertyKey[] {
            return Reflect.ownKeys(getOriginalTarget() as object).filter(k => k !== METADATA_KEY);
        },

        getOwnPropertyDescriptor(target, prop): PropertyDescriptor | undefined {
            if (prop === METADATA_KEY) {
                return {
                    configurable: false,
                    enumerable: false,
                    value: null,
                    writable: false,
                };
            }
            return Reflect.getOwnPropertyDescriptor(target, prop);
        },

        get(target: object, prop: PropertyKey, receiver: unknown) {
            function getOriginal() {
                const originalTarget = getOriginalTarget();
                try {
                    return Reflect.get(originalTarget as object, prop, receiver);
                } catch (e) {
                    throw new Error(`Cannot read property ${String(prop)} on object ${originalTarget}.\nReason: ${e}`);
                }
            }
            if (prop === 'constructor') {
                return originalConstructor;
            }
            if (typeof prop === 'string') {
                if (FILTERED_PROPS.indexOf(prop) < 0) {
                    const answer = expectedMemberAccess.get(prop);
                    if (answer != null) {
                        const result = answer.handle({
                            args: undefined,
                            context: target,
                            getOriginalContext: getOriginalTarget as () => object,
                            getOriginalTarget: getOriginal
                        });
                        if (!('error' in result)) {
                            return result.result;
                        }
                    }
                    throw new Error(`Unexpected property access: ${expectedCalls.path}.${prop}`);
                }
            }
            return getOriginal(); 
        }
    };
}

export interface MockMetadata<T> {
    expectationsRegistry: ExpectationsRegistry;
    getInstance(): T;
}

type ChainableMock<T> = MethodMock<T> & ObjectMock<T>;
type MethodMock<T> = T extends FnType<infer Args, infer Ret> ? (
    (...args: Args) =>  ChainableMock<Ret> &
                        Recording<RecordingMetadata<'call', Args, Ret>>
) : {};
type ObjectMock<T> = {
    [K in keyof T]: ChainableMock<T[K]> &
                    Recording<RecordingMetadata<'getter', [], T[K]>>
};

export type Mock<T> = WithMetadata<MOCK_METADATA_KEY, MockMetadata<T>> & ObjectMock<T> & MethodMock<T>;

function createVirtualMockStub<T>(name: string): T {
    return createClassWithName<T>(
            `${name}; If you are seeing this then most likely you forgot to use instance()`) as any;
}

interface MockParams {
    /**
     * Type of this recording. This is just a convenience for expectation setter plugins.
     */
    recordingType: RecordingType;

    /**
     * Expectations for the current symbol.
     */
    expectations: MockExpectations<unknown[] | undefined, unknown>;

    /**
     * Cause the current chain to become visible on the mock instance.
     */
    materializeChain: () => void;

    /**
     * Constructor of the original object.
     */
    originalConstructor: AnyFunction;

    /**
     * Human readable JavaScript-like object notation representing where the current mock can be found
     */
    mockPath: string;

    /**
     * Contains all expectations set throughout the whole mock
     */
    registry: ExpectationsRegistry;

    /**
     * The arguments (or argument matchers) passed to this mocked call.
     */
    args: unknown[] | undefined;
}

/**
 * Mocks the next member or function call in a chain.
 */
function mockNext<T>(params: MockParams, maybeStub?: any): ChainableMock<T> & GetterRecording {

    const stub = maybeStub == null ?
            createVirtualMockStub<ChainableMock<T> & GetterRecording>(params.mockPath) as any :
            maybeStub;

    function materializeChain() {
        params.expectations.addExpectation(params.args, runtime => {
            return new Proxy(stub as object, instanceProxyHandlerFactory(
                    runtime.getOriginalTarget,
                    runtime.getOriginalContext,
                    params.originalConstructor,
                    expectedMemberAccess,
                    expectedCalls));
        });
        params.materializeChain();
    }

    function createExpectations(path: string): MockExpectations<unknown[] | undefined, unknown> {
        const expectations = new MockExpectations<unknown[] | undefined, unknown>(path);
        params.registry.addExpectations(expectations);
        return expectations;
    }

    const expectedMemberAccess: Map<string, MockExpectations<unknown[] | undefined, unknown>> = new Map();
    const expectedCalls: MockExpectations<unknown[] | undefined, unknown> = createExpectations(params.mockPath);
    const mockCache = new ChainingMockCache();

    function getOrCreateExpectations(prop: string) {
        let expectations = expectedMemberAccess.get(prop);
        if (expectations != null) {
            return expectations;
        }
        expectations = createExpectations(params.mockPath + humanReadableObjectPropertyAccess(prop));
        expectedMemberAccess.set(prop, expectations);
        return expectations;
    }

    const recordingMetadata: RecordingMetadata<RecordingType, unknown[] | undefined, unknown> = {
        expectations: params.expectations,
        args: params.args,
        ret: {} as any, // TODO
        type: params.recordingType,
        // TODO: This is just a temporary hack to allow bootstrapping the chain. Figure out a cleaner way
        expect: (maybeStub != null) ? materializeChain : params.materializeChain
    };

    setMetadata(stub, 'recording', recordingMetadata);

    const handler: ProxyHandler<ChainableMock<T> & GetterRecording> = {
        apply(target: ChainableMock<T>, _thisArg: ChainableMock<T>, argArray?: unknown[]): ChainableMock<unknown> {
            const args = argArray || [];
            return mockCache.getOrElse(args, () => mockNext({
                recordingType: 'call',
                expectations: expectedCalls,
                materializeChain,
                // "target" can only be a function here so it must have a constructor
                originalConstructor: target.constructor as AnyFunction,
                mockPath: params.mockPath + `(${formatArgArray(argArray)})`, // TODO: Factor out params formatting
                registry: params.registry,
                args
            }));
        },
        get(target: ChainableMock<T>, prop: PropertyKey, receiver: unknown): Map<string, any> | ChainableMock<unknown> {
            if (typeof prop !== 'string') {
                return Reflect.get(target, prop, receiver);
            }
            if (prop === METADATA_KEY) {
                return Reflect.get(stub, METADATA_KEY, receiver);
            }

            // For property access, you want to store the already produced mocks 
            return mockCache.getOrElse(prop, () => {
                if (!(prop in stub)) {
                    stub[prop] = undefined; // make sure the key is enumerable on the stub
                }
                return mockNext({
                    recordingType: 'getter',
                    expectations: getOrCreateExpectations(prop),
                    materializeChain,
                    originalConstructor: Object,
                    mockPath: params.mockPath + humanReadableObjectPropertyAccess(prop),
                    registry: params.registry,
                    args: undefined
                });
            });
        }
    };

    return new Proxy(stub, handler);
}

function mockFirst<T extends object>(backingInstance: T, originalConstructor: AnyFunction): Mock<T> {

    const registry = new ExpectationsRegistry();

    const mockMetadata: MockMetadata<unknown> = {
        getInstance() {
            const res = fmMetadata.expectations.handle({
                args: [],
                context: undefined,
                getOriginalContext: () => undefined,
                getOriginalTarget: () => backingInstance
            });
            if ('error' in res) {
                throw new Error(res.error);
            }
            return res.result;
        },
        expectationsRegistry: registry
    };
    setMetadata(backingInstance as WithMetadata<'mock', MockMetadata<T>>, 'mock', mockMetadata);

    const firstMock = mockNext<T>({
        recordingType: 'call',
        expectations: new MockExpectations(originalConstructor.name),
        materializeChain: () => { /* noop */ },
        originalConstructor,
        mockPath: originalConstructor.name,
        registry,
        args: []
    }, backingInstance);

    const fmMetadata = getMetadata(firstMock, 'recording');
    fmMetadata.expect();

    return firstMock as any as Mock<T>;
}

export function getMockInstance<T>(mock: WithMetadata<MOCK_METADATA_KEY, MockMetadata<T>>): T {
    return getMetadata(mock, 'mock').getInstance();
}

export function verifyMock(mock: Mock<any>): void {
    getMetadata(mock, 'mock').expectationsRegistry.verify();
}

export function resetMock(mock: Mock<any>): void {
    // TODO: Also clear the internal state of the expectation setter
    getMetadata(mock, 'mock').expectationsRegistry.reset();
}

export function debugMock(mock: Mock<any>): string {
    return getMetadata(mock, 'mock').expectationsRegistry.toString();
}

export function createVirtualMock<T extends object>(name: string): Mock<T> {
    const toMock = createClassWithName<T>(`<${name}>`);
    return mockFirst<T>(toMock as T, toMock as any as AnyFunction);
}

export function createClassOrFunctionMock<T extends object>(ctrOrFn: ConstructorType<T> | AnyFunction): Mock<T> {
    // When `mock` is invoked with a function, either the user is trying to create a virtual mock of a class
    // or he's trying to create a backed mock of a function.
    return mockFirst<T>(ctrOrFn as T, ctrOrFn as AnyFunction);
}

export function createBackedMock<T extends object | AnyFunction>(toMock: T): Mock<T> {
    return mockFirst(toMock, toMock.constructor as AnyFunction);
}


// TODO: move this to its own file

type KeyType = string | unknown[]; // Key is either a property name or an argument array
type ValueType = ChainableMock<unknown>;

/**
 * This very usage-specific cache is meant only to cache expectations for the purpose of automatic chaining.
 * It will not behave like you'd expect a generic cache to behave.
 */
export class ChainingMockCache {

    private data: Array<{ key: Matcher<KeyType>, value: ValueType}> = [];

    public getOrElse(key: KeyType, ifAbsent: () => ValueType): ValueType {
        for (const entry of this.data) {
            if (match(entry.key, key) === true) {
                return entry.value;
            }
        }

        const value = ifAbsent();
        this.data.push({ key: jsonEq(key), value });

        return value;
    }
}
