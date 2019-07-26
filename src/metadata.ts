/**
 * Stores metadata safely on a namespace on objects
 */

export const METADATA_KEY = '__OMNIMOCK__';

export type WithMetadata<Key extends string, T> = {
    [METADATA_KEY]: {
        [K in Key]: T;
    };
}

export type GetMetadata<Key extends string, T extends WithMetadata<Key, any>> = T extends WithMetadata<Key, infer DATA> ? DATA : never;
export function getMetadata<Key extends string, DATA>(t: WithMetadata<Key, DATA>, key: Key): DATA {
    const metadata = t[METADATA_KEY];
    if (metadata == null) {
        throw new Error('No metadata found');
    }
    return metadata[key];
}

export function setMetadata<Key extends string, DATA, T extends WithMetadata<Key, DATA>>(target: T, key: Key, metadata: DATA): T {
    if (!(METADATA_KEY in target) || (target as WithMetadata<Key, unknown>)[METADATA_KEY] == null) {
        target[METADATA_KEY] = {} as any;
    }
    target[METADATA_KEY][key] = metadata;
    return target;
}

export function hasMetadata<Key extends string, DATA>(t: object, key: Key): t is WithMetadata<Key, DATA> {
    return (METADATA_KEY in t) && (t as WithMetadata<Key, unknown>)[METADATA_KEY] != null && (t as WithMetadata<Key, unknown>)[METADATA_KEY][key] != null;
}
