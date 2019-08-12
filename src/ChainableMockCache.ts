import { match } from './matchers';

/**
 * This very usage-specific cache is meant only to cache expectations for the purpose of automatic chaining.
 * It will not behave like you'd expect a generic cache to behave.
 */
export class ChainingMockCache<KeyType, ValueType> {

    private data: Array<{ key: KeyType, value: ValueType}> = [];

    public getOrElse(key: KeyType, ifAbsent: () => ValueType): ValueType {
        for (const entry of this.data) {
            if (match(entry.key, key) === true) {
                return entry.value;
            }
        }

        const value = ifAbsent();
        this.data.push({ key, value });

        return value;
    }

    public getAll(): ValueType[] {
        return this.data.map(entry => entry.value);
    }

    public clear() {
        this.data.length = 0;
    }
}
