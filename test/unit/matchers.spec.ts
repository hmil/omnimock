import {
    allOf,
    anyArray,
    anyBoolean,
    anyFunction,
    anyNumber,
    anyObject,
    anyOf,
    anyString,
    anySymbol,
    anything,
    arrayEq,
    between,
    contains,
    createMatcher,
    equals,
    greaterThan,
    greaterThanOrEqual,
    instance,
    instanceOf,
    match,
    matching,
    mock,
    not,
    objectEq,
    same,
    smallerThan,
    smallerThanOrEqual,
    verify,
    weakEquals,
    when,
} from '../../src';
import { MatcherMetadata } from '../../src/matcher';
import { CatClass, Container } from '../fixtures/classes';

describe('argument matchers', () => {

    describe('same', () => {
        it('matches only the exact same instance', () => {
            const myMock = mock<(arg: { name: string }) => boolean>('myMock');
            const ref = { name: 'Jack' };

            when(myMock(same(ref))).return(true);

            expect(() => instance(myMock)({ name: 'Jack' })).toThrow(/Unexpected/);
            expect(instance(myMock)(ref)).toBe(true);
        });

        it('is equal only if it uses the same ref', () => {
            const ref = { name: 'Jack' };
            expect(match(same(ref), same({ name: 'Jack' }))).not.toBe(true);
            expect(match(same(ref), same(ref))).toBe(true);
        });
    });

    describe('weakEquals', () => {
        it('matches by weak equality', () => {
            const myMock = mock<(arg: string | number) => boolean>('myMock');
            when(myMock(weakEquals(''))).return(true);
            expect(() => instance(myMock)(' ')).toThrow(/Unexpected/);
            expect(instance(myMock)('')).toBe(true);
            expect(instance(myMock)(0)).toBe(true);
        });

        it('is equal only if if contents is strictly equal', () => {
            expect(match(weakEquals(''), weakEquals(' '))).not.toBe(true);
            expect(match(weakEquals(''), weakEquals(''))).toBe(true);
            expect(match(weakEquals(''), weakEquals(0))).not.toBe(true);
        });
    });

    describe('anything', () => {
        it('matches anything', () => {
            const myMock = mock<(arg: any) => boolean>('myMock');

            when(myMock(anything())).return(true);

            expect(instance(myMock)('foo')).toBe(true);
            expect(instance(myMock)(0)).toBe(true);
            expect(instance(myMock)({a: 2})).toBe(true);
        });
        it('Does not match missing arguments', () => {
            const myMock = mock<(arg?: any) => boolean>('myMock');
            when(myMock(anything())).return(true);

            expect(() => instance(myMock)()).toThrow(/Unexpected/);
        });
        it('matches itself', () => {
            expect(match(anything(), anything())).toBe(true);
        });
    });

    describe('instanceof', () => {
        it('matches instances of a class', () => {
            const myMock = mock<(arg: CatClass) => boolean>('myMock');
            const cat = new CatClass('Olinka');
            const container = new Container();

            when(myMock(instanceOf(CatClass))).return(true);

            expect(() => instance(myMock)(container as any)).toThrow(/Unexpected/);
            expect(instance(myMock)(cat)).toBe(true);
        });
        it('matches instances of a subclass', () => {
            const myMock = mock<(arg: Container) => boolean>('myMock');
            const cat = new CatClass('Olinka');

            when(myMock(instanceOf(Container))).return(true);

            expect(() => instance(myMock)('foo' as any)).toThrow(/Unexpected/);
            expect(instance(myMock)(cat)).toBe(true);
        });
        it('matches itself if using the same ref', () => {
            expect(match(instanceOf(Container), instanceOf(CatClass))).not.toBe(true);
            expect(match(instanceOf(Container), instanceOf(Container))).toBe(true);
        });
    });

    describe('type matchers', () => {
        it('anyNumber matches any number', () => {
            const myMock = mock<(arg: number) => boolean>('myMock');

            when(myMock(anyNumber())).return(true);

            expect(() => instance(myMock)('12' as any)).toThrow(/Unexpected/);
            expect(instance(myMock)(12)).toBe(true);
        });
        it('anyBoolean matches any boolean', () => {
            const myMock = mock<(arg: boolean) => boolean>('myMock');

            when(myMock(anyBoolean())).return(true);

            expect(() => instance(myMock)('true' as any)).toThrow(/Unexpected/);
            expect(instance(myMock)(true)).toBe(true);
            expect(instance(myMock)(false)).toBe(true);
        });
        it('anyString matches any string', () => {
            const myMock = mock<(arg: string) => boolean>('myMock');

            when(myMock(anyString())).return(true);

            expect(() => instance(myMock)(12 as any)).toThrow(/Unexpected/);
            expect(instance(myMock)('12')).toBe(true);
        });
        it('anyFunction matches any function', () => {
            const myMock = mock<(arg: (n: number) => string) => boolean>('myMock');

            when(myMock(anyFunction())).return(true);

            expect(() => instance(myMock)('12' as any)).toThrow(/Unexpected/);
            expect(instance(myMock)(() => 'ok')).toBe(true);
        });
        it('anyObject matches any object', () => {
            const myMock = mock<(arg: (n: CatClass) => string) => boolean>('myMock');

            when(myMock(anyObject())).return(true);

            expect(() => instance(myMock)('12' as any)).toThrow(/Unexpected/);
            expect(() => instance(myMock)(() => 'ok')).toThrow(/Unexpected/);
            expect(instance(myMock)({ } as any)).toBe(true);
        });
        it('anySymbol matches any symbol', () => {
            const myMock = mock<(arg: symbol) => boolean>('myMock');

            when(myMock(anySymbol())).return(true);

            expect(() => instance(myMock)('12' as any)).toThrow(/Unexpected/);
            expect(instance(myMock)(Symbol('hello'))).toBe(true);
        });
        it('anyArray matches any function', () => {
            const myMock = mock<(arg: string[]) => boolean>('myMock');

            when(myMock(anyArray())).return(true);

            expect(() => instance(myMock)('12' as any)).toThrow(/Unexpected/);
            expect(instance(myMock)(['hello'])).toBe(true);
        });
        it('matches matchers of the same type', () => {
            expect(match(anyString(), anyNumber())).not.toBe(true);
            expect(match(anyNumber(), anyString())).not.toBe(true);
            expect(match(anyBoolean(), anyString())).not.toBe(true);
            expect(match(anyObject(), anyString())).not.toBe(true);
            expect(match(anySymbol(), anyString())).not.toBe(true);
            expect(match(anyFunction(), anyString())).not.toBe(true);
            expect(match(anyArray(), anyString())).not.toBe(true);

            expect(match(anyString(), anyString())).toBe(true);
            expect(match(anyNumber(), anyNumber())).toBe(true);
            expect(match(anyBoolean(), anyBoolean())).toBe(true);
            expect(match(anyObject(), anyObject())).toBe(true);
            expect(match(anySymbol(), anySymbol())).toBe(true);
            expect(match(anyFunction(), anyFunction())).toBe(true);
            expect(match(anyArray(), anyArray())).toBe(true);
        });
    });

    describe('anyOf', () => {
        it('matches if any of the arguments matches', () => {
            const myMock = mock<(arg: string) => boolean>('myMock');

            when(myMock(anyOf('lettuce', 'bacon', 'avocado'))).return(true);

            expect(instance(myMock)('lettuce')).toBe(true);
            expect(instance(myMock)('bacon')).toBe(true);
            expect(instance(myMock)('avocado')).toBe(true);
            expect(() => instance(myMock)('tomato')).toThrow(/Unexpected.+tomato/);
        });

        it('can be combined with other matchers', () => {
            const myMock = mock<(arg: number) => boolean>('myMock');

            when(myMock(anyOf(smallerThan(0), between(45, 55), greaterThan(100)))).return(true);

            expect(instance(myMock)(-2)).toBe(true);
            expect(instance(myMock)(50)).toBe(true);
            expect(instance(myMock)(130)).toBe(true);
            expect(() => instance(myMock)(20)).toThrow(/Unexpected.+20/);
        });

        it('mismatches when empty', () => {
            const myMock = mock<(arg: number) => boolean>('myMock');

            when(myMock(anyOf())).return(true);

            expect(() => instance(myMock)(20)).toThrow(/Unexpected.+20/);
        });

        it('is equals if it matches the same things', () => {
            expect(match(anyOf(), anyOf())).toBe(true);
            expect(match(anyOf<any>(1, 'q'), anyOf<any>(1, 'q'))).toBe(true);
            expect(match(anyOf(greaterThan(0), between(45, 55), smallerThan(100)),
                         anyOf(greaterThan(0), between(45, 55), smallerThan(100))))
                    .toBe(true);
            expect(match(anyOf(greaterThan(0), between(45, 55), smallerThan(100)), anyOf(1))).not.toBe(true);
        });
    });

    describe('allOf', () => {
        it('matches if all of the arguments match', () => {
            const myMock = mock<(arg: string) => boolean>('myMock');

            when(myMock(allOf('lettuce'))).return(true);

            expect(instance(myMock)('lettuce')).toBe(true);
            expect(() => instance(myMock)('tomato')).toThrow(/Unexpected.+tomato/);
        });

        it('can be combined with other matchers', () => {
            const myMock = mock<(arg: number) => boolean>('myMock');

            when(myMock(allOf(greaterThan(0), between(45, 55), smallerThan(100)))).return(true);

            expect(() => instance(myMock)(-2)).toThrow(/Unexpected.+-2/);
            expect(instance(myMock)(50)).toBe(true);
            expect(() => instance(myMock)(130)).toThrow(/Unexpected.+130/);
            expect(() => instance(myMock)(20)).toThrow(/Unexpected.+20/);
        });

        it('matches when empty', () => {
            const myMock = mock<(arg: number) => boolean>('myMock');

            when(myMock(allOf())).return(true);

            expect(instance(myMock)(20)).toBe(true);
        });

        it('is equals if it matches the same things', () => {
            expect(match(allOf(), allOf())).toBe(true);
            expect(match(allOf<any>(1, 'q'), allOf<any>(1, 'q'))).toBe(true);
            expect(match(allOf(greaterThan(0), between(45, 55), smallerThan(100)),
                         allOf(greaterThan(0), between(45, 55), smallerThan(100))))
                    .toBe(true);
            expect(match(allOf(greaterThan(0), between(45, 55), smallerThan(100)), allOf(1))).not.toBe(true);
        });
    });

    describe('comparators', () => {
        it('greaterThan accepts greater values', () => {
            const myMock = mock<(arg: number) => boolean>('myMock');

            when(myMock(greaterThan(1))).return(true);

            expect(() => instance(myMock)(0)).toThrow(/Unexpected/);
            expect(() => instance(myMock)(1)).toThrow(/Unexpected/);
            expect(instance(myMock)(2)).toBe(true);
        });
        it('smallerThan accepts greater values', () => {
            const myMock = mock<(arg: number) => boolean>('myMock');

            when(myMock(smallerThan(1))).return(true);

            expect(() => instance(myMock)(2)).toThrow(/Unexpected/);
            expect(() => instance(myMock)(1)).toThrow(/Unexpected/);
            expect(instance(myMock)(0)).toBe(true);
        });
        it('greaterThanOrEqual accepts greater values', () => {
            const myMock = mock<(arg: number) => boolean>('myMock');

            when(myMock(greaterThanOrEqual(1))).return(true);

            expect(() => instance(myMock)(0)).toThrow(/Unexpected/);
            expect(instance(myMock)(1)).toBe(true);
            expect(instance(myMock)(2)).toBe(true);
        });
        it('smallerThanOrEqual accepts greater values', () => {
            const myMock = mock<(arg: number) => boolean>('myMock');

            when(myMock(smallerThanOrEqual(1))).return(true);

            expect(() => instance(myMock)(2)).toThrow(/Unexpected/);
            expect(instance(myMock)(1)).toBe(true);
            expect(instance(myMock)(0)).toBe(true);
        });
        it('equals accepts equal values', () => {
            const myMock = mock<(arg: number) => boolean>('myMock');

            when(myMock(equals(1))).return(true);

            expect(() => instance(myMock)(2)).toThrow(/Unexpected/);
            expect(instance(myMock)(1)).toBe(true);
            expect(() => instance(myMock)(0)).toThrow(/Unexpected/);
        });
        describe('between', () => {
            it('accepts values in included range', () => {
                const myMock = mock<(arg: number) => boolean>('myMock');

                when(myMock(between(1, 3))).return(true);

                expect(() => instance(myMock)(0)).toThrow(/Unexpected/);
                expect(instance(myMock)(1)).toBe(true);
                expect(instance(myMock)(2)).toBe(true);
                expect(instance(myMock)(3)).toBe(true);
                expect(() => instance(myMock)(4)).toThrow(/Unexpected/);
            });
            it('accepts minimum value exclusive', () => {
                const myMock = mock<(arg: number) => boolean>('myMock');

                when(myMock(between({value: 1, exclusive: true}, 3))).return(true);

                expect(() => instance(myMock)(0)).toThrow(/Unexpected/);
                expect(() => instance(myMock)(1)).toThrow(/Unexpected/);
                expect(instance(myMock)(2)).toBe(true);
                expect(instance(myMock)(3)).toBe(true);
                expect(() => instance(myMock)(4)).toThrow(/Unexpected/);
            });
            it('accepts maximum value exclusive', () => {
                const myMock = mock<(arg: number) => boolean>('myMock');

                when(myMock(between(1, { value: 3, exclusive: true }))).return(true);

                expect(() => instance(myMock)(0)).toThrow(/Unexpected/);
                expect(instance(myMock)(1)).toBe(true);
                expect(instance(myMock)(2)).toBe(true);
                expect(() => instance(myMock)(3)).toThrow(/Unexpected/);
                expect(() => instance(myMock)(4)).toThrow(/Unexpected/);
            });
        });
    });

    describe('arrayEq', () => {
        it('matches arrays with the same content', () => {
            const myMock = mock<(arg: string[]) => boolean>('myMock');

            when(myMock(arrayEq(['hello', 'world']))).return(true);

            expect(() => instance(myMock)('12' as any)).toThrow(/Unexpected/);
            expect(() => instance(myMock)([])).toThrow(/Unexpected/);
            expect(() => instance(myMock)(['one', 'two'])).toThrow(/Unexpected/);
            expect(instance(myMock)(['hello', 'world'])).toBe(true);
        });
        it('can combine with other matchers', () => {
            const myMock = mock<(arg: Array<string | number>) => boolean>('myMock');

            when(myMock(arrayEq(['one', smallerThan(12)]))).return(true);

            expect(() => instance(myMock)('12' as any)).toThrow(/Unexpected/);
            expect(() => instance(myMock)([])).toThrow(/Unexpected/);
            expect(() => instance(myMock)(['one', 12])).toThrow(/Unexpected/);
            expect(instance(myMock)(['one', 10])).toBe(true);
        });
        it('is equal if the array match', () => {
            expect(match(arrayEq([]), arrayEq([]))).toBe(true);
            expect(match(arrayEq([1, 2, 3]), arrayEq([1, 2, 3]))).toBe(true);
            expect(match(arrayEq([1, 2, 3]), arrayEq([]))).not.toBe(true);
            expect(match(arrayEq([greaterThanOrEqual(12)]), arrayEq([greaterThanOrEqual(12)]))).toBe(true);
            expect(match(arrayEq([greaterThanOrEqual(12)]), arrayEq([greaterThan(12)]))).not.toBe(true);
        });
    });

    describe('objectEq', () => {
        it('accepts same object', () => {
            const myMock = mock<(arg: object) => boolean>('myMock');

            when(myMock(objectEq({ name: 'Ola', job: 'teacher' }))).return(true);

            expect(instance(myMock)({ name: 'Ola', job: 'teacher' })).toBe(true);
        });
        it('rejects non-objects and null', () => {
            const myMock = mock<(arg: object) => boolean>('myMock');

            when(myMock(objectEq({ name: 'Ola', job: 'teacher' }))).return(true);

            expect(() => instance(myMock)(null)).toThrow(/Unexpected.+null/);
            expect(() => instance(myMock)('ola' as any)).toThrow(/Unexpected/);
        });
        it('rejects objects with different key sets', () => {
            const myMock = mock<(arg: object) => boolean>('myMock');

            when(myMock(objectEq({ name: 'Ola', job: 'teacher' }))).return(true);

            // Less keys
            expect(() => instance(myMock)({ name: 'Ola' })).toThrow(/Unexpected/);
            expect(() => instance(myMock)({ job: 'teacher' })).toThrow(/Unexpected/);
            // More keys
            expect(() => instance(myMock)({ name: 'Ola', job: 'teacher', phone: '123456' })).toThrow(/Unexpected/);
            // Different keys
            expect(() => instance(myMock)({ name: 'Ola', jobs: ['teacher'] })).toThrow(/Unexpected/);
        });
        it('rejects objects with different values', () => {
            const myMock = mock<(arg: object) => boolean>('myMock');

            when(myMock(objectEq({ name: 'Ola', job: 'teacher' }))).return(true);

            expect(() => instance(myMock)({ name: 'Ola', job: ['teacher'] })).toThrow(/Unexpected/);
            expect(() => instance(myMock)({ name: 'Ola', job: 'student' })).toThrow(/Unexpected/);
            expect(() => instance(myMock)({ name: 'Ola', job: 12 })).toThrow(/Unexpected/);
        });
        it('combines with other matchers', () => {
            const myMock = mock<(arg: object) => boolean>('myMock');

            when(myMock(objectEq({ name: 'Ola', age: between(30, 40) }))).return(true);

            expect(() => instance(myMock)({ name: 'Ola', age: 20 })).toThrow(/Unexpected/);
            expect(() => instance(myMock)({ name: 'Ola', age: 45 })).toThrow(/Unexpected/);
            expect(instance(myMock)({ name: 'Ola', age: 35 })).toBe(true);
        });
        it('Protects against modifications', () => {
            const myMock = mock<(arg: object) => boolean>('myMock');
            const ref = { name: 'Ola', job: 'teacher' };

            when(myMock(objectEq(ref))).return(true);
            ref.name = 'Steven';

            expect(() => instance(myMock)(ref)).toThrow(/Unexpected/);
        });
    });

    describe('objectContaining', () => {
        it('rejects objects with different values', () => {
            const myMock = mock<(arg: object) => boolean>('myMock');

            when(myMock(contains({ name: 'Ola', job: 'teacher' }))).return(true);

            expect(() => instance(myMock)({ name: 'Ola', job: ['teacher'] })).toThrow(/Unexpected/);
            expect(() => instance(myMock)({ name: 'Ola', job: 'student' })).toThrow(/Unexpected/);
            expect(() => instance(myMock)({ name: 'Ola', job: 12 })).toThrow(/Unexpected/);
        });
        it('accepts matching objects', () => {
            const myMock = mock<(arg: object) => boolean>('myMock');

            when(myMock(contains({ name: 'Ola', job: 'teacher' }))).return(true);

            expect(instance(myMock)({ name: 'Ola', job: 'teacher' })).toBe(true);
            expect(instance(myMock)({ name: 'Ola', job: 'teacher', age: 21 })).toBe(true);
        });
        it('combines with other matchers', () => {
            const myMock = mock<(arg: object) => boolean>('myMock');

            when(myMock(contains({ name: 'Ola', age: between(30, 40) }))).return(true);

            expect(() => instance(myMock)({ name: 'Ola', age: 20 })).toThrow(/Unexpected/);
            expect(() => instance(myMock)({ name: 'Ola', age: 45 })).toThrow(/Unexpected/);
            expect(instance(myMock)({ name: 'Ola', age: 35 })).toBe(true);
            expect(instance(myMock)({ name: 'Ola', age: 35, job: 'teacher' })).toBe(true);
        });
    });

    describe('custom matcher', () => {
        it('lets users write custom matching logic', () => {
            const myMock = mock<(arg: string) => boolean>('myMock');

            when(myMock(matching(value => value.charAt(2) === 'o'))).return(true);

            expect(() => instance(myMock)('Ola')).toThrow(/Unexpected/);
            expect(instance(myMock)('Olo')).toBe(true);
        });
    });

    describe('not', () => {
        it('negates the matcher', () => {
            const myMock = mock<(arg: string) => boolean>('myMock');

            when(myMock(not(matching(value => value.charAt(2) === 'o')))).return(true);

            expect(instance(myMock)('Ola')).toBe(true);
            expect(() => instance(myMock)('Olo')).toThrow(/Unexpected/);
        });
        it('works with bare values', () => {
            const myMock = mock<(arg: string) => boolean>('myMock');

            when(myMock(not('Olo'))).return(true);

            expect(instance(myMock)('Ola')).toBe(true);
            expect(() => instance(myMock)('Olo')).toThrow(/Unexpected/);
        });
    });

    describe('match', () => {
        it('uses the matcher logic if present', () => {
            const mockMatcher = mock<MatcherMetadata<any>>('myMock');
            const matcher = createMatcher(instance(mockMatcher));
            when(mockMatcher.match('hello')).return(true).once();

            expect(match(matcher, 'hello')).toBe(true);

            verify(mockMatcher);
        });
        it('matches null and undefined with strict equality', () => {
            expect(match(null, null)).toBe(true);
            expect(match(null, undefined)).not.toBe(true);
            expect(match(undefined, undefined)).toBe(true);
            expect(match(undefined, null)).not.toBe(true);
        });
        it('matches non basic object types with strict equality', () => {
            const cat = new CatClass('Olinka');
            const catClone = new CatClass('Olinka');

            expect(match(cat, catClone)).not.toBe(true);
            expect(match(cat, cat)).toBe(true);
        });
    });

});
