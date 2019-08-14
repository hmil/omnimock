import { AnyFunction, FnType } from './base-types';
import { isFailure, RuntimeContext } from './behavior/Behavior';
import { MockBehaviors } from './behavior/MockExpectations';
import { reportFunctionCallError, reportMemberAccessError } from './behavior/reporters';
import { ChainingMockCache } from './ChainableMockCache';
import { formatArgArray, formatPropertyAccess, makeConstructorPath } from './formatting';
import { lazySingleton, undefinedOr } from './fp-utils';
import { getMetadata, METADATA_KEY } from './metadata';
import { Recording, RECORDING_METADATA_KEY, RecordingMetadata, RecordingType } from './recording';

const constructorCacheKey = Symbol('constructor');
const FILTERED_PROPS = ['toJSON', ...Object.getOwnPropertyNames(Object.prototype)];

function createProxyStub<T>(): T {
    return function virtualStub() {
        throw new Error('Error: attempted to invoke a stub! This should not happen.' +
        'Please report a bug at https://github.com/hmil/omnimock');
    } as any;
}

type ChainableMock<T> = MethodMock<T> & ObjectMock<T> & CtrMock<T>;
type MethodMock<T> = T extends FnType<infer Args, infer Ret> ? (
    (...args: Args) =>  ChainableMock<Ret> &
                        Recording<RecordingMetadata<'call', Args, Ret>>
) : {};
type CtrMock<T> = T extends new (...args: infer Args) => infer Inst ? (
    new (...args: Args) => ChainableMock<Inst> & Recording<RecordingMetadata<'call', Args, Inst>>
) : {};
type ObjectMock<T> = {
    [K in keyof T]: ChainableMock<T[K]> &
                    Recording<RecordingMetadata<'getter', [], T[K]>>
};

export type Mock<T> =   Recording<RecordingMetadata<RecordingType, any[], T>> &
                        ChainableMock<T>;

interface MockParameters<T extends object> {
    /**
     * Type of this recording. This is just a convenience for expectation setter plugins.
     */
    recordingType: RecordingType;

    /**
     * Expectations for the current symbol.
     */
    expectations: MockBehaviors<unknown[] | undefined, T>;

    /**
     * Human readable JavaScript-like object notation representing where the current mock can be found
     */
    path: string;

    /**
     * The arguments (or argument matchers) passed to this mocked call.
     */
    args: unknown[] | undefined;

    /**
     * Returns the backing instance of this mock, if it is a backed mock.
     */
    initialMock?: T;

    /**
     * Sets up the expectation chain leading up to the current mock.
     * Also called "automatic chaining".
     */
    chain: () => void;

    expectedMemberAccess: Map<PropertyKey, MockBehaviors<unknown[] | undefined, object>>;

    expectedCalls: MockBehaviors<unknown[] | undefined, object>;
    expectedConstructors: MockBehaviors<unknown[] | undefined, object>;
}

function getTargetPrototype<T extends object>(target: Partial<T> | T): any {
    if (typeof target === 'function') {
        return target.prototype;
    }
    return target.constructor.prototype;
}

