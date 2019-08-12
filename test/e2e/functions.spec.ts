import { instance, mock, when } from '../../src';

describe('mocking functions', () => {

    it('allows faking a function', () => {
        const virtualMock = mock<(arg: number) => string>('virtualMock');
        when(virtualMock(2)).return('virtual');
        expect(instance(virtualMock)(2)).toBe('virtual');
    });

    it('backed mocks can call the underlying function', () => {
        const backedMock = mock('backedFn', (arg: number) => `I'm ${arg} years old`);
        when(backedMock(25)).callThrough();
        expect(instance(backedMock)(25)).toBe('I\'m 25 years old');
    });
});
