import { recordedCall, recordedGetter, RecordedCall, RecordedGetter } from "./recording";
import { FnType, ConstructorType, graft, AnyFunction } from './base-types';
import { WithMetadata, METADATA_KEY, createMetadata, TsMockMetadata } from './metadata';


interface MockMethod<Ctx, Fn extends AnyFunction, Args extends any[], Ret> {
    (...args: Args): RecordedCall<Ctx, Fn, Args, Ret>;
}

type MockMember<T, Ctx> = T extends FnType<infer Args, infer Ret> ? MockMethod<Ctx, T, Args, Ret> : undefined;

type MockObject<T, Inst> = Inst extends undefined ? 
    { [K in keyof T]: RecordedGetter<Inst, never, T[K]> & MockMember<T[K], Inst> } :
    { [K in keyof Inst]: RecordedGetter<Inst, K, Inst[K]> & MockMember<Inst[K], Inst> };

const MOCK_METADATA_KEY = 'mock';

export type MockMetadata<T> = WithMetadata<typeof MOCK_METADATA_KEY, T>;
export type InstanceBackedMock<T> = MockObject<T, T> & MockMetadata<T>;
export type Mock<T> = MockObject<T, undefined> & MockMetadata<T>;

export function instantiate<T extends ConstructorType>(klass: T, params: ConstructorParameters<T>): InstanceType<T> {
    class Ctr extends klass {
    }
    return new Ctr(...params);
}

const FILTERED_PROPS = Object.getOwnPropertyNames(Object.prototype);

function instanceProxyHandlerFactory(
        originalConstructor: Function,
        expectations: Map<string, () => any>): ProxyHandler<any> {
    return {
        getPrototypeOf() {
            return originalConstructor.prototype;
        },

        get(target: object, prop: PropertyKey, receiver: unknown) {
            if (prop === 'constructor') {
                return originalConstructor;
            }
            const orig = Reflect.get(target, prop, receiver);
            if (typeof prop === 'string') {
                if (FILTERED_PROPS.indexOf(prop) < 0) {
                    const answer = expectations.get(prop);
                    if (answer != null) {
                        return answer();
                    } else {
                        throw new Error(`Unexpected property access: ${originalConstructor.name}.${prop}`);
                    }
                }
            }
            return orig;
        }
    };
}


function mockProxyHandlerFactory<T extends object>(
        baseObject: T,
        originalConstructor: Function): ProxyHandler<Mock<T>> {
    const expectations = new Map<string, () => any>();
    const instance = new Proxy<T>(baseObject, instanceProxyHandlerFactory(originalConstructor, expectations));
    const metadata = createMetadata<typeof MOCK_METADATA_KEY, T>(MOCK_METADATA_KEY, instance);
        
    return {
        get(target: Mock<T>, prop: PropertyKey, receiver: unknown): TsMockMetadata<typeof MOCK_METADATA_KEY, T> | RecordedGetter<any, any, any> {
            if (typeof prop !== 'string') {
                return Reflect.get(target, prop, receiver);
            }
            if (prop === METADATA_KEY) {
                return metadata;
            }
            
            const propertyStr = prop;
            const MOCK_EXPECTATION_SETTER_NAME = `${target}.${propertyStr}; If you are seeing this then most likely you passed someMock directly instead of instance(someMock)`;
            
            const record = recordedGetter(baseObject, propertyStr as keyof T,
                (cb) => {
                    expectations.set(propertyStr, cb);
                });
            const dummyContext = {
                [MOCK_EXPECTATION_SETTER_NAME](): RecordedCall<T, AnyFunction, any, any> {
                    return recordedCall(baseObject, () => Reflect.get(baseObject, prop, receiver), (cb) => {
                        expectations.set(propertyStr, () => (...args: any[]) => cb(args));
                    });
                }
            }

            const ret = graft(dummyContext[MOCK_EXPECTATION_SETTER_NAME], record);
            return ret;
        }
    };
}

export function mockClass<T extends ConstructorType>(klass: T, params: ConstructorParameters<T>): Mock<InstanceType<T>> {
    return new Proxy<Mock<InstanceType<T>>>({} as any, mockProxyHandlerFactory(instantiate(klass, params), klass));
}

export function mockInterface<T>(name: string): Mock<T> {
    const dummyCtx = {
        [name]: class {}
    };
    return new Proxy<Mock<T>>({} as any, mockProxyHandlerFactory(new dummyCtx[name], dummyCtx[name]));
}

export function mockObject<T extends object>(toMock: T): Mock<T> {

    return new Proxy<Mock<T>>({} as any, mockProxyHandlerFactory(toMock, toMock.constructor));
}
