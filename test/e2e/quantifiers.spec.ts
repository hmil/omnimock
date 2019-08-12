import { instance, mock, verify, when, mockInstance } from '../../src';
import { CatClass } from '../fixtures/classes';

describe('Expectation quantifiers', () => {

    it('needs a behavior defined first', () => {
        const catMock = mock(CatClass);
        expect(() => when(catMock.food).once()).toThrow(/No behavior defined/);
    });

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

    describe('verification', () => {
        it('can verify a whole mock', () => {
            const catMock = mock(CatClass);

            // This mock is used by the catMock but it is not part of that mock.
            // The expectations set on that mock should not be verified.
            const chipMock = mock<CatClass['tag']['chip']>('chipMock');
            when(chipMock.id).useValue(112).atLeastOnce();

            when(catMock.color).useValue('green').atLeastOnce();
            when(catMock.getTag(12).chip).useValue(instance(chipMock));
            when(catMock.getTag(22).chip).useValue(instance(chipMock)).atLeastOnce();

            try {
                verify(catMock);
                fail('Should have thrown');
            } catch (e) {
                expect(e.message).toContain('2 unsatisfied');
                expect(e.message).toContain('<CatClass>.color');
                expect(e.message).toContain('<CatClass>.getTag(22).chip');
            }
        });

        it('can verify a subset of a mock', () => {
            const catMock = mock(CatClass);

            const chipMock = mock<CatClass['tag']['chip']>('chipMock');
            when(chipMock.id).useValue(112).atLeastOnce();

            when(catMock.color).useValue('green').atLeastOnce();
            when(catMock.getTag(12).chip).useValue(instance(chipMock));
            when(catMock.getTag(22).chip).useValue(instance(chipMock)).atLeastOnce();

            try {
                verify(catMock.getTag(22));
                fail('Should have thrown');
            } catch (e) {
                expect(e.message).toContain('1 unsatisfied');
                expect(e.message).toContain('<CatClass>.getTag(22).chip');
            }
        });
    });
});
