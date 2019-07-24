import { AnyFunction, ConstructorType, FnType } from './base-types';
import { getMetadata, METADATA_KEY, setMetadata, WithMetadata } from './metadata';
import { GetterRecording, Recording, RecordingMetadata, RecordingType } from './recording';
import { MockExpectations, ExpectationsRegistry } from './expectations';

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
/**
 * Creates a class with a dynamic name.
 */
function createClassWithName<T>(name: string): { new (...args: any[]): T } {
    return { [name]: class{} }[name] as ConstructorType<T>;
}

const FILTERED_PROPS = Object.getOwnPropertyNames(Object.prototype);

function instanceProxyHandlerFactory(
        getOriginalTarget: () => unknown,
        getOriginalContext: () => object | undefined,
        originalConstructor: Function | undefined,
        expectedMemberAccess: Map<string, MockExpectations<unknown[], unknown>>,
        expectedCalls: MockExpectations<unknown[], unknown>
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
                throw new Error(`Unexpected method call: TODO better error message!`);
            }
            return result.result;
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
                            args: [],
                            context: target,
                            getOriginalContext: getOriginalTarget as () => object,
                            getOriginalTarget: getOriginal
                        });
                        if (!('error' in result)) {
                            return result.result;
                        }
                    }
                    throw new Error(`Unexpected property access: ${(originalConstructor || Object).name}.${prop}`);
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
    expectations: MockExpectations<unknown[], unknown>;

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
    args: unknown[];
}

/**
 * Mocks the next member or function call in a chain.
 */
function mockNext<T>(params: MockParams, maybeStub?: any): ChainableMock<T> & GetterRecording {

    const stub = maybeStub == null ? createVirtualMockStub<ChainableMock<T> & GetterRecording>('${target}.${prop}') as any : maybeStub;

    function materializeChain() {
        params.expectations.addExpectation(
            params.args,
            (runtime) => {
                const stub = createFunctionWithName('virtual mock');
                return new Proxy(stub as object, instanceProxyHandlerFactory(
                        runtime.getOriginalTarget,
                        runtime.getOriginalContext,
                        params.originalConstructor,
                        expectedMemberAccess,
                        expectedCalls));
            });
        params.materializeChain();
    }

    function createExpectations(path: string, isGetter: boolean): MockExpectations<unknown[], unknown> {
        const expectations = new MockExpectations<unknown[], unknown>(path, isGetter);
        params.registry.addExpectations(expectations);
        return expectations;
    }

    const expectedMemberAccess: Map<string, MockExpectations<unknown[], unknown>> = new Map();
    const expectedCalls: MockExpectations<unknown[], unknown> = createExpectations(params.mockPath, false);

    function getOrCreateExpectations(prop: string) {
        let expectations = expectedMemberAccess.get(prop);
        if (expectations != null) {
            return expectations;
        }
        expectations = createExpectations(params.mockPath + humanReadableObjectPropertyAccess(prop), true);
        expectedMemberAccess.set(prop, expectations);
        return expectations;
    };

    const recordingMetadata: RecordingMetadata<RecordingType, unknown[], unknown> = {
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
            return mockNext({
                recordingType: 'call',
                expectations: expectedCalls,
                materializeChain: materializeChain,
                originalConstructor: target.constructor, // "target" can only be a function here so it must have a constructor
                mockPath: params.mockPath + `(${(argArray || []).map(a => `${a}`).join(', ')})`,
                registry: params.registry,
                args: argArray || [],
            });
        },
        get(target: ChainableMock<T>, prop: PropertyKey, receiver: unknown): Map<string, any> | ChainableMock<unknown> {
            if (typeof prop !== 'string') {
                return Reflect.get(target, prop, receiver);
            }
            if (prop === METADATA_KEY) {
                return Reflect.get(stub, METADATA_KEY, receiver);
            }

            return mockNext({
                recordingType: 'getter',
                expectations: getOrCreateExpectations(prop),
                materializeChain: materializeChain,
                originalConstructor: Object,
                mockPath: params.mockPath + humanReadableObjectPropertyAccess(prop),
                registry: params.registry,
                args: []
            });
        }
    };

    return new Proxy(stub, handler);
}

const IDENTIFIER_RX = /^[$A-Z_][0-9A-Z_$]*$/i;
function humanReadableObjectPropertyAccess(name: string) {
    if (IDENTIFIER_RX.test(name)) {
        return `.${name}`;
    }
    return `['${name}']`;
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
    const stub = createVirtualMockStub<ChainableMock<T> & GetterRecording & WithMetadata<MOCK_METADATA_KEY, MockMetadata<T>>>('root');
    setMetadata(stub, 'mock', mockMetadata);

    const firstMock = mockNext<T>({
        recordingType: 'call',
        expectations: new MockExpectations(originalConstructor.name, false),
        materializeChain: () => {},
        originalConstructor,
        mockPath: originalConstructor.name,
        registry: registry,
        args: []
    }, stub);

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

export function mockClass<T extends ConstructorType<any>>(klass: T, params: ConstructorParameters<T>): Mock<InstanceType<T>> {
    const toMock = instantiate(klass, params);
    return mockFirst(toMock, klass);
}

export function mockInterface<T extends object>(name: string): Mock<T> {
    const klass = createClassWithName<T>(name);
    const toMock = instantiate(klass, []);
    return mockFirst(toMock, klass);
}

export function mockObject<T extends object>(toMock: T): Mock<T> {
    return mockFirst(toMock, toMock.constructor);
}
