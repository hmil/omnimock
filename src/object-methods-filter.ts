export class ObjectMethodsFilter {

    private static readonly FILTERED_METHODS = Object.getOwnPropertyNames(Object.prototype);

    create<T>(prop: PropertyKey, orig: (...args: any[]) => T, cb: (args: unknown[]) => T): (...args: any[]) => T {
        if (typeof orig !== 'function') {
            return orig;
        }
        const shouldBypass = typeof prop === 'string' && ObjectMethodsFilter.FILTERED_METHODS.indexOf(prop) >= 0;
        return function(this: any) {
            if (shouldBypass) {
                return orig.call(this, arguments);
            }
            return cb(Array.prototype.slice.apply(arguments));
        };
    }
}
