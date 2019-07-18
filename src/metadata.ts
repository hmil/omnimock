/**
 * Stores metadata safely on a namespace on objects
 */

export const METADATA_KEY = '__TSMOCK__';

export type WithMetadata<Type, T> = {
    [METADATA_KEY]: TsMockMetadata<Type, T>;
}

export interface TsMockMetadata<Type, T> {
    type: Type;
    data: T;
}


export function getMetadata<DATA>(t: WithMetadata<unknown, DATA>): DATA {
    return t[METADATA_KEY].data;
}

export function setMetadata<Type, DATA>(target: WithMetadata<Type, DATA>, metadata: TsMockMetadata<Type, DATA>): void {
    target[METADATA_KEY] = metadata;
}

export function createMetadata<Type, DATA>(type: Type, data: DATA): TsMockMetadata<Type, DATA> {
    return { data, type };
}

export function withMetadata<T, Type, DATA>(target: T, metadata: TsMockMetadata<Type, DATA>): T & WithMetadata<Type, DATA> {
    return {
        ...target,
        [METADATA_KEY]: metadata
    };
}

export function hasMetadata<Type extends string>(target: unknown, type: Type): target is WithMetadata<Type, unknown> {
    return typeof target === 'object' && target != null && METADATA_KEY in target &&
            (target as WithMetadata<unknown, unknown>)[METADATA_KEY].type === type;
}