function mockProxyHandler<T extends object>(params: MockParameters<T>): ProxyHandler<T> {

    const mockCache = new ChainingMockCache<unknown[] | PropertyKey, Mock<object>>();

    function createExpectations(path: string): MockBehaviors<unknown[] | undefined, object> {
        const expectations = new MockBehaviors<unknown[] | undefined, object>(path);
        return expectations;
    }

    function getOrCreatePropertyExpectations(prop: PropertyKey) {
        let expectations = params.expectedMemberAccess.get(prop);
        if (expectations != null) {
            return expectations;
        }
        expectations = createExpectations(params.path + formatPropertyAccess(prop));
        params.expectedMemberAccess.set(prop, expectations);
        return expectations;
    }

    const instance = lazySingleton((context: RuntimeContext<unknown[] | undefined, object>) => instantiateMock<T>({
        getBacking: context.getOriginalTarget,
        getOriginalPrototype: undefinedOr(
                context.getOriginalTarget, getOriginalTarget => getTargetPrototype(getOriginalTarget())),
        expectedCalls: params.expectedCalls,
        expectedConstructors: params.expectedConstructors,
        expectedMemberAccess: params.expectedMemberAccess
    }));

    let hasChained = false;

    function chain() {
        if (!hasChained) {
            hasChained = true;
            params.expectations.addExpectation(params.args, instance);
        }
        params.chain();
    }

    const metadata: RecordingMetadata<RecordingType, unknown[] | undefined, T> = {
        expectations: params.expectations,
        args: params.args,
        type: params.recordingType,
        reset: () => {
            params.expectations.reset();
            mockCache.clear();
            params.expectedMemberAccess.clear();
            params.expectedCalls.reset();
            params.expectedConstructors.reset();
            hasChained = false;
        },
        expect: () => {
            params.chain();
        },
        debug: () => {
            // TODO: The order in which this function prints is not representative of the matching order.
            const acc: string[] = [];
            if (params.expectedCalls.size > 0) {
                acc.push(params.expectedCalls.toString());
            }
            if (params.expectedConstructors.size > 0) {
                acc.push(params.expectedConstructors.toString());
            }
            for (const access of params.expectedMemberAccess.values()) {
                acc.push(access.toString());
            }

            const childrenDebug = mockCache.getAll()
                    .map(m => getMetadata(m, RECORDING_METADATA_KEY).debug())
                    .filter(s => s.length > 0)
                    .join('\n');

            return acc.join('\n') +
                    (acc.length > 0 && childrenDebug.length > 0 ? `\n` : '') +
                    childrenDebug;
        },
        verify: () => {
            return params.expectations.getAllUnsatisfied()
                    .map(expectation => expectation.toString())
                    .concat(...mockCache.getAll()
                        .map(m => getMetadata(m, RECORDING_METADATA_KEY).verify()));
        },
        ret: () => {
            if (params.initialMock !== undefined) {
                return params.initialMock;
            }
            throw new Error(`"instance" needs to be called on the root of a mock. It was called on ${params.path}.`);
        }
    };

    return {
        get(_target: T, p: PropertyKey, _receiver: any): any {
            if (p === METADATA_KEY) {
                return { [RECORDING_METADATA_KEY]: metadata };
            }
            return mockCache.getOrElse(p, () => {
                const newPath = params.path + formatPropertyAccess(p);
                return mockNext({
                    recordingType: 'getter',
                    expectations: getOrCreatePropertyExpectations(p),
                    path: newPath,
                    args: undefined,
                    chain,
                    expectedCalls: new MockBehaviors(newPath),
                    expectedConstructors: new MockBehaviors(makeConstructorPath(newPath)),
                    expectedMemberAccess: new Map()
                });
            });
        },
        apply(_target: T, _thisArg: any, argArray?: any): any {
            const args = sanitizeArgArray(argArray);
            return mockCache.getOrElse(args, () => {
                const newPath = params.path + `(${formatArgArray(argArray)})`;
                return mockNext({
                    recordingType: 'call',
                    expectations: params.expectedCalls,
                    path: newPath,
                    args,
                    chain,
                    expectedCalls: new MockBehaviors(newPath),
                    expectedConstructors: new MockBehaviors(makeConstructorPath(newPath)),
                    expectedMemberAccess: new Map()
                });
            });
        },
        has(_target: T, p: PropertyKey): boolean {
            if (p === METADATA_KEY) {
                return true;
            }
            return false;
        },
        set(_target: T, _p: PropertyKey, _value: any, _receiver: any): boolean {
            throw new Error('Cannot set a property on an expectation setter. Did you forget `instance()`?');
        },
        deleteProperty(_target: T, _p: PropertyKey): boolean {
            throw new Error('Cannot delete a property on an expectation setter. Did you forget `instance()`?');
        },
        defineProperty(_target: T, _p: PropertyKey, _attributes: PropertyDescriptor): boolean {
            throw new Error('Cannot define a property on an expectation setter. Did you forget `instance()`?');
        },
        construct(_target: T, argArray: any, _newTarget?: any): object {
            const args = sanitizeArgArray(argArray);
            const newPath = makeConstructorPath(params.path) + `(${formatArgArray(argArray)})`;
            return mockCache.getOrElse([constructorCacheKey, ...args], () => mockNext({
                recordingType: 'call',
                expectations: params.expectedConstructors,
                path: newPath,
                args,
                chain,
                expectedCalls: new MockBehaviors(newPath),
                expectedConstructors: new MockBehaviors(makeConstructorPath(newPath)),
                expectedMemberAccess: new Map()
            }));
        }
    };
}

