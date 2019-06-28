
export interface IMatcher {
    __EASYMOCK_MATCHER: {
        /** Returns true if actual matches this matcher, or an error message otherwise */
        match(actual: unknown): true | string;
        name: string;
    };
}

export function isMatcher(t: unknown): t is IMatcher {
    return typeof t === 'object' && t != null && '__EASYMOCK_MATCHER' in t;
}
