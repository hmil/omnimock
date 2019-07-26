import { AnyFunction, ConstructorType, FnType } from './base-types';
import { getMetadata, METADATA_KEY, setMetadata, WithMetadata } from './metadata';
import { GetterRecording, Recording, RecordingMetadata, RecordingType } from './recording';
import { MockExpectations, ExpectationsRegistry } from './expectations';
import { formatArgArray, humanReadableObjectPropertyAccess } from './formatting';
import { Matcher, match, jsonEq } from './matchers';

export const MOCK_METADATA_KEY = 'mock';
export type MOCK_METADATA_KEY = typeof MOCK_METADATA_KEY;

export function instantiate<T extends ConstructorType<any>>(klass: T, params: ConstructorParameters<T>): InstanceType<T> {
    class Ctr extends klass {
    }
    return new Ctr(...params);
}

/**
 * Creates a function with a dynamic name.
 */
function createFunctionWithName(name: string) {
    return { [name](){} }[name];
}

const FILTERED_PROPS = Object.getOwnPropertyNames(Object.prototype);

function instanceProxyHandlerFactory(
        getOriginalTarget: () => unknown,
        getOriginalContext: () => object | undefined,
        originalConstructor: Function | undefined,
        expectedMemberAccess: Map<string, MockExpectations<unknown[] | undefined, unknown>>,
        expectedCalls: MockExpectations<unknown[] | undefined, unknown>
): ProxyHandler<any> {
    return {
        getPrototypeOf(target: any) {
            if (originalConstructor != null) {
                return originalConstructor.prototype;
            } else {
                return target.getPrototypeOf();
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
            return Reflect.ownKeys(getOriginalTarget() as object).filter((k) => k !== METADATA_KEY);
        },

        getOwnPropertyDescriptor: function(target, prop): PropertyDescriptor | undefined {
            if (prop === METADATA_KEY) {
                return {
                    configurable: false,
                    enumerable: false,
                    value: null,
                    writable: false,
                }
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
    getInstance(): T;
    expectationsRegistry: ExpectationsRegistry
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
    return createFunctionWithName(`${name}; If you are seeing this then most likely you passed someMock directly instead of instance(someMock)`) as any;
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
    originalConstructor: Function;

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

    const stub = maybeStub == null ? createVirtualMockStub<ChainableMock<T> & GetterRecording>(params.mockPath) as any : maybeStub;


    function materializeChain() {
        params.expectations.addExpectation(
            params.args,
            (runtime) => {
                // const stub = createFunctionWithName('chain');
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
    };

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
                materializeChain: materializeChain,
                originalConstructor: target.constructor, // "target" can only be a function here so it must have a constructor
                mockPath: params.mockPath + `(${formatArgArray(argArray)})`, // TODO: Factor out params formatting
                registry: params.registry,
                args: args
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
                    materializeChain: materializeChain,
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

function mockFirst<T extends object>(backingInstance: T, originalConstructor: Function): Mock<T> {

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
    // const stub = createVirtualMockStub<ChainableMock<T> & GetterRecording & WithMetadata<MOCK_METADATA_KEY, MockMetadata<T>>>('root');
    setMetadata(backingInstance as WithMetadata<'mock', MockMetadata<T>>, 'mock', mockMetadata);

    const firstMock = mockNext<T>({
        recordingType: 'call',
        expectations: new MockExpectations(originalConstructor.name),
        materializeChain: () => {},
        originalConstructor,
        mockPath: originalConstructor.name,
        registry: registry,
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
    getMetadata(mock, 'mock').expectationsRegistry.reset();
}

export function debugMock(mock: Mock<any>): string {
    return getMetadata(mock, 'mock').expectationsRegistry.toString();
}

export function createVirtualMock<T extends object>(name: string): Mock<T> {
    const toMock = createFunctionWithName(name) as T;
    return mockFirst(toMock, toMock.constructor);
}

export function createBackedMock<T extends object | AnyFunction>(toMock: T): Mock<T> {
    return mockFirst(toMock, toMock.constructor);
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
