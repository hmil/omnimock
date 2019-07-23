import { AnyFunction, ConstructorType, FnType } from './base-types';
import { getMetadata, METADATA_KEY, setMetadata, WithMetadata } from './metadata';
import { Expectation, GetterRecording, Recording, RecordingMetadata, RecordingType, RECORDING_METADATA_KEY, isGetterRecording } from './recording';

export const MOCK_METADATA_KEY = 'mock';
export type MOCK_METADATA_KEY = typeof MOCK_METADATA_KEY;

interface MockMethod<Ctx, Args extends unknown[], Ret> {
    (...args: Args): Recording<RecordingMetadata<'call', Ctx, Args, Ret>> & MockMember<Ret, undefined>;
}

type MockMember<T, Ctx> = T extends FnType<infer Args, infer Ret> ? MockMethod<Ctx, Args, Ret> : MockObject<T, undefined>;

type MockObject<T, Inst> = Inst extends undefined ? 
    { [K in keyof T]: Recording<RecordingMetadata<'getter', Inst, unknown[], T[K]>> & MockMember<T[K], Inst> } :
    { [K in keyof Inst]: Recording<RecordingMetadata<'getter', Inst, unknown[], Inst[K]>> & MockMember<Inst[K], Inst> };

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
        expectedMemberAccess: Map<string, Expectation<unknown>[]>,
        expectedCalls: Expectation<unknown>[]
): ProxyHandler<any> {
    return {
        getPrototypeOf(target: any) {
            if (originalConstructor != null) {
                return originalConstructor.prototype;
            } else {
                return target.getPrototypeOf();
            }
        },

        apply(target: AnyFunction, thisArg: object, argArray?: unknown[]): any {
            function getOriginal() {
                const originalTarget = getOriginalTarget();
                try {
                    return Reflect.apply(originalTarget as AnyFunction, getOriginalContext(), argArray || []);
                } catch (e) {
                    throw new Error(`Cannot call ${originalTarget}.\nReason: ${e}`);
                }
            }
            if (expectedCalls.length > 0) {
                return expectedCalls[0](getOriginalTarget as () => object, getOriginal, thisArg, argArray || []);
            } else {
                throw new Error(`Unexpected method call: TODO better error message!`);
            }
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
                    if (answer != null && answer.length > 0) {
                        return answer[0](getOriginalTarget as () => object, getOriginal, target, []);
                    } else {
                        throw new Error(`Unexpected property access: ${(originalConstructor || Object).name}.${prop}`);
                    }
                }
            }
            return getOriginal(); 
        }
    };
}

interface MockMetadata2<T> {
    getInstance(): T;
}

type ChainableMock<T, Inst> = MethodMock<T, Inst> & ObjectMock<T, Inst>;
type MethodMock<T, Inst> = T extends FnType<infer Args, infer Ret> ? (
    (...args: Args) =>  ChainableMock<Ret, Inst> &
                        Recording<RecordingMetadata<'call', Inst, Args, Ret>>
) : {};
type ObjectMock<T, Inst> = {
    [K in keyof T]: ChainableMock<T[K], Inst> &
                    Recording<RecordingMetadata<'getter', Inst, [], T[K]>>
};

type _Mock<T, Inst> = WithMetadata<MOCK_METADATA_KEY, MockMetadata2<T>> & ObjectMock<T, Inst>;
export type Mock<T> = _Mock<T, undefined>;
export type InstanceBackedMock<T> = _Mock<T, T>;

function createVirtualMockStub<T>(name: string): T {
    return createFunctionWithName(`${name}; If you are seeing this then most likely you passed someMock directly instead of instance(someMock)`) as any;
}

interface MockParams<T> {
    /**
     * Type of this recording. This is just a convenience for expectation setter plugins.
     */
    recordingType: RecordingType;

    /**
     * Expectations for the current symbol.
     */
    expectations: Expectation<T>[];

    /**
     * Cause the current chain to become visible on the mock instance.
     */
    materializeChain: () => void;

    originalConstructor: Function;
}

/**
 * Mocks the next member or function call in a chain.
 */
function mockNext<T>(params: MockParams<T>, maybeStub?: any): ChainableMock<T, unknown> & GetterRecording {

    const stub = maybeStub == null ? createVirtualMockStub<ChainableMock<T, unknown> & GetterRecording>('${target}.${prop}') as any : maybeStub;

    function materializeChain() {
        params.expectations[0] = (getOriginalContext, getOriginal) => {
            const stub = createFunctionWithName('virtual mock');
            return new Proxy(stub as object,
                    instanceProxyHandlerFactory(
                        getOriginal,
                        getOriginalContext,
                        params.originalConstructor,
                        expectedMemberAccess,
                        expectedCalls));
        };
        params.materializeChain();
    }

    const expectedMemberAccess: Map<string, Array<Expectation<unknown>>> = new Map();
    const expectedCalls: Array<Expectation<unknown>> = [];

    function getOrCreateExpectations(prop: string) {
        let expectations = expectedMemberAccess.get(prop);
        if (expectations != null) {
            return expectations;
        }
        expectations = [] as AnyFunction[];
        expectedMemberAccess.set(prop, expectations);
        return expectations;
    };

    const recordingMetadata: RecordingMetadata<RecordingType, T, unknown[], unknown> = {
        expectations: params.expectations,
        args: [] as any[], // TODO
        ret: {} as any, // TODO
        type: params.recordingType,
        expect: materializeChain
    };

    setMetadata(stub, 'recording', recordingMetadata);

    const handler: ProxyHandler<ChainableMock<T, unknown> & GetterRecording> = {
        apply(target: ChainableMock<T, unknown>, thisArg: ChainableMock<T, unknown>, argArray?: unknown[]): ChainableMock<unknown, unknown> {
            return mockNext({
                recordingType: 'call',
                expectations: expectedCalls,
                materializeChain: materializeChain,
                originalConstructor: target.constructor, // "target" can only be a function here so it must have a constructor
            });
        },
        get(target: ChainableMock<T, unknown>, prop: PropertyKey, receiver: unknown): Map<string, any> | ChainableMock<unknown, unknown> {
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
            });
        }
    };

    return new Proxy(stub, handler);
}

function mockFirst<T extends object>(backingInstance: T, originalConstructor: Function): Mock<T> {
    const mockMetadata: MockMetadata2<unknown> = {
        getInstance() {
            return fmMetadata.expectations[0](() => undefined, () => backingInstance, undefined, []);
        }
    };
    const stub = createVirtualMockStub<ChainableMock<T, unknown> & GetterRecording & WithMetadata<MOCK_METADATA_KEY, MockMetadata2<T>>>('root');
    setMetadata(stub, 'mock', mockMetadata);

    const firstMock = mockNext({
        recordingType: 'call',
        expectations: [],
        materializeChain: () => {},
        originalConstructor
    }, stub);

    const fmMetadata = getMetadata<RECORDING_METADATA_KEY, RecordingMetadata<RecordingType, T, unknown[], unknown>>(firstMock, 'recording');
    fmMetadata.expect();

    return firstMock as any as Mock<T>;
}

export function getMockInstance<T>(mock: Mock<T>): T {
    return getMetadata(mock, 'mock').getInstance();
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
