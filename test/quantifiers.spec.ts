import { CatClass } from "./fixtures/classes";
import { mock, instance, when, verify } from "../src";

describe('Expectation quantifiers', () => {

    describe('automatic chaining', () => {
        it('allows any number of accesses', () => {
            const catMock = mock(CatClass, 'Olinka');

            when(catMock.purr()).return('hoyhoy').anyTimes();
            when(catMock.getTag(1).manufacturer.fetch()).resolve('hoyhoy').once();

            const cat = instance(catMock);

            expect(() => cat.getTag).not.toThrow();
            expect(() => cat.getTag(1)).not.toThrow();
            expect(() => cat.getTag(1).manufacturer).not.toThrow();
            expect(() => cat.getTag(1).manufacturer.fetch).not.toThrow();
            expect(() => cat.getTag(1).manufacturer.fetch()).not.toThrow();
            expect(() => verify(catMock)).not.toThrow();
        });
    });

    describe('.atLeastOnce()', () => {
        it('asserts at least one call', () => {
            const catMock = mock(CatClass, 'Olinka');

            when(catMock.purr()).return('hoyhoy').atLeastOnce();

            expect(() => verify(catMock)).toThrow();
            expect(() => instance(catMock).purr()).not.toThrow();
            expect(() => verify(catMock)).not.toThrow();
            expect(() => instance(catMock).purr()).not.toThrow();
            expect(() => verify(catMock)).not.toThrow();
        });

        it('asserts at least one member access', () => {
            const catMock = mock(CatClass, 'Olinka');

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
            const catMock = mock(CatClass, 'Olinka');

            when(catMock.purr()).return('hoyhoy').atMostOnce();

            expect(() => verify(catMock)).not.toThrow();
            expect(() => instance(catMock).purr()).not.toThrow();
            expect(() => verify(catMock)).not.toThrow();
            expect(() => instance(catMock).purr()).toThrow();
        });

        it('asserts at most one member access', () => {
            const catMock = mock(CatClass, 'Olinka');

            when(catMock.color).useValue('hoyhoy').atMostOnce();

            expect(() => verify(catMock)).not.toThrow();
            expect(() => instance(catMock).color).not.toThrow();
            expect(() => verify(catMock)).not.toThrow();
            expect(() => instance(catMock).color).toThrow();
        });
    });

    describe('.once()', () => {
        it('asserts exactly one call', () => {
            const catMock = mock(CatClass, 'Olinka');

            when(catMock.purr()).useValue('hoyhoy').once();

            expect(() => verify(catMock)).toThrow();
            expect(() => instance(catMock).purr()).not.toThrow();
            expect(() => verify(catMock)).not.toThrow();
            expect(() => instance(catMock).purr()).toThrow();
        });

        it('asserts exactly one member access', () => {
            const catMock = mock(CatClass, 'Olinka');

            when(catMock.color).useValue('hoyhoy').once();

            expect(() => verify(catMock)).toThrow();
            expect(() => instance(catMock).color).not.toThrow();
            expect(() => verify(catMock)).not.toThrow();
            expect(() => instance(catMock).color).toThrow();
        });
    });

    describe('.times(n)', () => {
        it('asserts an arbitrary number of calls', () => {
            const catMock = mock(CatClass, 'Olinka');

            when(catMock.purr()).useValue('hoyhoy').times(2);

            expect(() => verify(catMock)).toThrow();
            expect(() => instance(catMock).purr()).not.toThrow();
            expect(() => verify(catMock)).toThrow();
            expect(() => instance(catMock).purr()).not.toThrow();
            expect(() => verify(catMock)).not.toThrow();
            expect(() => instance(catMock).purr()).toThrow();
        });

        it('asserts an arbitrary number of member accesses', () => {
            const catMock = mock(CatClass, 'Olinka');

            when(catMock.color).useValue('hoyhoy').times(2);

            expect(() => verify(catMock)).toThrow();
            expect(() => instance(catMock).color).not.toThrow();
            expect(() => verify(catMock)).toThrow();
            expect(() => instance(catMock).color).not.toThrow();
            expect(() => verify(catMock)).not.toThrow();
            expect(() => instance(catMock).color).toThrow();
        });
    })
});
