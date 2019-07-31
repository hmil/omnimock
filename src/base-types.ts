export type ConstructorType<T> = new (...args: any[]) => T;
export type NotAConstructorType<T, Default> = T extends ConstructorType<any> ? Default : T;
export type FnType<Args extends any[], Ret> = (...args: Args) => Ret;
export type AnyFunction = FnType<any[], any>;

export interface Indexable {
    [k: string]: unknown;
}

/**
 * Adds all properties of twig onto stem and returns stem.
 */
export function graft<A, B>(stem: A, twig: B): A & B {
    for (const key of Object.getOwnPropertyNames(twig)) {
        (stem as any)[key] = (twig as any)[key];
    }
    return stem as any;
}