/**
 * Creates the next mock in a chain.
 *
 * The mock is a proxy object where we control all operations. No calls are ever forwarded to the stub.
 * The proxy hooks define the complete logic of what happens when a mock is used.
 *
 * The purpose of the mock is to define the behavior of an instance.
 */
function mockNext<T extends object>(params: MockParameters<T>): Mock<T> {
    const stub = createProxyStub();
    const handler = mockProxyHandler(params);

    return new Proxy(stub as any, handler);
}

function sanitizeArgArray(args: any[] | undefined): any[] {
    // The prototype of ProxyHandler.apply allows undefined arrays but these have not been observed in practice
    return args
        // istanbul ignore next
        || [];
}

function mockFirst<T extends object>(name: string, proto: object, backing?: T | Partial<T>): Mock<T> {
    const expectedCalls = new MockBehaviors<unknown[] | undefined, object>(`<${name}>`);
    const expectedConstructors = new MockBehaviors<unknown[] | undefined, object>(`new <${name}>`);
    const expectedMemberAccess = new Map();
    const instance = lazySingleton(() => instantiateMock<T>({
        getBacking: undefinedOr(backing, b => () => b),
        getOriginalPrototype: () => proto,
        expectedCalls,
        expectedConstructors,
        expectedMemberAccess
    }));
    return mockNext({
        path: `<${name}>`,
        args: undefined,
        chain: () => { /* noop */ },
        expectations: new MockBehaviors(''),
        recordingType: 'getter',
        initialMock: instance(),
        expectedCalls,
        expectedConstructors,
        expectedMemberAccess
    });
}

interface InstanceParameters<T extends object> {
    getOriginalPrototype: () => object | null;

    /**
     * Returns the backing instance. Note that at this point, even virtual mocks have a backing instance.
     */
    getBacking?: () => T | Partial<T>;

    /**
     * The expected calls on this mock.
     */
    expectedCalls: MockBehaviors<unknown[] | undefined, object>;

    /**
     * The expected constructor invokations on this mock.
     */
    expectedConstructors: MockBehaviors<unknown[] | undefined, object>;

    /**
     * The expected member accesses on this mock
     */
    expectedMemberAccess: Map<PropertyKey, MockBehaviors<unknown[] | undefined, object>>;
}

