import { instance, mock, when } from '../src';
import { CatClass } from './fixtures/classes';

/**
 * These exotic edge cases are experimental and subject to change.
 */

xdescribe('setter behavior', () => {

    it('changes the value of the backing instance', () => {
        const catMock = mock<CatClass>('catMock', {});
        instance(catMock).color = 'green';
        expect(instance(catMock).color).toBe('green');
    });

    it('changes the value of the virtual mock only if callThrough() is allowed', () => {
        const catMock = mock<CatClass>('catMock');
        instance(catMock).color = 'green';
        expect(() => instance(catMock).color).toThrow();
        when(catMock.color).useActual();
        when(catMock.name).useActual();
        expect(instance(catMock).color).toBe('green');
    });
    
    it('setting the name property on a virtual mock fails due to implementation details', () => {
        const catMock = mock<CatClass>('catMock');
        // TODO: This contradicts the design philosophy of omnimock.
        // Might need a separate entry point for mocking functions.
        // OR maybe we can get around this when we hook the set operation
        expect(() => instance(catMock).name = 'Olinka').toThrow();
        when(catMock.name).useActual();
        expect(instance(catMock).name).toBe('catMock');
    });

    it('invokes the setter on the backing instance', () => {
        let fooValue = '';
        const myMock = mock('catMock', {
            set foo(s: string) {
                fooValue = s;
            }
        });
        instance(myMock).foo = 'hello';
        expect(fooValue).toBe('hello');
    });

    it('setting a value on the mock sets the value on the backing instance', () => {
        const myMock = mock('myMock', {
            foo: ''
        });
        (myMock as any).foo = 'hello';
        expect(instance(myMock).foo).toBe('hello');
    });

    it('setting a value on the mock invokes the setter of the backing instance', () => {
        let fooValue = '';
        const myMock = mock('myMock', {
            set foo(s: string) {
                fooValue = s;
            }
        });
        (myMock as any).foo = 'hello';
        expect(fooValue).toBe('hello');
    });
});
