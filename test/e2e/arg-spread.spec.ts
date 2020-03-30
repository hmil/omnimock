import { anyArray, instance, mock, when } from '../../src';

describe('Argument spread', () => {
    
    it('works with virtual mock', () => {
        const fnMock = mock<(...arg: number[]) => string>('virtualMock');
        when(fnMock(10, 20, 30)).return('Got some elements');
        const args = [10, 20, 30];
        expect(instance(fnMock)(...args)).toBe(`Got some elements`);
    });

    it('works with backed mock using backing implementation', () => {
        const fnMock = mock('backedFn', (...args: number[]) => `Got ${args.length} arguments`);
        const params = [10, 20, 30];
        expect(instance(fnMock)(...params)).toBe(`Got 3 arguments`);
    });

    it('works with backed mock and custom implementation', () => {
        const fnMock = mock('backedFn', (...args: number[]) => `Got ${args.length} arguments`);
        when(fnMock(10, 20, 30)).return('Got some elements');
        const params = [10, 20, 30];
        expect(instance(fnMock)(...params)).toBe(`Got some elements`);
    });
});
