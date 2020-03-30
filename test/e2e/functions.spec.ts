import { instance, mock, when, anyArray } from '../../src';

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

    describe('apply', () => {
        it('uses the virtual implementation', () => {
            const virtualMock = mock<(arg: number) => string>('virtualMock');
            when(virtualMock(2)).return('virtual');
            expect(instance(virtualMock).apply({}, [2])).toBe('virtual');
        });

        it('uses the virtual implementation recursively', () => {
            const virtualMock = mock<(arg: number) => string>('virtualMock');
            when(virtualMock(2)).return('virtual');
            expect(instance(virtualMock).apply.apply({}, [{}, [2]])).toBe('virtual');
        });

        it('uses the backing implementation', () => {
            const virtualMock = mock('backedFn', (arg: number) => `I'm ${arg} years old`);
            expect(instance(virtualMock).apply({}, [2])).toBe('I\'m 2 years old');
        });

        it('uses the virtual implementation on top of a backing', () => {
            const virtualMock = mock('backedFn', (arg: number) => `I'm ${arg} years old`);
            when(virtualMock(2)).return('virtual');
            expect(instance(virtualMock).apply({}, [2])).toBe('virtual');
        });
    });

    describe('call', () => {
        it('uses the virtual implementation', () => {
            const virtualMock = mock<(arg: number) => string>('virtualMock');
            when(virtualMock(2)).return('virtual');
            expect(instance(virtualMock).call({}, 2)).toBe('virtual');
        });

        it('uses the virtual implementation recursively', () => {
            const virtualMock = mock<(arg: number) => string>('virtualMock');
            when(virtualMock(2)).return('virtual');
            expect(instance(virtualMock).call.call({}, {}, 2)).toBe('virtual');
        });

        it('uses the backing implementation', () => {
            const virtualMock = mock('backedFn', (arg: number) => `I'm ${arg} years old`);
            expect(instance(virtualMock).call({}, 2)).toBe('I\'m 2 years old');
        });

        it('uses the virtual implementation on top of a backing', () => {
            const virtualMock = mock('backedFn', (arg: number) => `I'm ${arg} years old`);
            when(virtualMock(2)).return('virtual');
            expect(instance(virtualMock).call({}, 2)).toBe('virtual');
        });
    });
});
