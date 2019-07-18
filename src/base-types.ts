export type ConstructorType = new (...args: any[]) => any;
export type AnyFunction = (...args: any[]) => any;
export type NotAConstructorType<T, Default> = T extends ConstructorType ? Default : T;
export type FnType<Args extends any[], Ret> = (...args: Args) => Ret;

/**
 * Adds all properties of twig onto stem and returns stem.
 */
export function graft<A, B>(stem: A, twig: B): A & B {
    for (const key of Object.getOwnPropertyNames(twig)) {
        (stem as any)[key] = (twig as any)[key];
    }
    return stem as any;
}
