import { anyString, instance, Mock, mock, mockInstance, when } from '../../src';
import { CatClass } from '../fixtures/classes';

describe('ways to create a mock', () => {
    it('create an anonymous virtual mock with a name', () => {
        const m = mock<CatClass>('CatClass');
        verifyCatMock(m);
    });

    it('create a virtual mock from a constructor', () => {
        const m = mock(CatClass);
        verifyCatMock(m);
        expect(instance(m)).toBeInstanceOf(CatClass);
    });

    it('create a backed mock from a partial type', () => {
        const m = mock<CatClass>('partialCat', new CatClass('Olinka'));
        verifyCatMock(m);
        expect(instance(m)).toBeInstanceOf(CatClass);
    });

    it('create a backed mock from a partial type and constructor', () => {
        const m = mock(CatClass, {
            food: 'oreos'
        });
        verifyCatMock(m);
        expect(instance(m)).toBeInstanceOf(CatClass);
    });

    it('create a backed mock from a function with a custom name', () => {
        function charCode(s: string): number {
            return s.charCodeAt(0);
        }
        const m = mock('mockCharCode', charCode);
        when(m('a')).return(42);
        expect(instance(m)('a')).toBe(42);
    });

    it('create the mock of a constructor', () => {
        const m = mock<typeof CatClass>('CatCtr', CatClass);
        when(new m(anyString()).food).useValue('chilli');

        expect(new (instance(m))('Olinka').food).toBe('chilli');
    });

});

function verifyCatMock(m: Mock<CatClass>) {
    when(m.food).useValue('oreos');
    expect(instance(m).food).toBe('oreos');
}

describe('ways to obtain a mock instance from a mock', () => {
    it('is obtained at the root of the mock', () => {
        const m = mock<CatClass>('CatClass');
        when(m.food).useValue('oreos');
        expect(instance(m).food).toBe('oreos');
    });

    it('can not be obtained from a deeper level', () => {
        const m = mock<CatClass>('CatClass');
        when(m.food).useValue('oreos');
        expect(() => instance(m.food)).toThrow(/It was called on <CatClass>.food/);
    });
});


describe('ways to create a mock instance', () => {

    it('create an anonymous virtual mock with a name', () => {
        const m = mockInstance<CatClass>('CatClass');
        expect(() => m.purr()).toThrow(/Unexpected/);
    });

    it('create a virtual mock from a constructor', () => {
        const m = mockInstance(CatClass);
        expect(() => m.purr()).toThrow(/Unexpected/);
    });
    
    it('create a backed mock from a partial type', () => {
        const m = mockInstance<CatClass>('partialCat', {
            food: 'oreos'
        });
        expect(() => m.purr()).toThrow(/Unexpected/);
        expect(m.food).toBe('oreos');
    });
    
    it('create a backed mock from a partial type and constructor', () => {
        const m = mockInstance(CatClass, {
            food: 'oreos'
        });
        expect(() => m.purr()).toThrow(/Unexpected/);
        expect(m.food).toBe('oreos');
        expect(m).toBeInstanceOf(CatClass);
    });

    it('create a backed mock from a function with a custom name', () => {
        function charCode(s: string): number {
            return s.charCodeAt(0);
        }
        const m = mockInstance('mockCharCode', charCode);
        expect(m('a')).toBe(97);
    });
});
