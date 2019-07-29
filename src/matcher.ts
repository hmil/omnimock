import { WithMetadata, hasMetadata } from './metadata';

interface MatcherMetadata {
    /** Returns true if actual matches this matcher, or an error message otherwise */
    match(actual: unknown): true | string;
    name: string;
    /** Hash is used to compare matchers */
    hash: string;
}

export const MATCHER_KEY = 'matcher';
export type MATCHER_KEY = typeof MATCHER_KEY;

export type Matcher<T> = T & WithMetadata<MATCHER_KEY, MatcherMetadata>;

export function isMatcher(t: unknown): t is Matcher<typeof t> {
    return typeof t === 'object' && t != null && hasMetadata(t, MATCHER_KEY);
}

