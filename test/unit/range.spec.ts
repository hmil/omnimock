import { Range } from '../../src/range';

describe('Range', () => {
    it('prints nice strings', () => {
        expect(new Range(1).toString()).toBe('once');
        expect(new Range(2).toString()).toBe('2 times');
        expect(new Range(1, 3).toString()).toBe('between 1 and 3 times');
        expect(new Range(1, Number.MAX_SAFE_INTEGER).toString()).toBe('at least once');
        expect(new Range(3, Number.MAX_SAFE_INTEGER).toString()).toBe('at least 3 times');
    });
});
