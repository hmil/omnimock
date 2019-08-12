import { instance, mock, when } from '../../src';
import { CatClass } from '../fixtures/classes';

/**
 * These exotic edge cases are experimental and subject to change.
 */

describe('setter behavior', () => {

    it('changes the value of the backing instance', () => {
        const catMock = mock<CatClass>('catMock', {});
        instance(catMock).color = 'green';
        expect(instance(catMock).color).toBe('green');
    });

    it('throws an error on a virtual mock', () => {
        const catMock = mock<CatClass>('catMock');
        expect(() => instance(catMock).color = 'green').toThrow(/Unexpected write: <catMock>.color = green/);
        expect(() => instance(catMock).color).toThrow(/Unexpected property access/);
    });

    it('setting the name property on a virtual mock throws the same error as any other property', () => {
        // The implied regression here would be that the virtual mock's backing object,
        // a function, would prevent writes to `name`
        const catMock = mock<CatClass>('catMock');
        expect(() => instance(catMock).name = 'Olinka').toThrow(/Unexpected write: <catMock>.name = Olinka/);
        expect(() => instance(catMock).name).toThrow(/Unexpected property access/);
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

    it('setting a value on the mock is an error', () => {
        const myMock = mock('myMock', {
            foo: 'original'
        });
        expect(() => (myMock as any).foo = 'hello').toThrow(/Did you forget/);
        expect(instance(myMock).foo).toBe('original');
    });

    it('setting an unspecified value on the mock is an error', () => {
        const myMock = mock<{foo: string, bar: string}>('myMock', {
            foo: 'original'
        });
        expect(() => (myMock as any).bar = 'hello').toThrow(/Did you forget/);
        expect(() => instance(myMock).bar).toThrow(/Unexpected property access/);
    });

    it('setting a value on the instance invokes the setter of the backing instance', () => {
        let fooValue = '';
        const myMock = mock('myMock', {
            set foo(s: string) {
                fooValue = s;
            }
        });
        instance(myMock).foo = 'hello';
        expect(fooValue).toBe('hello');
    });
});

describe('delete behavior', () => {

    it('deletes the value of the backing instance', () => {
        const catMock = mock<CatClass>('catMock', {
            color: 'green'
        });
        delete instance(catMock).color;
        expect(() => instance(catMock).color).toThrow(/Unexpected property access/);
    });

    it('throws an error on a virtual mock', () => {
        const catMock = mock<CatClass>('catMock');
        expect(() => delete instance(catMock).color).toThrow(/Unexpected: delete <catMock>.color/);
        expect(() => instance(catMock).color).toThrow(/Unexpected property access/);
    });

    it('deleting the name property on a virtual mock throws the same error as any other property', () => {
        // The implied regression here would be that the virtual mock's backing object,
        // a function, would prevent writes to `name`
        const catMock = mock<CatClass>('catMock');
        expect(() => delete instance(catMock).name).toThrow(/Unexpected: delete <catMock>.name/);
        expect(() => instance(catMock).name).toThrow(/Unexpected property access/);
    });

    it('deleting a value on the mock is an error', () => {
        const myMock = mock('myMock', {
            foo: 'original'
        });
        expect(() => delete (myMock as any).foo).toThrow(/Did you forget/);
        expect(instance(myMock).foo).toBe('original');
    });

    it('deleting an unspecified value on the mock is an error', () => {
        const myMock = mock<{foo: string, bar: string}>('myMock', {
            foo: 'original'
        });
        expect(() => delete (myMock as any).bar).toThrow(/Did you forget/);
        expect(() => instance(myMock).bar).toThrow(/Unexpected property access/);
    });

    it('deleting an unspecified value on the instance is a no-op', () => {
        const myMock = mock<{foo: string, bar: string}>('myMock', {
            foo: 'original'
        });
        expect(() => delete instance(myMock).bar).not.toThrow();
        expect(() => instance(myMock).bar).toThrow(/Unexpected property access/);
    });
});
