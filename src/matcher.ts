import { hasMetadata, WithMetadata } from './metadata';

export interface MatcherMetadata<T extends MatcherMetadata<any>> {
    name: string;
    /** Compares this matcher against another matcher of the same type. Returns true if they are equivalent. */
    equals(other: T): boolean;
    /** Returns true if actual matches this matcher, or an error message otherwise */
    match(actual: unknown): true | string;
}

export const MATCHER_KEY = 'matcher';
export type MATCHER_KEY = typeof MATCHER_KEY;

export type Matcher<T> = T & WithMetadata<MATCHER_KEY, MatcherMetadata<any>>;

export function isMatcher(t: unknown): t is Matcher<typeof t> {
    return typeof t === 'object' && t != null && hasMetadata(t, MATCHER_KEY);
}
