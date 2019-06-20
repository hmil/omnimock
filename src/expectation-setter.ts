export interface IExpectationSetters<T> {
    andReturn: (val: T) => IExpectationSetters<T>;
    andVoid: () => IExpectationSetters<T>;
    andThrow: (e: any) => IExpectationSetters<T>;
    once: () => IExpectationSetters<T>;
    anyTimes: () => IExpectationSetters<T>;
    atLeastOnce: () => IExpectationSetters<T>;
    times: (n: number) => IExpectationSetters<T>;
}
