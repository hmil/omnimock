import { instance, mock, verify, when } from '../src';
import { CatClass } from './fixtures/classes';

describe('Expectation quantifiers', () => {

    describe('.atLeastOnce()', () => {
        it('asserts at least one call', () => {
            const catMock = mock(CatClass);

            when(catMock.purr()).return('hoyhoy').atLeastOnce();

            expect(() => verify(catMock)).toThrow();
            expect(() => instance(catMock).purr()).not.toThrow();
            expect(() => verify(catMock)).not.toThrow();
            expect(() => instance(catMock).purr()).not.toThrow();
            expect(() => verify(catMock)).not.toThrow();
        });
        it('asserts at least one member access', () => {
            const catMock = mock(CatClass);

            when(catMock.color).useValue('hoyhoy').atLeastOnce();

            expect(() => verify(catMock)).toThrow();
            expect(() => instance(catMock).color).not.toThrow();
            expect(() => verify(catMock)).not.toThrow();
            expect(() => instance(catMock).color).not.toThrow();
            expect(() => verify(catMock)).not.toThrow();
        });
    });

    describe('.atMostOnce()', () => {
        it('asserts at most one call', () => {
            const catMock = mock(CatClass);

            when(catMock.purr()).return('hoyhoy').atMostOnce();

            expect(() => verify(catMock)).not.toThrow();
            expect(() => instance(catMock).purr()).not.toThrow();
            expect(() => verify(catMock)).not.toThrow();
            expect(() => instance(catMock).purr()).toThrow();
        });
        it('asserts at most one member access', () => {
            const catMock = mock(CatClass);

            when(catMock.color).useValue('hoyhoy').atMostOnce();

            expect(() => verify(catMock)).not.toThrow();
            expect(() => instance(catMock).color).not.toThrow();
            expect(() => verify(catMock)).not.toThrow();
            expect(() => instance(catMock).color).toThrow();
        });
    });

    describe('.once()', () => {
        it('asserts exactly one call', () => {
            const catMock = mock(CatClass);

            when(catMock.purr()).return('hoyhoy').once();

            expect(() => verify(catMock)).toThrow();
            expect(() => instance(catMock).purr()).not.toThrow();
            expect(() => verify(catMock)).not.toThrow();
            expect(() => instance(catMock).purr()).toThrow();
        });
        it('asserts exactly one member access', () => {
            const catMock = mock(CatClass);

            when(catMock.color).useValue('hoyhoy').once();

            expect(() => verify(catMock)).toThrow();
            expect(() => instance(catMock).color).not.toThrow();
            expect(() => verify(catMock)).not.toThrow();
            expect(() => instance(catMock).color).toThrow();
        });
    });

    describe('.times(n)', () => {
        it('asserts an arbitrary number of calls', () => {
            const catMock = mock(CatClass);

            when(catMock.purr()).return('hoyhoy').times(2);

            expect(() => verify(catMock)).toThrow();
            expect(() => instance(catMock).purr()).not.toThrow();
            expect(() => verify(catMock)).toThrow();
            expect(() => instance(catMock).purr()).not.toThrow();
            expect(() => verify(catMock)).not.toThrow();
            expect(() => instance(catMock).purr()).toThrow();
        });
        it('asserts an arbitrary number of member accesses', () => {
            const catMock = mock(CatClass);

            when(catMock.color).useValue('hoyhoy').times(2);

            expect(() => verify(catMock)).toThrow();
            expect(() => instance(catMock).color).not.toThrow();
            expect(() => verify(catMock)).toThrow();
            expect(() => instance(catMock).color).not.toThrow();
            expect(() => verify(catMock)).not.toThrow();
            expect(() => instance(catMock).color).toThrow();
        });
    });

    describe('.never()', () => {
        it('asserts zero calls', () => {
            const catMock = mock(CatClass);

            when(catMock.purr()).return('hoyhoy').never();

            expect(() => verify(catMock)).not.toThrow();
            expect(() => instance(catMock).purr()).toThrow();
            expect(() => verify(catMock)).toThrow();
        });
        it('asserts zero member accesses', () => {
            const catMock = mock(CatClass);

            when(catMock.color).useValue('hoyhoy').never();

            expect(() => verify(catMock)).not.toThrow();
            expect(() => instance(catMock).color).toThrow();
            expect(() => verify(catMock)).toThrow();
        });
    });
});
