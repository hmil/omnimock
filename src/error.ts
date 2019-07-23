
/**
 * Type-level error, used to provide helpful debugging information at compile time.
 */
export interface TsMockError<T extends string> {
    __TSMOCK_ERROR__: {
        [k in T]: null;
    }
}

export function suppressCompileTimeError<T>(t: T): T & TsMockError<any> {
    return t as any;
}
