import { anyString, instance, mock, when } from '../../src';
import { setCustomFail } from '../../src/behavior/reporters';
import { CatClass } from '../fixtures/classes';

describe('partial mocks', () => {

    it('forwards unexpected accesses to known values', () => {
        const catMock = mock<CatClass>('catMock', {
            color: undefined,
            name: 'Olinka',
            purr: () => 'hello'
        });
        expect(instance(catMock).name).toBe('Olinka');
        expect(instance(catMock).purr()).toBe('hello');
        expect(instance(catMock).color).toBeUndefined();
    });

    it('throws on unexpected access to unknown value', () => {
        setCustomFail(null);
        const catMock = mock<CatClass>('catMock', {
            color: undefined,
            name: 'Olinka',
            purr: () => 'hello'
        });
        expect(() => instance(catMock).food).toThrow(/Unexpected.+food/);
    });

    it('permits mocking omitted values', () => {
        const catMock = mock<CatClass>('catMock', {
            color: undefined,
            name: 'Olinka',
            purr: () => 'hello'
        });
        when(catMock.greet(anyString())).return('Oh hi Mark');
        expect(instance(catMock).greet('Joe')).toBe('Oh hi Mark');
    });

    it('permits mocking specified values', () => {
        const catMock = mock<CatClass>('catMock', {
            color: undefined,
            name: 'Olinka',
            purr: () => 'hello'
        });
        when(catMock.purr()).return('Oh hi Mark');
        expect(instance(catMock).purr()).toBe('Oh hi Mark');
    });

    it('permits through-mocking of known values', () => {
        const catMock = mock<CatClass>('catMock', {
            color: undefined,
            name: 'Olinka',
            purr: () => 'hello'
        });
        when(catMock.purr()).callThrough();
        expect(instance(catMock).purr()).toBe('hello');
    });

    it('through-mocking of unknown values is an error', () => {
        const catMock = mock<CatClass>('catMock', {
            color: undefined,
            name: 'Olinka',
            purr: () => 'hello'
        });
        when(catMock.food).useActual();
        expect(() => instance(catMock).food).toThrow(/Attempted to `useActual`/);
    });
});
