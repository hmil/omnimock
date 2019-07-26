import { mock, when, anyOf, instance, between, smallerThan, greaterThan, allOf } from "../src";

describe('argument matchers', () => {

    describe('anyOf', () => {
        it('matches if any of the arguments matches', () => {
            const myMock = mock<(arg: string) => boolean>();

            when(myMock(anyOf('lettuce', 'bacon', 'avocado'))).return(true);

            expect(instance(myMock)('lettuce')).toBe(true);
            expect(instance(myMock)('bacon')).toBe(true);
            expect(instance(myMock)('avocado')).toBe(true);
            expect(() => instance(myMock)('tomato')).toThrow(/Unexpected.+tomato/);
        });

        it('can be combined with other matchers', () => {
            const myMock = mock<(arg: number) => boolean>();

            when(myMock(anyOf(smallerThan(0), between(45, 55), greaterThan(100)))).return(true);

            expect(instance(myMock)(-2)).toBe(true);
            expect(instance(myMock)(50)).toBe(true);
            expect(instance(myMock)(130)).toBe(true);
            expect(() => instance(myMock)(20)).toThrow(/Unexpected.+20/);
        });

        it('mismatches when empty', () => {
            const myMock = mock<(arg: number) => boolean>();

            when(myMock(anyOf())).return(true);

            expect(() => instance(myMock)(20)).toThrow(/Unexpected.+20/);
        });
    });

    describe('allOf', () => {
        it('matches if all of the arguments match', () => {
            const myMock = mock<(arg: string) => boolean>();

            when(myMock(allOf('lettuce'))).return(true);

            expect(instance(myMock)('lettuce')).toBe(true);
            expect(() => instance(myMock)('tomato')).toThrow(/Unexpected.+tomato/);
        });

        it('can be combined with other matchers', () => {
            const myMock = mock<(arg: number) => boolean>();

            when(myMock(allOf(greaterThan(0), between(45, 55), smallerThan(100)))).return(true);

            expect(() => instance(myMock)(-2)).toThrow(/Unexpected.+-2/);
            expect(instance(myMock)(50)).toBe(true);
            expect(() => instance(myMock)(130)).toThrow(/Unexpected.+130/);
            expect(() => instance(myMock)(20)).toThrow(/Unexpected.+20/);
        });

        it('matches when empty', () => {
            const myMock = mock<(arg: number) => boolean>();

            when(myMock(allOf())).return(true);

            expect(instance(myMock)(20)).toBe(true);
        });
    });
});