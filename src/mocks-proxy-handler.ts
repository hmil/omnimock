import { ObjectMethodsFilter } from './object-methods-filter';
import { IMocksContext } from './mocks-control';

export class MocksProxyHandler implements ProxyHandler<object> {

    constructor(
            private context: IMocksContext,
            private originalConstructor: Function,
            private inst: any,
            private filter: ObjectMethodsFilter) {
    }

    /** @override */
    getPrototypeOf() {
        if (this.inst.constructor != null) {
            return this.inst.constructor.prototype;
        } else {
            return null;
        }
    }

    /** @override */
    get(target: object, prop: PropertyKey, receiver: unknown) {
        if (prop === 'constructor') {
            return this.originalConstructor;
        }
        const orig = Reflect.get(target, prop, receiver);
        return this.filter.create(prop, orig, (args: unknown[]) => {
            return this.context.getState().invoke(receiver, prop, args);
        });
    }
}
