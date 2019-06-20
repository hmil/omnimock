export interface InvocationResult<T> {
    answer(): T;
}

export const voidInvocationResult = new class implements InvocationResult<void> {
    /** @override */
    answer() {
        return undefined;
    }
}();

export class StaticInvocationResult<T> implements InvocationResult<T> {
    constructor(private readonly value: T) { }
    /** @override */
    answer(): T {
        return this.value;
    }
}

export class ThrowingInvocationResult implements InvocationResult<never> {
    constructor(private readonly error: any) { }
    /** @override */
    answer(): never {
        throw this.error;
    }
}