function instanceProxyHandler<T extends object>(params: InstanceParameters<T>): ProxyHandler<T> {

    return {
        getPrototypeOf(_target: T): object | null {
            return params.getOriginalPrototype();
        },
        get(target: T, p: PropertyKey, receiver: any): any {
            const answer = params.expectedMemberAccess.get(p);
            function getSignature() {
                return params.expectedCalls.path + formatPropertyAccess(p);
            }
            if (answer != null) {
                const context = {
                    args: undefined,
                    context: undefined,
                    getOriginalTarget: undefinedOr(params.getBacking, getBacking => {
                        if (Reflect.has(getBacking(), p)) {
                            return () => Reflect.get(getBacking(), p, receiver);
                        }
                        return undefined;
                    }),
                };

                const match = answer.match(context);

                if (match.matched !== undefined) {
                    const result = match.matched.handle(context);
                    if (isFailure(result)) {
                        return reportMemberAccessError(
                                getSignature(),
                                Array.from(params.expectedMemberAccess.keys()),
                                match,
                                params.getBacking);
                    } else {
                        return result.result;
                    }
                }
            }

            if (typeof p === 'string' && FILTERED_PROPS.indexOf(p) >= 0) {
                return Reflect.get(target, p, receiver);
            }

            if (params.getBacking) {
                const backing = params.getBacking();
                if (Reflect.has(backing, p)) {
                    return Reflect.get(backing, p, receiver);
                }
            }

            return reportMemberAccessError(
                    getSignature(), Array.from(params.expectedMemberAccess.keys()), undefined, params.getBacking);
        },
        set(_target: T, p: PropertyKey, value: any, receiver: any): boolean {
            if (params.getBacking) {
                return Reflect.set(params.getBacking(), p, value, receiver);
            } else {
                throw new Error(
                        `Unexpected write: ${params.expectedCalls.path}${formatPropertyAccess(p)} = ${value}\n` +
                        `Use a backed mock if you want to test property mutations.`);
            }
        },
        deleteProperty(_target: T, p: PropertyKey): boolean {
            if (params.getBacking) {
                return Reflect.deleteProperty(params.getBacking(), p);
            } else {
                throw new Error(
                        `Unexpected: delete ${params.expectedCalls.path}${formatPropertyAccess(p)}\n` +
                        `Use a backed mock if you want to test property mutations.`);
            }
        },
        apply(_target: T, thisArg: any, argArray?: any): any {
            function getOriginal(getBacking: () => any) {
                return Reflect.apply(getBacking(), thisArg, sanitizeArgArray(argArray));
            }
            function getSignature() {
                return `${params.expectedCalls.path}(${formatArgArray(argArray)})`;
            }

            const context: RuntimeContext<any, any> = {
                args: sanitizeArgArray(argArray),
                context: thisArg,
                getOriginalTarget: undefinedOr(params.getBacking, getBacking => () => getOriginal(getBacking))
            };
            const match = params.expectedCalls.match(context);

            if (match.matched !== undefined) {
                const result = match.matched.handle(context);
                if (isFailure(result)) {
                    return reportFunctionCallError(getSignature(), match, 'does not matter');
                } else {
                    return result.result;
                }
            } else {
                // If no expectation matched this call, then attempt to call the backing if it is a function
                if (params.getBacking) {
                    const backing = params.getBacking();
                    if (typeof backing === 'function') {
                        return Reflect.apply(backing, thisArg, argArray || []);
                    }
                }

                return reportFunctionCallError(getSignature(), match, params.getBacking ? 'yes' : 'no');
            }
        },
        construct(_target: T, argArray?: any, newTarget?: any): any {
            function getOriginal(getBacking: () => any) {
                return Reflect.construct(getBacking(), argArray, newTarget);
            }

            function getSignature() {
                return params.expectedConstructors.path + `(${formatArgArray(argArray)})`;
            }

            const context: RuntimeContext<any, any> = {
                args: sanitizeArgArray(argArray),
                context: newTarget,
                getOriginalTarget: undefinedOr(params.getBacking, getBacking => () => getOriginal(getBacking))
            };
            const match = params.expectedConstructors.match(context);

            if (match.matched !== undefined) {
                const result = match.matched.handle(context);
                if (isFailure(result)) {
                    return reportFunctionCallError(getSignature(), match, 'does not matter');
                } else {
                    return result.result;
                }
            } else {
                // If no expectation matched this call, then attempt to construct the backing if it is a function
                if (params.getBacking) {
                    const backing = params.getBacking();
                    if (typeof backing === 'function') {
                        return Reflect.construct(backing, argArray, newTarget);
                    }
                }

                return reportFunctionCallError(getSignature(), match, params.getBacking ? 'yes' : 'no');
            }
        },
    };
}

/**
 * Creates the instance of a mock.
 *
 * The instance is also a Proxy where all accesses are hooked. No calls are ever forwarded to the stub.
 * The logic in the hooks defines what happens when the instance is used.
 *
 * The purpose of the instance is to behave exactly as specified by the mock which generated it.
 */
function instantiateMock<T extends object>(params: InstanceParameters<T>): T {
    // At this point we don't know if the thing to mock is a function or an object.
    // However, the stub has to be a function in order for the proxy to be callable,
    // but a function has weird properties such as `.name`, `.caller`, etc. which would
    // interfere with the behavior of the mock as an object.
    // Therefore, the stub cannot also be the backing object.
    const backing = params.getBacking ? params.getBacking() : createProxyStub();
    return new Proxy(backing as T, instanceProxyHandler(params));
}

export function getMockInstance<T>(mock: Mock<T>): T {
    return getMetadata(mock, RECORDING_METADATA_KEY).ret();
}

export function verifyMock(mock: Mock<any>): void {
    const errors = getMetadata(mock, RECORDING_METADATA_KEY).verify();
    if (errors.length > 0) {
        throw new Error(`There are ${errors.length} unsatisfied expectations:\n` +
        errors.map((s, idx) => `${idx}. ${s.toString()}`).join('\n'));
    }
}

export function resetMock(mock: Mock<any>): void {
    getMetadata(mock, RECORDING_METADATA_KEY).reset();
}

export function debugMock(mock: Mock<any>): string {
    return getMetadata(mock, RECORDING_METADATA_KEY).debug();
}

export function createVirtualMock<T extends object>(name: string, prototype: any): Mock<T> {
    return mockFirst<T>(name, prototype);
}

export function createBackedMock<T extends object | AnyFunction>(
        name: string, backing: Partial<T> | T, prototype: any): Mock<T> {
    return mockFirst<T>(name, prototype, backing);
}
