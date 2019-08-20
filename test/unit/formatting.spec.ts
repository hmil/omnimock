import { mock, instance, when, greaterThan } from '../../src';
import { fmt } from '../../src/formatting';
import { CatClass } from '../fixtures/classes';

describe('string formatting', () => {
    it('formats primitive values', () => {
        expect(fmt`${1}, ${'a'}, ${Symbol('s')}, ${null}`).toBe('1, "a", Symbol(s), null');
    });
    it('truncates strings', () => {
        expect(fmt`${'This string is very long and it completely bloats logs and therefore it is kept small here'}`)
            .toBe('"This string is very long and it completely bloats logs and therefore it is kept …"');
    });
    it('formats functions with their name', () => {
        function SomeFunc() { /* noop */ }
        const otherFunc = () => { /* noop */ };
        expect(fmt`${SomeFunc}, ${otherFunc}`).toBe('function SomeFunc, function otherFunc');
    });
    it('uses an object\'s toString if it is not the default', () => {
        const obj = {
            toString() {
                return 'hello world';
            }
        };
        expect(fmt`${obj}`).toBe('hello world');
    });
    it('shows an object\'s keys if it has no custom toString', () => {
        const obj = {
            foo: 'hello',
            bar() { return 'boo'; },
            count: 2
        };
        expect(fmt`${obj}`).toBe('Object(foo, bar, count)');
    });
    it('formats mock setters', () => {
        expect(fmt`${mock<any>('myMock')}`)
                .toBe('mock(<myMock>)');
        expect(fmt`${mock<CatClass>('myMock').getTag(2).chip.id}`)
                .toBe('mock(<myMock>.getTag(2).chip.id)');
    });
    it('formats mock instances', () => {
        const myMock = mock<CatClass>('myMock');
        when(myMock.getTag(2).chip.id).return(2);
        expect(fmt`${instance(myMock)}`)
                .toBe('instance(<myMock>)');
        expect(fmt`${instance(myMock).getTag(2).chip}`)
                .toBe('instance(<myMock>.getTag(2).chip)');
    });
    it('formats matchers', () => {
        expect(fmt`${greaterThan(12)}`).toBe('<greater than 12>');
    });
});
