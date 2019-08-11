import { instance, mock, Mock, when, mockInstance } from '../src';
import { CatClass } from './fixtures/classes';

describe('ways to create a mock', () => {
    it('create an anonymous virtual mock with a name', () => {
        const m = mock<CatClass>('CatClass');
        verifyCatMock(m);
    });

    it('create a virtual mock from a constructor', () => {
        const m = mock(CatClass);
        verifyCatMock(m);
    });

    it('create a backed mock from a complete type', () => {
        const backing = new CatClass('Olinka');
        const m = mock(backing);
        verifyCatMock(m);
    });
    
    it('create a backed mock from a partial type', () => {
        const m = mock<CatClass>('partialCat', {
            food: 'oreos'
        });
        verifyCatMock(m);
    });

    it('create a backed mock from a function', () => {
        function charCode(s: string): number {
            return s.charCodeAt(0);
        }
        const m = mock(charCode);
        when(m('a')).return(42);
        expect(instance(m)('a')).toBe(42);
    });

    it('create a backed mock from a function with a custom name', () => {
        function charCode(s: string): number {
            return s.charCodeAt(0);
        }
        const m = mock('mockCharCode', charCode);
        when(m('a')).return(42);
        expect(instance(m)('a')).toBe(42);
    });
});

function verifyCatMock(m: Mock<CatClass>) {
    when(m.food).useValue('oreos');
    expect(instance(m).food).toBe('oreos');
}

describe('ways to create a mock instance', () => {

    it('create an anonymous virtual mock with a name', () => {
        const m = mockInstance<CatClass>('CatClass');
        expect(() => m.purr()).toThrow(/Unexpected/);
    });

    it('create a virtual mock from a constructor', () => {
        const m = mockInstance(CatClass);
        expect(() => m.purr()).toThrow(/Unexpected/);
    });

    it('create a backed mock from a complete type', () => {
        const backing = new CatClass('Olinka');
        const m = mockInstance(backing);
        expect(() => m.purr()).not.toThrow(/Unexpected/);
        expect(m.name).toBe('Olinka');
    });
    
    it('create a backed mock from a partial type', () => {
        const m = mockInstance<CatClass>('partialCat', {
            food: 'oreos'
        });
        expect(() => m.purr()).toThrow(/Unexpected/);
        expect(m.food).toBe('oreos');
    });

    it('create a backed mock from a function', () => {
        function charCode(s: string): number {
            return s.charCodeAt(0);
        }
        const m = mockInstance(charCode);
        expect(m('a')).toBe(42);
    });

    it('create a backed mock from a function with a custom name', () => {
        function charCode(s: string): number {
            return s.charCodeAt(0);
        }
        const m = mockInstance('mockCharCode', charCode);
        expect(m('a')).toBe(42);
    });
});
