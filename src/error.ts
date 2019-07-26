
/**
 * Type-level error, used to provide helpful debugging information at compile time.
 */
export interface OmniMockError<T extends string> {
    __OMNIMOCK_ERROR__: {
        [k in T]: null;
    }
}

export function suppressCompileTimeError<T>(t: T): T & OmniMockError<any> {
    return t as any;
}
